import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Construit les options `fetch` / `fetchOptions.dispatcher` pour les SDK
 * OpenAI v7+ et Anthropic v1+ (qui ont remplacé `httpAgent` par `fetch`).
 */
export function buildSdkProxyFetchOptions(proxyRaw: string | undefined): {
  fetch?: typeof fetch;
  fetchOptions?: Record<string, unknown>;
} {
  const trimmed = proxyRaw?.trim() ?? "";
  if (!trimmed) {
    return {};
  }
  const dispatcher = new ProxyAgent(trimmed);
  return {
    fetch: undiciFetch as unknown as typeof fetch,
    fetchOptions: { dispatcher },
  };
}
