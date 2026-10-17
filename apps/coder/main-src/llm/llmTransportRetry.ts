import {
  APIError as AnthropicApiError,
  APIConnectionError as AnthropicConnectionError,
  APIConnectionTimeoutError as AnthropicConnectionTimeoutError,
  APIUserAbortError as AnthropicUserAbortError,
} from "@anthropic-ai/sdk";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
} from "openai";

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onResolve = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };
    const id = setTimeout(onResolve, ms);
    const onAbort = () => {
      clearTimeout(id);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Avec le SDK OpenAI par défaut « max 3 tentatives » ; surcharge possible via MAI_CODER_LLM_TRANSPORT_MAX_ATTEMPTS */
export function parseTransportMaxAttempts(): number {
  const n = Number.parseInt(
    (process.env.MAI_CODER_LLM_TRANSPORT_MAX_ATTEMPTS ??
      process.env.ASYNC_LLM_TRANSPORT_MAX_ATTEMPTS ??
      "") ||
      "",
    10
  );
  if (Number.isFinite(n) && n >= 1) {
    return Math.min(8, n);
  }
  return 3;
}

export function isRetryableTransportError(e: unknown): boolean {
  if (e instanceof APIUserAbortError || e instanceof AnthropicUserAbortError) {
    return false;
  }
  if (e instanceof Error && e.name === "AbortError") {
    return false;
  }
  if (
    e instanceof APIConnectionTimeoutError ||
    e instanceof APIConnectionError ||
    e instanceof AnthropicConnectionTimeoutError ||
    e instanceof AnthropicConnectionError
  ) {
    return true;
  }
  if (e instanceof APIError || e instanceof AnthropicApiError) {
    const st = e.status;
    if (st === 408 || st === 409 || st === 429) {
      return true;
    }
    if (typeof st === "number" && st >= 500 && st <= 599) {
      return true;
    }
    return false;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed|NetworkError|socket/i.test(
    msg
  );
}

/**
 * 在「建立连接 / 拿到流」阶段重试；流已开始读 body 后勿再调用（避免重复生成）。
 */
export async function withLlmTransportRetry<T>(
  op: () => Promise<T>,
  opts: { signal?: AbortSignal; maxAttempts?: number }
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? parseTransportMaxAttempts();
  let last: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (opts.signal?.aborted) {
      throw opts.signal.reason instanceof Error
        ? opts.signal.reason
        : new DOMException("Aborted", "AbortError");
    }
    try {
      return await op();
    } catch (e) {
      last = e;
      if (opts.signal?.aborted) {
        throw e;
      }
      if (!isRetryableTransportError(e) || attempt === maxAttempts - 1) {
        throw e;
      }
      const delay =
        Math.min(8000, 400 * 2 ** attempt) + Math.floor(Math.random() * 250);
      try {
        await sleep(delay, opts.signal);
      } catch {
        throw e;
      }
    }
  }
  throw last;
}
