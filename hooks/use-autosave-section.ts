"use client";

/**
 * Enregistrement automatique d'une section de réglages.
 *
 * Une section (Vibe, Recherche, Blackline) expose une dizaine de contrôles.
 * Les câbler un par un à l'enregistrement produit autant de code que de
 * réglages, et l'oubli d'un seul est silencieux : le contrôle semble
 * marcher, la valeur ne part jamais.
 *
 * Le hook surveille donc l'ENSEMBLE des valeurs de la section : dès qu'une
 * seule change, la section est écrite. Les modifications rapprochées sont
 * regroupées (un curseur déplacé produit une seule écriture, pas dix), et
 * l'annulation réécrit la valeur précédente.
 *
 * L'interface est remise dans son état initial par l'appelant, via
 * `apply` : le hook ne connaît pas les cases à cocher, seulement les
 * valeurs.
 */

import { useEffect, useMemo, useRef } from "react";
import { useAutosavePreference } from "@/hooks/use-autosave-preference";

export type AutosaveSectionOptions<T> = {
  /** Valeurs surveillées par la section. */
  values: T;
  /** Écrit les valeurs côté serveur. */
  write: (values: T) => Promise<unknown>;
  /** Remet l'interface dans l'état de ces valeurs. */
  apply: (values: T) => void;
  /**
   * Délai de regroupement des modifications, en millisecondes.
   *
   * Un texte saisi au clavier produit une modification par frappe : sans
   * regroupement, chaque lettre serait une écriture.
   */
  delay?: number;
  /** L'enregistrement est-il possible ? */
  enabled?: boolean;
  /** Message affiché une fois l'écriture réussie. */
  successMessage?: string;
  /** Message affiché si l'écriture échoue. */
  errorMessage?: string;
};

export function useAutosaveSection<T>({
  values,
  write,
  apply,
  delay = 600,
  enabled = true,
  successMessage = "Paramètres enregistrés",
  errorMessage,
}: AutosaveSectionOptions<T>) {
  const { save } = useAutosavePreference<T>({
    errorMessage,
    successMessage,
    write: async (corps) => {
      await write(corps);
    },
  });
  // La clé d'un instantané sert à savoir si quelque chose a changé. La
  // sérialisation doit être stable : les valeurs sont des primitives.
  const cle = useMemo(() => JSON.stringify(values), [values]);

  const cleEnregistree = useRef<string>("");
  const valeursEnregistrees = useRef<T | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Premier passage : les viennent d'être chargées, elles ne sont pas
    // modifiées. On les note comme référence, sans rien écrire.
    if (cleEnregistree.current === "") {
      cleEnregistree.current = cle;
      valeursEnregistrees.current = values;
      return;
    }

    if (cle === cleEnregistree.current) {
      return;
    }

    if (minuteur.current) {
      clearTimeout(minuteur.current);
    }

    const valeursAEcrire = values;
    minuteur.current = setTimeout(() => {
      const precedente = valeursEnregistrees.current;
      valeursEnregistrees.current = valeursAEcrire;
      cleEnregistree.current = cle;
      void save(valeursAEcrire, () => {
        if (!precedente) {
          return;
        }
        apply(precedente);
        valeursEnregistrees.current = precedente;
        cleEnregistree.current = JSON.stringify(precedente);
        void save(precedente, () => {});
      });
    }, delay);

    return () => {
      if (minuteur.current) {
        clearTimeout(minuteur.current);
      }
    };
  }, [cle, values, enabled, apply, save, delay]);
}
