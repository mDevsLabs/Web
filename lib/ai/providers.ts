import { createOpenAI } from "@ai-sdk/openai";
import { MAI_API_URL } from "../constants";
import { titleModel } from "./models";

export function getLanguageModel(
  modelId: string,
  options?: {
    apiKey?: string | null;
    sessionToken?: string | null;
    userId?: string | null;
  }
) {
  const effectiveKey =
    options?.apiKey ||
    options?.sessionToken ||
    process.env.MAI_API_KEY ||
    "mai-web-default";

  const headers: Record<string, string> = {
    "HTTP-Referer": "https://mai.val.run",
    "X-Title": "mAI Web",
  };

  if (options?.userId) {
    headers["x-user-id"] = options.userId;
  }

  const maiBaseUrl = MAI_API_URL.endsWith("/v1")
    ? MAI_API_URL
    : `${MAI_API_URL.replace(/\/+$/, "")}/v1`;

  const maiClient = createOpenAI({
    apiKey: effectiveKey,
    baseURL: maiBaseUrl,
    fetch: async (url, init) => {
      let urlStr = url.toString();
      if (
        urlStr.includes("/chat/completions") &&
        !urlStr.includes("/v1/chat/completions")
      ) {
        urlStr = urlStr.replace("/chat/completions", "/v1/chat/completions");
      }
      return await fetch(urlStr, init);
    },
    headers,
  });

  return maiClient.chat(modelId);
}

export function getTitleModel(options?: {
  apiKey?: string | null;
  sessionToken?: string | null;
  userId?: string | null;
}) {
  return getLanguageModel(titleModel.id, options);
}
