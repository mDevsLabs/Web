import "server-only";

/**
 * État de configuration de Wakies côté HÔTE.
 *
 * Le gabarit exposait `setupStatus()` : une liste de variables d'environnement
 * manquantes (`INTELLIGENCE_API_KEY`, `OPENAI_API_KEY`, `SLACK_*`…). Sur
 * l'application Vite, cette liste était l'écran de configuration — il fallait
 * saisir des clés dans un serveur qu'on hébergeait soi-même.
 *
 * Intégré à mAI, cette question a une réponse différente : le modèle vient de
 * l'API mAI, la recherche Web de `/v1/web/search`, et les quotas des forfaits.
 * Il n'y a donc plus AUCUNE clé à saisir, et `missing` est vide — l'interface
 * affiche « prêt » et les écrans de configuration du gabarit deviennent des
 * explanations, plus des formulaires.
 *
 * Les intégrations externes du gabarit — Slack (Channels SDK), les
 * ordinateurs persistants (OpenBot), la voix temps réel (OpenAI Realtime) —
 * n'ont pas d'équivalent branché ici. Elles sont déclarées explicitement
 * indisponibles plutôt que silencieuses : l'interface peut ainsi dire
 * « non configuré » au lieu d'échouer au milieu d'une action.
 */
export type WakiesSetup = {
  /** Intelligence CopilotKit : non branchée (les conversations sont locales). */
  intelligence: boolean;
  /** Modèle : toujours disponible via l'API mAI. */
  model: boolean;
  /** Navigateur isolé pour la lecture de page : non branché. */
  browser: boolean;
  /** Voix temps réel : branchée selon la configuration audio de l'hôte. */
  voice: boolean;
  /** Ordinateurs persistants (OpenBot) : non branchés. */
  computers: boolean;
  /** Canal Slack : non branché. */
  slack: string;
  /** Éléments bloquants : vide tant que le chat fonctionne. */
  missing: string[];
};

export async function wakiesSetupStatus(): Promise<WakiesSetup> {
  const voice = Boolean(
    process.env.MAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.VOX_API_KEY
  );
  return {
    browser: false,
    computers: false,
    intelligence: false,
    missing: [],
    // Le modèle est toujours joignable : `getLanguageModel` passe par l'API mAI,
    // avec la clé de session si aucune clé serveur n'est configurée.
    model: true,
    slack: "not_configured",
    voice,
  };
}
