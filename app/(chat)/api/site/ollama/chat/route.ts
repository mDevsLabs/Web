import { type NextRequest, NextResponse } from "next/server";
import { getLoopbackOllamaUrl } from "@/lib/site/ollama-url";
import { authenticateSession } from "@/lib/site/session-auth";

export type Role = "user" | "assistant" | "system";

/** Seuls ces rôles sont acceptés en entrée et transmis au template de chat. */
const ALLOWED_ROLES: ReadonlySet<string> = new Set<Role>([
  "user",
  "assistant",
  "system",
]);

export interface Message {
  content: string;
  id?: string;
  images?: string[];
  role: Role;
  timestamp?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, messages, temperature, maxTokens, systemPrompt } = body as {
      model: string;
      messages: Message[];
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    };

    if (!model) {
      return NextResponse.json(
        { error: "Le modèle est requis." },
        { status: 400 }
      );
    }

    // Identité vérifiée côté serveur (session signée)
    const session = await authenticateSession(req);
    if (!session.ok) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const ollamaUrl = getLoopbackOllamaUrl();
    if (!ollamaUrl) {
      return NextResponse.json(
        {
          error:
            "Configuration OLLAMA_BASE_URL invalide : seule une adresse de boucle locale est autorisée.",
        },
        { status: 500 }
      );
    }
    const ollamaHost = ollamaUrl.origin;

    // Préparer l'historique complet avec le prompt système éventuel
    const formattedMessages: { role: string; content: string }[] = [];

    if (systemPrompt && systemPrompt.trim().length > 0) {
      formattedMessages.push({
        content: systemPrompt.trim(),
        role: "system",
      });
    }

    if (Array.isArray(messages)) {
      messages.forEach((msg) => {
        // Le rôle est validé avant d'atteindre le template de chat d'Ollama : une
        // valeur arbitraire issue du corps de requête était transmise telle quelle.
        const role = ALLOWED_ROLES.has(msg.role) ? msg.role : null;
        if (role && (msg.content || (msg.images && msg.images.length > 0))) {
          const formattedMsg: {
            role: Role;
            content: string;
            images?: string[];
          } = {
            content: msg.content || "",
            role,
          };

          if (msg.images && msg.images.length > 0) {
            // Strip data:image/...;base64, prefix if present for Ollama API
            formattedMsg.images = msg.images.map((img) =>
              img.includes(";base64,") ? img.split(";base64,")[1] : img
            );
          }

          formattedMessages.push(formattedMsg);
        }
      });
    }

    const ollamaPayload = {
      messages: formattedMessages,
      model,
      options: {
        num_predict: typeof maxTokens === "number" ? maxTokens : 2048,
        temperature: typeof temperature === "number" ? temperature : 0.7,
      },
      stream: true,
    };

    let response: Response;
    try {
      response = await fetch(`${ollamaHost}/api/chat`, {
        body: JSON.stringify(ollamaPayload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: req.signal,
      });
    } catch (err: any) {
      console.error("Erreur de connexion à Ollama:", err);
      return NextResponse.json(
        {
          error:
            "Ollama local n'est pas accessible.\n" +
            'Veuillez démarrer Ollama avec la commande "ollama serve" puis réessayer.',
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erreur inconnue");
      console.error(`Ollama error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Ollama a répondu avec une erreur (${response.status}).` },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "Aucun flux de réponse reçu d'Ollama." },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    const stream = new ReadableStream({
      cancel() {
        // Client déconnecté : annuler la lecture en amont pour arrêter la génération Ollama
        reader.cancel().catch(() => {});
      },
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const parsed = JSON.parse(trimmed);
                if (parsed.message?.content) {
                  controller.enqueue(encoder.encode(parsed.message.content));
                }
              } catch {
                // Erreur de parsage de ligne NDJSON ignorable
              }
            }
          }

          // Process remaining buffer
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              if (parsed.message?.content) {
                controller.enqueue(encoder.encode(parsed.message.content));
              }
            } catch {
              // Ignore final line parse error
            }
          }

          controller.close();
        } catch {
          console.error("Streaming error");
          controller.error("Streaming error");
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("Erreur dans route Ollama:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
