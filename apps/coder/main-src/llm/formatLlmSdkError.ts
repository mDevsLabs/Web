import { APIError as AnthropicAPIError } from "@anthropic-ai/sdk";
import { APIError as OpenAIAPIError } from "openai";

function statusHintFr(status: number): string {
  if (status === 401 || status === 403) {
    return " (Clé API invalide, compte non autorisé ou accès refusé par le fournisseur)";
  }
  if (status === 402) {
    return " (Crédits insuffisants ou problème de facturation du compte)";
  }
  if (status === 429) {
    return " (Limite de requêtes atteinte ou quota dépassé, veuillez patienter)";
  }
  if (status >= 500 && status <= 599) {
    return " (Erreur serveur du fournisseur IA, veuillez réessayer)";
  }
  return "";
}

function stringifyErrorBody(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  try {
    const s = JSON.stringify(err);
    return s === "{}" ? "" : s;
  } catch {
    return String(err);
  }
}

/**
 * 将 OpenAI / Anthropic SDK 的 APIError 等格式化为可读字符串（含 HTTP 状态与响应体），便于 UI 与主进程日志排查。
 */
export function formatLlmSdkError(e: unknown): string {
  if (e instanceof OpenAIAPIError || e instanceof AnthropicAPIError) {
    const status = e.status;
    const msg = (e.message ?? "").trim();
    const body = stringifyErrorBody(e.error);
    if (typeof status === "number") {
      const hint = statusHintFr(status);
      const head = `HTTP ${status}${hint}`;
      const parts = [head, msg, body].filter((p) => p.length > 0);
      // 避免 message 与 body 完全重复
      const out = parts.join(" ");
      return out.trim() || String(e);
    }
    return [msg, body].filter((p) => p.length > 0).join(" ") || String(e);
  }
  if (e instanceof Error) {
    return e.message || String(e);
  }
  return String(e);
}
