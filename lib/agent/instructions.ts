export const AGENT_FINAL_RESPONSE_INSTRUCTION =
  "ÉTAPE FINALE OBLIGATOIRE : ne proposes plus aucun outil. Résume en français le travail effectué, indique le résultat du dernier outil et les prochaines actions concrètes. Réponds toujours avec un texte utile, même si le résultat est vide ou partiel.";

/**
 * Rappel d'exécution du plan.
 *
 * Sans cela, l'outil `tasks` suffisait à faire annoncer un plan et à s'arrêter
 * là : le modèle résumait « le plan est prêt, les tâches restent en attente »
 * alors que l'utilisateur attendait un travail accompli. Injecté à chaque étape
 * tant qu'aucune tâche n'est terminée, il disparaît dès que le plan avance.
 */
export const AGENT_PLAN_EXECUTION_INSTRUCTION =
  "PLAN EN COURS D'EXÉCUTION — l'utilisateur a demandé de voir les tâches : elles ne sont pas une simple liste à contempler. Exécute la première tâche encore en attente dès cette étape, appelle les outils utiles pour la mener à bien, puis passe à la suivante. Ne réponds pas encore par un résumé du plan : garde le plan affiché à jour au fur et à mesure.";

export const AGENT_FALLBACK_FINAL_RESPONSE =
  "La génération s'est terminée sans synthèse textuelle. Les étapes réalisées restent disponibles dans la timeline ; relancez la demande pour obtenir une réponse détaillée.";

export function composeAgentInstructions(
  base: string,
  reorientations: readonly string[],
  finalize = false,
  planExecution = false
): string {
  const additions = [
    ...(reorientations.length > 0
      ? [
          "CONSIGNES DE RÉORIENTATION DE L'UTILISATEUR (à prendre en compte maintenant, par ordre d'arrivée) :",
          ...reorientations.map((text) => `- ${text}`),
        ]
      : []),
    ...(planExecution && !finalize ? [AGENT_PLAN_EXECUTION_INSTRUCTION] : []),
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
          "L'utilisateur a activé l'option Tâches : appelle IMMÉDIATEMENT l'outil tasks pour structurer un plan réel (2 à 8 tâches concrètes et ordonnées), puis EXÉCUTE ce plan tâche par tâche sans attendre de validation. Le plan est affiché à l'utilisateur : l'annoncer sans le dérouler ne répond pas à sa demande. Après le résultat de l'outil, poursuis dans la même étape logique, et termine toujours par une réponse textuelle utile — une fois le plan exécuté, ou en expliquant la limite réelle qui a interrompu son déroulement.",
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
