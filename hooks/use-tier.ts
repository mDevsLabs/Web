"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { resolveTierInfo, type TierInfo } from "@/lib/auth/tier-info";

// Tier client à partir de /api/settings. Le hook délègue toute la dérivation à
// resolveTierInfo (lib/auth/tier-info.ts), testable sans React ni SWR.
//
// Règle du correctif « abonné Plus bloqué hors de l'espace Agent » : `loaded`
// signifie « tier CONNU » — la réponse est arrivée sans erreur. En chargement
// ou en échec réseau, `loaded` reste false : la garde de mode du shell ne doit
// pas interpréter l'absence de données comme « Free », sinon les abonnés
// payants sont réassignés silencieusement à l'accueil Chat. Le serveur arbitre
// de toute façon à l'envoi (plan_required sur /api/chat et /api/agent).
export type { TierInfo };

export function useTier(): TierInfo {
  const { data, error, isLoading } = useSettings({
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return useMemo(
    () =>
      resolveTierInfo({
        data,
        error,
        isLoading,
      }),
    [data, error, isLoading]
  );
}
