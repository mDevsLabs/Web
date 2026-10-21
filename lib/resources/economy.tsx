"use client";

/**
 * Économie des ressources — le mode « pas cher » de l'interface.
 *
 * POURQUOI CE MODULE EXISTE
 *
 * L'hôte mAI fait tourner plusieurs applications dans la même page : le
 * chat, le Site, Vibe, Blackline. Elles ne sont pas mountées ensemble —
 * mais leurs RESSOURCES restent, elles : animations, lecteurs audio, sockets
 * temps réel, rafraîchissements périodiques, boucle de rendu 3D.
 *
 * Sur un poste modeste, un jeu 3D lancé depuis la barre latérale pendant
 * qu'une conversation streamed se met à saccader n'a rien d'unbug : c'est la
 * concurrence entre deux boucle de rendu et deux fils d'exécution.
 *
 * CE QUE CE MODULE FAIT
 *
 * Il expose un seul signal — « l'économie est-elle active ? » — et trois
 * raisons de l'être :
 *
 * 1. l'utilisateur l'a demandé (réglage « Mode économie ») ;
 * 2. l'onglet est caché (personne ne regarde, rien ne tourne pour personne) ;
 * 3. une activité lourde est en cours (Blackline, un traitement de fond).
 *
 * Les consommateurs — animations, audio, temps réel, rafraîchissements —
 * réagissent à ce signal. Aucun ne le recalcule : le mode économie se décide
 * à UN endroit.
 *
 * LE RÉGLAGE EST UN RÉGLAGE D'APPAREIL
 *
 * « Mode économie » décrit la machine sur laquelle on travaille, pas le
 * compte : il vit dans le `localStorage`, comme la largeur de la barre
 * latérale. Le suivre sur tous les appareils n'aurait aucun sens — un
 * portable et un poste fixe n'ont pas les mêmes ressources.
 */

import { MotionConfig } from "framer-motion";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Clé de stockage du réglage d'appareil. */
export const ECONOMY_MODE_STORAGE_KEY = "mai.economy-mode";

export type EconomyContextValue = {
  /**
   * L'économie est-elle active ?
   *
   * Vrai si l'utilisateur l'a demandée, si l'onglet est caché, ou si une
   * activité lourde est en cours.
   */
  isEconomy: boolean;
  /** L'utilisateur a-t-il demandé le mode économie ? */
  isEconomyRequested: boolean;
  /** L'onglet est-il caché ? */
  isTabHidden: boolean;
  /** Nombre d'activités lourdes en cours. */
  heavyTaskCount: number;
  /** Bascule le réglage d'appareil. */
  setEconomyRequested: (value: boolean) => void;
  /**
   * Déclare une activité lourde.
   *
   * La fonction renvoyée la libère : l'utiliser comme fonction de nettoyage
   * d'un effet React garantit qu'une exception ne laissera pas l'activité
   * « en cours » pour toujours.
   */
  registerHeavyTask: (id: string) => () => void;
};

const EconomyContext = createContext<EconomyContextValue | null>(null);

/** Lit le réglage d'appareil. Une valeur illisible vaut « désactivé ». */
export function readEconomyPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(ECONOMY_MODE_STORAGE_KEY) === "true";
  } catch {
    // Un navigateur en navigation privée peut refuser le stockage : on
    // garde alors le réglage par défaut, qui est « désactivé ».
    return false;
  }
}

/** Écrit le réglage d'appareil. */
export function writeEconomyPreference(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      ECONOMY_MODE_STORAGE_KEY,
      value ? "true" : "false"
    );
  } catch {
    // Idem : l'échec d'écriture ne doit pas casser l'interface.
  }
}

export function EconomyProvider({ children }: { children: ReactNode }) {
  const [isEconomyRequested, setIsEconomyRequested] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [heavyTasks, setHeavyTasks] = useState<string[]>([]);

  // Le réglage est relu au montage : il peut avoir été changé depuis un
  // autre onglet, ou sur un autre poste (même origine, même navigateur).
  useEffect(() => {
    setIsEconomyRequested(readEconomyPreference());
  }, []);

  // L'onglet caché : plus personne ne regarde, donc plus rien ne tourne
  // pour personne. C'est le signal le plus rentable — un onglet en arrière-plan
  // qui anime et rafraîchit coûte pour rien.
  useEffect(() => {
    const onVisibilityChange = () => setIsTabHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const registerHeavyTask = useCallback((id: string) => {
    setHeavyTasks((actuelles) =>
      actuelles.includes(id) ? actuelles : [...actuelles, id]
    );
    return () => {
      setHeavyTasks((actuelles) => actuelles.filter((entree) => entree !== id));
    };
  }, []);

  const setEconomyRequested = useCallback((value: boolean) => {
    setIsEconomyRequested(value);
    writeEconomyPreference(value);
  }, []);

  const isEconomy = isEconomyRequested || isTabHidden || heavyTasks.length > 0;

  // L'attribut est porté par `<html>` : les feuilles de style peuvent
  // alors couper transitions et animations sans que chaque composant ait à
  // consulter le contexte.
  useEffect(() => {
    const racine = document.documentElement;
    if (isEconomy) {
      racine.dataset.economy = "true";
    } else {
      delete racine.dataset.economy;
    }
    return () => {
      delete racine.dataset.economy;
    };
  }, [isEconomy]);

  const value = useMemo<EconomyContextValue>(
    () => ({
      heavyTaskCount: heavyTasks.length,
      isEconomy,
      isEconomyRequested,
      isTabHidden,
      registerHeavyTask,
      setEconomyRequested,
    }),
    [
      heavyTasks.length,
      isEconomy,
      isEconomyRequested,
      isTabHidden,
      registerHeavyTask,
      setEconomyRequested,
    ]
  );

  return (
    <EconomyContext.Provider value={value}>
      {/*
        `reducedMotion="always"` coupe les animations Framer Motion sans
        toucher à leur état final : les composants apparaissent à leur place,
        ils ne glissent plus. C'est le mode d'accessibilité du système,
        réutilisé ici comme mode d'économie.
      */}
      <MotionConfig reducedMotion={isEconomy ? "always" : "user"}>
        {children}
      </MotionConfig>
    </EconomyContext.Provider>
  );
}

/**
 * L'état d'économie.
 *
 * Hors du provider, on rend un état neutre : mieux vaut une application
 * qui n'économise pas qu'une application qui plante parce qu'un provider a
 * été oublié.
 */
export function useEconomy(): EconomyContextValue {
  const context = useContext(EconomyContext);
  const neutre = useMemo<EconomyContextValue>(
    () => ({
      heavyTaskCount: 0,
      isEconomy: false,
      isEconomyRequested: false,
      isTabHidden: false,
      registerHeavyTask: () => () => undefined,
      setEconomyRequested: () => undefined,
    }),
    []
  );
  return context ?? neutre;
}
