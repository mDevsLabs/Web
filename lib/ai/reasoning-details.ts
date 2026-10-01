// Capture de `reasoning_details` sur un flux SSE.
//
// Le provider AI SDK ne lit que `content`, `tool_calls` et `annotations` dans la
// réponse de `/chat/completions` : les blocs de raisonnement y sont ignorés, et
// avec eux les `reasoning_details` que le fournisseur renvoie. Les tokens, eux,
// sont bien captés (via `usage.outputTokenDetails.reasoningTokens`) parce que
// le provider analyse le bloc `usage`.
//
// On récupère donc ce champ à la source : le `fetch` du provider est surchargé
// dans lib/ai/providers.ts, c'est le seul endroit où le flux passe encore
// intact.
//
// Trois règles, non négociables :
// 1. la branche de lecture ne doit JAMAIS ralentir ni casser le flux principal —
//    chaque erreur y est avalée, et le lecteur est abandonné si le client part ;
// 2. la collecte est plafonnée, sinon un modèle bavard ferait grossir un run
//    sans borne (les détails contiennent le raisonnement complet, pas un résumé) ;
// 3. rien n'est écrit dans les logs : c'est du contenu de raisonnement.

import { type ReasoningDetail, readReasoningDetails } from "@/lib/agent/usage";

/** Plafonds : 20 blocs, 256 Ko de texte cumulé, 1 Mo de ligne non terminée. */
const MAX_BLOCKS = 20;
const MAX_TEXT_BYTES = 256 * 1024;
const MAX_LINE_BYTES = 1024 * 1024;

export type ReasoningDetailsSink = {
  /** Détails collectés depuis le dernier `reset()`. */
  details: ReasoningDetail[];
  /**
   * Branche la lecture sur une réponse. Renvoie une réponse équivalente dont le
   * corps est intact : appelant et provider ne voient aucune différence.
   *
   * Sans effet sur une réponse non-SSE (JSON simple) ou déjà branchée — un
   * double branchement ne serait qu'une source de fuite.
   */
  attach: (response: Response) => Response;
  /** Vide la collecte entre deux tours d'un même run. */
  reset: () => void;
};

/**
 * Crée un collecteur de détails de raisonnement.
 *
 * Le collecteur est transmissions par l'appelant plutôt que global : un module
 * mutable partagé donnerait à deux requêtes concurrentes le même tampon, et le
 * raisonnement d'un utilisateur se retrouverait chez un autre.
 */
export function createReasoningDetailsSink(): ReasoningDetailsSink {
  let details: ReasoningDetail[] = [];
  let textBytes = 0;
  let attached = false;
  // Le budget doit être vérifié AVANT d'ajouter un bloc, pas seulement entre
  // deux lectures : un seul bloc de 400 Ko dépasserait la limite à lui seul, et
  // passerait en entier parce que le test n'a lieu qu'au chunk suivant.
  let saturated = false;

  const reset = () => {
    details = [];
    textBytes = 0;
    attached = false;
    saturated = false;
  };

  const attach = (response: Response): Response => {
    // Un seul branchement par réponse : un second `tee()` doublerait la
    // consommation mémoire pour rien.
    if (attached || !response.body) {
      return response;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/event-stream")) {
      return response;
    }
    attached = true;

    const [forCaller, forScan] = response.body.tee();
    const withinBudget = () =>
      !saturated && details.length < MAX_BLOCKS && textBytes < MAX_TEXT_BYTES;

    void scanSse(forScan, {
      onBlock: (block) => {
        const text = typeof block.text === "string" ? block.text : "";
        // Un bloc qui ne tient pas dans le budget restant est écarté en
        // entier plutôt que tronqué : une moitié de raisonnement se lirait
        // comme un raisonnement complet.
        if (saturated || details.length >= MAX_BLOCKS) {
          saturated = true;
          return;
        }
        if (textBytes + text.length > MAX_TEXT_BYTES) {
          saturated = true;
          return;
        }
        details.push(block);
        textBytes += text.length;
      },
      shouldContinue: withinBudget,
    });

    return new Response(forCaller, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  };

  return {
    attach,
    get details() {
      return details;
    },
    reset,
  };
}

type ScanOptions = {
  onBlock: (block: ReasoningDetail) => void;
  shouldContinue: () => boolean;
};

/**
 * Lit un flux SSE à la recherche des blocs `reasoning_details`.
 *
 * Volontairement tolérant : un fragment coupé au milieu d'un chunk JSON est
 * normal en SSE, on accumule donc jusqu'à trouver une ligne `data:` complète, et
 * on ne désérialise que les lignes qui mentionnent le champ — les chunks de
 * texte, qui sont la quasi-totalité, ne sont jamais passés par `JSON.parse`.
 */
async function scanSse(
  stream: ReadableStream<Uint8Array>,
  options: ScanOptions
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (options.shouldContinue()) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        collectFromLine(line, options.onBlock);
        newline = buffer.indexOf("\n");
      }
      // Un chunk unique peut être volumineux (réponse entière d'un modèle non
      // streamé) : sans cette borne, le buffer croîtrait sans limite.
      if (buffer.length > MAX_LINE_BYTES) {
        return;
      }
    }
  } catch {
    // Flux interrompu (client déconnecté, avancement annulé) : rien à faire, et
    // surtout aucune raison de propager l'erreur au flux principal.
  } finally {
    // Libère la branche de lecture. `cancel()` est un no-op si le flux est déjà
    // terminé ; l'ignorer laisserait un reader en suspens.
    try {
      await reader.cancel();
    } catch {
      // Le flux est déjà clos : rien à libérer.
    }
  }
}

const REASONING_DETAILS_KEY = "reasoning_details";

/**
 * Collecte les blocs d'une ligne `data:`.
 *
 * Le champ est cherché à TOUTE profondeur plutôt qu'à un emplacement supposé :
 * selon la route et le fournisseur il arrive à la racine du chunk, sous
 * `choices[].delta` ou sous `choices[].message`. Épingler une position ferait
 * perdre silencieusement la collecte dès que la forme change — exactement ce que
 * l'on veut éviter.
 */
function collectFromLine(
  line: string,
  onBlock: (block: ReasoningDetail) => void
) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) {
    return;
  }
  const payload = trimmed.slice(5).trim();
  if (
    !payload ||
    payload === "[DONE]" ||
    !payload.includes(REASONING_DETAILS_KEY)
  ) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    // Fragment incomplet ou champ malformé : ignoré. Le chunk suivant portera
    // une version complète.
    return;
  }
  walkForReasoningDetails(parsed, onBlock, 0);
}

/** Profondeur maximale de la recherche : au-delà, la forme n'est pas la nôtre. */
const MAX_WALK_DEPTH = 6;

function walkForReasoningDetails(
  node: unknown,
  onBlock: (block: ReasoningDetail) => void,
  depth: number
): void {
  if (depth > MAX_WALK_DEPTH || node === null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkForReasoningDetails(item, onBlock, depth + 1);
    }
    return;
  }
  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key === REASONING_DETAILS_KEY) {
      // L'extraction et le plafond sont ceux du module d'usage : les dupliquer
      // ici les ferait diverger au premier changement.
      for (const block of readReasoningDetails(value)) {
        onBlock(block);
      }
      continue;
    }
    if (value && typeof value === "object") {
      walkForReasoningDetails(value, onBlock, depth + 1);
    }
  }
}
