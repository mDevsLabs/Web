import { GoogleGenerativeAI } from "@google/generative-ai";
import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";
import { runCodexOAuthResponseText } from "./llm/codexOAuthAdapter.js";
import { resolveModelRequest } from "./llm/modelResolve.js";
import {
  applyAnthropicProviderIdentity,
  applyOpenAIProviderIdentity,
  buildAnthropicAuthOptions,
  buildAnthropicProviderIdentityMetadata,
  createAnthropicClient,
  prependProviderIdentitySystemPrompt,
  providerIdentityForOAuthAuth,
} from "./llm/providerIdentity.js";
import { ensureFreshOAuthAuthForRequest } from "./llm/providerOAuthLogin.js";
import { openAICompatibleEffectiveTemperature } from "./llm/thinkingLevel.js";
import { checkMaiQuotaAvailable } from "./maiAccountStore.js";
import type { ShellSettings } from "./settingsStore.js";

export const THREAD_TITLE_PLACEHOLDER = "???";

const MAX_FALLBACK_TITLE_CODEPOINTS = 48;
const MAX_GENERATED_TITLE_CODEPOINTS = 80;

const THREAD_TITLE_SYSTEM_PROMPT = `Generate a concise, sentence-case title (3-7 words) that captures the main topic or goal of this coding session. The title should be clear enough that the user recognizes the session in a list. Use sentence case: capitalize only the first word and proper nouns.

Return JSON with a single "title" field.

Good examples:
{"title": "Fix login button on mobile"}
{"title": "Add OAuth authentication"}
{"title": "Debug failing CI tests"}
{"title": "Refactor API client error handling"}

Bad (too vague): {"title": "Code changes"}
Bad (too long): {"title": "Investigate and fix the issue where the login button does not respond on mobile devices"}
Bad (wrong case): {"title": "Fix Login Button On Mobile"}`;
const MAX_RULE_CONTEXT_CODEPOINTS = 4000;

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/gu, " ").trim();
}

function sliceByCodePoints(input: string, max: number): string {
  const chars = Array.from(input);
  return chars.length <= max
    ? input
    : `${chars.slice(0, Math.max(1, max - 1)).join("")}…`;
}

function stripOuterCodeFence(input: string): string {
  const trimmed = input.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

function normalizeTitleCandidate(
  input: string,
  max = MAX_GENERATED_TITLE_CODEPOINTS
): string | null {
  const singleLine = collapseWhitespace(input.replace(/\r?\n/g, " ")).replace(
    /^["'`]+|["'`]+$/g,
    ""
  );
  if (!singleLine) {
    return null;
  }
  return sliceByCodePoints(singleLine, max);
}

function clipRuleContext(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return "";
  }
  return sliceByCodePoints(normalized, MAX_RULE_CONTEXT_CODEPOINTS);
}

function buildThreadTitleSystemPrompt(
  ruleContext: string,
  _language?: string
): string {
  const clippedRules = clipRuleContext(ruleContext);
  const langInstruction =
    "Générez le titre dans la langue principale de la requête utilisateur (par défaut en français si la langue est indéterminée).";

  if (!clippedRules) {
    return [THREAD_TITLE_SYSTEM_PROMPT, "", langInstruction].join("\n");
  }
  return [
    THREAD_TITLE_SYSTEM_PROMPT,
    "",
    langInstruction,
    "Follow the language and style requirements in the rules below when deciding the title language and wording.",
    "If the rules specify a default reply language, generate the title in that language unless the user explicitly switched languages in the current request.",
    "",
    clippedRules,
  ].join("\n");
}

function extractTitleFromJsonLike(input: string): string | null {
  const trimmed = stripOuterCodeFence(input);
  const tryParse = (raw: string): string | null => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "string") {
        return normalizeTitleCandidate(parsed);
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        "title" in parsed &&
        typeof (parsed as { title?: unknown }).title === "string"
      ) {
        return normalizeTitleCandidate((parsed as { title: string }).title);
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  return (
    tryParse(trimmed) ??
    (() => {
      const match = trimmed.match(/\{[\s\S]*\}/);
      return match ? tryParse(match[0]) : null;
    })()
  );
}

function extractOpenAIText(
  content: OpenAI.Chat.Completions.ChatCompletionMessage["content"]
): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  const parts = content as Array<Record<string, unknown>>;
  return parts
    .map((part) => {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "text" &&
        "text" in part
      ) {
        return typeof part.text === "string" ? part.text : "";
      }
      return "";
    })
    .join("\n");
}

export function deriveFallbackThreadTitle(
  input: string,
  max = MAX_FALLBACK_TITLE_CODEPOINTS
): string {
  const normalized = collapseWhitespace(input);
  if (!normalized) {
    return "";
  }
  return sliceByCodePoints(normalized, max);
}

export function parseGeneratedThreadTitle(input: string): string | null {
  const parsedJsonTitle = extractTitleFromJsonLike(input);
  if (parsedJsonTitle) {
    return parsedJsonTitle;
  }
  const plain = stripOuterCodeFence(input)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return plain ? normalizeTitleCandidate(plain) : null;
}

export async function generateThreadTitle(
  settings: ShellSettings,
  modelSelection: string,
  description: string,
  ruleContext = ""
): Promise<string | null> {
  const userPrompt = collapseWhitespace(description);
  if (!userPrompt) {
    return null;
  }

  const resolved = resolveModelRequest(settings, modelSelection);
  if (!resolved.ok) {
    return null;
  }

  // Vérification du quota avant de lancer la requête de titre
  if (
    resolved.providerId === "mai" ||
    resolved.baseURL?.includes("mai.val.run")
  ) {
    const quota = await checkMaiQuotaAvailable(settings, false);
    if (!quota.available) {
      return null;
    }
  }

  const threadLang = settings.language ?? "fr";

  try {
    if (resolved.paradigm === "openai-compatible") {
      if (resolved.oauthAuth?.provider === "codex") {
        const requestProviderIdentity =
          providerIdentityForOAuthAuth(resolved.oauthAuth) ??
          resolved.providerIdentity;
        const text = await runCodexOAuthResponseText({
          auth: resolved.oauthAuth,
          baseURL: resolved.baseURL,
          input: userPrompt,
          instructions: prependProviderIdentitySystemPrompt(
            settings,
            buildThreadTitleSystemPrompt(ruleContext, threadLang),
            requestProviderIdentity
          ),
          maxOutputTokens: 120,
          model: resolved.requestModelId,
          providerId: resolved.providerId,
          temperature: openAICompatibleEffectiveTemperature(
            resolved.requestModelId,
            0
          ),
        });
        return parseGeneratedThreadTitle(text);
      }
      const proxyRaw = resolved.proxyUrl?.trim() ?? "";
      const httpAgent = proxyRaw ? new HttpsProxyAgent(proxyRaw) : undefined;
      const client = new OpenAI(
        applyOpenAIProviderIdentity(
          settings,
          {
            apiKey: resolved.apiKey,
            baseURL: resolved.baseURL,
            dangerouslyAllowBrowser: false,
            httpAgent,
            maxRetries: 0,
          },
          resolved.providerIdentity
        )
      );
      const response = await client.chat.completions.create({
        max_tokens: 120,
        messages: [
          {
            content: prependProviderIdentitySystemPrompt(
              settings,
              buildThreadTitleSystemPrompt(ruleContext, threadLang),
              resolved.providerIdentity
            ),
            role: "system",
          },
          { content: userPrompt, role: "user" },
        ],
        model: resolved.requestModelId,
        temperature: openAICompatibleEffectiveTemperature(
          resolved.requestModelId,
          0
        ),
      });
      return parseGeneratedThreadTitle(
        extractOpenAIText(response.choices[0]?.message?.content ?? "")
      );
    }

    if (resolved.paradigm === "anthropic") {
      const oauthAuth =
        resolved.oauthAuth?.provider === "claude"
          ? await ensureFreshOAuthAuthForRequest(
              resolved.providerId,
              resolved.oauthAuth
            )
          : undefined;
      const key = (oauthAuth?.accessToken ?? resolved.apiKey).trim();
      const requestProviderIdentity =
        providerIdentityForOAuthAuth(oauthAuth) ?? resolved.providerIdentity;
      const anthropicMetadata = buildAnthropicProviderIdentityMetadata(
        settings,
        requestProviderIdentity
      );
      const client = createAnthropicClient(
        applyAnthropicProviderIdentity(
          settings,
          {
            ...buildAnthropicAuthOptions(key, oauthAuth),
            baseURL: resolved.baseURL,
            maxRetries: 0,
          },
          requestProviderIdentity
        )
      );
      const response = await client.messages.create({
        max_tokens: 120,
        model: resolved.requestModelId,
        system: prependProviderIdentitySystemPrompt(
          settings,
          buildThreadTitleSystemPrompt(ruleContext, threadLang),
          requestProviderIdentity
        ),
        temperature: 0,
        ...(anthropicMetadata ? { metadata: anthropicMetadata } : {}),
        messages: [{ content: userPrompt, role: "user" }],
      });
      return parseGeneratedThreadTitle(
        response.content
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("\n")
      );
    }

    const genAI = new GoogleGenerativeAI(resolved.apiKey);
    const model = genAI.getGenerativeModel({
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0,
      },
      model: resolved.requestModelId,
      systemInstruction: prependProviderIdentitySystemPrompt(
        settings,
        buildThreadTitleSystemPrompt(ruleContext, threadLang),
        resolved.providerIdentity
      ),
    });
    const response = await model.generateContent(userPrompt);
    return parseGeneratedThreadTitle(response.response.text());
  } catch {
    return null;
  }
}
