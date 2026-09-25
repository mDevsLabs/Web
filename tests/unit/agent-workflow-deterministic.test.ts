import { describe, expect, it, vi } from "vitest";
import {
  closeActivity,
  emptyDurationCheckpoint,
  openActivity,
} from "@/lib/agent/limits";
import { composeAgentInstructions } from "@/lib/agent/runtime";
import type { ToolExecutionContext } from "@/lib/agent/types";

const mocks = vi.hoisted(() => ({
  extractDocument: vi.fn(),
  fetchDocument: vi.fn(),
  saveDocument: vi.fn(),
  search: vi.fn(),
}));

vi.mock("@/lib/ai/tools/web-search", () => ({
  webSearch: { execute: mocks.search },
}));
vi.mock("@/lib/agent/tools/internal/extract", () => ({
  extractDocument: mocks.extractDocument,
  fetchDocumentBuffer: mocks.fetchDocument,
  MAX_EXTRACT_CHARS: 200_000,
  MIN_EXTRACT_CHARS: 100,
}));
vi.mock("@/lib/db/queries", () => ({ saveDocument: mocks.saveDocument }));

const { searchWebTool } = await import("@/lib/agent/tools/internal/search-web");
const { readFileTool } = await import("@/lib/agent/tools/internal/read-file");
const { createArtifactTool } = await import(
  "@/lib/agent/tools/internal/create-artifact"
);

const context: ToolExecutionContext = {
  chatId: "chat",
  projectId: null,
  runId: "run",
  sessionToken: "session",
  stepId: "step",
  toolCallId: "call",
  toolExecutionId: "execution",
  userEmail: "user@example.test",
  userId: "user",
};

describe("Parcours Agent déterministe — recherche, fichier, livrable", () => {
  it("conserve les sources et crée un livrable à partir de résultats simulés", async () => {
    mocks.search.mockResolvedValue({
      query: "agent",
      results: [
        {
          snippet: "Fait vérifié",
          source: "example.com",
          title: "Source A",
          url: "https://example.com/a",
        },
      ],
    });
    mocks.fetchDocument.mockResolvedValue({
      buffer: Buffer.from("texte"),
      contentType: "text/plain",
    });
    mocks.extractDocument.mockResolvedValue({
      data: {
        contentType: "text/plain",
        headings: [],
        isTruncated: false,
        length: 5,
        pages: 1,
        tables: [],
        text: "texte",
      },
    });
    mocks.saveDocument.mockResolvedValue(undefined);

    const searched = await searchWebTool.execute({ query: "agent" }, context);
    expect(searched.success).toBe(true);
    if (!searched.success) return;
    expect(searched.sources?.[0]?.url).toBe("https://example.com/a");

    const read = await readFileTool.execute(
      { url: "https://example.com/doc.txt" },
      context
    );
    expect(read.success).toBe(true);
    if (!read.success) return;
    expect((read.data as { text: string }).text).toBe("texte");
    expect(read.sources?.[0]?.kind).toBe("file");

    const artifact = await createArtifactTool.execute(
      {
        content: "Source A : Fait vérifié. Fichier : texte.",
        kind: "text",
        title: "Synthèse",
      },
      context
    );
    expect(artifact.success).toBe(true);
    if (!artifact.success) return;
    expect(artifact.outcome?.artifact?.title).toBe("Synthèse");
    expect(mocks.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Synthèse", userId: "user" })
    );
  });

  it("interrompt une tranche puis reprend avec un nouveau budget sans modifier l'ancien", () => {
    const old = openActivity(emptyDurationCheckpoint(), { now: () => 1000 });
    const stopped = closeActivity(old, { now: () => 241_000 });
    expect(stopped.activeMs).toBe(240_000);
    expect(stopped.activeSince).toBeNull();
    const resumed = openActivity(emptyDurationCheckpoint(), {
      now: () => 500_000,
    });
    expect(resumed.activeMs).toBe(0);
    expect(stopped.activeMs).toBe(240_000);
    expect(
      composeAgentInstructions("Résumé borné : source A et livrable Synthèse", [
        "Poursuis l'analyse",
      ])
    ).toContain("Poursuis l'analyse");
  });
});
