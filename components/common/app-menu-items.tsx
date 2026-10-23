"use client";

/**
 * Liste des entrées du menu des applications — source unique du rendu.
 *
 * Le menu des applications était rendu à trois endroits (le sélecteur
 * commun, le logo de la barre latérale et le nom « mAI »), chacun avec sa
 * propre copie de la liste : une entrée ajoutée à un endroit manquait aux
 * autres, et l'ordre pouvait diverger sans que rien ne le signale.
 *
 * Ce module dessine les ENTRÉES ; chaque hôte garde la main sur son
 * déclencheur, son en-tête et ses propres règles d'accès. L'ordre, lui, vient
 * de `APP_MENU_ORDER` — une seule source, donc un seul ordre vrai.
 */

import {
  CheckIcon,
  Code2Icon,
  CrosshairIcon,
  GlobeIcon,
  LockIcon,
  MessageCircleIcon,
  TerminalIcon,
} from "@mdevs/icons";
import Image from "next/image";
import type React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { AppKey } from "@/lib/apps/catalog";
import { APP_MENU_ORDER } from "@/lib/apps/catalog";
import { cn } from "@/lib/utils";

function VibeGlyph({ className }: { className?: string }) {
  return (
    <Image
      alt="Vibe"
      className={cn("size-4 rounded-sm object-contain dark:invert", className)}
      height={16}
      src="/vibe/logo.png"
      unoptimized
      width={16}
    />
  );
}

/** Glyphe de chaque application. */
export const APP_MENU_ICONS: Record<
  AppKey,
  React.ComponentType<{ className?: string }>
> = {
  blackline: CrosshairIcon,
  cli: TerminalIcon,
  code: Code2Icon,
  mai: MessageCircleIcon,
  site: GlobeIcon,
  vibe: VibeGlyph,
};

export type AppMenuItemsProps = {
  /**
   * Application courante. `null` = aucune : toutes les entrées restent
   * cliquables (cas de /wakies, qui n'appartient pas au catalogue).
   */
  currentApp: AppKey | null;
  /** L'application de bureau est-elle disponible ? */
  isDesktop: boolean;
  /**
   * État d'authentification.
   *
   * `undefined` = inconnu (vérification en cours, ou session morte en cours
   * de reprise) : aucun cadenas n'est affiché, parce qu'on ne sait pas encore
   * si l'accès est possible.
   */
  isAuthenticated?: boolean;
  /** Ouvre le terminal local. */
  onOpenCli: () => void;
  /** Bascule vers une application. */
  onSelectApp: (key: AppKey, path: string) => void;
};

export function AppMenuItems({
  currentApp,
  isDesktop,
  isAuthenticated,
  onOpenCli,
  onSelectApp,
}: AppMenuItemsProps) {
  return (
    <>
      {APP_MENU_ORDER.map((item) => {
        // Le CLI est une entrée de menu, pas une application web : il ouvre
        // le terminal local de l'application de bureau.
        if (item.kind === "cli") {
          return (
            <DropdownMenuItem
              asChild
              className={cn(
                "cursor-pointer rounded-lg",
                (!isDesktop || isAuthenticated === false) && "opacity-60"
              )}
              key="cli"
              onSelect={() => {
                onOpenCli();
              }}
            >
              <div className="flex items-start gap-2.5 px-2 py-2">
                <TerminalIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-sidebar-foreground/90">
                      CLI
                    </span>
                    {!isDesktop && (
                      <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-muted-foreground">
                        Bureau
                      </span>
                    )}
                    {isAuthenticated === false && (
                      <LockIcon className="ml-auto size-3 text-warning" />
                    )}
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    mAI dans un terminal local
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          );
        }

        const entry = item.entry;
        const isCurrent = currentApp === entry.key;
        const AppGlyph = APP_MENU_ICONS[entry.key];
        const isCodeDisabled = entry.key === "code" && !isDesktop;
        // Le Site reste accessible sans compte : c'est la vitrine de mAI.
        const isLocked =
          isAuthenticated === false && !isCurrent && entry.key !== "site";

        return (
          <DropdownMenuItem
            asChild
            className={cn(
              "cursor-pointer rounded-lg",
              (isCodeDisabled || isLocked) && "opacity-60"
            )}
            key={entry.key}
            onSelect={() => onSelectApp(entry.key, entry.path)}
          >
            <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg">
              <AppGlyph
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[13px] font-semibold",
                      isCurrent
                        ? "text-foreground"
                        : "text-sidebar-foreground/90"
                    )}
                  >
                    {entry.label}
                  </span>
                  {isCodeDisabled && (
                    <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-muted-foreground">
                      Bureau
                    </span>
                  )}
                  {isLocked && (
                    <LockIcon className="ml-auto size-3 text-warning" />
                  )}
                </div>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {entry.description}
                </span>
              </div>
              {isCurrent && (
                <CheckIcon className="mt-1 size-3.5 shrink-0 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
