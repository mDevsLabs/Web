/**
 * ============================================================================
 * PRÉFÉRENCES DE NOTIFICATION — VIBE (lib/notifications/vibe-preferences.ts)
 * ============================================================================
 *
 * POURQUOI CE MODULE
 *
 * Les préférences de notification de Vibe vivent dans `user_settings`, côté
 * BACKEND (SQLite Val Town) : `email_notifications`, `push_notifications`,
 * `notify_on_like`, `notify_on_repost`, `notify_on_reply`, `notify_on_dm`.
 *
 * L'écran groupé des paramètres mAI doit les afficher et les enregistrer.
 * Ce module fait la traduction entre le vocabulaire de l'écran (des cases
 * lisibles) et celui de Vibe (des colonnes) — ET il dit clairement ce qui
 * n'a pas de transport derrière lui.
 *
 * ── Le mensonge de l'e-mail et du push ────────────────────────────────────
 *
 * `email_notifications` et `push_notifications` existent dans la base Vibe,
 * mais AUCUN transport ne les honore côté hôte : il n'y a pas d'envoi
 * d'e-mail pour Vibe, et pas de Web Push. Les exposer comme des réglages
 * fonctionnels serait promettre un envoi qui n'existe pas.
 *
 * Ils sont donc ici, mais MARQUÉS comme sans effet : l'interface peut les
 * afficher en les présentant honnêtement, ou les retirer. Le choix est fait
 * par l'interface, pas caché dans ce module.
 *
 * Client-safe : aucun import serveur, aucune base.
 */

/** Les préférences de notification de Vibe, dans le vocabulaire de l'écran. */
export type VibeNotificationPreferences = {
  /** J'aime et réactions. */
  likes: boolean;
  /** Messages privés. */
  directMessages: boolean;
  /** Notifications par e-mail — SANS transport côté hôte. */
  email: boolean;
  /** Notifications push — SANS Web Push configuré. */
  push: boolean;
  /** Réponses, citations et mentions. */
  replies: boolean;
  /** Partages. */
  reposts: boolean;
};

/** Les préférences par défaut : ce que le backend inscrit pour un compte neuf. */
export const VIBE_NOTIFICATION_DEFAULTS: VibeNotificationPreferences = {
  directMessages: true,
  email: true,
  likes: true,
  push: true,
  replies: true,
  reposts: true,
};

/**
 * Réglages qui n'ont AUCUN effet derrière eux.
 *
 * L'interface doit le dire : un réglage qui ne fait rien est pire
 * qu'un réglage absent, parce qu'il occupe une place dans l'écran et
 * promet une protection.
 */
export const VIBE_NOTIFICATION_WITHOUT_TRANSPORT = ["email", "push"] as const;

/**
 * Extrait les préférences de notification d'un objet `UserSettings`.
 *
 * Le backend peut omettre une colonne (base antérieure à une migration) :
 * chaque absence vaut alors le défaut, jamais `false`. Une préférence
 * absente ne doit pas couper une notification.
 *
 * Le paramètre est typé par les CLÉS qui l'intéressent, et non par
 * `Record<string, unknown>` : `UserSettings` est une interface sans index
 * signature, et un objet de cette forme n'est pas assignable à un index
 * signature — le type refusait un appel parfaitement légitime.
 */
export function readVibeNotificationPreferences(
  settings:
    | {
        email_notifications?: boolean;
        notify_on_dm?: boolean;
        notify_on_like?: boolean;
        notify_on_reply?: boolean;
        notify_on_repost?: boolean;
        push_notifications?: boolean;
      }
    | null
    | undefined
): VibeNotificationPreferences {
  const source = settings ?? {};
  const lire = (cle: string, defaut: boolean): boolean => {
    const valeur = (source as Record<string, unknown>)[cle];
    if (typeof valeur === "boolean") {
      return valeur;
    }
    return defaut;
  };
  return {
    directMessages: lire("notify_on_dm", true),
    email: lire("email_notifications", true),
    likes: lire("notify_on_like", true),
    push: lire("push_notifications", true),
    replies: lire("notify_on_reply", true),
    reposts: lire("notify_on_repost", true),
  };
}

/**
 * Traduit les préférences de l'écran en colonnes Vibe.
 *
 * Seules les colonnes RÉELLEMENT lues par le backend sont envoyées. Le
 * haptique et les animations ne sont pas là : ce sont des préférences
 * d'APPAREIL, elles vivent dans le `localStorage` de Vibe.
 */
export function toVibeNotificationPayload(
  preferences: VibeNotificationPreferences
): Record<string, boolean> {
  return {
    email_notifications: preferences.email,
    notify_on_dm: preferences.directMessages,
    notify_on_like: preferences.likes,
    notify_on_reply: preferences.replies,
    notify_on_repost: preferences.reposts,
    push_notifications: preferences.push,
  };
}
