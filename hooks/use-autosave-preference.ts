"use client";

/**
 * Enregistrement immédiat d'une préférence, avec annulation.
 *
 * Les paramètres ne se enregistrent plus : chaque changement est écrit
 * aussitôt, et l'utilisateur est prévenu par une notification qui porte un
 * bouton « Annuler ». Le modèle est celui déjà en place dans les préférences
 * IA : un seul mécanisme, donc un seul comportement d'interface.
 *
 * L'annulation ne se contente pas de remettre l'affichage dans son état
 * initial : elle réécrit la valeur précédente, parce qu'un réglage que
 * l'interface présente comme annulé mais que la base a gardé est un
 * réglage qui reviendra au prochain rechargement.
 */

import { useCallback } from "react";
import { toast } from "sonner";

export type AutosaveOptions<P = Record<string, unknown>> = {
  /** Route qui reçoit le changement. */
  endpoint?: string;
  /** Méthode d'écriture. */
  method?: "POST" | "PATCH" | "PUT";
  /**
   * Écrivain personnalisé.
   *
   * Certaines cibles ne passent pas par une route de l'hôte : les
   * préférences Vibe vivent dans le backend social, derrière son propre
   * client. L'en-tête — notification, annulation — reste identique.
   */
  write?: (payload: P) => Promise<unknown>;
  /** Revalidation des données lues après l'écriture. */
  revalidate?: () => unknown;
  /** Message affiché une fois l'écriture réussie. */
  successMessage?: string;
  /** Message affiché si l'écriture échoue. */
  errorMessage?: string;
  /**
   * Durée d'affichage de la notification, en millisecondes.
   *
   * Un changement suivi d'un annulation doit rester lisible : par défaut
   * la notification vit cinq secondes.
   */
  duration?: number;
};

/** Dérogations ponctuelles à l'enregistrement par défaut. */
export type AutosaveOverride<P = Record<string, unknown>> = Partial<
  AutosaveOptions<P>
>;

export function useAutosavePreference<P = Record<string, unknown>>(
  defaults: AutosaveOptions<P>
) {
  const save = useCallback(
    async (
      payload: P,
      rollback: () => void | Promise<void>,
      override: AutosaveOverride<P> = {}
    ): Promise<boolean> => {
      const options = { ...defaults, ...override };
      try {
        if (options.write) {
          await options.write(payload);
        } else {
          if (!options.endpoint) {
            throw new Error("Aucune destination d'enregistrement.");
          }
          const reponse = await fetch(options.endpoint, {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: options.method ?? "POST",
          });
          if (!reponse.ok) {
            throw new Error(
              options.errorMessage ??
                "Erreur lors de l'enregistrement des paramètres."
            );
          }
        }
        await options.revalidate?.();
        toast.success(options.successMessage ?? "Paramètres enregistrés", {
          action: {
            label: "Annuler",
            onClick: () => {
              void rollback();
            },
          },
          duration: options.duration ?? 5000,
          position: "top-right",
        });
        return true;
      } catch (erreur) {
        toast.error(
          erreur instanceof Error
            ? erreur.message
            : (options.errorMessage ??
                "Erreur lors de l'enregistrement des paramètres.")
        );
        return false;
      }
    },
    [defaults]
  );

  return { save };
}
