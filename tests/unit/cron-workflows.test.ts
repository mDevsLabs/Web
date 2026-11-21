import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("CRON & Workflows GitHub Actions", () => {
  const root = process.cwd();
  const workflowsDir = join(root, ".github", "workflows");

  const requiredWorkflows = [
    "cron-master.yml",
    "cron-agent.yml",
    "cron-planning.yml",
    "cron-wakies.yml",
    "cron-vibe.yml",
    "cron-notifications.yml",
    "cron-quizzly.yml",
    "models-sync.yml",
  ];

  it("dispose de tous les fichiers de workflows demandés", () => {
    for (const file of requiredWorkflows) {
      const p = join(workflowsDir, file);
      expect(existsSync(p), `Le workflow ${file} doit exister`).toBe(true);
    }
  });

  it("tous les workflows possèdent le déclencheur workflow_dispatch", () => {
    for (const file of requiredWorkflows) {
      const content = readFileSync(join(workflowsDir, file), "utf8");
      expect(content).toContain("workflow_dispatch");
    }
  });

  it("cron-master.yml orchestre l'ensemble des ticks groupés via curl", () => {
    const content = readFileSync(join(workflowsDir, "cron-master.yml"), "utf8");
    expect(content).toContain("curl");
    expect(content).toContain("/api/cron/");
    expect(content).toContain('cron: "*/30 * * * *"');
    expect(content).toContain("CRON_SECRET");
    expect(content).toContain("APP_URL");
    expect(content).toContain("schedule");
    // Le job n'a besoin ni du dépôt ni de Node : pas de checkout ni de setup.
    expect(content).not.toContain("actions/checkout");
    expect(content).not.toContain("actions/setup-node");
    // Le secret ne transite jamais par l'URL.
    expect(content).not.toMatch(/\?[^\s"]*secret=/i);
  });

  it("cron-master.yml appelle les six ticks avec le bon verbe", () => {
    const content = readFileSync(join(workflowsDir, "cron-master.yml"), "utf8");
    const attendus: [string, "GET" | "POST"][] = [
      ["agent", "POST"],
      ["planning", "POST"],
      ["wakies", "POST"],
      ["vibe", "GET"],
      ["notifications", "POST"],
      ["quizzly", "POST"],
    ];
    for (const [tick, verbe] of attendus) {
      expect(content, `${tick} ${verbe}`).toMatch(
        new RegExp(`launch\\s+${tick}\\s+${verbe}\\s+\\d+`)
      );
    }
  });

  it("models-sync.yml déclenche la synchronisation toutes les 12h", () => {
    const content = readFileSync(join(workflowsDir, "models-sync.yml"), "utf8");
    expect(content).toContain("scripts/updateModels.ts");
    expect(content).toContain("0 */12 * * *");
    expect(content).toContain("DATABASE_URL");
    expect(content).toContain("OPENROUTER_API_KEY");
  });

  it("le script run-tick.mjs est présent et déclare les 6 ticks", () => {
    const scriptPath = join(root, "scripts", "cron", "run-tick.mjs");
    expect(existsSync(scriptPath)).toBe(true);
    const content = readFileSync(scriptPath, "utf8");
    const ticks = [
      "agent",
      "planning",
      "wakies",
      "vibe",
      "notifications",
      "quizzly",
    ];
    for (const tick of ticks) {
      expect(content).toContain(tick);
      expect(content).toContain(`/api/cron/${tick}`);
    }
  });
});
