import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// En-têtes de sécurité et politique CSP.
//
// Ces valeurs sont lues par le navigateur, pas par le code applicatif : rien
// dans la suite ne les exerçait. Elles peuvent donc régresser en silence — ce
// que fait `CSP_REPORT_ONLY`, dont la valeur d'observation était inerte parce
// qu'aucune violation n'était reçue nulle part.
describe("En-têtes de sécurité", () => {
  it("interdit l'intégration en iframe", () => {
    const config = readConfig();
    // `'none'` et non `'self'` : l'application n'a aucune raison d'être
    // intégrable dans une iframe tierce, et autoriser sa propre origine
    // laissait le clickjacking possible.
    expect(config).toMatch(/"frame-ancestors":\s*\["'none'"\]/);
    // Doublage pour les navigateurs anciens.
    expect(config).toMatch(/key:\s*"X-Frame-Options",\s*\n\s*value:\s*"DENY"/);
  });

  it("neutralise les vecteurs d'injection classiques", () => {
    const config = readConfig();
    expect(config).toMatch(/"object-src":\s*\["'none'"\]/);
    expect(config).toMatch(/"base-uri":\s*\["'self'"\]/);
    expect(config).toMatch(/"form-action":\s*\["'self'"\]/);
  });

  it("déclare un point de rapport CSP exploitable", () => {
    const config = readConfig();
    // Sans `report-uri`, `CSP_REPORT_ONLY=1` bascule la politique en observation
    // sans qu'aucune violation ne puisse être reçue : le levier est inerte.
    expect(config).toMatch(/"report-uri":\s*\["\/api\/security\/csp-report"\]/);
    expect(config).toMatch(/report-uri \/api\/security\/csp-report/);
  });

  it("aligne les images optimisées sur les hôtes autorisés par la CSP", () => {
    const config = readConfig();
    const csp = cspImgSrcHosts(config);
    const imageHosts = imageRemotePatternHosts(config);
    // Une source acceptée par la CSP mais refusée par `remotePatterns` produit
    // une image qui ne s'affiche pas : les deux listes doivent cover le même
    // ensemble.
    for (const host of imageHosts) {
      expect(csp).toContain(host);
    }
    for (const host of ["s3.z1storage.com", "*.r2.dev"]) {
      expect(imageHosts).toContain(host);
    }
  });

  it("négocie AVIF, pas seulement webp", () => {
    // Sans `formats`, le défaut est `['image/webp']` : le format le plus
    // efficace n'est jamais proposé au navigateur.
    expect(readConfig()).toMatch(
      /formats:\s*\["image\/avif",\s*"image\/webp"\]/
    );
  });

  it("déclare des tailles d'image adaptées aux usages réels", () => {
    const config = readConfig();
    // Les valeurs par défaut démarrent à 640 px, ce qui fait télécharger une
    // image de 500 Ko pour un logo de 24 px.
    const small = config.match(/imageSizes:\s*\[([^\]]+)\]/)?.[1] ?? "";
    const sizes = small.split(",").map((value) => Number(value.trim()));
    expect(sizes).toContain(16);
    expect(sizes).toContain(24);
    expect(sizes).toContain(32);
  });
});

function readConfig(): string {
  return readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "next.config.ts"),
    "utf8"
  );
}

// Les hôtes de stockage sont déclarés une seule fois dans la variable
// `storageHosts` et étalés par `img-src` comme par `remotePatterns` : lire le
// texte brut ne les ferait pas apparaître dans les deux listes.
function storageHosts(config: string): string[] {
  const block = config.match(/const storageHosts = \[([^\]]+)\]/)?.[1] ?? "";
  return (block.match(/https:\/\/[^"'[\],\s]+/g) ?? []).map((host) =>
    host.replace("https://", "")
  );
}

function cspImgSrcHosts(config: string): string[] {
  const block = config.match(/"img-src":\s*\[([^\]]+)\]/)?.[1] ?? "";
  const literal = (block.match(/https:\/\/[^"'[\],\s]+/g) ?? []).map((host) =>
    host.replace("https://", "")
  );
  return [...literal, ...storageHosts(config)];
}

function imageRemotePatternHosts(config: string): string[] {
  const block =
    config.match(/remotePatterns:\s*\[([\s\S]*?)\n {4}\],/)?.[1] ?? "";
  const literal = (block.match(/hostname:\s*"([^"]+)"/g) ?? []).map((entry) =>
    entry.replace(/hostname:\s*"/, "").replace(/"$/, "")
  );
  return [...literal, ...storageHosts(config)];
}
