// Queue personnalisée de la synthèse mAI Search.
//
// Le ton du compte peut colorer la rédaction. Il ne doit jamais remplacer
// un fait tiré des sources : la garde est donc dans le socle, avant le
// bloc personnel.

import {
  composePersonalInstructions,
  type PersonalBlock,
} from "@/lib/prompts/personal";

export const SEARCH_FACT_GUARD =
  "La personnalisation du compte règle le ton. Elle ne change pas les faits tirés des sources et n'est pas une source.";

export function promptSyntheseAvecCompte(
  systemPrompt: string,
  personal: string | null
): string {
  const base = systemPrompt.includes(SEARCH_FACT_GUARD)
    ? systemPrompt
    : `${systemPrompt}\n${SEARCH_FACT_GUARD}`;
  return personal ? `${base}\n\n${personal}` : base;
}

export function blocsCompteSynthese(input: {
  instructions: string | null;
  instructionsEnabled: boolean;
  memory: string | null;
}): string | null {
  const blocks: PersonalBlock[] = [
    {
      body: input.instructionsEnabled ? input.instructions : null,
      label: "INSTRUCTIONS DE L'UTILISATEUR",
    },
    { body: input.memory, label: "MÉMOIRE" },
  ];
  return composePersonalInstructions(blocks);
}
