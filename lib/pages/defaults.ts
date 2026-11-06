/**
 * Point de départ d'une page nouvelle.
 *
 * Une duplication reprend le modèle et la consigne de la source. Une
 * création reprend les défauts du compte. Une consigne ou un modèle vides
 * ne s'écrivent pas sur la page : elle suit alors le modèle du compte,
 * comme avant ces défauts.
 */
export function resolveNewPageDefaults(params: {
  duplicate: {
    customPrompt: string | null;
    modelId: string | null;
  } | null;
  preferences: {
    pagesDefaultModel: string | null;
    pagesDefaultPrompt: string;
  };
}): { customPrompt: string | null; modelId: string | null } {
  if (params.duplicate) {
    return {
      customPrompt: params.duplicate.customPrompt,
      modelId: params.duplicate.modelId,
    };
  }
  const prompt = params.preferences.pagesDefaultPrompt.trim();
  const model = params.preferences.pagesDefaultModel?.trim() ?? "";
  return {
    customPrompt: prompt.length > 0 ? prompt : null,
    modelId: model.length > 0 ? model : null,
  };
}
