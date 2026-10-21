import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOCAL_LOGOS,
  MODELS_DEV_IDS,
  resolveLogoSource,
} from "@/lib/ai/model-selector/logo-map";

const DOSSIER = join(process.cwd(), "public/models");

/** Fichiers présents dans le dossier des icônes. */
function iconesPresentes(): string[] {
  return readdirSync(DOSSIER)
    .filter((nom) => nom.endsWith(".svg"))
    .sort();
}

describe("catalogue des logos de modèles", () => {
  it("déclare des icônes locales qui existent toutes", () => {
    for (const [cle, fichier] of Object.entries(LOCAL_LOGOS)) {
      expect(
        existsSync(join(DOSSIER, fichier)),
        `l'icône locale de « ${cle} » est absente : ${fichier}`
      ).toBe(true);
    }
  });

  it("n laisse aucune icône orpheline dans le dossier", () => {
    const referencees = new Set(Object.values(LOCAL_LOGOS));
    for (const nom of iconesPresentes()) {
      expect(
        referencees.has(nom),
        `l'icône ${nom} n'est référencée par aucune table : elle ne sera jamais affichée`
      ).toBe(true);
    }
  });

  it("sert d'abord l'icône locale, sans requête tierce", () => {
    for (const cle of Object.keys(LOCAL_LOGOS)) {
      const source = resolveLogoSource(cle);
      expect(source.isLocal).toBe(true);
      expect(source.src.startsWith("/models/")).toBe(true);
    }
  });

  it("retombe sur models.dev avec l'identifiant du laboratoire", () => {
    // Les aliases réécrivaient le nom du fournisseur : `amazon` devenait
    // `amazon.svg`, que models.dev ne sert pas. Le vrai logo s'appelle
    // `amazon-bedrock`.
    expect(resolveLogoSource("amazon").src).toBe("/models/amazon-bedrock.svg");
    expect(resolveLogoSource("bedrock").src).toBe("/models/amazon-bedrock.svg");
    expect(resolveLogoSource("alibaba").src).toBe("/models/qwen-alibaba.svg");
    expect(resolveLogoSource("llama").src).toBe("/models/meta-llama.svg");
    expect(resolveLogoSource("doubao").src).toBe("/models/bytedance-seed.svg");
    expect(resolveLogoSource("granite").src).toBe("/models/ibm-granite.svg");
  });

  it("normalise les alias de fournisseurs vers une clé connue", () => {
    const expectations: Record<string, string> = {
      alibaba: "/models/qwen-alibaba.svg",
      amazon: "/models/amazon-bedrock.svg",
      doubao: "/models/bytedance-seed.svg",
      granite: "/models/ibm-granite.svg",
      grok: "https://models.dev/logos/xai.svg",
      kimi: "https://models.dev/logos/moonshotai.svg",
      laguna: "https://models.dev/logos/poolside.svg",
      llama: "/models/meta-llama.svg",
      mAI: "/models/mai.svg",
      mdevslabs: "/models/mai.svg",
      yi: "https://models.dev/logos/01-ai.svg",
    };
    for (const [alias, attendu] of Object.entries(expectations)) {
      expect(resolveLogoSource(alias).src).toBe(attendu);
    }
  });

  it("n'invente pas d'identifiant distant pour un laboratoire inconnu", () => {
    const source = resolveLogoSource("laboratoire-inconnu");
    expect(source.isLocal).toBe(false);
    expect(source.src).toBe("https://models.dev/logos/laboratoire-inconnu.svg");
  });

  it("associe un identifiant distant explicite aux alias réécrits", () => {
    expect(MODELS_DEV_IDS.amazon).toBe("amazon-bedrock");
    expect(MODELS_DEV_IDS.qwen).toBe("alibaba");
    expect(MODELS_DEV_IDS["meta-llama"]).toBe("meta");
    expect(MODELS_DEV_IDS.bytedance).toBe("volcengine");
  });
});

describe("intégrité visuelle des icônes", () => {
  // Le rendu de chaque SVG à 600 DPI est un travail CPU : à froid (import de
  // `sharp`, transformation du fichier), il dépasse le délai par défaut de
  // cinq secondes et échoue sur un poste lent. L'ASSERTION n'est pas
  // affaiblie : c'est le délai qui est allongé.
  it("dessine encore le logo de chaque laboratoire", async () => {
    // Un tracé mal réécrit ne produit pas une icône « un peu différente » :
    // il produit une tache, ou rien du tout. Le rendu est vérifié à
    // l'échelle réelle d'affichage.
    const { default: sharp } = await import("sharp");
    for (const nom of iconesPresentes()) {
      const svg = readFileSync(join(DOSSIER, nom));
      const { data, info } = await sharp(svg, { density: 600 })
        .resize(32, 32, {
          background: { alpha: 0, b: 0, g: 0, r: 0 },
          fit: "contain",
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      let peints = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 8) {
          peints += 1;
        }
      }
      const couverture = peints / (info.width * info.height);
      expect(couverture, `${nom} ne dessine rien`).toBeGreaterThan(0.02);
      expect(couverture, `${nom} est une pleine page`).toBeLessThan(0.95);
    }
  }, 60_000);
});

describe("poids des icônes embarquées", () => {
  it("reste dans le budget de poids", () => {
    // Les icônes sont affichées à 16 px. Un dossier qui pèse plus d'un
    // demi-mégaoctet ne peut pas être la conséquence d'un travail de
    // dessin : c'est un défaut de vectorisation.
    let total = 0;
    for (const nom of iconesPresentes()) {
      const taille = readFileSync(join(DOSSIER, nom)).byteLength;
      expect(
        taille,
        `${nom} pèse ${taille} octets pour une icône de 16 px`
      ).toBeLessThan(120_000);
      total += taille;
    }
    expect(total).toBeLessThan(300_000);
  });

  it("est optimisé (le script d'allègement est passé)", () => {
    // Un fichier qui n'a pas été optimisé contient encore ses métadonnées
    // (<title>, <desc>) et son précision d'origine.
    for (const nom of iconesPresentes()) {
      const contenu = readFileSync(join(DOSSIER, nom), "utf8");
      expect(contenu, `${nom} porte encore un <title>`).not.toContain(
        "<title>"
      );
      expect(contenu, `${nom} porte encore un <desc>`).not.toContain("<desc>");
    }
  });
});
