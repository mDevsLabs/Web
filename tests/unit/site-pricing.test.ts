import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..", "..");

function readRepoFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf8");
}

describe("Page Tarifs (/site/pricing) et espace Mon compte (/site/account)", () => {
  const pricingSource = readRepoFile("app/(chat)/site/pricing/page.tsx");
  const accountSource = readRepoFile("app/(chat)/site/account/page.tsx");
  const accountNavSource = readRepoFile(
    "components/site/account/account-navigation.tsx"
  );

  it("remplace uniquement le Quota mAI par les 4 phrases attendues tout en gardant les autres quotas", () => {
    expect(pricingSource).toContain("Une limite élevée pour tester");
    expect(pricingSource).toContain(
      "Des limites importantes pour des petits projets"
    );
    expect(pricingSource).toContain("Une puissance incroyable");
    expect(pricingSource).toContain(
      "Les limites les plus élevées pour un travail perfectionné"
    );

    // Les autres quotas restent intacts
    expect(pricingSource).toContain("Stockage Cloud");
    expect(pricingSource).toContain("Quota Images");
    expect(pricingSource).toContain("Quota Audio (TTS)");
    expect(pricingSource).toContain("Plugins & MCP");
    expect(pricingSource).toContain("Agents");
    expect(pricingSource).toContain("Vibe");
    expect(pricingSource).toContain(
      "Accès prioritaire aux nouvelles fonctionnalités"
    );
  });

  it("intègre les dialogues et la célébration directement dans /site/pricing sans lien #upgrade-code", () => {
    expect(pricingSource).toContain("UpgradeCodeDialog");
    expect(pricingSource).toContain("DowngradeFreeDialog");
    expect(pricingSource).toContain("UpgradeCelebration");
    expect(pricingSource).not.toContain("#upgrade-code");
  });

  it("supprime la section Code d'Upgrade de /site/account et de sa navigation", () => {
    expect(accountSource).not.toContain("UpgradeCodeSection");
    expect(accountSource).not.toContain("upgrade-code");
    expect(accountNavSource).not.toContain("upgrade-code");
  });
});
