/**
 * 对 API 基址发起 fire-and-forget `HEAD`，
 * 让 TCP/TLS 与界面侧准备并行，减轻「首条消息」体感延迟。
 *
 * 在以下情况跳过：与 CC `apiPreconnect.ts` 一致（Bedrock/Vertex/Foundry、代理 env、
 * ANTHROPIC_UNIX_SOCKET、mTLS 证书 env）；另在 Async 中若应用内配置了 HTTP 代理也跳过。
 */

import type { ModelRequestParadigm } from "../settingsStore.js";

function ccEnvTruthy(v: string | undefined): boolean {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase().trim());
}

/** 与 CC `apiPreconnect.ts` 中 `AbortSignal.timeout(10_000)` 一致 */
const PRECONNECT_HEAD_ABORT_MS = 10_000;

const warmed = new Set<string>();

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** 无自定义 Base URL 时的首方默认入口（仅用于预热连接） */
export function defaultPreconnectBaseUrl(
  paradigm: ModelRequestParadigm,
  baseURL?: string
): string | null {
  const custom = baseURL?.trim();
  if (custom) {
    return normalizeBaseUrl(custom);
  }
  switch (paradigm) {
    case "openai-compatible":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com";
    case "gemini":
      return "https://generativelanguage.googleapis.com";
    default:
      return null;
  }
}

export function preconnectLlmBaseUrlIfEligible(params: {
  paradigm: ModelRequestParadigm;
  baseURL?: string;
  /** 应用内为该模型/提供商配置的代理（非空则跳过） */
  appProxyUrl?: string;
}): void {
  // 与 CC `utils/apiPreconnect.ts` 跳过条件对齐（另加 Async 的 app 内代理）
  if (
    ccEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    ccEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    ccEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
  ) {
    return;
  }
  if (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ANTHROPIC_UNIX_SOCKET ||
    process.env.CLAUDE_CODE_CLIENT_CERT ||
    process.env.CLAUDE_CODE_CLIENT_KEY
  ) {
    return;
  }
  if (params.appProxyUrl?.trim()) {
    return;
  }

  const url = defaultPreconnectBaseUrl(params.paradigm, params.baseURL);
  if (!url) {
    return;
  }
  if (warmed.has(url)) {
    return;
  }
  warmed.add(url);

  // eslint-disable-next-line @typescript-eslint/no-unsupported-features/node-builtins -- Node 18+ / Electron 与 CC 相同用法
  void fetch(url, {
    method: "HEAD",
    signal: AbortSignal.timeout(PRECONNECT_HEAD_ABORT_MS),
  }).catch(() => {});
}
