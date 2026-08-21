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

  const maiClient = createOpenAI({
    apiKey: effectiveKey,
    baseURL: `${MAI_API_URL}/v1`,
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
