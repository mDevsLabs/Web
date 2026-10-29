import { describe, expect, it } from "vitest";
import {
  decideDmRecipient,
  decideStoryInteraction,
} from "../../vibe-access-policy";

describe("Stories — lecture et interaction", () => {
  const base = {
    alive: true,
    authorId: 10,
    blockedEitherWay: false,
    isFollower: false,
    viewerId: 20,
    visibility: "public",
  };

  it("autorise une story publique à un spectateur non abonné", () => {
    expect(decideStoryInteraction(base)).toBe(true);
  });

  it("exige un abonnement pour une story followers", () => {
    expect(decideStoryInteraction({ ...base, visibility: "followers" })).toBe(
      false
    );
    expect(
      decideStoryInteraction({
        ...base,
        isFollower: true,
        visibility: "followers",
      })
    ).toBe(true);
  });

  it("réserve une story privée à son auteur", () => {
    expect(decideStoryInteraction({ ...base, visibility: "private" })).toBe(
      false
    );
    expect(
      decideStoryInteraction({
        ...base,
        viewerId: 10,
        visibility: "private",
      })
    ).toBe(true);
  });

  it("refuse un compte bloqué dans un sens ou dans l'autre, même abonné", () => {
    expect(
      decideStoryInteraction({
        ...base,
        blockedEitherWay: true,
        isFollower: true,
        visibility: "followers",
      })
    ).toBe(false);
  });

  it("refuse une story expirée ou archivée, même à son auteur", () => {
    expect(
      decideStoryInteraction({ ...base, alive: false, viewerId: 10 })
    ).toBe(false);
  });

  it("une visibilité inconnue retombe sur le plus strict", () => {
    expect(decideStoryInteraction({ ...base, visibility: "weird" })).toBe(
      false
    );
  });
});

describe("DM — consentement du destinataire", () => {
  const base = {
    blockedEitherWay: false,
    dmsEnabled: true,
    policy: "everyone",
    recipientFollowsSender: false,
    settingsPresent: true,
  };

  it("autorise quand personne n'a bloqué et que la réception est ouverte", () => {
    expect(decideDmRecipient(base)).toEqual({ allowed: true });
  });

  it("refuse un blocage dans les deux sens", () => {
    expect(decideDmRecipient({ ...base, blockedEitherWay: true })).toEqual({
      allowed: false,
      reason: "blocked",
    });
  });

  it("refuse des DM désactivés ou policy nobody", () => {
    expect(decideDmRecipient({ ...base, dmsEnabled: false })).toEqual({
      allowed: false,
      reason: "dms_disabled",
    });
    expect(decideDmRecipient({ ...base, policy: "nobody" })).toEqual({
      allowed: false,
      reason: "dms_disabled",
    });
  });

  it("policy following exige que le destinataire suive l'expéditeur", () => {
    expect(decideDmRecipient({ ...base, policy: "following" })).toEqual({
      allowed: false,
      reason: "followers_only",
    });
    expect(
      decideDmRecipient({
        ...base,
        policy: "following",
        recipientFollowsSender: true,
      })
    ).toEqual({ allowed: true });
  });

  it("sans préférences enregistrées, conserve la réception ouverte historique", () => {
    expect(decideDmRecipient({ ...base, settingsPresent: false })).toEqual({
      allowed: true,
    });
  });
});
