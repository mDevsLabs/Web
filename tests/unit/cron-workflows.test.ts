import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("CRON & Workflows GitHub Actions", () => {
  const root = process.cwd();
  const workflowsDir = join(root, ".github", "workflows");

  const removedScheduledWorkflows = [
    "cron-master.yml",
    "cron-agent.yml",
    "cron-planning.yml",
    "cron-wakies.yml",
    "cron-vibe.yml",
    "cron-notifications.yml",
    "cron-quizzly.yml",
    "models-sync.yml",
  ];

  it("ne contient aucun workflow CRON ou de synchronisation automatique planifiée", () => {
    for (const file of removedScheduledWorkflows) {
      const p = join(workflowsDir, file);
      expect(existsSync(p), `Le workflow ${file} doit être supprimé`).toBe(
        false
      );
    }
  });

  it("le script run-tick.mjs reste disponible pour les déclenchements manuels", () => {
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
