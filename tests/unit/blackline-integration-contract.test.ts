import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le contrat d'intégration entre l'hôte mAI et le jeu BLACKLINE.
 *
 * L'hôte mAI monte le jeu par un chemin FIXE
 * (`/blackline/assets/blackline.js`) et appelle le contrat publié sur
 * `window.blackline`. Ces deux points sont des CONTRATS : ils sont posés par
 * deux fichiers qui ne se compilent pas ensemble (le jeu est un artefact
 * statique, l'hôte est du TypeScript compilé par Next). Rien ne les
 * contraindrait à rester d'accord — sauf un test.
 *
 * Les deux moitiés d'un contrat qui divergent produisent un ÉCHEC SILENCIEUX :
 * le chargement du module réussit, le contrat est introuvable, et le jeu ne se
 * monte pas.
 */
describe("contrat d'intégration du jeu Blackline", () => {
  const RACINE = process.cwd();
  const HOTE = join(RACINE, "components/blackline/blackline-host.tsx");
  const JEU = join(RACINE, "apps/blackline/src/mount.ts");
  const VITE = join(RACINE, "apps/blackline/vite.config.ts");

  it("l'hôte importe le jeu par un chemin FIXE", () => {
    const source = readFileSync(HOTE, "utf8");
    // Le chemin est en dur, et le build produit un fichier de ce nom : les
    // deux doivent rester d'accord.
    expect(source).toContain("/blackline/assets/blackline.js");
  });

  it("l'hôte appelle le contrat publié sur window", () => {
    const source = readFileSync(HOTE, "utf8");
    // Un EXPORT nommé serait élagué par le build : le contrat est donc
    // publié sur `window`, où rien ne peut l'élaguer.
    expect(source).toContain("window.blackline");
    expect(source).toContain("contrat.mount");
  });

  it("le jeu publie le contrat sur window", () => {
    const source = readFileSync(JEU, "utf8");
    expect(source).toContain("window.blackline");
    expect(source).toContain("mount: mountBlackline");
  });

  it("le jeu publie le contrat de DÉMONTAGE sur window", () => {
    const source = readFileSync(JEU, "utf8");
    // `unmount` est le pendant de `mount`. Sans lui, l'hôte ne peut que
    // retirer la balise <script> : la boucle de rendu continue de tourner
    // et le contexte WebGL n'est jamais relâché.
    expect(source).toContain("unmount: unmountBlackline");
  });

  it("l'hôte démonte le jeu en quittant la page", () => {
    const source = readFileSync(HOTE, "utf8");
    // L'appel est dans la fonction de nettoyage de l'effet : c'est le seul
    // moment où l'hôte sait que le jeu ne sera plus affiché.
    expect(source).toContain("unmount");
  });

  it("le moteur se libère lui-même", () => {
    const source = readFileSync(
      join(RACINE, "apps/blackline/src/game.ts"),
      "utf8"
    );
    // `dispose()` doit arrêter la boucle ET libérer le contexte : un
    // `disposed` mis à true sans rien libérer laisserait le tampon GPU en
    // mémoire.
    expect(source).toContain("dispose()");
    expect(source).toContain("forceContextLoss");
    expect(source).toContain("suspendFrame");
  });

  it("le build nomme le chunk d'entrée de façon fixe", () => {
    const source = readFileSync(VITE, "utf8");
    // Un nom changeant à chaque build obligerait l'hôte à lire un manifeste
    // avant de charger le jeu — un aller-retour, et une source d'échec.
    expect(source).toContain("assets/blackline.js");
  });

  it("le build conserve les exports du point d'entrée", () => {
    const source = readFileSync(VITE, "utf8");
    // `strict` expose le chunk d'entrée SANS les exports du point d'entrée :
    // le contrat d'intégration disparaîtrait.
    expect(source).toContain("preserveEntrySignatures: 'allow-extension'");
  });

  it("le jeu ne touche jamais <html> directement", () => {
    // Les classes et variables du jeu vivent sur SA racine, jamais sur le
    // document : dans l'hôte, ce document est celui du CHAT.
    const interdits = [
      "document.documentElement.classList",
      "document.body.append",
    ];
    for (const fichier of [
      "apps/blackline/src/game/render-settings.ts",
      "apps/blackline/src/ui/hud-controller.ts",
      "apps/blackline/src/ui/hud-update.ts",
      "apps/blackline/src/landscape.ts",
    ]) {
      const source = readFileSync(join(RACINE, fichier), "utf8");
      for (const motif of interdits) {
        expect(source, `${fichier} manipule le document`).not.toContain(motif);
      }
    }
  });

  it("le point d'entrée du jeu est importable par l'hôte", () => {
    // Le fichier doit exister : l'hôte le charge par le chemin du build, et
    // un fichier renommé rendrait le jeu inatteignable sans le moindre
    // message.
    expect(existsSync(join(RACINE, "apps/blackline/src/mount.ts"))).toBe(true);
  });
});
