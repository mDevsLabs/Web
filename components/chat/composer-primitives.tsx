"use client";

import { ArrowUpIcon, Loader2Icon, SquareIcon, XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Primitive de présentation partagées par les deux barres de message (Chat et
// Agent). Objectif : un seul « langage visuel » — conteneur, bordure, rayon,
// ombres, états focus/disabled/loading — sans fusionner les deux composants :
// chaque composer garde ses capacités propres (mentions, slash, chips, Skills,
// dictée, quota côté Chat ; options, outils, réflexion côté Agent).
//
// Le shell du Chat est produit par PromptInput > InputGroup : il ne peut pas
// recevoir directement le composant ComposerShell (le textarea du Chat porte
// des classes calées sur l'overlay de surlignage des mentions). Pour garder une
// source unique, la classe canonique est définie une fois ici et déclinée en
// version « enfant » ([&>div]:…) pour ce cas précis.

// Jetons canoniques du conteneur : arrondi généreux, fond carte translucide,
// ombres pilotées par les variables --shadow-composer / --shadow-composer-focus
// (thème clair et sombre définis dans app/globals.css).
const COMPOSER_SHELL_TOKENS = [
  "rounded-[28px]",
  "border",
  "border-border/40",
  "bg-card/85",
  "backdrop-blur-xl",
  "shadow-[var(--shadow-composer)]",
  "transition-all",
  "duration-200",
  "focus-within:border-border/70",
  "focus-within:shadow-[var(--shadow-composer-focus)]",
] as const;

export const composerShellClass = COMPOSER_SHELL_TOKENS.join(" ");

export const composerShellChildClass = COMPOSER_SHELL_TOKENS.map(
  (token) => `[&>div]:${token}`
).join(" ");

// Conteneur du composer : à utiliser tel quel par les composers « simples »
// (Agent). L'espacement interne (padding) reste du ressort du compositeur.
export function ComposerShell({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(composerShellClass, className)} {...props} />;
}

// Textarea canonique : mêmes métriques verticales que le Chat (l'Agent adopte
// ce gabarit) ; les composers qui superposent un calque au texte (surlignage
// des mentions côté Chat) conservent leurs classes exactes pour rester alignés
// au pixel.
export const composerTextareaClass =
  "min-h-[52px] w-full resize-none bg-transparent px-4 pb-1.5 pt-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60";

// Rangée d'actions : outils à gauche, actions à droite.
export const composerActionsRowClass =
  "flex items-center justify-between gap-2 px-1";

// Bouton d'envoi/arrêt canonique. Deux états exclusifs :
// - running + onStop : bouton d'arrêt (carré plein) ;
// - sinon : bouton d'envoi fléché, désactivé sans contenu, en échec (croix) ou
//   en chargement (téléversement en cours).
// `type="submit"` permet aux composers pilotés par un formulaire (Chat) de
// déclencher la soumission native ; les autres passent onSend.
export function ComposerSendButton({
  canSend,
  disabled = false,
  error = false,
  loading = false,
  onSend,
  onStop,
  quotaExhausted = false,
  running = false,
  sendLabel,
  sendTestId,
  sendTitle,
  stopLabel,
  stopTestId,
  stopTitle,
  type = "button",
}: {
  canSend: boolean;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  onSend?: () => void;
  onStop?: () => void;
  quotaExhausted?: boolean;
  running?: boolean;
  sendLabel: string;
  sendTestId?: string;
  sendTitle?: string;
  stopLabel: string;
  stopTestId?: string;
  stopTitle?: string;
  type?: "button" | "submit";
}) {
  if (running && onStop) {
    return (
      <button
        aria-label={stopLabel}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-all duration-200 hover:opacity-85 active:scale-95 sm:h-8 sm:w-8"
        data-testid={stopTestId}
        onClick={onStop}
        title={stopTitle}
        type="button"
      >
        <SquareIcon className="size-4 fill-current" />
      </button>
    );
  }

  const isDisabled = disabled || !canSend || quotaExhausted;

  return (
    <button
      aria-label={sendLabel}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 sm:h-8 sm:w-8",
        isDisabled
          ? quotaExhausted
            ? "cursor-not-allowed bg-destructive/20 text-destructive opacity-70"
            : "cursor-not-allowed bg-muted text-muted-foreground/25"
          : "cursor-pointer bg-foreground text-background hover:opacity-85 active:scale-95"
      )}
      data-testid={sendTestId}
      disabled={isDisabled}
      onClick={type === "button" ? onSend : undefined}
      title={sendTitle}
      type={type}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : error ? (
        <XIcon className="size-4" />
      ) : (
        <ArrowUpIcon className="size-4" />
      )}
    </button>
  );
}

// Rangée d'outils du pied de composer (version composant, pour les composers
// qui ne passent pas par PromptInput). Les enfants restent libres : chaque
// composer garde ses boutons et menus propres.
export function ComposerActionsRow({
  children,
  className,
  ...props
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn(composerActionsRowClass, className)} {...props}>
      {children}
    </div>
  );
}
