"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  Code2Icon,
  GlobeIcon,
  LockIcon,
  MessageCircleIcon,
  TerminalIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useOptionalAuth } from "@/components/site/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useFavoriteApp } from "@/hooks/use-favorite-app";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";
import type { AppKey } from "@/lib/apps/catalog";
import { APP_ORDER, appKeyFromPath } from "@/lib/apps/catalog";
import { cn } from "@/lib/utils";

function VibeGlyph({ className }: { className?: string }) {
  return (
    <Image
      alt="Vibe"
      className={cn("size-4 rounded-sm object-contain dark:invert", className)}
      height={16}
      src="/vibe/logo.PNG"
      unoptimized
      width={16}
    />
  );
}

export const APP_SWITCHER_ICONS: Record<
  AppKey,
  React.ComponentType<{ className?: string }>
> = {
  code: Code2Icon,
  mai: MessageCircleIcon,
  site: GlobeIcon,
  vibe: VibeGlyph,
};

interface AppSwitcherProps {
  align?: "start" | "center" | "end";
  children?: React.ReactNode;
  className?: string;
  isAuthenticated?: boolean;
  side?: "top" | "bottom" | "left" | "right";
}

export function AppSwitcherMenu({
  children,
  align = "start",
  side = "bottom",
  className,
  isAuthenticated,
}: AppSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDesktop } = useIsDesktopApp();
  const { favorite } = useFavoriteApp();
  const currentApp = appKeyFromPath(pathname);

  // Authentification : prop explicite, ou contexte du site, ou présence de session client
  const siteAuth = useOptionalAuth();
  const [hasCookieSession, setHasCookieSession] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return Boolean(
      document.cookie.includes("mai_session_token=") ||
        document.cookie.includes("mai_user=") ||
        localStorage.getItem("mai_auth")
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const authed = Boolean(
      document.cookie.includes("mai_session_token=") ||
        document.cookie.includes("mai_user=") ||
        localStorage.getItem("mai_auth")
    );
    setHasCookieSession(authed);
  }, []);

  const isAuthed =
    isAuthenticated === undefined
      ? siteAuth === null
        ? hasCookieSession
        : siteAuth.isAuthenticated
      : isAuthenticated;

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
      if (!isAuthed) {
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
        if (typeof window !== "undefined" && window.maiDesktop?.openCoder) {
          window.maiDesktop.openCoder().catch(() => {});
        }
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
    [currentApp, isAuthed, isDesktop, resetChat, router]
  );

  const handleOpenCli = useCallback(async () => {
    // VÉRIFICATION OBLIGATOIRE : Bloquer si non connecté à un compte mAI
    if (!isAuthed) {
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
          {!isAuthed && (
            <span className="flex items-center gap-1 text-[10px] text-warning font-medium lowercase">
              <LockIcon className="size-2.5" />
              Connexion requise
            </span>
          )}
        </div>

        {!isAuthed && (
          <div className="mx-1 mb-1.5 rounded-lg border border-warning/30 bg-warning/10 p-2 text-[11px] leading-snug text-warning">
            Connectez-vous à votre compte mAI pour basculer vers les autres
            applications.
          </div>
        )}

        {APP_ORDER.map((entry) => {
          const isCurrent = currentApp === entry.key;
          const isFavorite = favorite === entry.key;
          const AppGlyph = APP_SWITCHER_ICONS[entry.key];
          const isCodeDisabled = entry.key === "code" && !isDesktop;
          const isLocked = !isAuthed && !isCurrent;

          return (
            <DropdownMenuItem
              asChild
              className={cn(
                "cursor-pointer rounded-lg",
                (isCodeDisabled || isLocked) && "opacity-60"
              )}
              key={entry.key}
              onSelect={() => handleAppSelect(entry.key, entry.path)}
            >
              <div className="flex items-start gap-2.5 px-2 py-2">
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
                {!isCurrent && isFavorite && (
                  <CheckIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}

        {/* Option CLI toujours présente */}
        <DropdownMenuItem
          asChild
          className={cn(
            "cursor-pointer rounded-lg",
            (!isDesktop || !isAuthed) && "opacity-60"
          )}
          onSelect={() => {
            void handleOpenCli();
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
                {!isAuthed && (
                  <LockIcon className="ml-auto size-3 text-warning" />
                )}
              </div>
              <span className="text-[11px] leading-snug text-muted-foreground">
                mAI dans un terminal local
              </span>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
