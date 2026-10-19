import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";
import { stripLegacyToolCallMarkup } from "../agent/legacyToolCallFromText.js";
import type { ShellSettings } from "../settingsStore.js";
import { streamCodexOAuth } from "./codexOAuthAdapter.js";
import { formatLlmSdkError } from "./formatLlmSdkError.js";
import { withLlmTransportRetry } from "./llmTransportRetry.js";
import { composeSystem, temperatureForMode } from "./modePrompts.js";
import {
  applyOpenAIProviderIdentity,
  prependProviderIdentitySystemPrompt,
} from "./providerIdentity.js";
import { buildOpenAIUserContent } from "./resolvedUserSerialize.js";
import { llmSdkResponseHeadTimeoutMs } from "./sdkResponseHeadTimeoutMs.js";
import type { SendableMessage } from "./sendResolved.js";
import { userMessageTextForSend } from "./sendResolved.js";
import {
  createStreamTimeoutManager,
  resolveStreamTimeouts,
} from "./streamTimeouts.js";
import {
  openAICompatibleEffectiveTemperature,
  openAIReasoningEffort,
  resolveRequestedTemperature,
} from "./thinkingLevel.js";
import type {
  StreamHandlers,
  TurnTokenUsage,
  UnifiedChatOptions,
} from "./types.js";

export async function streamOpenAICompatible(
  settings: ShellSettings,
  messages: SendableMessage[],
  options: UnifiedChatOptions,
  handlers: StreamHandlers
): Promise<void> {
  if (options.requestOAuthAuth?.provider === "codex") {
    await streamCodexOAuth(
      settings,
      messages,
      options,
      handlers,
      options.requestOAuthAuth
    );
    return;
  }

  const key = options.requestApiKey.trim();
  if (!key) {
    handlers.onError(
      "Clé API non configurée pour ce fournisseur compatible OpenAI. Veuillez renseigner votre clé dans Paramètres → Modèles."
    );
    return;
  }

  const baseURL = options.requestBaseURL?.trim() || undefined;
  const model = options.requestModelId.trim();
  if (!model) {
    handlers.onError(
      "Nom de requête du modèle manquant. Veuillez modifier le modèle dans Paramètres → Modèles."
    );
    return;
  }

  const proxyRaw =
    (options.requestProxyUrl?.trim() || settings.openAI?.proxyUrl?.trim()) ??
    "";
  let httpAgent: InstanceType<typeof HttpsProxyAgent> | undefined;
  if (proxyRaw) {
    try {
      httpAgent = new HttpsProxyAgent(proxyRaw);
    } catch {
      handlers.onError(
        "Adresse du proxy invalide. Veuillez vérifier le format du proxy HTTP dans Paramètres → Modèles."
      );
      return;
    }
  }

  // maxRetries: 0，避免 SDK 对超时类失败自动重试拉长等待
  const client = new OpenAI(
    applyOpenAIProviderIdentity(
      settings,
      {
        apiKey: key,
        baseURL,
        dangerouslyAllowBrowser: false,
        httpAgent,
        maxRetries: 0,
        timeout: llmSdkResponseHeadTimeoutMs(),
      },
      options.requestProviderIdentity
    )
  );

  const apiMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const role = m.role as "user" | "assistant";
      if (role === "user" && m.resolved && m.resolved.hasImages) {
        return { content: buildOpenAIUserContent(m.resolved), role };
      }
      const text = role === "user" ? userMessageTextForSend(m) : m.content;
      return { content: text, role };
    });

  const storedSystem = messages.find((m) => m.role === "system");
  const systemContent = prependProviderIdentitySystemPrompt(
    settings,
    composeSystem(
      storedSystem?.content,
      options.mode,
      options.agentSystemAppend
    ),
    options.requestProviderIdentity
  );
  const requestedTemperature = resolveRequestedTemperature(
    temperatureForMode(options.mode),
    options.temperatureMode,
    options.temperature
  );
  const temperature =
    options.temperatureMode === "custom" && options.temperature != null
      ? requestedTemperature
      : openAICompatibleEffectiveTemperature(model, requestedTemperature);
  const effort = openAIReasoningEffort(options.thinkingLevel ?? "off");

  let full = "";
  let buffer = "";
  let inThinking = false;
  let usage: TurnTokenUsage | undefined;
  let activeStream: { controller?: { abort?: () => void } } | null = null;

  const timeoutAc = new AbortController();
  const onAbort = () => {
    timeoutAc.abort();
    try {
      activeStream?.controller?.abort?.();
    } catch {
      /* ignore */
    }
  };
  if (options.signal.aborted) {
    timeoutAc.abort();
  } else {
    options.signal.addEventListener("abort", onAbort, { once: true });
  }

  const timeoutConfig = resolveStreamTimeouts(settings);
  const timeoutMgr = createStreamTimeoutManager(timeoutConfig, () =>
    timeoutAc.abort()
  );
  timeoutMgr.start();

  try {
    const stream = await withLlmTransportRetry(
      () =>
        client.chat.completions.create(
          {
            max_tokens: options.maxOutputTokens,
            messages: [
              { content: systemContent, role: "system" as const },
              ...apiMessages,
            ],
            model,
            stream: true,
            stream_options: { include_usage: true },
            temperature,
            ...(effort ? { reasoning_effort: effort } : {}),
          },
          { signal: timeoutAc.signal }
        ),
      { signal: options.signal }
    );
    activeStream = stream as { controller?: { abort?: () => void } };

    for await (const chunk of stream) {
      if (timeoutAc.signal.aborted) {
        break;
      }
      timeoutMgr.onChunk();

      // 提取 usage（通常在最后一个 chunk，choices 为空时携带）
      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
        };
      }

      // 1. natively supported reasoning_content (e.g. DeepSeek API)
      // eslint-disable-next  @typescript-eslint/no-explicit-any
      const reasoningPiece =
        (chunk.choices[0]?.delta as any)?.reasoning_content ?? "";
      if (reasoningPiece) {
        handlers.onThinkingDelta?.(reasoningPiece);
      }

      // 2. parse <think> tags in content
      const piece = chunk.choices[0]?.delta?.content ?? "";
      if (piece) {
        buffer += piece;

        while (buffer.length > 0) {
          if (inThinking) {
            const closeIdx = buffer.indexOf("</think>");
            if (closeIdx === -1) {
              const partialClose = [
                "<",
                "</",
                "</t",
                "</th",
                "</thi",
                "</thin",
                "</think",
              ].find((p) => buffer.endsWith(p));
              if (partialClose) {
                const safeText = buffer.slice(
                  0,
                  buffer.length - partialClose.length
                );
                if (safeText) {
                  handlers.onThinkingDelta?.(safeText);
                }
                buffer = partialClose;
                break;
              }
              handlers.onThinkingDelta?.(buffer);
              buffer = "";
            } else {
              const thinkText = buffer.slice(0, closeIdx);
              if (thinkText) {
                handlers.onThinkingDelta?.(thinkText);
              }
              inThinking = false;
              buffer = buffer.slice(closeIdx + 8);
            }
          } else {
            const openIdx = buffer.indexOf("<think>");
            if (openIdx === -1) {
              // Check for partial '<think>' at the end
              const partialOpen = [
                "<",
                "<t",
                "<th",
                "<thi",
                "<thin",
                "<think",
              ].find((p) => buffer.endsWith(p));
              if (partialOpen) {
                const safeText = buffer.slice(
                  0,
                  buffer.length - partialOpen.length
                );
                if (safeText) {
                  full += safeText;
                  handlers.onDelta(safeText);
                }
                buffer = partialOpen;
                break; // wait for next chunk
              }
              full += buffer;
              handlers.onDelta(buffer);
              buffer = "";
            } else {
              const textBefore = buffer.slice(0, openIdx);
              if (textBefore) {
                full += textBefore;
                handlers.onDelta(textBefore);
              }
              inThinking = true;
              buffer = buffer.slice(openIdx + 7);
            }
          }
        }
      }
    }

    if (buffer) {
      if (inThinking) {
        handlers.onThinkingDelta?.(buffer);
      } else {
        full += buffer;
        handlers.onDelta(buffer);
      }
    }

    timeoutMgr.stop();
    const cleaned = stripLegacyToolCallMarkup(full);

    if (
      !usage ||
      ((usage.inputTokens ?? 0) === 0 && (usage.outputTokens ?? 0) === 0)
    ) {
      let inputChars = systemContent.length;
      for (const m of apiMessages) {
        if (typeof m.content === "string") {
          inputChars += m.content.length;
        } else if (Array.isArray(m.content)) {
          inputChars += JSON.stringify(m.content).length;
        }
      }
      const outputChars = cleaned.length;
      usage = {
        inputTokens: Math.max(1, Math.ceil(inputChars / 4)),
        outputTokens: Math.max(1, Math.ceil(outputChars / 4)),
      };
    }

    handlers.onDone(cleaned, usage);
  } catch (e: unknown) {
    timeoutMgr.stop();
    if (options.signal.aborted) {
      if (
        !usage ||
        ((usage.inputTokens ?? 0) === 0 && (usage.outputTokens ?? 0) === 0)
      ) {
        let inputChars = systemContent.length;
        for (const m of apiMessages) {
          if (typeof m.content === "string") inputChars += m.content.length;
        }
        usage = {
          inputTokens: Math.max(1, Math.ceil(inputChars / 4)),
          outputTokens: Math.max(1, Math.ceil(full.length / 4)),
        };
      }
      handlers.onDone(full, usage);
      return;
    }
    if (timeoutAc.signal.aborted) {
      handlers.onError(
        "Délai d'attente dépassé : la réponse du modèle est trop lente, requête interrompue. Veuillez réessayer."
      );
      return;
    }
    handlers.onError(formatLlmSdkError(e));
  } finally {
    activeStream = null;
    options.signal.removeEventListener("abort", onAbort);
  }
}
