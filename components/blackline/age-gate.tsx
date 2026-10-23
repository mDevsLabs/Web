"use client";

/**
 * ============================================================================
 * CONFIRMATION D'ÂGE — BLACKLINE (16+, PEGI 16)
 * ============================================================================
 *
 * POURQUOI CE COMPOSANT EXISTE
 *
 * Blackline est classé **PEGI 16** : il contient des représentations de
 * violence (armes à feu, affrontements et éliminations — le jeu ne montre pas
 * de sang, mais le conflit armé est explicite). L'accès à un contenu classé
 * doit être conditionné à une confirmation d'âge.
 *
 * LA RÈGLE : À CHAQUE LANCEMENT, ET RIEN N'EST MÉMORISÉ
 *
 * La confirmation est demandée à CHAQUE entrée dans le jeu. Elle n'est
 * écrite :
 *   - ni en base de données (aucune colonne, aucune table) ;
 *   - ni dans le `localStorage` (aucune clé) ;
 *   - ni dans un cookie.
 *
 * Elle vit dans l'ÉTAT DU COMPOSANT : un rechargement de page — ou une
 * navigation qui quitte `/blackline` puis y revient — repose la question.
 * C'est le comportement demandé, et c'est aussi le plus simple à auditer :
 * il n'y a rien àpurger, donc rien qui puisse survivre par accident.
 *
 * LE REFUS N'EST PAS UNE IMPASSE
 *
 * Un refus n'enferme pas l'utilisateur : la modale laisse place à un message
 * d'explication et un lien de retour. Le jeu ne se lance pas, mais la page
 * reste lisible et la navigation hors du jeu reste possible.
 */

import { CrosshairIcon, ShieldAlertIcon } from "@mdevs/icons";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type AgeGateResult = "accepted" | "refused";

type BlacklineAgeGateProps = {
  onDecide: (result: AgeGateResult) => void;
};

/**
 * Modale de confirmation d'âge.
 *
 * La modale est un `role="dialog"` `aria-modal`, et le focus y entre : un
 * clavier ne doit pas pouvoir la contourner pour atteindre le jeu sans avoir
 * répondu. `Échap` ne la ferme PAS — c'est une condition d'accès, pas une
 * fenêtre à_QUITTER.
 */
export function BlacklineAgeGate({ onDecide }: BlacklineAgeGateProps) {
  const [refuse, setRefuse] = useState(false);
  const confirmerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Le focus entre dans la modale : la première action proposée est la
    // confirmation, et le clavier ne doit pas rester sur l'élément qui a
    // ouvert la page.
    confirmerRef.current?.focus();
  }, []);

  return (
    <div
      aria-labelledby="blackline-age-titre"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      onKeyDown={(event) => {
        // `Échap` ne ferme pas : la question doit receives une réponse.
        if (event.key === "Escape") {
          event.preventDefault();
        }
      }}
      role="dialog"
    >
      <div className="surface-card flex w-full max-w-lg flex-col gap-5 p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <ShieldAlertIcon className="size-4" />
          Classification PEGI 16 — 16 ans et plus
        </div>

        <div className="flex flex-col gap-2">
          <h1
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            id="blackline-age-titre"
          >
            BLACKLINE est un jeu de combat 16+
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce jeu contient des représentations de violence : armes à feu,
            affrontements et éliminations. Il est classé PEGI 16 et
            s&apos;adresse aux personnes âgées de 16 ans ou plus.
          </p>
          <p className="text-sm text-muted-foreground">
            Votre âge est demandé à <strong>chaque lancement</strong> du jeu. Il
            n&apos;est ni enregistré, ni mémorisé sur cet appareil.
          </p>
        </div>

        {refuse ? (
          <div className="surface-muted flex flex-col gap-3 p-4">
            <p className="text-sm text-foreground">
              Blackline n&apos;est pas accessible aux moins de 16 ans. Vous
              pouvez continuer à utiliser mAI normalement.
            </p>
            <Button asChild className="w-fit" variant="outline">
              <a href="/">Retour à mAI</a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex items-center gap-2"
              onClick={() => onDecide("accepted")}
              ref={confirmerRef}
            >
              <CrosshairIcon className="size-4" />
              J&apos;ai 16 ans ou plus
            </Button>
            <Button
              className="sm:ml-auto"
              onClick={() => setRefuse(true)}
              variant="outline"
            >
              J&apos;ai moins de 16 ans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
