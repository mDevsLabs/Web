import type { LanguageModel } from "ai";
import { describe, expect, it, vi } from "vitest";
import {
  generateConversationTitleWithModel,
  sanitizeGeneratedTitle,
  TITLE_FALLBACK_MODEL_ID,
} from "@/lib/ai/title-generator";
import { groupChatsByDate } from "@/lib/chat/history-groups";

describe("Génération de titre par le modèle de la conversation", () => {
  it("nettoie les balises think, guillemets et refuse 'New Conversation'", () => {
    expect(
      sanitizeGeneratedTitle("<think>réflexion</think>\n« Météo à Paris »")
    ).toBe("Météo à Paris");
    expect(sanitizeGeneratedTitle("Titre: Débogage API")).toBe("Débogage API");
    expect(sanitizeGeneratedTitle("New Conversation")).toBeNull();
    expect(sanitizeGeneratedTitle("Nouvelle discussion")).toBeNull();
  });

  it("utilise le modèle actif de la conversation puis bascule sur mai-2.5-omni en cas d'échec", async () => {
    const attemptedModels: string[] = [];
    const resolveModel = (id: string) => ({ modelId: id }) as unknown as LanguageModel;

    // 1. Succès direct du modèle de la conversation
    const direct = await generateConversationTitleWithModel({
      assistantText: "Voici l'analyse demandée.",
      generate: (async ({ model }: { model: unknown }) => {
        const id = (model as { modelId: string }).modelId;
        attemptedModels.push(id);
        return { text: "Analyse architecture TypeScript" };
      }) as never,
      instructions: "title",
      modelId: "anthropic/claude-4.5-sonnet",
      resolveModel,
      userText: "Analyse mon architecture TypeScript",
    });
    expect(direct).toBe("Analyse architecture TypeScript");
    expect(attemptedModels).toEqual(["anthropic/claude-4.5-sonnet"]);

    // 2. Échec du modèle de conversation -> repli sur mai-2.5-omni
    attemptedModels.length = 0;
    const fallbackOmni = await generateConversationTitleWithModel({
      assistantText: "Bonjour !",
      generate: vi.fn(async ({ model }: { model: unknown }) => {
        const id = (model as { modelId: string }).modelId;
        attemptedModels.push(id);
        if (id !== TITLE_FALLBACK_MODEL_ID) {
          throw new Error("upstream 502");
        }
        return { text: "Premier échange amical" };
      }) as never,
      instructions: "title",
      modelId: "broken/model",
      resolveModel,
      userText: "Salut",
    });
    expect(fallbackOmni).toBe("Premier échange amical");
    expect(attemptedModels).toEqual(["broken/model", "mai-2.5-omni"]);
  });

  it("retombe sur le texte utilisateur si même mai-2.5-omni échoue", async () => {
    const title = await generateConversationTitleWithModel({
      assistantText: "",
      generate: (async () => {
        throw new Error("network down");
      }) as never,
      instructions: "title",
      modelId: "mai-2.5-omni",
      resolveModel: (id) => ({ modelId: id }) as unknown as LanguageModel,
      userText: "  Corriger mon script SQL  ",
    });
    expect(title).toBe("Corriger mon script SQL");
  });
});

describe("Regroupement sidebar : Épinglés conditionnel et tri au dernier message", () => {
  const refNow = new Date("2026-11-23T18:00:00Z");

  it("n'alimente la section pinned que s'il existe des conversations épinglées", () => {
    const grouped = groupChatsByDate(
      [
        {
          createdAt: "2026-11-23T10:00:00Z",
          id: "c1",
          lastMessageAt: "2026-11-23T15:00:00Z",
          pinned: false,
        },
        {
          createdAt: "2026-11-22T12:00:00Z",
          id: "c2",
          lastMessageAt: "2026-11-22T18:00:00Z",
          pinned: false,
        },
      ],
      refNow
    );

    expect(grouped.pinned).toHaveLength(0);
    expect(grouped.today.map((c) => c.id)).toEqual(["c1"]);
    expect(grouped.yesterday.map((c) => c.id)).toEqual(["c2"]);
  });

  it("isole les conversations épinglées et classe les autres selon lastMessageAt", () => {
    const grouped = groupChatsByDate(
      [
        {
          createdAt: "2026-10-01T10:00:00Z",
          id: "pinned-old",
          lastMessageAt: "2026-11-23T12:00:00Z",
          pinned: true,
        },
        {
          // Créée il y a 2 semaines mais nouveau message envoyé aujourd'hui
          createdAt: "2026-11-05T09:00:00Z",
          id: "bumped-today",
          lastMessageAt: "2026-11-23T17:30:00Z",
          pinned: false,
        },
        {
          createdAt: "2026-11-19T12:00:00Z",
          id: "week-chat",
          lastMessageAt: "2026-11-20T12:00:00Z",
          pinned: false,
        },
      ],
      refNow
    );

    expect(grouped.pinned.map((c) => c.id)).toEqual(["pinned-old"]);
    expect(grouped.today.map((c) => c.id)).toEqual(["bumped-today"]);
    expect(grouped.lastWeek.map((c) => c.id)).toEqual(["week-chat"]);
  });
});
