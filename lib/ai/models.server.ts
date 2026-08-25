import "server-only";

import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";
import { type ChatModel, FALLBACK_MODELS, formatModelName } from "./models";

export async function fetchUserModels(): Promise<ChatModel[]> {
  try {
    const user = await getMaiUser();
    let authHeader = "";

    if (user?.id) {
      const apiKey = await getUserApiKey(user.id);
      if (apiKey) {
        authHeader = `Bearer ${apiKey}`;
      }
    }

    if (!authHeader) {
      const token = await getMaiSessionToken();
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }

    const res = await fetch(`${MAI_API_URL}/v1/models`, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) {
      return FALLBACK_MODELS;
    }

    const json = await res.json();
    const rawList = json.data || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return FALLBACK_MODELS;
    }

    return rawList.map((m: any) => {
      const { name, provider, isFree } = formatModelName(m.id);
      const rawName = m.name && m.name !== m.id ? m.name : name;
      const cleanName = rawName
        .replace(/\s*\((free|gratuit|free tier)\)/gi, "")
        .replace(/:free/gi, "")
        .trim();
      return {
        architecture: m.architecture,
        description: m.description || `Modèle ${provider}`,
        id: m.id,
        isFree: m.isFree === undefined ? isFree : m.isFree,
        maxContext: m.maxContext || m.context_length || 128_000,
        maxOutput: m.maxOutput || 4096,
        name: cleanName || name,
        provider,
        supported_parameters: m.supported_parameters,
      };
    });
  } catch (err) {
    console.error("Erreur fetchUserModels:", err);
    return FALLBACK_MODELS;
  }
}
