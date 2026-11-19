import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TYPES,
  originForNotificationType,
  QUIZZLY_NOTIFICATION_TYPES,
} from "@/lib/notifications/types";
import {
  isSearchSourceKey,
  SEARCH_SOURCE_KEYS,
  SEARCH_SOURCE_LABELS,
} from "@/lib/search/types";

describe("Index de recherche - Quizzly et Blackline", () => {
  it("contient quizzly et blackline dans SEARCH_SOURCE_KEYS", () => {
    expect(SEARCH_SOURCE_KEYS).toContain("quizzly");
    expect(SEARCH_SOURCE_KEYS).toContain("blackline");
    expect(isSearchSourceKey("quizzly")).toBe(true);
    expect(isSearchSourceKey("blackline")).toBe(true);
  });

  it("définit les libellés officiels en français", () => {
    expect(SEARCH_SOURCE_LABELS.quizzly).toBe("Quizzly (Quiz & Matières)");
    expect(SEARCH_SOURCE_LABELS.blackline).toBe("Blackline (Jeu 3D)");
  });
});

describe("Notifications Quizzly", () => {
  it("énumère les types de notifications scolaires Quizzly", () => {
    expect(QUIZZLY_NOTIFICATION_TYPES).toContain("quizzly_reminder");
    expect(QUIZZLY_NOTIFICATION_TYPES).toContain("quizzly_league");
    expect(QUIZZLY_NOTIFICATION_TYPES).toContain("quizzly_gift");
    expect(QUIZZLY_NOTIFICATION_TYPES).toContain("quizzly_streak");
  });

  it("inclut les types Quizzly dans NOTIFICATION_TYPES", () => {
    for (const type of QUIZZLY_NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPES).toContain(type);
    }
  });

  it("résout l'origine canonique vers mai pour être géré dans l'hôte", () => {
    expect(originForNotificationType("quizzly_reminder")).toBe("mai");
    expect(originForNotificationType("quizzly_streak")).toBe("mai");
  });
});
