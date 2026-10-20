/**
 * ============================================================================
 * RÉGLAGES DU JEU BLACKLINE — CONTRAT PARTAGÉ
 * ============================================================================
 *
 * Blackline expose une trentaine de réglages, tous de formes différentes :
 * énumérations, nombres bornés, texte court, table de touches, couleur. Les
 * porter en base demande donc deux choses : un CONTRAT (quelles clés, quelles
 * valeurs) et une NORMALISATION (un réglage illisible retombe sur sa valeur
 * par défaut, jamais sur une valeur fantôme).
 *
 * LE PRINCIPE EST CELUI DE L'HOSTE : LE SERVEUR FAIT FOI
 *
 * Un réglage illisible ne doit jamais faire échouer l'enregistrement des
 * AUTRES : c'est le même contrat que le thème, le modèle par défaut ou le
 * mode de création. Un `undefined` illisible vaut « system », pas « une
 * erreur ». Ici, un `quality` illisible vaut `ultra` (la valeur par défaut
 * du jeu), et une clé inconnue est IGNORÉE — pas stockée, pas rejouée.
 *
 * LA PROGRESSION N'EST PAS ICI
 *
 * XP, armes, collection et carrière restent dans le `localStorage` de
 * l'appareil : Blackline a volontairement retiré la synchronisation en ligne
 * (version 1.2.0). Seul le journal des réglages est partagé — voir
 * `lib/db/migrations/0064_blackline_settings.sql`.
 */

// ── Les réglages du jeu, un par un ─────────────────────────────────────────

/** Valeurs acceptées pour un réglage d'énumération. */
const ENUMS = {
  cameraMode: ["first", "third"],
  cameraShoulder: ["left", "right"],
  hitFeedback: ["both", "visual", "audio", "none"],
  motionLevel: ["full", "reduced", "off"],
  quality: ["performance", "balanced", "ultra"],
  renderResolution: ["auto", "native", "1080p", "1440p", "4k", "8k"],
  reticleStyle: ["dot", "cross", "circle"],
} as const;

/**
 * Réglages numériques : bornes basse, borne haute, valeur par défaut.
 *
 * Les bornes sont celles du jeu (`apps/blackline/src/settings-normalize.ts`) :
 * le serveur ne doit jamais accepter une valeur que le jeu refusera ensuite.
 */
const NOMBRES = {
  adsSensitivity: [0.3, 1.5, 1],
  adsZoom: [0.8, 1.2, 1],
  cameraDistance: [2, 5, 3.5],
  fov: [65, 110, 84],
  grenadePower: [0.65, 1.2, 1],
  joystickDeadzone: [0.04, 0.25, 0.09],
  reticleScale: [0.65, 1.6, 1],
  sensitivity: [0.2, 3, 1],
  touchOpacity: [0.45, 1, 0.8],
  touchScale: [0.85, 1.25, 1],
  touchSensitivity: [0.2, 3, 1],
  volume: [0, 1, 0.6],
} as const;

/** Réglages booléens : leur valeur par défaut. */
const BOOLEENS = {
  adaptive: false,
  autoClimb: true,
  autoReload: true,
  autoSprint: true,
  batterySaver: false,
  cameraShake: true,
  hitmarkerEnabled: true,
  hitmarkerSound: true,
  invertY: false,
  leftHanded: false,
  mobileAimAssist: true,
  mobileAutoFire: true,
  reduceMotion: false,
  screenEffects: true,
  showFPS: true,
  toggleAim: false,
} as const;

/** Longueur maximale du texte libre (indicatif, couleur du réticule). */
const TEXTE_MAX = 32;

/** Taille maximale de l'objet de réglages sérialisé, en octets. */
export const BLACKLINE_SETTINGS_MAX_BYTES = 32_000;

/** Nombre maximal de touches par action. */
const TOUCHES_MAX = 3;

/** Longueur maximale d'un code de touche (`KeyA`, `Digit1`, `Space`…). */
const CODE_TOUCHE_MAX = 24;

/**
 * Normalise un objet de réglages.
 *
 * Une clé illisible est IGNORÉE : elle ne fait pas échouer l'enregistrement
 * des autres, et elle n'est pas stockée. C'est le fail-safe de l'hôte : un
 * réglage fantôme ne doit jamais être persisté puis rejoué.
 */
export function normalizeBlacklineSettings(
  value: unknown
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [cle, valeurs] of Object.entries(ENUMS)) {
    const brut = source[cle];
    if (
      typeof brut === "string" &&
      (valeurs as readonly string[]).includes(brut)
    ) {
      result[cle] = brut;
    }
  }

  for (const [cle, bornes] of Object.entries(NOMBRES)) {
    const brut = source[cle];
    if (typeof brut !== "number" || !Number.isFinite(brut)) {
      continue;
    }
    const [min, max] = bornes;
    // La valeur est BORNÉE, pas rejetée : un réglage hors bornes est ramené
    // dans l'intervalle, comme le fait le jeu lui-même.
    result[cle] = Math.min(max, Math.max(min, brut));
  }

  for (const [cle, defaut] of Object.entries(BOOLEENS)) {
    const brut = source[cle];
    if (typeof brut === "boolean") {
      result[cle] = brut;
    } else if (brut === undefined) {
      // Un booléen absent prend sa valeur par défaut : le serveur fournit
      // ainsi un jeu complet, même si le client n'a rien envoyé.
      result[cle] = defaut;
    }
  }

  // Le réticule : une couleur hexadécimale, ou la valeur par défaut du jeu.
  if (typeof source.crosshair === "string") {
    if (/^#[a-f0-9]{6}$/i.test(source.crosshair)) {
      result.crosshair = source.crosshair.toLowerCase();
    }
  }

  // L'indicatif : un nom court, épuré.
  if (typeof source.callsign === "string") {
    const nom = source.callsign.trim().slice(0, 18);
    if (nom) {
      result.callsign = nom;
    }
  }

  // Les touches PC : une table d'actions, chaque action portant des codes.
  if (source.bindings && typeof source.bindings === "object") {
    const tables = source.bindings as Record<string, unknown>;
    const resultat: Record<string, string[]> = {};
    for (const [action, codes] of Object.entries(tables)) {
      if (!Array.isArray(codes)) {
        continue;
      }
      const retenus = codes
        .filter(
          (code): code is string =>
            typeof code === "string" && code.length <= CODE_TOUCHE_MAX
        )
        .slice(0, TOUCHES_MAX);
      if (retenus.length > 0) {
        resultat[action] = retenus;
      }
    }
    if (Object.keys(resultat).length > 0) {
      result.bindings = resultat;
    }
  }

  return result;
}

/**
 * Le corps de la requête est-il acceptable ?
 *
 * Le serveur borne la TAILLE de l'objet : sans cela, une clé de plusieurs
 * mégaoctets serait écrite en base, et relue à chaque lancement du jeu.
 */
export function isValidBlacklineSettingsBody(
  value: unknown
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  try {
    return (
      new TextEncoder().encode(JSON.stringify(value)).length <=
      BLACKLINE_SETTINGS_MAX_BYTES
    );
  } catch {
    return false;
  }
}
