export interface MaiModelItem {
  capabilities?: {
    coding?: boolean;
    reasoning?: boolean;
    vision?: boolean;
    jsonOutput?: boolean;
    functionCalling?: boolean;
  };
  context_length: number;
  description: string;
  execution_mode?: string;
  huggingface_tag?: string | null;
  id: string;
  license?: string;
  max_output_tokens?: number;
  name: string;
  ollama_tag?: string | null;
  parameters?: string;
  recommended_hardware?: {
    minVram?: string;
    recommendedVram?: string;
    ram?: string;
  };
  status?: "active" | "beta" | "deprecated";
  tagline?: string;
  usable_in_cloud_chat?: boolean;
  version?: string;
}

export type MaiModelSort =
  | "default"
  | "name-asc"
  | "name-desc"
  | "params-desc"
  | "context-desc";

export interface MaiParamPreset {
  id: string;
  label: string;
  maxB: number | null;
  minB: number | null;
}
