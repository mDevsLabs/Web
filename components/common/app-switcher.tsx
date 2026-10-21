"use client";

import { ChevronDownIcon, LockIcon } from "@mdevs/icons";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { AppMenuItems } from "@/components/common/app-menu-items";
import { useOptionalAuth } from "@/components/site/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";
import type { AppKey } from "@/lib/apps/catalog";
import { appKeyFromPath } from "@/lib/apps/catalog";
import { readAuthentication } from "@/lib/client/authentication";
import { cn } from "@/lib/utils";

interface AppSwitcherProps {
  align?: "start" | "center" | "end";
  children?: React.ReactNode;
  className?: string;
  /**
   * Application considérée comme courante. `null` = aucune : le menu sert de
   * portail vers les autres espaces (cas de /wakies, qui n'appartient pas au
   * catalogue) et TOUTES les entrées restent cliquables, y compris mAI.
   */
  currentAppOverride?: AppKey | null;
  isAuthenticated?: boolean;
  side?: "top" | "bottom" | "left" | "right";
}

export function AppSwitcherMenu({
  children,
  align = "start",
  side = "bottom",
  className,
  currentAppOverride,
  isAuthenticated,
}: AppSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDesktop, openCoder } = useIsDesktopApp();
  const currentApp =
    currentAppOverride === undefined
      ? appKeyFromPath(pathname)
      : currentAppOverride;

  // Le cookie mAI est HttpOnly : document.cookie ne peut pas indiquer la connexion.
  const siteAuth = useOptionalAuth();
  const { data: verifiedAuthentication } = useSWR(
    isAuthenticated === undefined
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/me`
      : null,
    readAuthentication,
    { dedupingInterval: 15_000, revalidateOnFocus: true }
  );
  const isAuthed =
    isAuthenticated ??
    verifiedAuthentication ??
    (siteAuth?.isAuthenticated ? true : undefined);

  let resetChat: (() => void) | undefined;
  try {
    // Peut être appelé hors du DataStreamProvider/ActiveChatProvider (ex: sur /site)
    // donc repli sécurisé
    const activeChat = useActiveChat();
    resetChat = activeChat.resetChat;
  } catch {
    resetChat = undefined;
  }

  const handleAppSelect = useCallback(
    (key: AppKey, path: string) => {
      // Même application : pas de navigation superflue
      if (key === currentApp) {
        return;
      }

      // VÉRIFICATION OBLIGATOIRE : Bloquer si non connecté à un compte mAI
      if (key !== "site" && isAuthed !== true) {
        if (isAuthed === undefined) {
          toast.info(
            "La connexion est en cours de vérification. Réessayez dans un instant."
          );
          return;
        }
        toast.error(
          "Veuillez vous connecter à votre compte mAI pour accéder aux autres applications.",
          {
            action: {
              label: "Connexion",
              onClick: () => router.push("/login"),
            },
            duration: 5000,
          }
        );
        return;
      }

      if (key === "code") {
        if (!isDesktop) {
          toast.error(
            "mAI Coder nécessite l'application de bureau mAI. Téléchargez l'application de bureau pour y accéder.",
            {
              action: {
                label: "Télécharger",
                onClick: () =>
                  window.open(
                    "https://github.com/mDevsLabs/Web/releases/latest",
                    "_blank"
                  ),
              },
              duration: 5000,
            }
          );
          return;
        }
        void openCoder().then((result) => {
          if (!result.success)
            toast.error(result.error || "Impossible de lancer Coder");
        });
        router.push("/coder");
        return;
      }

      if (path === "/") {
        resetChat?.();
        router.push("/");
        return;
      }

      router.push(path);
    },
    [currentApp, isAuthed, isDesktop, openCoder, resetChat, router]
  );

  const handleOpenCli = useCallback(async () => {
    // VÉRIFICATION OBLIGATOIRE : Bloquer si non connecté à un compte mAI
    if (isAuthed !== true) {
      if (isAuthed === undefined) {
        toast.info(
          "La connexion est en cours de vérification. Réessayez dans un instant."
        );
        return;
      }
      toast.error(
        "Veuillez vous connecter à votre compte mAI pour accéder au CLI.",
        {
          action: {
            label: "Connexion",
            onClick: () => router.push("/login"),
          },
          duration: 5000,
        }
      );
      return;
    }

    if (!isDesktop) {
      toast.error(
        "Le CLI mAI nécessite l'application de bureau mAI. Téléchargez l'application de bureau pour y accéder.",
        {
          action: {
            label: "Télécharger",
            onClick: () => router.push("/downloads"),
          },
          duration: 5000,
        }
      );
      return;
    }

    try {
      const result = await window.maiDesktop?.openCli?.();
      if (!result?.success) {
        toast.error(
          result?.error || "Mettez à jour mAI Bureau pour ouvrir le CLI."
        );
      }
    } catch {
      toast.error("Impossible d'ouvrir le terminal CLI.");
    }
  }, [isAuthed, isDesktop, router]);

  return (
    <DropdownMenu>
      {children ? (
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors",
              className
            )}
            title="Changer d'application"
            type="button"
          >
            <span>Applications mAI</span>
            <ChevronDownIcon className="size-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={align}
        className="w-68 p-1.5 shadow-xl border border-border/80 bg-popover text-popover-foreground z-50 rounded-xl"
        side={side}
      >
        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Applications mAI</span>
          {isAuthed === false && (
            <span className="flex items-center gap-1 text-[10px] text-warning font-medium lowercase">
              <LockIcon className="size-2.5" />
              Connexion requise
            </span>
          )}
        </div>

        {isAuthed === false && (
          <div className="mx-1 mb-1.5 rounded-lg border border-warning/30 bg-warning/10 p-2 text-[11px] leading-snug text-warning">
            Connectez-vous à votre compte mAI pour basculer vers les autres
            applications.
          </div>
        )}

        {/*
          Les entrées sont rendues par le module partagé : l'ordre du menu
          (mAI, Site, Vibe, Coder, CLI, Blackline) n'existe qu'à un seul
          endroit, et les trois rendus du menu ne peuvent plus diverger.
        */}
        <AppMenuItems
          currentApp={currentApp}
          isAuthenticated={isAuthed}
          isDesktop={isDesktop}
          onOpenCli={() => {
            void handleOpenCli();
          }}
          onSelectApp={(key, path) => {
            handleAppSelect(key, path);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
