import { describe, expect, it } from "vitest";
import { buildPromptAddendum } from "@/lib/chat/prompt";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";
import { QUIZZY_REPOS, sourcesQuizzy } from "@/lib/quizzly/quizzy-media";
import {
  blocsCompteSynthese,
  promptSyntheseAvecCompte,
  SEARCH_FACT_GUARD,
} from "@/lib/search/summary-personal";
import { inviteSysteme, memoiresCompteSansDoublon } from "@/lib/wakies/prompt";

describe("Quizzy", () => {
  it("ne demande le GIF que lorsqu'il est animé", () => {
    expect(sourcesQuizzy("think", true)).toEqual([
      "/quizzly/quizzy-think.gif",
      QUIZZY_REPOS,
    ]);
    expect(sourcesQuizzy("think", false)).toEqual([QUIZZY_REPOS]);
    expect(sourcesQuizzy("idle", true)).toEqual([QUIZZY_REPOS]);
    expect(sourcesQuizzy("inconnu", true)).toEqual([QUIZZY_REPOS]);
  });
});

describe("mémoire partagée", () => {
  it("retire un souvenir déjà présent dans les mémoires Wakies", () => {
    expect(
      memoiresCompteSansDoublon(["  Prague  ", "Rust", "prague"], ["Prague"])
    ).toEqual(["Rust"]);
  });

  it("place les instructions et la mémoire mAI avant les compétences", () => {
    const prompt = inviteSysteme({
      instructions: "Aide aux révisions.",
      instructionsCompte: "Vouvoie.",
      memoiresCompte: ["Prague", "Rust"],
      memories: ["Prague"],
      nom: "Ada",
      outils: [],
      page: null,
      skills: ["Résume."],
    });
    expect(prompt.split("Prague").length - 1).toBe(1);
    expect(prompt).toContain("Rust");
    expect(prompt).toContain("Instructions du compte mAI");
    expect(prompt.indexOf("Vouvoie")).toBeLessThan(prompt.indexOf("Résume"));
    expect(prompt.indexOf("Rust")).toBeLessThan(prompt.indexOf("Résume"));
  });

  it("garde les faits de la synthèse au-dessus de la personnalisation", () => {
    const personal = blocsCompteSynthese({
      instructions: "Vouvoie.",
      instructionsEnabled: true,
      memory: "MÉMOIRE — 1. Prague",
    });
    const prompt = promptSyntheseAvecCompte("Socle.", personal);
    expect(prompt.split("Prague").length - 1).toBe(1);
    expect(prompt.indexOf(SEARCH_FACT_GUARD)).toBeLessThan(
      prompt.indexOf("Prague")
    );
    expect(promptSyntheseAvecCompte("Socle.", null)).toContain(
      SEARCH_FACT_GUARD
    );
    expect(
      blocsCompteSynthese({
        instructions: "secret",
        instructionsEnabled: false,
        memory: null,
      })
    ).toBeNull();
  });

  it("n'écrit la mémoire du chat que dans la section de capacité", async () => {
    const addendum = await buildPromptAddendum({
      agentInstructions: null,
      agentSkillInstructions: [],
      chatCustomInstructions: null,
      enabledTools: [],
      isFreeUser: true,
      isGhostMode: false,
      pendingPrompt: null,
      projectCustomInstructions: null,
      projectFilesPromptBlock: null,
      skillInstructions: null,
      skillTools: [],
      userCustomEnabled: true,
      userCustomInstructions: "Vouvoie.",
    } as never);
    expect(addendum.effectiveAddendum).toContain("Vouvoie");
    expect(addendum.effectiveAddendum).not.toContain("MÉMOIRE");

    const prompt = buildChatSystemPrompt({
      addendum: addendum.effectiveAddendum,
      artifactsAvailable: false,
      capabilities: {
        attachments: 0,
        memory: { block: "MÉMOIRE — 1. Prague", writable: false },
        plan: null,
        reasoning: false,
        tools: [],
        toolsSupported: false,
      },
      requestHints: null,
    });
    expect(prompt.split("Prague").length - 1).toBe(1);
  });
});
