/**
 * ============================================================================
 * BLACKLINE — PROFIL ÉNERGÉTIQUE DE L'APPAREIL
 * ============================================================================
 *
 * POURQUOI CE MODULE
 *
 * Un jeu 3D dans un onglet de navigateur coûte cher : GPU, mémoire, batterie.
 * Blackline a déjà ses propres réglages (`batterySaver`, `adaptive`, `quality`,
 * `renderResolution`) et sa politique de rendu (plafond de FPS, rendu à
 * l'arrêt sur un menu). Ce qui manquait, c'est de savoir SUR QUOI il tourne :
 * un portable sur batterie à 12 % et un poste fixe branché demandent la même
 * chose à l'écran, pas la même chose à la machine.
 *
 * Ce module lit trois signaux — batterie, mémoire, économiseur de données — et
 * en tire une DÉROGATION DE SESSION aux réglages du compte.
 *
 * LES RÉGLAGES DU COMPTE RESTENT LA RÉFÉRENCE
 *
 * La dérogation ne s'écrit nulle part : elle est passée au montage du jeu et
 * disparaît avec la page. La base reste la source de vérité (c'est le contrat
 * de l'hôte), et l'interface DIT pourquoi elle a réduit la qualité — une
 * réduction silencieuse passerait pour un bug d'affichage.
 *
 * Aucune de ces API n'est garantie : `getBattery` est absente de Safari et de
 * Firefox, `deviceMemory` de Firefox. Leur absence n'est pas une erreur — le
 * profil vaut simplement `null`, et rien n'est dérogé.
 */

export interface DevicePowerProfile {
  /** Niveau 0..1, ou null si l'API Battery Status n'existe pas. */
  batteryLevel: number | null;
  /** L'appareil est-il branché ? null si inconnu. */
  charging: boolean | null;
  /** Mémoire approximative en Go (`navigator.deviceMemory`), ou null. */
  deviceMemoryGb: number | null;
  /** L'utilisateur a demandé à économiser les données. */
  saveData: boolean;
}

type BatteryManagerLike = EventTarget & {
  charging: boolean;
  level: number;
};

/** Seuil « batterie faible » : au-delà, on ne force plus rien. */
export const LOW_BATTERY = 0.2;
/** En dessous de cette mémoire, le moteur 3D saccade quoi qu'on fasse. */
export const LOW_MEMORY_GB = 4;

/**
 * Lit le profil énergétique. Ne lève jamais : une API absente vaut `null`.
 */
export async function readDevicePowerProfile(): Promise<DevicePowerProfile> {
  const nav =
    typeof navigator === "undefined"
      ? null
      : (navigator as Navigator & {
          getBattery?: () => Promise<BatteryManagerLike>;
          deviceMemory?: number;
          connection?: { saveData?: boolean };
        });

  let batteryLevel: number | null = null;
  let charging: boolean | null = null;
  if (nav && typeof nav.getBattery === "function") {
    try {
      const manager = await nav.getBattery();
      batteryLevel = manager.level;
      charging = manager.charging;
    } catch {
      // API refusée (permission, contexte non sécurisé) : on continue sans.
    }
  }

  return {
    batteryLevel,
    charging,
    deviceMemoryGb:
      typeof nav?.deviceMemory === "number" ? nav.deviceMemory : null,
    saveData: Boolean(nav?.connection?.saveData),
  };
}

export interface SessionDerogation {
  /**
   * Réglages passés au montage, par-dessus ceux du compte. Vide si l'appareil
   * ne justifie aucune dérogation.
   */
  overrides: Record<string, unknown>;
  /** Explication affichée à l'utilisateur, en français. `null` si aucune. */
  reason: string | null;
  /** Niveau de sévérité, pour l'habillage du message. */
  severity: "info" | "warning" | null;
}

/**
 * Traduit le profil en dérogations de session.
 *
 * L'ordre compte : une batterie faible est plus urgente qu'une mémoire juste,
 * et l'explication affichée doit être celle qui a réellement décidé.
 */
export function deriveSessionDerogation(
  profile: DevicePowerProfile
): SessionDerogation {
  const { batteryLevel, charging, deviceMemoryGb, saveData } = profile;
  const onBattery = charging === false;

  if (onBattery && batteryLevel !== null && batteryLevel <= LOW_BATTERY) {
    return {
      overrides: { adaptive: true, batterySaver: true },
      reason: `Batterie à ${Math.round(batteryLevel * 100)} % : le mode économie du jeu est activé pour cette session.`,
      severity: "warning",
    };
  }

  if (deviceMemoryGb !== null && deviceMemoryGb < LOW_MEMORY_GB) {
    return {
      overrides: { adaptive: true, batterySaver: true, quality: "performance" },
      reason: `Mémoire limitée (${deviceMemoryGb} Go) : qualité « performance» pour cette session.`,
      severity: "info",
    };
  }

  if (saveData) {
    return {
      overrides: { adaptive: true, batterySaver: true },
      reason: "Économiseur de données actif : mode économie du jeu activé.",
      severity: "info",
    };
  }

  if (onBattery) {
    return {
      overrides: { adaptive: true },
      reason:
        "Sur batterie : la résolution s'adapte automatiquement pour tenir la fluidité.",
      severity: "info",
    };
  }

  return { overrides: {}, reason: null, severity: null };
}

/** Libellé court du niveau de batterie, pour l'accueil (« 82 %», « branché»). */
export function formatPowerLabel(profile: DevicePowerProfile): string {
  if (profile.batteryLevel === null) {
    return "Alimentation inconnue";
  }
  const percent = `${Math.round(profile.batteryLevel * 100)} %`;
  if (profile.charging === true) {
    return `${percent} · branché`;
  }
  return `${percent} · batterie`;
}
