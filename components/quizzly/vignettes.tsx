/**
 * Vignettes de la boutique. Ce sont des dessins, pas des fichiers :
 * ils suivent les jetons de `.quizzly-root` et restent nets à toute taille.
 */

import { cn } from "@/lib/utils";

function Anneau({ classe }: { classe: string }) {
  return (
    <svg aria-hidden className="size-16" viewBox="0 0 64 64">
      <circle className="fill-q-level/20" cx="32" cy="32" r="18" />
      <circle
        className={cn("fill-none", classe)}
        cx="32"
        cy="32"
        r="24"
        strokeWidth="5"
      />
    </svg>
  );
}

export function VignetteArticle({ id }: { id: string }) {
  return (
    <div
      className={cn(
        "flex size-28 items-center justify-center rounded-[1.6rem] shadow-inner",
        fond(id)
      )}
    >
      {dessin(id)}
    </div>
  );
}

function fond(id: string): string {
  switch (id) {
    case "offre-jour":
      return "bg-q-streak/20";
    case "booster-xp":
      return "bg-q-xp/20";
    case "bouclier-ligue":
      return "bg-q-level/20";
    case "gel-serie":
      return "bg-q-quest/25";
    case "recharge-coeurs":
      return "bg-q-heart/20";
    case "cadre-laurier":
      return "bg-q-xp/15";
    case "cadre-or":
      return "bg-q-streak/20";
    default:
      return "bg-q-shop/15";
  }
}

function dessin(id: string) {
  if (id === "cadre-laurier") {
    return <Anneau classe="stroke-q-xp" />;
  }
  if (id === "cadre-or") {
    return <Anneau classe="stroke-q-streak" />;
  }
  if (id === "cadre-ardoise") {
    return <Anneau classe="stroke-q-level" />;
  }
  if (id === "cadre-diamant") {
    return <Anneau classe="stroke-cyan-400" />;
  }
  if (id === "cadre-amethyste") {
    return <Anneau classe="stroke-purple-500" />;
  }
  if (id === "recharge-coeurs") {
    return (
      <svg aria-hidden className="size-16 text-q-heart" viewBox="0 0 64 64">
        <path
          d="M32 52s-16-9.6-16-20a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 10.4-16 20-16 20z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "gel-serie") {
    return (
      <svg aria-hidden className="size-16 text-q-quest" viewBox="0 0 64 64">
        <path
          d="M22 10h20v8l-6 8 6 8v20H22V34l6-8-6-8z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M26 40h12" stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (id === "booster-xp") {
    return (
      <svg aria-hidden className="size-16 text-q-xp" viewBox="0 0 64 64">
        <path d="M34 8 18 36h12l-2 20 18-30H34z" fill="currentColor" />
      </svg>
    );
  }
  if (id === "bouclier-ligue") {
    return (
      <svg aria-hidden className="size-16 text-q-level" viewBox="0 0 64 64">
        <path
          d="M32 8 52 16v16c0 12-8 20-20 24C20 52 12 44 12 32V16z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "offre-jour") {
    return (
      <svg aria-hidden className="size-16 text-q-streak" viewBox="0 0 64 64">
        <circle cx="32" cy="32" fill="currentColor" r="10" />
        <g stroke="currentColor" strokeLinecap="round" strokeWidth="3">
          <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14 14l6 6M44 44l6 6M50 14l-6 6M20 44l-6 6" />
        </g>
      </svg>
    );
  }
  return (
    <svg aria-hidden className="size-16 text-q-gem" viewBox="0 0 64 64">
      <path d="M32 8 52 24 32 56 12 24z" fill="currentColor" />
    </svg>
  );
}
