"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Squelette de chargement partagé par les routes authentifiées.
//
// Avec `cacheComponents`, la navigation attend le rendu serveur du layout
// `(chat)` — qui résout la session — avant de peindre quoi que ce soit. Sans
// squelette, l'utilisateur voit un cadre vide pendant cet aller-retour, sur
// chacune des 13 routes de l'espace de travail.
//
// La forme reprend celle des cartes réelles (`surface-card`) pour que la
// transition squelette → contenu ne change pas la mise en page.

/** Barre de titre, largeur variable, comme un intertitre de carte. */
function TitleSkeleton({ width = "w-32" }: { width?: string }) {
  return <Skeleton className={cn("h-5", width)} />;
}

/** Bloc de texte, une ligne par entrée. */
function LinesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_unused, index) => (
        <Skeleton
          className={cn("h-3.5", index === count - 1 ? "w-2/3" : "w-full")}
          key={`line-${index}`}
        />
      ))}
    </div>
  );
}

/**
 * Squelette générique d'une page : barre d'outils puis cartes.
 *
 * `cards` nombre les cartes empilées ; `toolbar` ajoute la rangée de filtres
 * au-dessus, présente sur les pages à liste filtrable.
 */
export function RouteSkeleton({
  cards = 3,
  className,
  toolbar = false,
}: {
  cards?: number;
  className?: string;
  toolbar?: boolean;
}) {
  return (
    <div
      // Le conteneur annonce son contenu à l'assistance technique et laisse le
      // temps de lecture que la page mettrait à se charger.
      aria-busy="true"
      aria-label="Chargement en cours"
      className={cn("flex flex-col gap-4 p-4 sm:p-6", className)}
      role="status"
    >
      <TitleSkeleton width="w-48" />

      {toolbar ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_unused, index) => (
            <Skeleton
              className="h-8 w-28 rounded-full"
              key={`filter-${index}`}
            />
          ))}
        </div>
      ) : null}

      {Array.from({ length: cards }, (_unused, index) => (
        <div
          className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6"
          key={`card-${index}`}
        >
          <LinesSkeleton count={index === 0 ? 4 : 3} />
        </div>
      ))}
    </div>
  );
}

/**
 * Squelette de la barre latérale, affiché pendant la résolution de session du
 * layout. Sans lui, la navigation entre deux routes fait disparaître la barre
 * puis la faire revenir, ce qui provoque un clignotement.
 */
export function SidebarSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 p-3">
      <Skeleton className="h-9 w-full rounded-xl" />
      {Array.from({ length: 8 }, (_unused, index) => (
        <Skeleton
          className={cn(
            "h-8 w-full rounded-lg",
            index === 0 ? "bg-muted" : "opacity-70"
          )}
          key={`item-${index}`}
        />
      ))}
    </div>
  );
}
