"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback } from "react";
import { cn } from "@/lib/utils";

type PageBackButtonProps = Omit<ComponentProps<"button">, "children"> & {
  fallbackHref?: string;
  label?: string;
};

// Bouton retour intelligent : revient à la page précédente si un historique
// applicatif existe, sinon redirige vers fallbackHref (accueil par défaut).
export function PageBackButton({
  className,
  fallbackHref = "/",
  label = "Retour",
  onClick,
  ...props
}: PageBackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      const historyState = window.history.state as { idx?: number } | undefined;
      if (typeof historyState?.idx === "number" && historyState.idx > 0) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    },
    [fallbackHref, onClick, router]
  );

  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/60 text-muted-foreground backdrop-blur-sm transition hover:bg-muted/60 hover:text-foreground active:scale-95",
        className
      )}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <ArrowLeftIcon className="size-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
