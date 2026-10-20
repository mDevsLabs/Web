"use client";

/**
 * ============================================================================
 * MONTAGE DU JEU BLACKLINE DANS L'HÔTE
 * ============================================================================
 *
 * Blackline est un jeu Vite autonome : l'hôte ne le compile pas, il le MONTE.
 * Ce composant est le point de contact entre les deux mondes.
 *
 * LE CHEMIN, ÉTAPE PAR ÉTAPE
 *
 *  1. La CONFIRMATION D'ÂGE est demandée. Tant qu'elle n'est pas donnée, le
 *     bundle du jeu n'est même pas demandé : pas de moteur, pas de texture,
 *     pas de bande passante.
 *
 *  2. Le BUNDLE est chargé. Son nom est FIXE (`/blackline/assets/blackline.js`)
 *     : le navigateur le met en cache, et la page n'a rien à lire avant de
 *     l'insérer. Voir `scripts/build-blackline.mjs`.
 *
 *  3. Le JEU est monté dans le conteneur fourni par la page. Le point d'entrée
 *     du jeu (`apps/blackline/src/entry.ts`) est le MÊME que celui de
 *     l'application autonome : il n'y a pas deux montages à diverger.
 *
 *  4. Les RÉGLAGES de la base sont appliqués au jeu. La base fait foi (c'est
 *     le serveur qui décide, partout ailleurs dans mAI) ; le `localStorage` du
 *     jeu reste le repli hors ligne.
 *
 * LE CONTRAT EST UN OBJET SUR `window`
 *
 * L'hôte appelle `window.blackline.mount(...)`. Ce n'est pas un import :
 * le jeu est un artefact statique, servi depuis `public/`, et son nom de
 * chunk est FIXE. Un export nommé serait élagué par le build (le point
 * d'entrée n'a personne à qui parler tant que l'hôte ne l'appelle pas) —
 * et l'échec serait SILENCIEUX, puisque le chargement du module réussit.
 * Une affectation sur `window` ne peut pas être élaguée.
 *
 * OÙ SONT POSÉES LES CLASSES DU JEU
 *
 * Le jeu posait ses classes (`touch-device`, `reduced-motion`, `left-handed`)
 * sur `<html>` : dans l'hôte, ce document est celui du CHAT, et le jeu
 * repeindrait la barre latérale. Elles sont donc posées sur la racine
 * `.blackline-root` — voir `apps/blackline/src/root.ts`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BlacklineAgeGate } from "@/components/blackline/age-gate";
import { Button } from "@/components/ui/button";

/** Chunk d'entrée du jeu. Son nom est stable : voir scripts/build-blackline.mjs. */
const CHUNK_ENTREE = "/blackline/assets/blackline.js";

/**
 * Le contrat publié par le jeu.
 *
 * Le jeu le pose sur `window` (voir `apps/blackline/src/mount.ts`) : un
 * export Named pourrait être élagué par le build, et l'hôte chercherait
 * alors un contrat absent — sans le moindre message, puisque le chargement
 * du module réussit.
 */
declare global {
  interface Window {
    blackline?: {
      mount: (options: {
        container: HTMLElement;
        root: HTMLElement;
        settings?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
  }
}

type BlacklineHostProps = {
  /** Réglages enregistrés pour ce compte (base de données). */
  settings?: Record<string, unknown> | null;
};

export function BlacklineHost({ settings }: BlacklineHostProps) {
  // La confirmation d'âge vit ici, et NULLE PART : ni base, ni localStorage,
  // ni cookie. Un rechargement repose la question.
  const [age, setAge] = useState<"pending" | "accepted" | "refused">("pending");
  const [chargement, setChargement] = useState<
    "inactif" | "chargement" | "pret"
  >("inactif");
  const [erreur, setErreur] = useState<string | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Les réglages sont lus UNE FOIS : le jeu les applique à son montage, et
  // changer la référence ne doit pas remonter le jeu.
  const reglagesRef = useRef(settings);
  reglagesRef.current = settings;

  const monterJeu = useCallback(async () => {
    const conteneur = conteneurRef.current;
    if (!conteneur) {
      return;
    }
    setChargement("chargement");
    try {
      // Le jeu est un point d'entrée ES : il publie son contrat sur
      // `window.blackline` (voir apps/blackline/src/mount.ts). Un export nommé
      // pourrait être ÉLAGUÉ par le build — le point d'entrée n'a personne à
      // qui parler tant que l'hôte ne l'appelle pas — et l'hôte chercherait
      // alors un contrat absent, sans le moindre message.
      //
      // `window.blackline` ne peut pas être élagué : rien ne le rend inutile
      // au regard de l'arbreur.
      const contrat = window.blackline;
      if (!contrat?.mount) {
        throw new Error(
          "Le jeu n'a pas publié son point de montage (window.blackline.mount)."
        );
      }
      await contrat.mount({
        container: conteneur,
        root: conteneur,
        settings: reglagesRef.current ?? undefined,
      });
      setChargement("pret");
    } catch (error) {
      console.error("BLACKLINE : montage impossible", error);
      setErreur(
        "Le jeu n'a pas pu être chargé. Vérifiez que WebGL 2 est disponible, puis rechargez la page."
      );
      setChargement("inactif");
    }
  }, []);

  // Le montage a lieu UNE SEULE FOIS, après la confirmation d'âge.
  //
  // Le SCRIPT est inséré et ATTENDU : le jeu publie son contrat sur
  // `window.blackline` au chargement du module. Monter avant que le module
  // soit exécuté trouverait un contrat absent — et l'échec serait
  // silencieux, puisque le module arrive une fraction de seconde plus tard.
  useEffect(() => {
    if (age !== "accepted") {
      return;
    }
    // Un montage déjà en cours ou déjà fait : on ne recommence pas.
    if (scriptRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = CHUNK_ENTREE;
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    const demarrer = () => {
      void monterJeu();
    };
    script.addEventListener("load", demarrer);
    // Le script a pu être exécuté avant que l'écouteur ne soit posé (il
    // vient du cache) : le contrat est alors déjà publié.
    if (window.blackline?.mount) {
      demarrer();
    }

    return () => {
      script.removeEventListener("load", demarrer);
      script.remove();
      scriptRef.current = null;
    };
  }, [age, monterJeu]);

  if (age === "refused") {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="surface-card flex max-w-md flex-col gap-4 p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">
            Blackline est réservé aux 16 ans et plus
          </h2>
          <p className="text-sm text-muted-foreground">
            Ce jeu est classé PEGI 16. Vous pouvez continuer à utiliser mAI
            normalement.
          </p>
          <Button asChild className="mx-auto" variant="outline">
            <a href="/">Retour à mAI</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#17211e]">
      {/*
        La RACINE DU JEU. Elle porte la classe `blackline-root` : c'est
        l'élément sous lequel toute la feuille de style du jeu est re-ancrée,
        et celui qui reçoit ses classes d'état (`touch-device`,
        `reduced-motion`, `left-handed`…).

        Elle est `relative` : le canvas du jeu est en `position:absolute`
        (et non `fixed` — voir scripts/build-blackline-css.mjs), donc il se
        borne à CETTE racine et ne couvre jamais la barre latérale du chat.
      */}
      <div className="blackline-root absolute inset-0" ref={conteneurRef}>
        {/*
          Le canvas et l'interface du jeu. Le jeu les crée lui-même : ce
          conteneur n'est qu'un point d'ancrage, et il ne doit contenir QUE ce
          que le jeu y met.
        */}
      </div>

      {chargement === "chargement" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#c6dd94]">
          <div className="size-10 animate-spin rounded-full border-2 border-[#c6dd94]/30 border-t-[#c6dd94]" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em]">
            Préparation de l&apos;opération
          </p>
        </div>
      )}

      {erreur && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="surface-card flex max-w-md flex-col gap-4 p-6 text-center">
            <h2 className="text-lg font-bold text-foreground">
              Le jeu n&apos;a pas pu démarrer
            </h2>
            <p className="text-sm text-muted-foreground">{erreur}</p>
            <Button
              className="mx-auto"
              onClick={() => {
                setErreur(null);
                setChargement("inactif");
              }}
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {age === "pending" && (
        <BlacklineAgeGate
          onDecide={(result) => {
            setAge(result);
            if (result === "refused") {
              toast.info(
                "Blackline est classé PEGI 16 : l'accès est réservé aux 16 ans et plus."
              );
            }
          }}
        />
      )}
    </div>
  );
}
