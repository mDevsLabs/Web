/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI ASSISTANT & AUDIO/TTS API (mai.ts)
 * Modèles, discussions mAI, voix synthétiques (TTS), outils mAI
 * ============================================================================
 */

import type {
  MAIConversationSummary,
  MAIQuotas,
  MaiToolCall,
} from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";
import { ApiSettingsService } from "./settings";

export class ApiMaiService extends ApiSettingsService {
  public static async getSpeechVoices(): Promise<{
    voices: Array<{
      id: string;
      name: string;
      gender?: string;
      languages?: string[];
    }>;
  }> {
    const extract = (res: any) => ({
      voices: res?.voices || res?.data || (Array.isArray(res) ? res : []),
    });
    return extract(await ApiServiceCore.request("/v1/speech/voices"));
  }

  public static async textToSpeech(
    text: string,
    voice?: string
  ): Promise<{ url: string }> {
    const payload = JSON.stringify({
      input: text,
      model: "deepgram/flux-tts:free",
      return_json: true,
      voice: voice || undefined,
    });

    const endpoints = ["/v1/speech", "/speech", "/v1/audio/speech"];
    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const json = await ApiServiceCore.request<any>(ep, {
          body: payload,
          method: "POST",
        });
        const audioUrl = json?.audio_url || json?.audioContent;
        if (audioUrl) {
          return { url: audioUrl };
        }
      } catch (err: any) {
        if (!ApiServiceCore.shouldRetryVibeAlias(err)) throw err;
        lastError = err;
      }
    }
    throw lastError || new Error("Réponse audio invalide.");
  }

  public static async getModels(): Promise<{
    models: Array<{
      id: string;
      name: string;
      description: string;
      contextWindow?: number;
      provider?: string;
    }>;
  }> {
    try {
      const res = await ApiServiceCore.request<{
        data?: any[];
        models?: any[];
      }>("/v1/models");
      const list = res.data || res.models || [];
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((m: any) => {
          const rawName = m.name || m.id;
          const cleanName = rawName.includes(": ")
            ? rawName.split(": ")[1]
            : rawName;
          return {
            contextWindow:
              m.maxContext || m.context_length || m.contextWindow || 128_000,
            description: m.description || "",
            id: m.id,
            name: cleanName,
            provider:
              m.owned_by ||
              m.provider ||
              (m.id.includes("/") ? m.id.split("/")[0] : "mAI"),
          };
        });
        const lagunaIdx = formatted.findIndex(
          (m) => m.id === "poolside/laguna-xs-2.1:free"
        );
        if (lagunaIdx > 0) {
          const [laguna] = formatted.splice(lagunaIdx, 1);
          formatted.unshift(laguna);
        } else if (lagunaIdx === -1) {
          formatted.unshift({
            contextWindow: 128_000,
            description: "Modèle IA par défaut haute performance",
            id: "poolside/laguna-xs-2.1:free",
            name: "Laguna XS 2.1",
            provider: "Poolside",
          });
        }
        return { models: formatted };
      }
      return ApiMaiService.defaultModels();
    } catch {
      return ApiMaiService.defaultModels();
    }
  }

  private static defaultModels() {
    return {
      models: [
        {
          description: "Modèle IA par défaut haute performance",
          id: "poolside/laguna-xs-2.1:free",
          name: "Laguna XS 2.1",
          provider: "Poolside",
        },
        {
          description: "Modèle IA d'élite mAI — Raisonnement profond & Vision",
          id: "mai-1.5-apex",
          name: "mAI 1.5 Apex",
          provider: "mDevsLabs",
        },
        {
          description: "Modèle agile mAI ultra-rapide",
          id: "mai-1.5-light",
          name: "mAI 1.5 Light",
          provider: "mDevsLabs",
        },
        {
          description: "Vitesse instantanée et compréhension multimodale",
          id: "google/gemini-2.5-flash:free",
          name: "Gemini 2.5 Flash",
          provider: "Google",
        },
        {
          description: "Compétences avancées de logique et programmation",
          id: "meta-llama/llama-3.3-70b-instruct:free",
          name: "Llama 3.3 70B Instruct",
          provider: "Meta",
        },
        {
          description: "Raisonnement mathématique et logique complexe",
          id: "deepseek/deepseek-r1:free",
          name: "DeepSeek R1",
          provider: "DeepSeek",
        },
        {
          description: "Modèle de code spécialisé de haute précision",
          id: "qwen/qwen-2.5-coder-32b-instruct:free",
          name: "Qwen 2.5 Coder 32B",
          provider: "Qwen",
        },
      ],
    };
  }

  public static async chatMAI(
    message: string,
    execute_tool?: { name: string; args: any },
    model?: string,
    context?: { post_id?: string },
    conversationId?: string
  ): Promise<{
    reply: string;
    toolExecuted?: any;
    toolCalls?: MaiToolCall[];
    modelUsed?: string;
    requiresApproval?: boolean;
    pendingTool?: { name: string; args: any };
    conversation_id?: string | null;
    user_message_id?: string | null;
    assistant_message_id?: string | null;
  }> {
    const payload = {
      context,
      conversation_id: conversationId,
      execute_tool,
      message,
      model,
    };
    return ApiServiceCore.request("/v1/mai/chat", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  public static async regenerateMAI(opts?: {
    model?: string;
    postId?: string;
    conversationId?: string;
  }): Promise<{
    success: boolean;
    reply: string;
    message_id: string | null;
    modelUsed?: string;
    conversation_id?: string | null;
  }> {
    const payload = JSON.stringify({
      context: opts?.postId ? { post_id: opts.postId } : undefined,
      conversation_id: opts?.conversationId,
      model: opts?.model,
    });
    return ApiServiceCore.request("/v1/mai/regenerate", {
      body: payload,
      method: "POST",
    });
  }

  public static async getMAIHistory(
    conversationId?: string,
    limit?: number,
    offset?: number
  ): Promise<{
    conversation_id: string | null;
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      tool_calls?: MaiToolCall[];
      created_at: string;
    }>;
    has_more?: boolean;
  }> {
    const params = new URLSearchParams();
    if (conversationId) params.set("conversation_id", conversationId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return ApiServiceCore.request(`/v1/mai/history${qs}`);
  }

  public static async newMAIConversation(): Promise<{
    success: boolean;
    conversation_id: string;
  }> {
    return ApiServiceCore.request("/v1/mai/history/new", { method: "POST" });
  }

  public static async getMAIConversations(): Promise<{
    success: boolean;
    conversations: MAIConversationSummary[];
  }> {
    return ApiServiceCore.request("/v1/mai/conversations");
  }

  public static async renameMAIConversation(
    conversationId: string,
    title: string
  ): Promise<{
    success: boolean;
    conversation: { id: string; title: string };
  }> {
    const body = JSON.stringify({ title });
    return ApiServiceCore.request(
      `/v1/mai/conversations/${conversationId}/rename`,
      { body, method: "POST" }
    );
  }

  public static async deleteMAIConversation(
    conversationId: string
  ): Promise<{ success: boolean; deleted: string }> {
    return ApiServiceCore.request(`/v1/mai/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  public static async duplicateMAIConversation(
    conversationId: string
  ): Promise<{ success: boolean; conversation_id: string }> {
    return ApiServiceCore.request(
      `/v1/mai/conversations/${conversationId}/duplicate`,
      { method: "POST" }
    );
  }

  public static async executeMAITool(
    name: string,
    args: any = {},
    model?: string,
    approve = false,
    conversationId?: string
  ): Promise<{
    reply: string;
    toolExecuted?: any;
    toolCalls?: MaiToolCall[];
    modelUsed?: string;
    requiresApproval?: boolean;
    pendingTool?: { name: string; args: any };
    conversation_id?: string | null;
    assistant_message_id?: string | null;
  }> {
    const body = JSON.stringify({
      approve,
      args,
      conversation_id: conversationId,
      model,
      name,
    });
    return ApiServiceCore.request("/v1/mai/execute-tool", {
      body,
      method: "POST",
    });
  }

  public static async refuseMAITool(
    name: string,
    args: any = {},
    conversationId?: string
  ): Promise<{
    success: boolean;
    reply: string;
    toolCalls?: MaiToolCall[];
    conversation_id?: string | null;
    message_id?: string | null;
  }> {
    const body = JSON.stringify({
      args,
      conversation_id: conversationId,
      name,
    });
    return ApiServiceCore.request("/v1/mai/tool-refused", {
      body,
      method: "POST",
    });
  }

  public static async getMAIQuotas(): Promise<MAIQuotas> {
    return ApiServiceCore.request("/v1/mai/quotas");
  }

  public static async getMAITools(): Promise<{
    tools: Array<{
      id: string;
      name: string;
      slash_command: string;
      mention_tag: string;
      description: string;
      icon_name: string;
      category: string;
      sensitive: boolean;
    }>;
  }> {
    return ApiServiceCore.request("/v1/mai/tools");
  }
}
