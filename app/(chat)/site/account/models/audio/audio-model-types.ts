export interface AudioModelItem {
  created?: number;
  description: string;
  id: string;
  name: string;
  owned_by?: string;
  provider?: string;
  supported_parameters?: string[];
  voices?: string[];
}

export function getAudioModelId(model: AudioModelItem): string {
  return model.id;
}
