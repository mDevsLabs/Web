import { describe, expect, it } from "vitest";

import { findTeamRolesMissingModels } from "./teamModelValidation";

describe("findTeamRolesMissingModels", () => {
  it("lets built-in team roles inherit the currently selected chat model", () => {
    expect(
      findTeamRolesMissingModels(
        {
          experts: [],
          source: "builtin",
        },
        [
          {
            displayName: "GPT-5",
            id: "gpt-5",
            providerId: "provider-1",
            requestName: "gpt-5",
          },
        ]
      )
    ).toEqual([]);
  });

  it("flags an invalid built-in team global model id", () => {
    expect(
      findTeamRolesMissingModels(
        {
          builtinGlobalModelId: "missing-model",
          experts: [],
          source: "builtin",
        },
        [
          {
            displayName: "GPT-5",
            id: "gpt-5",
            providerId: "provider-1",
            requestName: "gpt-5",
          },
        ]
      )
    ).toEqual([
      {
        key: "builtin-global-model",
        kind: "builtin_global",
      },
    ]);
  });

  it("flags invalid built-in role model overrides", () => {
    expect(
      findTeamRolesMissingModels(
        {
          builtinExpertModelOverrides: {
            "builtin-engineering_frontend_developer": "missing-model",
          },
          experts: [],
          source: "builtin",
        },
        [
          {
            displayName: "GPT-5",
            id: "gpt-5",
            providerId: "provider-1",
            requestName: "gpt-5",
          },
        ]
      )
    ).toEqual([
      {
        expertId: "builtin-engineering_frontend_developer",
        key: "builtin-role:builtin-engineering_frontend_developer",
        kind: "builtin_role",
      },
    ]);
  });

  it("only flags explicit invalid preferred model ids", () => {
    expect(
      findTeamRolesMissingModels(
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
              assignmentKey: "reviewer",
              enabled: true,
              id: "bad-model",
              name: "Reviewer",
              preferredModelId: "missing-model",
              roleType: "reviewer",
              systemPrompt: "review",
            },
          ],
          source: "custom",
        },
        [
          {
            displayName: "GPT-5",
            id: "gpt-5",
            providerId: "provider-1",
            requestName: "gpt-5",
          },
        ]
      )
    ).toEqual([
      {
        key: "role:bad-model",
        kind: "role",
        role: {
          assignmentKey: "reviewer",
          enabled: true,
          id: "bad-model",
          name: "Reviewer",
          preferredModelId: "missing-model",
          roleType: "reviewer",
          systemPrompt: "review",
        },
      },
    ]);
  });
});
