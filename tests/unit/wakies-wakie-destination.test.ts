import { describe, expect, it } from "vitest";
import { resolveWakieDestination } from "@/lib/wakies/shared/wakie-destination";

const base = {
  availableSpaceIds: ["espace-1", "espace-2"],
  currentSpaceId: "espace-1",
  currentSpaceIds: ["espace-1"],
};

describe("Wakies — destination d'un Wakie", () => {
  it("conserve la destination explicite du patch", () => {
    expect(
      resolveWakieDestination({
        ...base,
        patchSpaceId: "espace-2",
        patchSpaceIds: ["espace-2"],
      })
    ).toEqual({ spaceId: "espace-2", spaceIds: ["espace-2"] });
  });

  it("répare un Wakie détaché avec le premier Espace du compte", () => {
    expect(
      resolveWakieDestination({
        availableSpaceIds: ["espace-2", "espace-3"],
        currentSpaceId: null,
        currentSpaceIds: [],
        patchSpaceId: null,
        patchSpaceIds: [],
      })
    ).toEqual({ spaceId: "espace-2", spaceIds: ["espace-2"] });
  });

  it("garde la destination dans les accès rendus", () => {
    expect(
      resolveWakieDestination({
        availableSpaceIds: ["espace-1"],
        currentSpaceId: "espace-2",
        currentSpaceIds: ["espace-1"],
      })
    ).toEqual({
      spaceId: "espace-2",
      spaceIds: ["espace-1", "espace-2"],
    });
  });

  it("n'efface pas les accès existants quand le patch envoie un tableau vide", () => {
    expect(
      resolveWakieDestination({
        availableSpaceIds: ["espace-1", "espace-2"],
        currentSpaceId: "espace-1",
        currentSpaceIds: ["espace-1", "espace-2"],
        patchSpaceIds: [],
      })?.spaceIds
    ).toEqual(["espace-1", "espace-2"]);
  });

  it("retourne null quand le compte n'a aucun Espace", () => {
    expect(
      resolveWakieDestination({
        availableSpaceIds: [],
        currentSpaceId: null,
        currentSpaceIds: [],
      })
    ).toBeNull();
  });
});
