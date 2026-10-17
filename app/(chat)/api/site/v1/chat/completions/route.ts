import { type NextRequest, NextResponse } from "next/server";
import { recordApiLog } from "@/lib/site/api-key-manager";
import { authenticateOpenAIRequest } from "@/lib/site/openai-auth";
import { resolveOllamaModel } from "@/lib/site/openai-model-mapper";
import type {
  OpenAIChatCompletionChunk,
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  OpenAIErrorResponse,
} from "@/lib/site/openai-types";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  // 1. Authentification & Rate limiting
  const auth = await authenticateOpenAIRequest(req);
  if (!auth.valid) {
    return auth.response;
  }

  try {
    const body = (await req.json()) as OpenAIChatCompletionRequest;

    if (!body.model) {
      return NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "missing_required_parameter",
            message: "Missing required parameter: 'model'.",
            param: "model",
            type: "invalid_request_error",
          },
        },
        { status: 400 }
      );
    }

    if (
      !body.messages ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0
    ) {
      return NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "missing_required_parameter",
            message:
              "Missing required parameter: 'messages' must be a non-empty array.",
            param: "messages",
            type: "invalid_request_error",
          },
        },
        { status: 400 }
      );
    }

    const planStr = (auth.plan || "Free").toLowerCase().trim();
    const isPaidPlan = ["plus", "pro", "max"].includes(planStr);
    const isFreePlan = !isPaidPlan;
    const modelName = (body.model || "").toLowerCase().trim();

    // Les alias cloud de la génération mAI-2 sont ouverts à tous les forfaits
    // (le quota hebdomadaire de tokens s'applique côté API mAI).
    const isMaiCloudAlias = modelName === "mai-2" || modelName === "mai-2-mini";

    if (isFreePlan && !modelName.includes("free") && !isMaiCloudAlias) {
      return NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "model_access_denied",
            message: `Le modèle '${body.model}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${auth.plan}) autorise uniquement les modèles contenant 'free'.`,
            param: "model",
            type: "permission_error",
          },
        },
        { status: 403 }
      );
    }

    // 2. Vérifier si le modèle est local (mAI / Ollama) ou Cloud (OpenRouter / Val Town).
    // Les alias mai-2 / mai-2-mini sont des modèles cloud : ils ne passent pas par Ollama.
    const isLocalModel =
      !isMaiCloudAlias &&
      (body.model.startsWith("mDevsLabs/") ||
        body.model.startsWith("mai-") ||
        body.model.includes("mAI"));
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      "";

    // Si c'est un modèle cloud (ou si l'utilisateur demande directement un modèle cloud), on délègue au proxy Val Town
    if (!isLocalModel) {
      const valTownRes = await fetch(
        "https://mai.val.run/v1/chat/completions",
        {
          body: JSON.stringify(body),
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );

      return new Response(valTownRes.body, {
        headers: {
          "Content-Type":
            valTownRes.headers.get("Content-Type") || "application/json",
        },
        status: valTownRes.status,
      });
    }

    const ollamaModel = resolveOllamaModel(body.model);
    const ollamaHost = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

    // Formater les messages pour l'API Ollama
    const formattedMessages = body.messages.map((m) => {
      let contentStr = "";
      let imagesStrArray: string[] | undefined;

      if (typeof m.content === "string") {
        contentStr = m.content;
      } else if (Array.isArray(m.content)) {
        m.content.forEach((part) => {
          if (part.type === "text" && part.text) {
            contentStr += part.text;
          } else if (part.type === "image_url" && part.image_url?.url) {
            const url = part.image_url.url;
            const b64Data = url.includes(";base64,")
              ? url.split(";base64,")[1]
              : url;
            if (!imagesStrArray) imagesStrArray = [];
            imagesStrArray.push(b64Data);
          }
        });
      }

      if (m.images && m.images.length > 0) {
        if (!imagesStrArray) imagesStrArray = [];
        m.images.forEach((img) => {
          const cleanB64 = img.includes(";base64,")
            ? img.split(";base64,")[1]
            : img;
          imagesStrArray!.push(cleanB64);
        });
      }

      return {
        content: contentStr,
        role: m.role,
        ...(imagesStrArray ? { images: imagesStrArray } : {}),
      };
    });

    const isStream = Boolean(body.stream);
    const options: Record<string, any> = {};
    if (typeof body.temperature === "number")
      options.temperature = body.temperature;
    if (typeof body.max_tokens === "number")
      options.num_predict = body.max_tokens;
    if (typeof body.top_p === "number") options.top_p = body.top_p;
    if (typeof body.frequency_penalty === "number")
      options.frequency_penalty = body.frequency_penalty;
    if (typeof body.presence_penalty === "number")
      options.presence_penalty = body.presence_penalty;

    const ollamaPayload = {
      messages: formattedMessages,
      model: ollamaModel,
      options,
      stream: isStream,
    };

    let ollamaRes: Response;
    try {
      ollamaRes = await fetch(`${ollamaHost}/api/chat`, {
        body: JSON.stringify(ollamaPayload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: req.signal,
      });
    } catch (err: any) {
      console.error("Ollama connection error:", err);
      return NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "ollama_offline",
            message: `Ollama engine unavailable at ${ollamaHost}. Please ensure Ollama is running.`,
            param: null,
            type: "service_unavailable",
          },
        },
        { status: 503 }
      );
    }

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => "");
      return NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: `ollama_http_${ollamaRes.status}`,
            message: `Ollama error: ${errText || ollamaRes.statusText}`,
            param: null,
            type: "api_error",
          },
        },
        { status: ollamaRes.status }
      );
    }

    const completionId = `chatcmpl-${Math.random().toString(36).substring(2, 11)}`;
    const createdTimestamp = Math.floor(Date.now() / 1000);

    // ─── MODE STREAMING SSE (Server-Sent Events) ────────────────────────────
    if (isStream) {
      const encoder = new TextEncoder();
      const reader = ollamaRes.body?.getReader();

      if (!reader) {
        return NextResponse.json<OpenAIErrorResponse>(
          {
            error: {
              code: "stream_error",
              message: "Failed to read response stream.",
              param: null,
              type: "api_error",
            },
          },
          { status: 500 }
        );
      }

      const stream = new ReadableStream({
        cancel() {
          // Client déconnecté : annuler la lecture en amont pour arrêter la génération Ollama
          reader.cancel().catch(() => {});
        },
        async start(controller) {
          // Premier chunk indicatif avec le rôle assistant
          const initialChunk: OpenAIChatCompletionChunk = {
            choices: [
              {
                delta: { role: "assistant" },
                finish_reason: null,
                index: 0,
              },
            ],
            created: createdTimestamp,
            id: completionId,
            model: body.model,
            object: "chat.completion.chunk",
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(initialChunk)}\n\n`)
          );

          const decoder = new TextDecoder();
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
                  const tokenContent = parsed.message?.content || "";
                  const isDone = Boolean(parsed.done);

                  if (tokenContent) {
                    const chunk: OpenAIChatCompletionChunk = {
                      choices: [
                        {
                          delta: { content: tokenContent },
                          finish_reason: null,
                          index: 0,
                        },
                      ],
                      created: createdTimestamp,
                      id: completionId,
                      model: body.model,
                      object: "chat.completion.chunk",
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                  }

                  if (isDone) {
                    const finalChunk: OpenAIChatCompletionChunk = {
                      choices: [
                        {
                          delta: {},
                          finish_reason: "stop",
                          index: 0,
                        },
                      ],
                      created: createdTimestamp,
                      id: completionId,
                      model: body.model,
                      object: "chat.completion.chunk",
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`)
                    );
                  }
                } catch {
                  // Erreur de parsage de ligne NDJSON ignorable
                }
              }
            }
          } catch (streamErr) {
            console.error("Streaming error:", streamErr);
          } finally {
            // Signal de fin SSE standard OpenAI
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            // Logging dans mprojects_api_logs
            recordApiLog({
              apiKey: auth.apiKeyToken,
              endpoint: "/v1/chat/completions",
              latencyMs: Math.round(performance.now() - startTime),
              method: "POST",
              statusCode: 200,
            }).catch(() => {});
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Content-Type": "text/event-stream",
        },
      });
    }

    // ─── MODE NON-STREAMING ──────────────────────────────────────────────────
    const ollamaData = await ollamaRes.json();
    const assistantContent = ollamaData.message?.content || "";
    const promptTokens =
      ollamaData.prompt_eval_count ||
      Math.round(JSON.stringify(body.messages).length / 4);
    const completionTokens =
      ollamaData.eval_count || Math.round(assistantContent.length / 4);

    const response: OpenAIChatCompletionResponse = {
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          message: {
            content: assistantContent,
            role: "assistant",
          },
        },
      ],
      created: createdTimestamp,
      id: completionId,
      model: body.model,
      object: "chat.completion",
      usage: {
        completion_tokens: completionTokens,
        prompt_tokens: promptTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };

    // Logging dans mprojects_api_logs
    await recordApiLog({
      apiKey: auth.apiKeyToken,
      endpoint: "/v1/chat/completions",
      latencyMs: Math.round(performance.now() - startTime),
      method: "POST",
      statusCode: 200,
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("OpenAI Chat Completion API Error:", err);
    return NextResponse.json<OpenAIErrorResponse>(
      {
        error: {
          code: "internal_error",
          message: err.message || "An internal server error occurred.",
          param: null,
          type: "api_error",
        },
      },
      { status: 500 }
    );
  }
}
