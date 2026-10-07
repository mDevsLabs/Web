// Types standards de l'API OpenAI v1 pour la couche de compatibilité mAI

export interface OpenAIChatMessage {
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  images?: string[];
  name?: string;
  role: "system" | "user" | "assistant" | "tool";
}

export interface OpenAIChatCompletionRequest {
  frequency_penalty?: number;
  max_tokens?: number;
  messages: OpenAIChatMessage[];
  model: string;
  n?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  user?: string;
}

export interface OpenAIUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

export interface OpenAIChatCompletionChoice {
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
}

export interface OpenAIChatCompletionResponse {
  choices: OpenAIChatCompletionChoice[];
  created: number;
  id: string;
  model: string;
  object: "chat.completion";
  usage: OpenAIUsage;
}

export interface OpenAIChatCompletionChunkDelta {
  content?: string;
  role?: "assistant" | "system" | "user";
}

export interface OpenAIChatCompletionChunkChoice {
  delta: OpenAIChatCompletionChunkDelta;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  index: number;
}

export interface OpenAIChatCompletionChunk {
  choices: OpenAIChatCompletionChunkChoice[];
  created: number;
  id: string;
  model: string;
  object: "chat.completion.chunk";
}

export interface OpenAIModelObject {
  created: number;
  id: string;
  object: "model";
  owned_by: string;
  parent?: string;
  permission?: any[];
  root?: string;
}

export interface OpenAIModelListResponse {
  data: OpenAIModelObject[];
  object: "list";
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string | null;
  };
}
