import { describe, expect, it } from "vitest";
import { AGENT_CHANNEL, AGENT_CHANNEL_LABELS } from "@/lib/agent/channel";
import { REWARD_LABELS, REWARD_TYPES } from "@/lib/forms/types";
import { SEARCH_SOURCE_KEYS, SEARCH_SOURCE_LABELS } from "@/lib/search/types";

describe("Forms and Rewards — Intégrité des types et récompenses", () => {
  it("définit les 4 types de récompenses canoniques (mAI, API, Images, Audio)", () => {
    expect(REWARD_TYPES).toContain("mai");
    expect(REWARD_TYPES).toContain("api");
    expect(REWARD_TYPES).toContain("images");
    expect(REWARD_TYPES).toContain("audio");
    expect(REWARD_TYPES.length).toBe(4);
  });

  it("fournit un libellé et une description claire pour chaque récompense", () => {
    for (const reward of REWARD_TYPES) {
      const info = REWARD_LABELS[reward];
      expect(info).toBeDefined();
      expect(info.title).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.icon).toBeTruthy();
    }
  });
});

describe("Recherche multi-source — Extension aux 5 univers", () => {
  it("contient les 5 nouvelles sources requises (site, wakies, coder, cli, vibe)", () => {
    expect(SEARCH_SOURCE_KEYS).toContain("site");
    expect(SEARCH_SOURCE_KEYS).toContain("wakies");
    expect(SEARCH_SOURCE_KEYS).toContain("coder");
    expect(SEARCH_SOURCE_KEYS).toContain("cli");
    expect(SEARCH_SOURCE_KEYS).toContain("vibe");
  });

  it("associe un label explicite à chacune des 5 nouvelles sources", () => {
    expect(SEARCH_SOURCE_LABELS.site).toContain("Site");
    expect(SEARCH_SOURCE_LABELS.wakies).toContain("Wakies");
    expect(SEARCH_SOURCE_LABELS.coder).toContain("Coder");
    expect(SEARCH_SOURCE_LABELS.cli).toContain("CLI");
    expect(SEARCH_SOURCE_LABELS.vibe).toContain("Vibe");
  });
});

describe("Mode Agent — Canal de diffusion", () => {
  it("est configuré sur le canal stable", () => {
    expect(AGENT_CHANNEL).toBe("stable");
  });

  it("affiche le libellé Bêta et Stable en français", () => {
    expect(AGENT_CHANNEL_LABELS.beta).toBe("Bêta");
    expect(AGENT_CHANNEL_LABELS.stable).toBe("Stable");
  });
});
