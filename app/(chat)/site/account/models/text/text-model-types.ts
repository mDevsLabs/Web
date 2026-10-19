export interface TextModelItem {
  created?: number;
  description: string;
  id: string;
  maxContext: number;
  maxOutput: number;
  name: string;
  object?: string;
  owned_by?: string;
  supported_parameters?: string[];
}

export function getTextModelId(model: TextModelItem): string {
  return model.id;
}
