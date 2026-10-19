"use client";

/**
 * Hook de lecture des widgets GitHub du site.
 *
 * Une seule implémentation pour les trois widgets : chacun avait copié son
 * `fetch`, son `try/catch` et son état d'initialisation, et les trois copies
 * convertissaient un échec en donnée (le widget de statut affichait même
 * « Opérationnel » sans avoir rien consulté). Ce qui est exigé ici :
 *
 *  - l'état initial est « on ne sait pas » (`data: null`, `source: "indisponible"`),
 *    jamais une valeur qui ressemble à une mesure ;
 *  - la réponse est validée dans sa forme ET dans sa charge utile avant usage ;
 *  - aucune branche d'erreur muette : `source` dit au composant ce qu'il peut
 *    afficher, et une annulation (`AbortController` au démontage) ne doit pas
 *    écrire dans un état monté à l'envers.
 */

import { useEffect, useState } from "react";
import type { GithubSource } from "@/lib/site/github-data";

type EnveloppeBrute = {
  data: unknown;
  source: GithubSource;
  stale: boolean;
  updatedAt: string;
};

export type EtatWidgetGithub<T> = {
  chargement: boolean;
  data: T | null;
  source: GithubSource;
  stale: boolean;
};

/**
 * État « on ne sait pas ». Une fonction et non une constante partagée : la donnée
 * doit rester typée `T | null` chez l'appelant, et un objet constant l'aurait fixé
 * à `unknown` dès la première utilisation.
 */
function etatInconnu<TDonnee>(chargement = false): EtatWidgetGithub<TDonnee> {
  return { chargement, data: null, source: "indisponible", stale: false };
}

function estEnveloppeBrute(value: unknown): value is EnveloppeBrute {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const brut = value as Record<string, unknown>;
  return (
    (brut.source === "cache" ||
      brut.source === "github" ||
      brut.source === "indisponible") &&
    typeof brut.stale === "boolean" &&
    typeof brut.updatedAt === "string" &&
    "data" in brut
  );
}

function estErreurAbandon(reason: unknown): boolean {
  return (
    (reason instanceof DOMException || reason instanceof Error) &&
    reason.name === "AbortError"
  );
}

export function useGithubWidget<T>(
  url: string,
  valider: (value: unknown) => value is T
): EtatWidgetGithub<T> {
  const [etat, setEtat] = useState<EtatWidgetGithub<T>>(() =>
    etatInconnu<T>(true)
  );

  useEffect(() => {
    const controller = new AbortController();
    setEtat(etatInconnu<T>(true));

    const lire = async () => {
      try {
        const reponse = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!reponse.ok) {
          setEtat(etatInconnu<T>());
          return;
        }
        const charge: unknown = await reponse.json();
        const enveloppe = estEnveloppeBrute(charge) ? charge : null;
        if (!enveloppe) {
          setEtat(etatInconnu<T>());
          return;
        }
        // Une enveloppe dont la charge utile ne ressemble pas au contrat est un
        // échec de lecture : on n'affiche pas ce qu'on n'a pas pu vérifier.
        const donnee = enveloppe.data;
        if (donnee !== null && !valider(donnee)) {
          setEtat(etatInconnu<T>());
          return;
        }
        setEtat({
          chargement: false,
          data: valider(donnee) ? donnee : null,
          source: enveloppe.source,
          stale: enveloppe.stale,
        });
      } catch (reason: unknown) {
        if (estErreurAbandon(reason)) {
          return;
        }
        setEtat(etatInconnu<T>());
      }
    };

    void lire();
    return () => controller.abort();
  }, [url, valider]);

  return etat;
}
