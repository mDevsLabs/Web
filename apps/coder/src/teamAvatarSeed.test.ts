import { describe, expect, it } from "vitest";

import { buildTeamAvatarSeed } from "./teamAvatarSeed";

describe("buildTeamAvatarSeed", () => {
  it("prefers assignmentKey so the same role keeps the same avatar across cards", () => {
    expect(
      buildTeamAvatarSeed({
        assignmentKey: "game_designer",
        avatarSeed: "proposal-1:0:game_designer",
        roleType: "custom",
      })
    ).toBe("custom:game_designer");
    expect(
      buildTeamAvatarSeed({
        assignmentKey: "game_designer",
        avatarSeed: "task-42",
        roleType: "custom",
      })
    ).toBe("custom:game_designer");
  });

  it("falls back to avatarSeed when there is no stable assignmentKey", () => {
    expect(
      buildTeamAvatarSeed({
        avatarSeed: "task-42",
        roleType: "custom",
      })
    ).toBe("task-42");
  });
});
