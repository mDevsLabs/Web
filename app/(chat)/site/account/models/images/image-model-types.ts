export interface ImageModelItem {
  created?: number;
  description: string;
  features?: string[];
  id: string;
  maxResolution?: string;
  model_type?: string;
  name: string;
  provider?: string;
  supported_parameters?: string[];
}

export function getImageModelId(model: ImageModelItem): string {
  return model.id;
}
