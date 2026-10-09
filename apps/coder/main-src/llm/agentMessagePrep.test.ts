import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AgentCommand } from "../agentSettingsTypes.js";
import {
  applySlashCommands,
  buildThreadTitleRuleAppend,
  prepareUserTurnForChat,
} from "./agentMessagePrep.js";

describe("agentMessagePrep slash commands", () => {
  it("expands template commands into user text", () => {
    const commands: AgentCommand[] = [
      {
        body: "Outline the plan: {{args}}",
        id: "user-plan",
        name: "Plan",
        slash: "plan",
      },
    ];
    expect(applySlashCommands("/plan fix auth", commands)).toEqual({
      readableRoots: [],
      slashSystemBlock: "",
      userText: "Outline the plan: fix auth",
    });
  });

  it("treats plugin commands as prompt injections instead of plain text replacement", () => {
    const commands: AgentCommand[] = [
      {
        body: "# Build Fix\n\nUse $ARGUMENTS",
        id: "plugin-command:demo:build-fix",
        invocation: "prompt",
        name: "Build Fix",
        pluginSourceName: "Demo Plugin",
        slash: "build-fix",
      },
    ];
    const applied = applySlashCommands("/build-fix src/App.tsx", commands);
    expect(applied.userText).toBe("src/App.tsx");
    expect(applied.slashSystemBlock).toContain("Slash command: /build-fix");
    expect(applied.slashSystemBlock).toContain("Use src/App.tsx");

    const prepared = prepareUserTurnForChat(
      "/build-fix src/App.tsx",
      { commands },
      null,
      [],
      "en"
    );
    expect(prepared.userText).toBe("src/App.tsx");
    expect(prepared.agentSystemAppend).toContain("Slash command: /build-fix");
    expect(prepared.agentSystemAppend).toContain("Use src/App.tsx");
  });

  it("substitutes Claude plugin variables in prompt slash commands", () => {
    const commandDir = join(
      mkdtempSync(join(tmpdir(), "async-command-root-")),
      "commands"
    );
    const pluginRoot = resolve(commandDir, "..");
    const commands: AgentCommand[] = [
      {
        body: "Use ${CLAUDE_SKILL_DIR}/template.md and ${CLAUDE_PLUGIN_ROOT}/shared/schema.json for $ARGUMENTS",
        commandBaseDirAbs: commandDir,
        id: "plugin-command:demo:build-fix",
        invocation: "prompt",
        name: "Build Fix",
        pluginRootAbs: pluginRoot,
        pluginSourceName: "Demo Plugin",
        slash: "build-fix",
      },
    ];

    const applied = applySlashCommands("/build-fix src/App.tsx", commands);
    const promptCommandDir = resolve(commandDir).replace(/\\/g, "/");
    const promptPluginRoot = resolve(pluginRoot).replace(/\\/g, "/");

    expect(applied.userText).toBe("src/App.tsx");
    expect(applied.slashSystemBlock).toContain(
      `${promptCommandDir}/template.md`
    );
    expect(applied.slashSystemBlock).toContain(
      `${promptPluginRoot}/shared/schema.json`
    );
    expect(applied.readableRoots).toEqual([
      resolve(commandDir),
      resolve(pluginRoot),
    ]);
  });

  it("injects skill base directories and substitutes Claude skill/plugin variables", () => {
    const skillRoot = join(
      mkdtempSync(join(tmpdir(), "async-skill-root-")),
      "skills",
      "demo"
    );
    const pluginRoot = resolve(skillRoot, "..", "..");
    const prepared = prepareUserTurnForChat(
      "./demo inspect refs",
      {
        skills: [
          {
            content:
              "Read ${CLAUDE_SKILL_DIR}/templates/a.md and ${CLAUDE_PLUGIN_ROOT}/shared/b.md",
            description: "Demo references",
            enabled: true,
            id: "plugin-skill:demo",
            name: "Demo Skill",
            pluginRootAbs: pluginRoot,
            pluginSourceKind: "skill",
            pluginSourceName: "Demo Plugin",
            pluginSourceRelPath: "skills/demo/SKILL.md",
            skillBaseDirAbs: skillRoot,
            slug: "demo",
          },
        ],
      },
      null,
      [],
      "en"
    );
    const promptSkillRoot = resolve(skillRoot).replace(/\\/g, "/");
    const promptPluginRoot = resolve(pluginRoot).replace(/\\/g, "/");

    expect(prepared.userText).toBe("inspect refs");
    expect(prepared.agentSystemAppend).toContain(
      `Base directory for this skill: ${promptSkillRoot}`
    );
    expect(prepared.agentSystemAppend).toContain(
      `Plugin root directory (\${CLAUDE_PLUGIN_ROOT}): ${promptPluginRoot}`
    );
    expect(prepared.agentSystemAppend).toContain(
      `${promptSkillRoot}/templates/a.md`
    );
    expect(prepared.agentSystemAppend).toContain(
      `${promptPluginRoot}/shared/b.md`
    );
    expect(prepared.readableRoots).toEqual([
      resolve(skillRoot),
      resolve(pluginRoot),
    ]);
  });
});

describe("buildThreadTitleRuleAppend", () => {
  it("includes always rules and auto language guidance", () => {
    const block = buildThreadTitleRuleAppend({
      agent: {
        rules: [
          {
            content: "所有回答默认使用中文。",
            enabled: true,
            id: "r1",
            name: "Use Chinese",
            scope: "always",
          },
        ],
      },
      uiLanguage: "fr",
      workspaceRoot: null,
    });

    expect(block).toContain("Rule: Use Chinese");
    expect(block).toContain("所有回答默认使用中文。");
    expect(block).toContain("Langue : suivre le prompt utilisateur");
  });

  it("includes imported workspace rule files", () => {
    const root = mkdtempSync(join(tmpdir(), "mai-title-rules-"));
    mkdirSync(join(root, ".cursor", "rules"), { recursive: true });
    writeFileSync(
      join(root, ".cursor", "rules", "language.mdc"),
      "Veuillez répondre en japonais par défaut.",
      "utf8"
    );

    const block = buildThreadTitleRuleAppend({
      agent: undefined,
      uiLanguage: "fr",
      workspaceRoot: root,
    });

    expect(block).toContain("Imported project rules");
    expect(block).toContain("Veuillez répondre en japonais par défaut.");
  });
});
