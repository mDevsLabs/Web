import { describe, expect, it } from "vitest";
import { createReasoningDetailsSink } from "@/lib/ai/reasoning-details";

// Le provider AI SDK ignore `reasoning_details` : le champ n'est lisible qu'ici,
// sur le flux, avant que le provider ne le jette. Trois propriétés rendent ce
// code risqué et méritent des tests : il ne doit JAMAIS altérer le flux
// principal, JAMAIS bloquer, et JAMAIS croître sans borne.

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(body, {
    headers: { "content-type": "text/event-stream" },
  });
}

/** Laisse le microtask qui pilote la branche de lecture se terminer. */
function flush(times = 12) {
  return new Promise<void>((resolve) => {
    let left = times;
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        resolve();
        return;
      }
      setTimeout(tick, 0);
    };
    setTimeout(tick, 0);
  });
}

describe("Le collecteur ne touche pas au flux principal", () => {
  it("redistribue le flux intact", async () => {
    const payload = [
      'data: {"choices":[{"delta":{"content":"Bonjour"}}]}\n',
      'data: {"choices":[{"delta":{"reasoning_details":[{"text":"réfléchir"}]}}]}\n',
      "data: [DONE]\n",
    ];
    const sink = createReasoningDetailsSink();
    const response = sink.attach(sseResponse(payload));

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toBe(payload.join(""));
  });

  it("ignore une réponse qui n'est pas un flux SSE", async () => {
    const sink = createReasoningDetailsSink();
    const json = Response.json({ ok: true });
    const attached = sink.attach(json);

    // La même réponse est renvoyée : rien n'est consommé ni dupliqué.
    expect(attached).toBe(json);
    expect(await attached.json()).toEqual({ ok: true });
    expect(sink.details).toEqual([]);
  });

  it("ne se branche qu'une fois sur une même réponse", async () => {
    const sink = createReasoningDetailsSink();
    const response = sseResponse([
      'data: {"reasoning_details":[{"text":"x"}]}\n',
    ]);
    const first = sink.attach(response);
    // Une seconde passe sur la réponse DÉJÀ transformée ne doit pas rebrancher.
    expect(sink.attach(first)).toBe(first);
    await flush();
  });
});

describe("La collecte trouve le champ où qu'il soit", () => {
  it("lit un bloc à la racine du chunk", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse(['data: {"reasoning_details":[{"text":"racine"}]}\n'])
    );
    await response.text();
    await flush();
    expect(sink.details[0]?.text).toBe("racine");
  });

  it("lit un bloc sous choices[].delta", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse([
        'data: {"choices":[{"delta":{"reasoning_details":[{"text":"delta"}]}}]}\n',
      ])
    );
    await response.text();
    await flush();
    expect(sink.details[0]?.text).toBe("delta");
  });

  it("lit un bloc sous choices[].message", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse([
        'data: {"choices":[{"message":{"reasoning_details":[{"text":"message"}]}}]}\n',
      ])
    );
    await response.text();
    await flush();
    expect(sink.details[0]?.text).toBe("message");
  });

  it("ignore les chunks de texte, qui ne sont jamais désérialisés", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"du texte ordinaire"}}]}\n',
        'data: {"choices":[{"delta":{"reasoning_details":[{"text":"retenu"}]}}]}\n',
      ])
    );
    await response.text();
    await flush();
    expect(sink.details).toHaveLength(1);
    expect(sink.details[0]?.text).toBe("retenu");
  });

  it("tolère un JSON malformé sans casser la suite", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse([
        'data: {"reasoning_details":[{"text":"coupé"\n',
        'data: {"reasoning_details":[{"text":"complet"}]}\n',
      ])
    );
    await response.text();
    await flush();
    // Le fragment cassé est ignoré, le suivant est retenu.
    expect(sink.details.some((block) => block.text === "complet")).toBe(true);
  });
});

describe("La collecte est bornée", () => {
  it("plafonne le nombre de blocs", async () => {
    const sink = createReasoningDetailsSink();
    const lines: string[] = [];
    for (let i = 0; i < 200; i++) {
      lines.push(`data: {"reasoning_details":[{"text":"bloc ${i}"}]}\n`);
    }
    const response = sink.attach(sseResponse(lines));
    await response.text();
    await flush(40);
    expect(sink.details.length).toBeLessThanOrEqual(20);
  });

  it("plafonne le volume de texte", async () => {
    const sink = createReasoningDetailsSink();
    // Un seul bloc énorme : le plafond de blocs ne suffit pas, c'est le volume
    // qui ferait grossir le run.
    const huge = "x".repeat(400 * 1024);
    const response = sink.attach(
      sseResponse([`data: {"reasoning_details":[{"text":"${huge}"}]}\n`])
    );
    await response.text();
    await flush(40);
    const kept = sink.details.reduce(
      (sum, block) =>
        sum + (typeof block.text === "string" ? block.text.length : 0),
      0
    );
    expect(kept).toBeLessThanOrEqual(256 * 1024);
  });

  it("émet le champ reasoning et ne duplique pas un snapshot cumulé", async () => {
    const sink = createReasoningDetailsSink();
    const deltas: string[] = [];
    sink.onDelta = (text) => deltas.push(text);
    const response = sink.attach(
      sseResponse([
        'data: {"choices":[{"delta":{"reasoning":"Je"}}]}\n',
        'data: {"choices":[{"delta":{"reasoning":"Je pense"}}]}\n',
        'data: {"choices":[{"delta":{"reasoning":"Je pense"}}]}\n',
      ])
    );
    await response.text();
    await flush();
    expect(deltas.join("")).toBe("Je pense");
  });

  it("continue à AFFICHER la réflexion après le plafond de blocs", async () => {
    // OpenRouter/GLM envoie `reasoning_details` à chaque chunk : vingt blocs
    // valent vingt fragments, et l'affichage s'arrêtait au milieu du
    // raisonnement alors que la génération continuait.
    const sink = createReasoningDetailsSink();
    const deltas: string[] = [];
    sink.onDelta = (text) => deltas.push(text);
    const lines: string[] = [];
    for (let i = 0; i < 200; i++) {
      lines.push(
        `data: {"choices":[{"delta":{"reasoning_details":[{"text":"fragment ${i} "}]}}]}\n`
      );
    }
    const response = sink.attach(sseResponse(lines));
    await response.text();
    await flush(60);
    // La collecte reste bornée…
    expect(sink.details.length).toBeLessThanOrEqual(20);
    // …mais la réflexion visible va au bout du flux.
    const affiche = deltas.join("");
    expect(affiche).toContain("fragment 0 ");
    expect(affiche).toContain("fragment 199 ");
  });

  it("branche plusieurs réponses d'un même run", async () => {
    const sink = createReasoningDetailsSink();
    const deltas: string[] = [];
    sink.onDelta = (text) => deltas.push(text);
    const first = sink.attach(
      sseResponse(['data: {"choices":[{"delta":{"reasoning":"un"}}]}\n'])
    );
    const second = sink.attach(
      sseResponse(['data: {"choices":[{"delta":{"reasoning":"deux"}}]}\n'])
    );
    await first.text();
    await second.text();
    await flush();
    expect(deltas.join("")).toBe("undeux");
  });

  it("reset vide la collecte", async () => {
    const sink = createReasoningDetailsSink();
    const response = sink.attach(
      sseResponse(['data: {"reasoning_details":[{"text":"avant"}]}\n'])
    );
    await response.text();
    await flush();
    expect(sink.details).toHaveLength(1);

    sink.reset();
    expect(sink.details).toEqual([]);
  });

  it("livre tout le content après une réflexion plus longue que le plafond", async () => {
    const sink = createReasoningDetailsSink();
    const huge = "r".repeat(300 * 1024);
    const payload = [
      `data: {"choices":[{"delta":{"reasoning":"${huge}"}}]}\n`,
      'data: {"choices":[{"delta":{"content":"Bonjour le reste de la phrase."}}]}\n',
    ];
    const response = sink.attach(sseResponse(payload));
    expect(await response.text()).toBe(payload.join(""));
  });
});
