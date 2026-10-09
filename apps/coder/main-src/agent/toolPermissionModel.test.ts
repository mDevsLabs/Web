import { describe, expect, it } from "vitest";
import type { AgentCustomization } from "../agentSettingsTypes.js";
import { resolveToolPermissionFromRules } from "./toolPermissionModel.js";

describe("resolveToolPermissionFromRules", () => {
  it("deny wins over allow", () => {
    const agent: AgentCustomization = {
      toolPermissionRules: [
        { behavior: "allow", ruleContent: "git status", toolName: "Bash" },
        { behavior: "deny", ruleContent: "git status", toolName: "Bash" },
      ],
    };
    expect(
      resolveToolPermissionFromRules(
        { arguments: { command: "git status" }, id: "1", name: "Bash" },
        agent
      )
    ).toBe("deny");
  });

  it("allow bypasses delegate path", () => {
    const agent: AgentCustomization = {
      toolPermissionRules: [
        { behavior: "allow", ruleContent: "echo *", toolName: "Bash" },
      ],
    };
    expect(
      resolveToolPermissionFromRules(
        { arguments: { command: "echo hi" }, id: "1", name: "Bash" },
        agent
      )
    ).toBe("allow");
  });

  it("ask becomes deny when shouldAvoidPermissionPrompts", () => {
    const agent: AgentCustomization = {
      shouldAvoidPermissionPrompts: true,
      toolPermissionRules: [{ behavior: "ask", toolName: "Write" }],
    };
    expect(
      resolveToolPermissionFromRules(
        { arguments: { file_path: "a.ts" }, id: "1", name: "Write" },
        agent
      )
    ).toBe("deny");
  });

  it("matches MCP-style tool names with wildcard", () => {
    const agent: AgentCustomization = {
      toolPermissionRules: [{ behavior: "deny", toolName: "mcp__srv__*" }],
    };
    expect(
      resolveToolPermissionFromRules(
        { arguments: {}, id: "1", name: "mcp__srv__danger" },
        agent
      )
    ).toBe("deny");
  });
});
