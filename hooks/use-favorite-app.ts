"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  type AppKey,
  DEFAULT_APP_KEY,
  FAVORITE_APP_STORAGE_KEY,
  isAppKey,
  normalizeAppKey,
} from "@/lib/apps/catalog";
import { fetcher } from "@/lib/utils";

// Préférence « Menu favori » : quelle application ouvrir par défaut.
//
// Le modèle est celui de use-agent-mode : le serveur est la source de vérité
// (colonne user_preferences.defaultApp), le localStorage est un cache
// d'affichage qui permet au menu du logo et à la redirection post-login de
// réagir sans attendre l'aller-retour. La clé SWR est exactement celle de la
// page Paramètres (/api/user/preferences) : un réglage modifié là-bas met à
// jour le cache ici automatiquement, et réciproquement.

type PreferencesPayload = Partial<{
  defaultApp: string;
}>;

const SWR_OPTIONS = {
  dedupingInterval: 30_000,
  revalidateOnFocus: false,
} as const;

function readStoredFavorite(): AppKey {
  try {
    return normalizeAppKey(localStorage.getItem(FAVORITE_APP_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_KEY;
  }
}

function writeStoredFavorite(key: AppKey) {
  try {
    localStorage.setItem(FAVORITE_APP_STORAGE_KEY, key);
  } catch {
    // Sans stockage, seul le serveur persiste : l'affichage suivant repassera
    // par l'aller-retour réseau. Sans gravité.
  }
}

export function useFavoriteApp() {
  const { mutate: mutateGlobal } = useSWRConfig();
  const [storedFavorite, setStoredFavorite] = useState<AppKey>(DEFAULT_APP_KEY);
  // Le cache local pré-remplit le premier rendu ; la base prend le relais dès
  // que /api/user/preferences a répondu (préférence peut diverger du cache :
  // autre appareil, changement récent).
  const [serverLoaded, setServerLoaded] = useState(false);

  useEffect(() => {
    setStoredFavorite(readStoredFavorite());
  }, []);

  const { data } = useSWR<PreferencesPayload>(
    "/api/user/preferences",
    fetcher,
    SWR_OPTIONS
  );

  const serverFavorite = normalizeAppKey(data?.defaultApp);

  // Dernière valeur de storedFavorite vue par la synchro serveur. La ref (et
  // non la dépendance) : rejouer la synchro à chaque écriture locale optimiste
  // referait un aller-retour d'affichage pour rien ; la ref suit la valeur
  // sans redéclencher l'effet.
  const storedFavoriteRef = useRef<AppKey>(DEFAULT_APP_KEY);
  storedFavoriteRef.current = storedFavorite;

  // serverFavorite est dérivée de data?.defaultApp : la dépendance couvre les
  // deux, et la garde d'égalité rend le redéclenchement idempotent.
  useEffect(() => {
    if (data?.defaultApp === undefined) {
      return;
    }
    setServerLoaded(true);
    if (serverFavorite !== storedFavoriteRef.current) {
      setStoredFavorite(serverFavorite);
      // Resynchronisation du cache résiduel d'un autre appareil.
      writeStoredFavorite(serverFavorite);
    }
  }, [data?.defaultApp, serverFavorite]);

  const favorite = serverLoaded ? serverFavorite : storedFavorite;

  const setFavorite = useCallback(
    (key: AppKey) => {
      const next = normalizeAppKey(key);
      // Affichage immédiat (menu, redirection) ; la base suit derrière.
      setStoredFavorite(next);
      writeStoredFavorite(next);

      // Écriture opportuniste de la préférence ; un échec signale une erreur
      // réseau mais ne casse rien : le prochain chargement relira la base.
      void fetch("/api/user/preferences", {
        body: JSON.stringify({ defaultApp: next }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
        .then(async (res) => {
          if (res.ok) {
            // Resynchronise le cache SWR partagé avec la page Paramètres.
            await mutateGlobal(
              (keyPredicate) =>
                typeof keyPredicate === "string" &&
                keyPredicate.startsWith("/api/user/preferences"),
              undefined,
              { revalidate: true }
            );
          }
        })
        .catch(() => {});
    },
    [mutateGlobal]
  );

  return { favorite, setFavorite };
}

/**
 * Variante sans hooks pour la redirection post-login : lit le cache local,
 * puis rafraîchit depuis la base avant de décider. Le cache sert de premier
 * choix si la base ne répond pas (fallback, pas source de vérité).
 */
export async function resolveFavoriteAppAfterLogin(): Promise<AppKey> {
  const stored = readStoredFavorite();
  try {
    const res = await fetch("/api/user/preferences", SWR_OPTIONS as never);
    if (res.ok) {
      const data = (await res.json()) as PreferencesPayload;
      const serverFavorite = isAppKey(data?.defaultApp)
        ? data.defaultApp
        : null;
      if (serverFavorite) {
        writeStoredFavorite(serverFavorite);
        return serverFavorite;
      }
    }
  } catch {
    // Hors ligne : le cache local est le meilleur choix disponible.
  }
  return stored;
}
