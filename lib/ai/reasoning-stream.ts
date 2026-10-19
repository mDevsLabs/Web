/**
 * Écriture de la réflexion dans le flux UI de l'AI SDK.
 *
 * Le provider n'émet jamais de chunk `reasoning-*` : son adaptateur ne lit que
 * `content` et `tool_calls`. Le collecteur SSE (`reasoning-details.ts`) capte
 * donc le texte à la source, et ce module le réinjecte dans le MÊME flux que
 * celui consommé par l'interface. Sans cette réinjection, le texte serait
 * collecté pour l'observabilité mais resterait invisible.
 *
 * Le writer est volontairement tolérant : une écriture après fermeture (client
 * parti, flux annulé) ne doit jamais interrompre la génération en cours.
 */

type ChunkWriter<TChunk> = {
  write: (chunk: TChunk) => void;
};

export type ReasoningChunkWriter = {
  /** Ajoute un delta de réflexion. Ouvre la part au premier texte non vide. */
  push: (text: string) => void;
  /** Ferme la part une seule fois. Sans texte reçu, n'écrit rien. */
  finish: () => void;
};

export function createReasoningChunkWriter<TChunk>(
  writer: ChunkWriter<TChunk>,
  id: string
): ReasoningChunkWriter {
  let started = false;
  let finished = false;

  const write = (chunk: TChunk) => {
    try {
      writer.write(chunk);
    } catch {
      // Flux déjà fermé : la réponse texte reste valable, on ne la casse pas.
    }
  };

  return {
    finish() {
      if (!started || finished) {
        return;
      }
      finished = true;
      write({ id, type: "reasoning-end" } as TChunk);
    },
    push(text) {
      if (finished || !text) {
        return;
      }
      if (!started) {
        started = true;
        write({ id, type: "reasoning-start" } as TChunk);
      }
      write({ delta: text, id, type: "reasoning-delta" } as TChunk);
    },
  };
}
