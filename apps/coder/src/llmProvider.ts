/** 与主进程 `ModelRequestParadigm` / 每条模型的请求范式一致 */
export type LlmProviderId = "openai-compatible" | "anthropic" | "gemini";
export type ModelRequestParadigm = LlmProviderId;

export const LLM_PROVIDER_OPTIONS: { id: LlmProviderId; label: string }[] = [
  { id: "openai-compatible", label: "OpenAI 兼容 API" },
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "gemini", label: "Google Gemini" },
];

export function parseLlmProvider(raw: unknown): LlmProviderId {
  if (raw === "anthropic" || raw === "gemini" || raw === "openai-compatible") {
    return raw;
  }
  return "openai-compatible";
}
