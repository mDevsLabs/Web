import { describe, expect, it, vi } from "vitest";
import type { TeamExpertConfig } from "../settingsStore.js";

const { listBuiltinTeamExpertsMock } = vi.hoisted(() => ({
  listBuiltinTeamExpertsMock: vi.fn<() => TeamExpertConfig[]>(() => []),
}));

vi.mock("./builtinTeamCatalog.js", () => ({
  listBuiltinTeamExperts: listBuiltinTeamExpertsMock,
}));

import { resolveTeamExpertProfiles } from "./teamExpertProfiles.js";

describe("resolveTeamExpertProfiles", () => {
  it("keeps the researcher available as a specialist assignment target", () => {
    const resolved = resolveTeamExpertProfiles(
      {
        experts: [
          {
            assignmentKey: "team_lead",
            enabled: true,
            id: "lead",
            name: "Team Lead",
            roleType: "team_lead",
            systemPrompt: "lead",
          },
          {
            assignmentKey: "researcher",
            enabled: true,
            id: "researcher",
            name: "Researcher",
            roleType: "custom",
            systemPrompt: "research",
          },
          {
            assignmentKey: "frontend",
            enabled: true,
            id: "frontend",
            name: "Frontend",
            roleType: "frontend",
            systemPrompt: "frontend",
          },
          {
            assignmentKey: "reviewer",
            enabled: true,
            id: "reviewer",
            name: "Reviewer",
            roleType: "reviewer",
            systemPrompt: "reviewer",
          },
        ],
        useDefaults: false,
      },
      []
    );

    expect(resolved.teamLead?.assignmentKey).toBe("team_lead");
    expect(resolved.reviewer?.assignmentKey).toBe("reviewer");
    expect(resolved.specialists.map((expert) => expert.assignmentKey)).toEqual([
      "researcher",
      "frontend",
    ]);
  });

  it("applies built-in role model overrides before the built-in global model", () => {
    listBuiltinTeamExpertsMock.mockReturnValue([
      {
        assignmentKey: "team_lead",
        enabled: true,
        id: "builtin-agents_orchestrator",
        name: "Agents Orchestrator",
        roleType: "team_lead",
        systemPrompt: "lead",
      },
      {
        assignmentKey: "frontend",
        enabled: true,
        id: "builtin-engineering_frontend_developer",
        name: "Frontend Developer",
        roleType: "frontend",
        systemPrompt: "frontend",
      },
      {
        assignmentKey: "backend",
        enabled: true,
        id: "builtin-engineering_backend_architect",
        name: "Backend Architect",
        roleType: "backend",
        systemPrompt: "backend",
      },
    ]);

    const resolved = resolveTeamExpertProfiles(
      {
        builtinExpertModelOverrides: {
          "builtin-engineering_frontend_developer": "gpt-frontend",
        },
        builtinGlobalModelId: "gpt-global",
        source: "builtin",
      },
      []
    );

    expect(resolved.teamLead?.preferredModelId).toBe("gpt-global");
    expect(
      resolved.specialists.find((expert) => expert.assignmentKey === "frontend")
        ?.preferredModelId
    ).toBe("gpt-frontend");
    expect(
      resolved.specialists.find((expert) => expert.assignmentKey === "backend")
        ?.preferredModelId
    ).toBe("gpt-global");
  });

  it("lets built-in team custom reviewers inherit the built-in global model", () => {
    listBuiltinTeamExpertsMock.mockReturnValue([
      {
        assignmentKey: "team_lead",
        enabled: true,
        id: "builtin-agents_orchestrator",
        name: "Agents Orchestrator",
        roleType: "team_lead",
        systemPrompt: "lead",
      },
      {
        assignmentKey: "reviewer",
        enabled: true,
        id: "builtin-engineering_code_reviewer",
        name: "Code Reviewer",
        roleType: "reviewer",
        systemPrompt: "reviewer",
      },
    ]);

    const resolved = resolveTeamExpertProfiles(
      {
        builtinGlobalModelId: "gpt-global",
        planReviewer: {
          assignmentKey: "plan_reviewer",
          enabled: true,
          id: "plan-reviewer",
          name: "Plan Reviewer",
          roleType: "reviewer",
          systemPrompt: "plan review",
        },
        source: "builtin",
      },
      []
    );

    expect(resolved.planReviewer?.preferredModelId).toBe("gpt-global");
    expect(resolved.deliveryReviewer?.preferredModelId).toBe("gpt-global");
  });
});
