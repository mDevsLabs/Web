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

  it("cron-master.yml exécute les ticks directement, sans appeler Vercel", () => {
    const content = readFileSync(join(workflowsDir, "cron-master.yml"), "utf8");
    expect(content).toContain('cron: "*/5 * * * *"');
    expect(content).toContain("scripts/cron/run-direct.ts");
    expect(content).toContain("--conditions=react-server");
    expect(content).toContain("--frozen-lockfile");
    for (const secret of [
      "DATABASE_URL",
      "CRON_SECRET",
      "OPENROUTER_API_KEY",
    ]) {
      expect(content).toContain(`secrets.${secret}`);
    }
    // Zéro Active CPU Vercel : aucun appel HTTP aux routes cron.
    expect(content).not.toContain("curl");
    expect(content).not.toContain("/api/cron/");
    // Moindre privilège, pas de jeton Git persisté, pas d'annulation en vol.
    expect(content).toContain("contents: read");
    expect(content).toContain("persist-credentials: false");
    expect(content).toContain("cancel-in-progress: false");
    expect(content).not.toMatch(/\?[^\s"]*secret=/i);
  });

  it("cron-master.yml propose les six ticks au déclenchement manuel", () => {
    const content = readFileSync(join(workflowsDir, "cron-master.yml"), "utf8");
    for (const tick of [
      "all",
      "agent",
      "planning",
      "wakies",
      "vibe",
      "notifications",
      "quizzly",
    ]) {
      expect(content, tick).toMatch(new RegExp(`^\\s+- ${tick}$`, "m"));
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
