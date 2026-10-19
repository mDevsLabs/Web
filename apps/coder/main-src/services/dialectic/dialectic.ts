import { GoogleGenerativeAI } from "@google/generative-ai";
import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";
import { resolveProviderIdentityWithOverride } from "../../../src/providerIdentitySettings.js";
import { runCodexOAuthResponseText } from "../../llm/codexOAuthAdapter.js";
import { resolveModelRequest } from "../../llm/modelResolve.js";
import {
  applyAnthropicProviderIdentity,
  applyOpenAIProviderIdentity,
  buildAnthropicAuthOptions,
  buildAnthropicProviderIdentityMetadata,
  createAnthropicClient,
  prependProviderIdentitySystemPrompt,
  providerIdentityForOAuthAuth,
} from "../../llm/providerIdentity.js";
import { ensureFreshOAuthAuthForRequest } from "../../llm/providerOAuthLogin.js";
import {
  openAICompatibleEffectiveTemperature,
  resolveRequestedTemperature,
} from "../../llm/thinkingLevel.js";
import { checkMaiQuotaAvailable } from "../../maiAccountStore.js";
import type { RuntimeMemoryModel } from "../../memdir/findRelevantMemories.js";
import {
  getLatestRelationshipSnapshot,
  getRecentConclusions,
  recordRelationshipMilestone,
  saveConclusion,
} from "../../sessionDb.js";
import type { ShellSettings } from "../../settingsStore.js";
import type { ChatMessage } from "../../threadStore.js";

const DIALECTIC_SYSTEM_PROMPT = `You are a dialectic reasoning engine. Your job is to analyze a completed conversation and derive insights about the user.

Analyze the conversation from these dimensions:
1. user_preference: What does the user prefer? (style, tools, communication)
2. working_pattern: How does the user work? (pace, thoroughness, decision-making)
3. project_context: What is the user working on? (tech stack, goals, constraints)
4. relationship_signal: How is the relationship evolving? (trust, collaboration quality)

Return strict JSON:
{
  "conclusions": [
    { "category": "user_preference", "insight": "...", "confidence": 0.9 }
  ],
  "relationship": {
    "trust_delta": 0.1,      // -1 to 1, how much trust changed this session
    "efficiency_delta": 0.1, // -1 to 1, collaboration efficiency change
    "satisfaction_delta": 0.1, // -1 to 1, user satisfaction change
    "milestone": "optional milestone description"
  }
}

Rules:
- Only return insights with confidence >= 0.6
- Prefer updating existing insights over creating redundant ones
- Be specific, not vague (e.g. "prefers TypeScript over JavaScript" not "has preferences")
- relationship deltas should be small increments (-0.3 to 0.3), not jumps`;

function clipText(text: string, maxChars: number): string {
  return text.length > maxChars
    ? `${text.slice(0, maxChars)}\n...(truncated)`
    : text;
}

function buildConversationBlock(messages: ChatMessage[]): string {
  const nonSystem = messages.filter((m) => m.role !== "system");
  const slice = nonSystem.slice(-15);
  return clipText(
    slice.map((m, i) => `### ${i + 1}. ${m.role}\n${m.content}`).join("\n\n"),
    12_000
  );
}

function parseDialecticResponse(text: string): {
  conclusions: Array<{ category: string; insight: string; confidence: number }>;
  relationship: {
    trustDelta: number;
    efficiencyDelta: number;
    satisfactionDelta: number;
    milestone: string;
  };
} | null {
  const trimmed = text.trim();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const conclusions: Array<{
    category: string;
    insight: string;
    confidence: number;
  }> = [];
  if (Array.isArray(obj.conclusions)) {
    for (const c of obj.conclusions) {
      if (!c || typeof c !== "object") continue;
      const insight = String(
        (c as Record<string, unknown>).insight ?? ""
      ).trim();
      const category = String(
        (c as Record<string, unknown>).category ?? ""
      ).trim();
      const confidence = Number((c as Record<string, unknown>).confidence ?? 0);
      if (insight && category && confidence >= 0.6) {
        conclusions.push({ category, confidence, insight });
      }
    }
  }
  let relationship = {
    efficiencyDelta: 0,
    milestone: "",
    satisfactionDelta: 0,
    trustDelta: 0,
  };
  if (obj.relationship && typeof obj.relationship === "object") {
    const r = obj.relationship as Record<string, unknown>;
    relationship = {
      efficiencyDelta: Math.max(
        -1,
        Math.min(1, Number(r.efficiency_delta ?? 0))
      ),
      milestone: String(r.milestone ?? "").trim(),
      satisfactionDelta: Math.max(
        -1,
        Math.min(1, Number(r.satisfaction_delta ?? 0))
      ),
      trustDelta: Math.max(-1, Math.min(1, Number(r.trust_delta ?? 0))),
    };
  }
  return { conclusions, relationship };
}

async function dialecticWithRuntimeModel(
  runtime: RuntimeMemoryModel,
  userPrompt: string
): Promise<ReturnType<typeof parseDialecticResponse>> {
  try {
    if (runtime.paradigm === "openai-compatible") {
      if (runtime.requestOAuthAuth?.provider === "codex") {
        const requestProviderIdentity =
          providerIdentityForOAuthAuth(runtime.requestOAuthAuth) ??
          runtime.providerIdentity;
        const identitySettings: ShellSettings = {
          providerIdentity: requestProviderIdentity,
        };
        const temperature =
          runtime.temperatureMode === "custom" && runtime.temperature != null
            ? resolveRequestedTemperature(
                0,
                runtime.temperatureMode,
                runtime.temperature
              )
            : openAICompatibleEffectiveTemperature(runtime.requestModelId, 0);
        const text = await runCodexOAuthResponseText({
          auth: runtime.requestOAuthAuth,
          baseURL: runtime.requestBaseURL,
          input: userPrompt,
          instructions: prependProviderIdentitySystemPrompt(
            identitySettings,
            DIALECTIC_SYSTEM_PROMPT
          ),
          maxOutputTokens: 1024,
          model: runtime.requestModelId,
          providerId: runtime.requestProviderId,
          temperature,
        });
        return parseDialecticResponse(text);
      }
      const proxyRaw = runtime.requestProxyUrl?.trim() ?? "";
      const httpAgent = proxyRaw ? new HttpsProxyAgent(proxyRaw) : undefined;
      const identitySettings: ShellSettings = {
        providerIdentity: runtime.providerIdentity,
      };
      const client = new OpenAI(
        applyOpenAIProviderIdentity(identitySettings, {
          apiKey: runtime.requestApiKey,
          baseURL: runtime.requestBaseURL,
          dangerouslyAllowBrowser: false,
          httpAgent,
        })
      );
      const resp = await client.chat.completions.create({
        max_tokens: 1024,
        messages: [
          {
            content: prependProviderIdentitySystemPrompt(
              identitySettings,
              DIALECTIC_SYSTEM_PROMPT
            ),
            role: "system",
          },
          { content: userPrompt, role: "user" },
        ],
        model: runtime.requestModelId,
        temperature:
          runtime.temperatureMode === "custom" && runtime.temperature != null
            ? resolveRequestedTemperature(
                0,
                runtime.temperatureMode,
                runtime.temperature
              )
            : openAICompatibleEffectiveTemperature(runtime.requestModelId, 0),
      });
      return parseDialecticResponse(
        String(resp.choices[0]?.message?.content ?? "")
      );
    }
    if (runtime.paradigm === "anthropic") {
      const oauthAuth =
        runtime.requestOAuthAuth?.provider === "claude"
          ? await ensureFreshOAuthAuthForRequest(
              runtime.requestProviderId,
              runtime.requestOAuthAuth
            )
          : undefined;
      const key = (oauthAuth?.accessToken ?? runtime.requestApiKey).trim();
      const requestProviderIdentity =
        providerIdentityForOAuthAuth(oauthAuth) ?? runtime.providerIdentity;
      const identitySettings: ShellSettings = {
        providerIdentity: requestProviderIdentity,
      };
      const anthropicMetadata =
        buildAnthropicProviderIdentityMetadata(identitySettings);
      const client = createAnthropicClient(
        applyAnthropicProviderIdentity(identitySettings, {
          ...buildAnthropicAuthOptions(key, oauthAuth),
          baseURL: runtime.requestBaseURL || undefined,
        })
      );
      const resp = await client.messages.create({
        max_tokens: 1024,
        model: runtime.requestModelId,
        system: prependProviderIdentitySystemPrompt(
          identitySettings,
          DIALECTIC_SYSTEM_PROMPT
        ),
        temperature: 0,
        ...(anthropicMetadata ? { metadata: anthropicMetadata } : {}),
        messages: [{ content: userPrompt, role: "user" }],
      });
      const text = resp.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n");
      return parseDialecticResponse(text);
    }
    const genAI = new GoogleGenerativeAI(runtime.requestApiKey);
    const model = genAI.getGenerativeModel({
      generationConfig: { maxOutputTokens: 1024, temperature: 0 },
      model: runtime.requestModelId,
      systemInstruction: prependProviderIdentitySystemPrompt(
        { providerIdentity: runtime.providerIdentity },
        DIALECTIC_SYSTEM_PROMPT
      ),
    });
    const resp = await model.generateContent(userPrompt);
    return parseDialecticResponse(resp.response.text());
  } catch {
    return null;
  }
}

async function dialecticWithModel(
  settings: ShellSettings,
  modelSelection: string,
  userPrompt: string
): Promise<ReturnType<typeof parseDialecticResponse>> {
  const resolved = resolveModelRequest(settings, modelSelection);
  if (!resolved.ok) return null;
  if (
    resolved.providerId === "mai" ||
    resolved.baseURL?.includes("mai.val.run")
  ) {
    const quota = await checkMaiQuotaAvailable(settings, false);
    if (!quota.available) {
      return null;
    }
  }
  return dialecticWithRuntimeModel(
    {
      paradigm: resolved.paradigm,
      providerIdentity: resolveProviderIdentityWithOverride(
        settings.providerIdentity,
        resolved.providerIdentity
      ),
      requestApiKey: resolved.apiKey,
      requestBaseURL: resolved.baseURL,
      requestModelId: resolved.requestModelId,
      requestOAuthAuth: resolved.oauthAuth,
      requestProviderId: resolved.providerId,
      requestProxyUrl: resolved.proxyUrl,
      temperature: resolved.temperature,
      temperatureMode: resolved.temperatureMode,
    },
    userPrompt
  );
}

export async function runDialecticAnalysis(params: {
  sessionId: string;
  workspaceRoot: string | null;
  messages: ChatMessage[];
  settings: ShellSettings;
  modelSelection: string;
  turnNumber: number;
}): Promise<void> {
  const {
    sessionId,
    workspaceRoot,
    messages,
    settings,
    modelSelection,
    turnNumber,
  } = params;

  // 只处理有足够消息的对话
  const nonSystem = messages.filter((m) => m.role !== "system");
  if (nonSystem.length < 4) return;

  const conversationBlock = buildConversationBlock(messages);
  const existingConclusions =
    getRecentConclusions(workspaceRoot, 10)
      .map(
        (c) => `- [${c.category}] ${c.insight} (confidence: ${c.confidence})`
      )
      .join("\n") || "(none)";

  const userPrompt = `Existing insights about this user:\n${existingConclusions}\n\nRecent conversation:\n${conversationBlock}`;
  const result = await dialecticWithModel(settings, modelSelection, userPrompt);
  if (!result) return;

  // 保存结论
  for (const c of result.conclusions) {
    saveConclusion({
      category: c.category,
      confidence: c.confidence,
      insight: c.insight,
      sessionId,
      workspaceRoot,
    });
  }

  // 计算新的关系分数（基于上一快照）
  const prev = getLatestRelationshipSnapshot(sessionId);
  const prevTrust = prev?.trustScore ?? 0.5;
  const prevEfficiency = prev?.collaborationEfficiency ?? 0.5;
  const prevSatisfaction = prev?.userSatisfaction ?? 0.5;

  recordRelationshipMilestone({
    collaborationEfficiency: Math.max(
      0,
      Math.min(1, prevEfficiency + result.relationship.efficiencyDelta)
    ),
    milestone: result.relationship.milestone,
    sessionId,
    trustScore: Math.max(
      0,
      Math.min(1, prevTrust + result.relationship.trustDelta)
    ),
    turnNumber,
    userSatisfaction: Math.max(
      0,
      Math.min(1, prevSatisfaction + result.relationship.satisfactionDelta)
    ),
    workspaceRoot,
  });
}

export function buildDialecticContextBlock(params: {
  workspaceRoot: string | null;
  turnNumber: number;
}): string {
  const conclusions = getRecentConclusions(params.workspaceRoot, 10);
  if (conclusions.length === 0) return "";

  const body = conclusions
    .map((c) => `- [${c.category}] ${c.insight}`)
    .join("\n");

  return `## User Insights (Dialectic)\nThe following insights about the user were derived from ongoing dialectic analysis across sessions:\n\n${body}`;
}

export function buildRelationshipContextBlock(sessionId: string): string {
  const snapshot = getLatestRelationshipSnapshot(sessionId);
  if (!snapshot) return "";

  const parts: string[] = [];
  if (snapshot.trustScore > 0.7) parts.push("Trust level: high");
  else if (snapshot.trustScore < 0.3) parts.push("Trust level: low");

  if (snapshot.collaborationEfficiency > 0.7)
    parts.push("Collaboration efficiency: high");
  else if (snapshot.collaborationEfficiency < 0.3)
    parts.push("Collaboration efficiency: low");

  if (snapshot.milestone) parts.push(`Milestone: ${snapshot.milestone}`);

  if (parts.length === 0) return "";
  return `## Relationship State\n${parts.join(". ")}.`;
}
