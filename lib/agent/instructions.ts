export const AGENT_FINAL_RESPONSE_INSTRUCTION =
  "ÉTAPE FINALE OBLIGATOIRE : ne proposes plus aucun outil. Résume en français le travail effectué, indique le résultat du dernier outil et les prochaines actions concrètes. Réponds toujours avec un texte utile, même si le résultat est vide ou partiel.";

export const AGENT_FALLBACK_FINAL_RESPONSE =
  "La génération s'est terminée sans synthèse textuelle. Les étapes réalisées restent disponibles dans la timeline ; relancez la demande pour obtenir une réponse détaillée.";

export function composeAgentInstructions(
  base: string,
  reorientations: readonly string[],
  finalize = false
): string {
  const additions = [
    ...(reorientations.length > 0
      ? [
          "CONSIGNES DE RÉORIENTATION DE L'UTILISATEUR (à prendre en compte maintenant, par ordre d'arrivée) :",
          ...reorientations.map((text) => `- ${text}`),
        ]
      : []),
    ...(finalize ? [AGENT_FINAL_RESPONSE_INSTRUCTION] : []),
  ];
  return additions.length > 0 ? `${base}\n\n${additions.join("\n")}` : base;
}

export type AgentOneShotOptions = {
  audio: boolean;
  image: boolean;
  memory: boolean;
  tasks: boolean;
  web: boolean;
};

export function buildAgentOneShotInstructions(
  options: AgentOneShotOptions | null
): string | null {
  if (!options) {
    return null;
  }

  return [
    ...(options.tasks
      ? [
          "L'utilisateur a activé l'option Tâches : commence IMMÉDIATEMENT par appeler l'outil tasks pour structurer un plan réel (2 à 8 tâches concrètes et ordonnées), puis exécute ce plan étape par étape sans attendre de validation. Après le résultat de l'outil, poursuis dans la même étape logique et termine toujours par une réponse textuelle utile.",
        ]
      : []),
    ...(options.image
      ? [
          "L'utilisateur a activé l'option Créer une image : utilise l'outil generate_image dès que la demande le permet, sans redemander la permission.",
        ]
      : []),
    ...(options.audio
      ? [
          "L'utilisateur a activé l'option Créer un audio : utilise l'outil generate_audio dès que la demande le permet, sans redemander la permission.",
        ]
      : []),
    ...(options.memory
      ? [
          "L'utilisateur a activé l'option Mémoire : utilise l'outil manage_memory pour retenir, retrouver ou oublier des informations durables le concernant quand c'est pertinent.",
        ]
      : []),
    ...(options.web
      ? [
          "L'utilisateur a demandé la Recherche Web : appuie tes affirmations factuelles sur search_web (et read_url pour les sources identifiées).",
        ]
      : []),
  ]
    .filter(Boolean)
    .join("\n");
}
