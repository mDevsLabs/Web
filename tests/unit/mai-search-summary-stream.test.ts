import { describe, expect, it } from "vitest";
import {
  collectSummarySources,
  readSummaryStream,
  type SummaryStreamEvent,
} from "@/lib/search/summary-stream";

function sseResponse(blocks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const block of blocks) {
          controller.enqueue(encoder.encode(block));
        }
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } }
  );
}

describe("sources de la synthèse mAI Search", () => {
  it("déduplique, normalise et plafonne les sources", () => {
    const initial = Array.from({ length: 8 }, (_, index) => ({
      title: `Résultat ${index}`,
      url: `https://exemple.fr/page-${index}`,
    }));
    const sources = collectSummarySources({
      initial: [
        { title: "Doublon", url: "https://www.exemple.fr/a" },
        ...initial,
        { title: "Invalide", url: "javascript:alert(1)" },
      ],
      target: { title: "Cible", url: "https://cible.fr/article" },
      toolResults: [
        {
          output: {
            results: [
              { title: "Outil", url: "https://outil.fr/x" },
              { title: "Doublon outil", url: "https://exemple.fr/a" },
            ],
          },
        },
      ],
    });
    expect(sources).toHaveLength(12);
    expect(sources[0].url).toBe("https://cible.fr/article");
    expect(sources[0].type).toBe("target");
    expect(sources[1].domain).toBe("exemple.fr");
    expect(sources.some((source) => source.url === "https://outil.fr/x")).toBe(
      true
    );
    expect(sources.every((source) => source.url.startsWith("http"))).toBe(true);
  });

  it("lit un flux SSE fragmenté et ignore une ligne illisible", async () => {
    const events: SummaryStreamEvent[] = [];
    const response = sseResponse([
      'data: {"type":"sources","sources":[{"id":"https://a.fr","title":"A","url":"https://a.fr","domain":"a.fr","type":"web"}]}\n\n',
      'data: {"type":"text-delta","delta":"Bon',
      'jour"}\n\ndata: pas-du-json\n\n',
      'data: {"type":"done"}\n\n',
    ]);
    await readSummaryStream(response, (event) => events.push(event));
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("sources");
    expect(events[1]).toEqual({ delta: "Bonjour", type: "text-delta" });
    expect(events[2]).toEqual({ type: "done" });
  });
});
