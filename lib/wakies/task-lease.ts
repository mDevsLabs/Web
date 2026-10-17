/**
 * Cycle de vie d'une tâche planifiée Wakies : durée du bail, borne des
 * tentatives, vocabulaire des statuts.
 *
 * Ces constantes sont isolées dans un module pur parce qu'elles sont la seule
 * partie du cycle de vie vérifiable sans base de données : la réservation
 * transactionnelle ne s'observe qu'en intégration (voir
 * `tests/unit/wakies-task-lease.test.ts` pour la partie testable ici). Le
 * précédent est le même côté Agent : `SCHEDULE_MAX_ATTEMPTS` et
 * `OCCURRENCE_LEASE_MS` vivent hors des requêtes.
 */

/**
 * Durée du bail d'exécution. Elle doit DÉPASSER `maxDuration` du tick cron
 * (300 s, `app/api/cron/wakies/route.ts`) : un bail plus court expire pendant
 * une exécution lente mais légitime, le tick suivant revend la MÊME occurrence et
 * relance un appel de modèle pour rien — puis le premier worker revient écrire
 * par-dessus. Le bail est donc la borne de la reprise, pas celle de l'exécution.
 */
export const TACHE_BAIL_MS = 6 * 60_000;

/**
 * Nombre maximal de revendications d'une même occurrence avant abandon. Une
 * occurrence abandonnée est celle dont l'exécution meurt sans appeler
 * `finishTask` ni `failTask` (invocation serverless tuée) : sans borne, elle
 * rebondirait `running` → bail expiré → `running` indéfiniment.
 */
export const TACHE_MAX_TENTATIVES = 3;

/**
 * Statuts d'une tâche. Ce sont les six valeurs réellement écrites en base ; le
 * type est fermé parce qu'aucune contrainte `CHECK` n'existe sur la colonne
 * (`varchar(16)` nu) — sans lui, un statut inventé passerait silencieusement et
 * sortirait la tâche du prédicat de revendication.
 */
export const STATUT_TACHE = {
  annule: "cancelled",
  complete: "completed",
  echoue: "failed",
  enCours: "running",
  file: "queued",
  suspendu: "paused",
} as const;

export type StatutTache = (typeof STATUT_TACHE)[keyof typeof STATUT_TACHE];

/**
 * Le nombre de tentatives consommées a-t-il dépassé la borne ? Comparaison
 * après incrément : la revendication qui fait passer à `MAX + 1` est celle de
 * trop, donc la dernière exécution autorisée porte le numéro `MAX`.
 */
export function tentativesEpuisees(attempt: number): boolean {
  return attempt > TACHE_MAX_TENTATIVES;
}

/**
 * Prochaine exécution d'une occurrence réussie.
 *
 * `0` est explicitement traité comme « non récurrent » : une valeur falsive
 * silencieuse ferait glisser une tâche ponctuelle en tâche répétée toutes les
 * 0 seconde. La date est calculée sur l'instant réel de fin, jamais sur
 * l'échéance d'origine — sinon une tâche à intervalle d'une heure qui traîne
 * cinquante minutes repartirait aussitôt.
 */
export function prochaineExecution(
  intervalSeconds: number | null,
  maintenant: Date
): Date | null {
  if (!intervalSeconds || intervalSeconds <= 0) {
    return null;
  }
  return new Date(maintenant.getTime() + intervalSeconds * 1000);
}
