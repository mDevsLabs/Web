import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initSettingsStore, patchSettings } from "../settingsStore.js";
import {
  addMarketplaceFromInput,
  installMarketplacePlugin,
} from "./pluginMarketplaceService.js";
import { getPluginRuntimeState } from "./pluginRuntimeService.js";

const tempRoots: string[] = [];

function makeTempRoot(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const dir = tempRoots.pop();
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  }
});

describe("pluginMarketplaceService", () => {
  it("installs marketplace entries that declare skills without a packaged plugin manifest", async () => {
    const userData = makeTempRoot("async-plugin-marketplace-settings-");
    const userPluginsRoot = makeTempRoot("async-plugin-marketplace-plugins-");
    const marketplaceRoot = makeTempRoot("async-plugin-marketplace-source-");
    initSettingsStore(userData);
    patchSettings({
      plugins: {
        userPluginsDir: userPluginsRoot,
      },
    });

    writeFile(
      path.join(marketplaceRoot, ".claude-plugin", "marketplace.json"),
      JSON.stringify(
        {
          metadata: {
            description: "Anthropic example skills",
            version: "1.0.0",
          },
          name: "anthropic-agent-skills",
          plugins: [
            {
              description: "Document skill collection",
              name: "document-skills",
              skills: ["./skills/xlsx", "./skills/pdf"],
              source: "./",
              strict: false,
            },
          ],
        },
        null,
        2
      )
    );
    writeFile(
      path.join(marketplaceRoot, "skills", "xlsx", "SKILL.md"),
      `---
name: Spreadsheet Suite
description: Spreadsheet helpers
---

Create spreadsheets.`
    );
    writeFile(
      path.join(marketplaceRoot, "skills", "pdf", "SKILL.md"),
      `---
name: PDF Suite
description: PDF helpers
---

Work with PDFs.`
    );

    await addMarketplaceFromInput(marketplaceRoot);
    const installed = await installMarketplacePlugin(
      "anthropic-agent-skills",
      "document-skills",
      "user",
      null
    );

    const claudeManifestPath = path.join(
      installed.installDir,
      ".claude-plugin",
      "plugin.json"
    );
    expect(fs.existsSync(claudeManifestPath)).toBe(true);
    expect(
      JSON.parse(fs.readFileSync(claudeManifestPath, "utf8"))
    ).toMatchObject({
      description: "Document skill collection",
      name: "document-skills",
      skills: ["./skills/xlsx", "./skills/pdf"],
    });

    const runtime = getPluginRuntimeState(null);
    expect(runtime.plugins).toHaveLength(1);
    expect(runtime.plugins[0]?.pluginName).toBe("document-skills");
    expect(runtime.skills.map((skill) => skill.slug).sort()).toEqual([
      "pdf",
      "xlsx",
    ]);
  });
});
