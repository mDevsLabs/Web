import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MCP_TEMPLATE_IDS,
  MCP_TEMPLATE_LIST,
} from "@/lib/mcp-templates/catalog";
import { mcpLogoSrc } from "@/lib/mcp-templates/logo";
import {
  SKILL_TEMPLATE_IDS,
  SKILL_TEMPLATE_LIST,
} from "@/lib/skill-templates/catalog";

// Inventaire des vrais logos MCP : chaque identifiant du catalogue doit avoir
// un asset réel dans public/mcp/<id>.svg (source Simple Icons, licence CC0).
// Un asset manquant fait échouer ce test au lieu de retomber silencieusement
// sur une icône générique ou, pire, sur le logo d'un autre service.
const PUBLIC_MCP_DIR = path.resolve(import.meta.dirname, "../../public/mcp");

describe("Catalogues MCP et Skills — identifiants et logos", () => {
  it("les identifiants MCP sont uniques", () => {
    expect(new Set(MCP_TEMPLATE_IDS).size).toBe(MCP_TEMPLATE_IDS.length);
  });

  it("les identifiants de Skills sont uniques", () => {
    expect(new Set(SKILL_TEMPLATE_IDS).size).toBe(SKILL_TEMPLATE_IDS.length);
  });

  it("chaque modèle MCP possède un logo réel dans public/mcp/<id>.svg", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      const file = path.join(PUBLIC_MCP_DIR, `${template.id}.svg`);
      expect(
        existsSync(file),
        `Logo manquant pour « ${template.id} » : ${mcpLogoSrc(template.id)}`
      ).toBe(true);
      const content = readFileSync(file, "utf8");
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
    }
  });

  it("les logos sont des SVG autonomes (pas de référence externe ni de script)", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      const content = readFileSync(
        path.join(PUBLIC_MCP_DIR, `${template.id}.svg`),
        "utf8"
      );
      expect(content).not.toMatch(/<script/i);
      expect(content).not.toMatch(/href\s*=/i);
      expect(content).not.toMatch(/url\(/i);
    }
  });

  it("les credentials déclarés ne portent aucune valeur de secret", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      for (const credential of template.credentials) {
        // Un credential ne déclare QUE sa métadonnée (où trouver la valeur) :
        // toute valeur par défaut serait un secret dans le code source.
        expect(JSON.stringify(credential)).not.toMatch(
          /"value"|"defaultValue"/
        );
      }
    }
  });

  it("aucun secret réel dans env/args des manifestes (mots de passe et clés)", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      // Le champ env est réservé aux variables NON sensibles : aucun champ
      // nommé token/secret/key/password ne doit y apparaître.
      for (const envKey of Object.keys(template.env ?? {})) {
        expect(envKey.toLowerCase()).not.toMatch(
          /token|secret|password|api[-_]?key/
        );
      }
    }
  });
});

describe("mcpLogoSrc — correspondance identifiant → fichier", () => {
  it("construit l'URL stable /mcp/<id>.svg", () => {
    expect(mcpLogoSrc("sentry")).toBe("/mcp/sentry.svg");
    expect(mcpLogoSrc("brave-search")).toBe("/mcp/brave-search.svg");
  });
});
