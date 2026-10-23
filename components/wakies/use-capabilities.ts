"use client";

/**
 * Capacités du compte : compétences, extensions et serveurs MCP.
 *
 * Ces données sont lues par deux écrans qui n'ont ni les mêmes styles ni le
 * même périmètre : l'app Wakies (`.wakies-root`) et l'onglet « Applications »
 * des paramètres mAI (hors `.wakies-root`). Le CHARGEMENT est donc séparé
 * de la PRÉSENTATION : ce module ne porte que la lecture, chaque écran
 * having sa propre façon de les montrer.
 */

import { useCallback, useEffect, useState } from "react";

/** Compétence personnelle du compte. */
export type Competence = {
  description?: string | null;
  id: string;
  name: string;
  pinned?: boolean;
};

/** Fiche d'extension du catalogue mAI. */
export type Extension = {
  description?: string | null;
  enabled?: boolean;
  id: string;
  installed?: boolean;
  locked?: boolean;
  name: string;
  toolIds?: string[];
};

/** Serveur MCP du compte. Masqué si le DTO ne porte que `secretKeys`. */
export type ServeurMcp = {
  enabled?: boolean;
  id: string;
  name: string;
  transport?: string | null;
};

export type Capabilities = {
  competences: Competence[];
  extensions: Extension[];
  serveurs: ServeurMcp[];
};

export const CAPACITIES_VIDES: Capabilities = {
  competences: [],
  extensions: [],
  serveurs: [],
};

async function chargerCompetences(): Promise<Competence[]> {
  try {
    const reponse = await fetch("/api/skills", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    if (Array.isArray(corps)) {
      return corps as Competence[];
    }
    if (
      corps &&
      typeof corps === "object" &&
      Array.isArray((corps as { skills?: Competence[] }).skills)
    ) {
      return (corps as { skills: Competence[] }).skills;
    }
    return [];
  } catch {
    return [];
  }
}

async function chargerExtensions(): Promise<Extension[]> {
  try {
    const reponse = await fetch("/api/plugins", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    if (Array.isArray(corps)) {
      return corps as Extension[];
    }
    if (
      corps &&
      typeof corps === "object" &&
      Array.isArray((corps as { plugins?: Extension[] }).plugins)
    ) {
      return (corps as { plugins: Extension[] }).plugins;
    }
    return [];
  } catch {
    return [];
  }
}

async function chargerServeurs(): Promise<ServeurMcp[]> {
  try {
    const reponse = await fetch("/api/mcp", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    const rawList = Array.isArray(corps)
      ? corps
      : corps &&
          typeof corps === "object" &&
          Array.isArray((corps as { servers?: unknown[] }).servers)
        ? (corps as { servers: unknown[] }).servers
        : [];
    return (
      rawList as Array<{
        enabled?: boolean;
        id: string;
        isEnabled?: boolean;
        name: string;
        transport?: string | null;
      }>
    ).map((s) => ({
      enabled: s.enabled ?? s.isEnabled ?? true,
      id: s.id,
      name: s.name,
      transport: s.transport ?? null,
    }));
  } catch {
    return [];
  }
}

export function useCapabilities(actif: boolean): {
  capabilities: Capabilities;
  chargement: boolean;
  erreur: string;
  rafraichir: () => Promise<void>;
} {
  const [capabilities, setCapabilities] = useState(CAPACITIES_VIDES);
  const [chargement, setChargement] = useState(actif);
  const [erreur, setErreur] = useState("");

  const rafraichir = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const [competences, extensions, serveurs] = await Promise.all([
        chargerCompetences(),
        chargerExtensions(),
        chargerServeurs(),
      ]);
      setCapabilities({ competences, extensions, serveurs });
    } catch {
      setErreur("Vos capacités n'ont pas pu être chargées. Réessayez.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (actif) {
      void rafraichir();
    }
  }, [actif, rafraichir]);

  return { capabilities, chargement, erreur, rafraichir };
}
