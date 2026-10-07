import fs from 'fs';
import path from 'path';
import { ModelInfo, modelsData } from './models-data';
import { maiModelsList } from './mai-models';

export type { ModelInfo };
export { modelsData };

const docsDirectory = path.join(process.cwd(), 'docs');

function readReadme(modelId: string): string {
  const readmePath = path.join(docsDirectory, modelId, 'README.md');
  if (!fs.existsSync(readmePath)) return '';
  return fs.readFileSync(readmePath, 'utf8');
}

/**
 * Le dépôt Hugging Face vit dans le catalogue API (`lib/mai-models.ts`), qui est
 * la seule source qui distingue les deux registries. Le renseigner ici évite de le
 * dupliquer dans `models-data.ts` et garantit que la commande `hf download` vise
 * bien le dépôt Hugging Face et non le tag Ollama.
 */
function resolveHuggingFaceTag(model: ModelInfo): string | undefined {
  if (model.huggingFaceTag) return model.huggingFaceTag;
  const apiModel = maiModelsList.find((entry) => entry.id === model.id);
  return apiModel?.huggingFaceTag ?? model.ollamaTag;
}

export function getModels(): ModelInfo[] {
  return modelsData.map((model) => ({
    ...model,
    huggingFaceTag: resolveHuggingFaceTag(model),
    readmeContent: readReadme(model.id),
  }));
}

export function getModelById(id: string): ModelInfo | null {
  const model = modelsData.find((m) => m.id === id);
  if (!model) return null;

  return {
    ...model,
    huggingFaceTag: resolveHuggingFaceTag(model),
    readmeContent: readReadme(model.id),
  };
}
