// Bloc d'instructions personnalisées.
//
// C'est LA partie du prompt qui varie d'un utilisateur, d'un projet et d'une
// conversation à l'autre. Elle est donc toujours produite de la même façon et
// toujours posée APRÈS le socle : le modèle lit d'abord un contrat stable
// (rôle, méthode, règles, capacités réelles), puis les consignes qu'il doit
// appliquer à CET échange. Un socle qui change à chaque message ne peut pas
// être optimisé ; et une consigne personnelle placée avant les règles de fond
// peut les écraser.
//
// Le délimiteur n'est pas décoratif : il rend le bloc indiscutable pour le
// modèle et pour nous — un test vérifie qu'il n'est jamais rien après lui.

export const PERSONAL_HEADER = [
  "════════════════════════════════════════",
  "INSTRUCTIONS PERSONNALISÉES — elles s'appliquent à cet échange et priment sur tes habitudes par défaut, sans jamais contredire les règles de sécurité ci-dessus.",
  "════════════════════════════════════════",
].join("\n");

export type PersonalBlock = {
  /** Contenu du bloc, ou `null` s'il n'y a rien à dire. */
  body: string | null;
  /** Titre affiché, utilisé comme repère dans les tests. */
  label: string;
};

/**
 * Compose la queue personnalisée. L'ordre des blocs est FIXE et le même partout :
 * ce qui vient du plus structurel (assistant, projet) au plus ponctuel
 * (commande de ce message). Les blocs vides sont retirés, jamais laissés à vide.
 */
export function composePersonalInstructions(
  blocks: readonly PersonalBlock[]
): string | null {
  const present = blocks.filter(
    (block) => block.body !== null && block.body.trim().length > 0
  );
  if (present.length === 0) {
    return null;
  }
  return [
    PERSONAL_HEADER,
    ...present.map((block) => `${block.label}\n${block.body?.trim()}`),
  ].join("\n\n");
}

/** Assemble le prompt final : socle, capacités, puis instructions personnalisées. */
export function composeSystemPrompt(parts: {
  base: string;
  capabilitySections: readonly (string | null)[];
  personal: string | null;
}): string {
  return [
    parts.base,
    ...parts.capabilitySections.filter(
      (section): section is string =>
        section !== null && section.trim().length > 0
    ),
    parts.personal,
  ]
    .filter((part): part is string => part !== null && part.trim().length > 0)
    .join("\n\n");
}
