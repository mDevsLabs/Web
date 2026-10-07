"use client";

import {
  ArchiveIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronDownIcon,
  Code2Icon,
  FolderKanbanIcon,
  GlobeIcon,
  ImageIcon,
  LibraryIcon,
  LockIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PenSquareIcon,
  PlusIcon,
  PuzzleIcon,
  SearchIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
  SparklesIcon,
  TerminalIcon,
  TrashIcon,
  UsersIcon,
  Volume2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createElement, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { BotGlyph } from "@/components/agents/bot-avatar";
import { ProjectIcon } from "@/components/chat/project-icon";
import { SearchDialog } from "@/components/chat/search-dialog";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useFavoriteApp } from "@/hooks/use-favorite-app";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";
import { useProjects } from "@/hooks/use-projects";
import { useTier } from "@/hooks/use-tier";
import type { AppKey } from "@/lib/apps/catalog";
import { APP_ORDER, appKeyFromPath } from "@/lib/apps/catalog";
import type { MaiUser } from "@/lib/auth/session";
import { pagePath } from "@/lib/client/api-endpoints";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function VibeSidebarIcon({ className }: { className?: string }) {
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

// Icônes du sélecteur d'applications du logo.
const APP_ICONS: Record<AppKey, React.ComponentType<{ className?: string }>> = {
  code: Code2Icon,
  mai: MessageCircleIcon,
  site: GlobeIcon,
  vibe: VibeSidebarIcon,
};

function SidebarProjects() {
  const { projects: allProjects, isLoading } = useProjects();
  const projects = allProjects.slice(0, 6);

  if (isLoading) {
    return (
      <SidebarGroup className="py-1">
        <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Dossiers</span>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/projects"
          >
            <PlusIcon className="size-3.5" />
          </Link>
        </div>
        <div className="flex flex-col gap-1 px-2 py-1">
          <div className="h-6 w-full animate-pulse rounded bg-sidebar-foreground/[0.06]" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-sidebar-foreground/[0.06]" />
        </div>
      </SidebarGroup>
    );
  }

  if (projects.length === 0) {
    return (
      <SidebarGroup className="py-1">
        <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Dossiers</span>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/projects"
          >
            <PlusIcon className="size-3.5" />
          </Link>
        </div>
      </SidebarGroup>
    );
  }
  return (
    <SidebarGroup className="py-1">
      <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Dossiers</span>
        <Link
          className="text-muted-foreground hover:text-foreground"
          href="/projects"
        >
          <PlusIcon className="size-3.5" />
        </Link>
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((p) => (
            <SidebarMenuItem key={p.id}>
              <SidebarMenuButton
                asChild
                className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                tooltip={`${p.name} (${p.chatCount ?? 0})`}
              >
                <Link href={`/projects/${p.id}`}>
                  <ProjectIcon
                    className="size-3.5 shrink-0"
                    name={p.icon}
                    style={{ color: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {p.chatCount ?? 0}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-7 rounded-lg text-[12px] text-muted-foreground hover:text-foreground"
            >
              <Link
                className="flex items-center gap-1.5 justify-between"
                href="/projects"
              >
                <span>Tous les dossiers</span>
                <ArrowRightIcon className="size-3" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function LockedSidebarNavItem({
  closeMobile,
  href,
  icon,
  label,
  onLockedClick,
  tooltip,
}: {
  closeMobile: () => void;
  href: string;
  /**
   * Un composant d'icône Lucide, ou n'importe quel nœud : certaines entrées
   * portent une marque en image plutôt qu'un glyphe.
   */
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  label: string;
  onLockedClick: () => void;
  tooltip: string;
}) {
  const pathname = usePathname();
  const { isPaid } = useTier();
  const isActive = pathname?.startsWith(href);
  const locked = !isPaid;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (locked) {
        e.preventDefault();
        e.stopPropagation();
        closeMobile();
        onLockedClick();
        toast.info(
          `« ${label} » est réservé aux forfaits Plus, Pro et Max. Mettez à niveau votre compte pour y accéder.`,
          {
            description:
              "Bouton d'upgrade disponible dans la fenêtre qui s'ouvre.",
            duration: 5000,
          }
        );
      } else {
        closeMobile();
      }
    },
    [closeMobile, label, locked, onLockedClick]
  );

  return (
    <SidebarMenuButton
      asChild
      className={cn(
        "h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        isActive && "bg-sidebar-accent font-semibold text-sidebar-foreground",
        locked && "opacity-55 cursor-not-allowed"
      )}
      tooltip={tooltip}
    >
      <Link
        aria-disabled={locked}
        href={locked ? "#" : href}
        onClick={handleClick}
        tabIndex={locked ? -1 : 0}
      >
        {typeof icon === "function"
          ? createElement(icon as React.ComponentType<{ className?: string }>, {
              className: cn("size-4", isActive && "text-primary"),
            })
          : icon}
        <span>{label}</span>
        {locked && <LockIcon className="ml-auto size-3 text-warning" />}
      </Link>
    </SidebarMenuButton>
  );
}

function SidebarNavCollapsible({
  children,
  dropdownItems,
  icon: Icon,
  isActive = false,
  isOpen = false,
  label,
  onOpenChange,
  tooltip,
}: {
  children: React.ReactNode;
  dropdownItems?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  isOpen?: boolean;
  label: string;
  onOpenChange?: (open: boolean) => void;
  tooltip: string;
}) {
  const { state, isMobile } = useSidebar();
  const isIconMode = state === "collapsed" && !isMobile;

  if (isIconMode) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground",
                isActive && "text-sidebar-foreground font-medium"
              )}
              tooltip={tooltip}
            >
              <Icon className={cn("size-4", isActive && "text-primary")} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-52 p-1.5 shadow-xl border border-sidebar-border bg-sidebar"
            side="right"
          >
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <DropdownMenuSeparator />
            {dropdownItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      className="group/collapsible"
      onOpenChange={onOpenChange}
      open={isOpen}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full justify-between",
              isActive &&
                "font-medium text-sidebar-foreground bg-sidebar-accent/30"
            )}
            tooltip={tooltip}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("size-4", isActive && "text-primary")} />
              <span>{label}</span>
            </div>
            <ChevronDownIcon className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 text-sidebar-foreground/50" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub className="mx-3 flex min-w-0 flex-col gap-1 border-l border-sidebar-border px-2 py-1 my-0.5">
            {children}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  hasDeadSession,
  user,
}: {
  hasDeadSession?: boolean;
  user?: MaiUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const [upgradeFeature, setUpgradeFeature] = useState<
    "skills" | "mcp" | "agents" | "wakies" | null
  >(null);

  const { isDesktop } = useIsDesktopApp();
  type NavMenuKey = "plus";
  const [openMenu, setOpenMenu] = useState<NavMenuKey | null>(null);

  const isCreationActive = Boolean(
    pathname?.startsWith("/creation") ||
      pathname?.startsWith("/images") ||
      pathname?.startsWith("/audio")
  );
  const isToolsActive = Boolean(
    pathname?.startsWith("/tools") ||
      pathname?.startsWith("/skills") ||
      pathname?.startsWith("/mcp")
  );
  // « Plus » regroupe Paramètres, Messages archivés et Planification.
  const isPlusActive = Boolean(
    pathname?.startsWith("/settings") ||
      pathname?.startsWith("/archived") ||
      pathname?.startsWith("/planning")
  );
  const isLibraryActive = pathname?.startsWith("/library");

  const { resetChat } = useActiveChat();

  const handleNavClick = useCallback(() => {
    setOpenMobile(false);
    setOpenMenu(null);
  }, [setOpenMobile]);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  useEffect(() => {
    setOpenMobile(false);
    setOpenMenu(null);
  }, [setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleGoHome = useCallback(() => {
    handleNavClick();
    resetChat();
    router.push("/");
  }, [handleNavClick, resetChat, router]);

  // Sélecteur d'application du logo (mAI / Site / Vibe / Code). Le favori est
  // coché en plus de l'application courante : c'est l'écran ouvert après
  // connexion, l'utilisateur doit pouvoir le reconnaître d'un coup d'œil.
  const { favorite } = useFavoriteApp();
  const currentApp = appKeyFromPath(pathname);

  const isUserLoggedIn = Boolean(user && !hasDeadSession);

  const handleAppSelect = useCallback(
    (path: string) => {
      handleNavClick();

      // Bloquer le changement d'application si non connecté à son compte mAI
      if (!isUserLoggedIn) {
        toast.error(
          "Veuillez vous connecter à votre compte mAI pour changer d'application.",
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

      if (path === "/coder") {
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
        // Coder : redirection vers son espace, avec déclenchement de la fenêtre native si disponible
        if (typeof window !== "undefined" && window.maiDesktop?.openCoder) {
          window.maiDesktop.openCoder().catch(() => {});
        }
        router.push("/coder");
        return;
      }
      if (path !== "/") {
        router.push(path);
        return;
      }
      // Retour à mAI (Web classique) : purge du brouillon et de la conversation active
      resetChat();
      router.push("/");
    },
    [handleNavClick, isDesktop, isUserLoggedIn, resetChat, router]
  );

  const handleOpenCli = useCallback(async () => {
    handleNavClick();

    // Bloquer le CLI si non connecté à son compte mAI
    if (!isUserLoggedIn) {
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
  }, [handleNavClick, isDesktop, isUserLoggedIn, router]);

  const handleNewChat = useCallback(() => {
    handleNavClick();
    resetChat();
    router.push("/");
  }, [handleNavClick, resetChat, router]);

  // La page de recherche est un ÉCRAN, pas une modale : on referme la barre
  // mobile puis on navigue. La modale de recherche rapide (⌘K, `/search`,
  // bouton d'attache du compositeur) reste en place pour qui la demande
  // explicitement.
  const handleOpenSearch = useCallback(() => {
    handleNavClick();
    router.push(pagePath("/recherche"));
  }, [handleNavClick, router]);

  // La navigation du site remplace cette barre, mais tous les hooks doivent
  // rester appelés lors des allers-retours entre le chat et /site.
  if (pathname?.startsWith("/site")) {
    return null;
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                {/* Le logo ouvre le sélecteur d'applications (mAI, Site, Vibe,
                    Code) : c'est le point d'entrée transverse de la suite, pas
                    un raccourci vers l'accueil. Le DropdownMenu enveloppe le
                    SidebarMenuButton (et non l'inverse) : asChild propage la
                    ref et les props Radix sur le bouton réel. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                      data-testid="app-switcher"
                      tooltip="Applications mAI"
                    >
                      <Image
                        alt="mAI"
                        className="rounded-md"
                        height={22}
                        src="/logo.png"
                        width={22}
                      />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-64 p-1.5 shadow-xl border border-sidebar-border bg-sidebar"
                    side="bottom"
                  >
                    {APP_ORDER.map((entry) => {
                      const isCurrent = currentApp === entry.key;
                      const isFavorite = favorite === entry.key;
                      const AppGlyph = APP_ICONS[entry.key];
                      const isCodeDisabled = entry.key === "code" && !isDesktop;
                      return (
                        <DropdownMenuItem
                          asChild
                          className={cn(
                            "cursor-pointer",
                            isCodeDisabled && "opacity-55"
                          )}
                          key={entry.key}
                          onSelect={() => handleAppSelect(entry.path)}
                        >
                          <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg">
                            <AppGlyph
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                isCurrent
                                  ? "text-primary"
                                  : "text-muted-foreground"
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
                              </div>
                              <span className="text-[11px] leading-snug text-muted-foreground">
                                {entry.description}
                              </span>
                            </div>
                            {(isCurrent || isFavorite) && (
                              <CheckIcon
                                className={cn(
                                  "mt-1 size-3.5 shrink-0",
                                  isCurrent
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuItem
                      className={cn(
                        "cursor-pointer",
                        !isDesktop && "opacity-55"
                      )}
                      onSelect={() => {
                        void handleOpenCli();
                      }}
                    >
                      <TerminalIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[13px]">CLI</span>
                          {!isDesktop && (
                            <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-muted-foreground">
                              Bureau
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          mAI dans un terminal local
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={handleToggleSidebar}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    Ouvrir la barre latérale
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Le nom « mAI ⌄ » ouvre le même sélecteur : un clic sur la
                  marque ne doit pas surprendre en changeant de page, il
                  présente le choix (parcours type ChatGPT/Codex). */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="group-data-[collapsible=icon]:hidden flex items-center gap-1.5 cursor-pointer text-left focus:outline-hidden"
                    title="Choisir l'application mAI"
                    type="button"
                  >
                    <span className="font-bold text-sm tracking-tight text-foreground hover:text-primary transition-colors">
                      mAI
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors">
                      Web
                    </span>
                    <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-64 p-1.5 shadow-xl border border-sidebar-border bg-sidebar"
                >
                  {APP_ORDER.map((entry) => {
                    const isCurrent = currentApp === entry.key;
                    const isFavorite = favorite === entry.key;
                    const AppGlyph = APP_ICONS[entry.key];
                    const isCodeDisabled = entry.key === "code" && !isDesktop;
                    return (
                      <DropdownMenuItem
                        asChild
                        className={cn(
                          "cursor-pointer",
                          isCodeDisabled && "opacity-55"
                        )}
                        key={entry.key}
                        onSelect={() => handleAppSelect(entry.path)}
                      >
                        <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg">
                          <AppGlyph
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              isCurrent
                                ? "text-primary"
                                : "text-muted-foreground"
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
                            </div>
                            <span className="text-[11px] leading-snug text-muted-foreground">
                              {entry.description}
                            </span>
                          </div>
                          {(isCurrent || isFavorite) && (
                            <CheckIcon
                              className={cn(
                                "mt-1 size-3.5 shrink-0",
                                isCurrent
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem
                    className={cn("cursor-pointer", !isDesktop && "opacity-55")}
                    onSelect={() => {
                      void handleOpenCli();
                    }}
                  >
                    <TerminalIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[13px]">CLI</span>
                        {!isDesktop && (
                          <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-muted-foreground">
                            Bureau
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        mAI dans un terminal local
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* La recherche est une PAGE, pas une modale : l'icône tient à
                  côté du bouton de rétractation, hors de la liste de navigation.
                  En mode icône, la cellule du logo redevient ce bouton — l'icône
                  de recherche disparaît donc avec le reste de l'en-tête. */}
              <div className="group-data-[collapsible=icon]:hidden flex items-center">
                <Button
                  aria-label="Rechercher"
                  className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground"
                  onClick={handleOpenSearch}
                  size="icon-sm"
                  title="Rechercher dans tout le compte"
                  variant="ghost"
                >
                  <SearchIcon />
                </Button>
                <SidebarTrigger className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SearchDialog />
        <SidebarContent>
          <SidebarGroup className="pt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/80 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    data-onboarding="new-chat"
                    onClick={handleNewChat}
                    tooltip="Nouvelle discussion"
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">Nouvelle discussion</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 1. Projets : avant la Bibliothèque (ordre produit validé). */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Projets"
                  >
                    <Link
                      data-onboarding="nav-projects"
                      href="/projects"
                      onClick={handleNavClick}
                    >
                      <FolderKanbanIcon className="size-4" />
                      <span>Projets</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 2. Wakies : l'espace Wakies (agents coworkers persistants,
                    espaces de pages, tâches planifiées). Réservé aux forfaits payants
                    (Plus, Pro, Max), bloqué avec cadenas pour Free comme les Bots. */}
                <SidebarMenuItem>
                  <LockedSidebarNavItem
                    closeMobile={handleNavClick}
                    href="/wakies"
                    icon={
                      <Image
                        alt="Wakies"
                        className="size-4 rounded-sm object-contain dark:invert"
                        height={16}
                        src="/wakies/logo.png"
                        unoptimized
                        width={16}
                      />
                    }
                    label="Wakies"
                    onLockedClick={() => setUpgradeFeature("wakies")}
                    tooltip="Wakies"
                  />
                </SidebarMenuItem>

                {/* 3. Bibliothèque : le stockage central des fichiers et
                    contenus générés (ex « Stockage »). */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Bibliothèque"
                  >
                    <Link
                      data-onboarding="nav-library"
                      href="/library"
                      onClick={handleNavClick}
                    >
                      <LibraryIcon className="size-4" />
                      <span>Bibliothèque</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Une seule entrée : le mode initial vient des paramètres. */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isCreationActive}
                    tooltip="Création"
                  >
                    <Link
                      data-onboarding="nav-images"
                      href="/creation"
                      onClick={handleNavClick}
                    >
                      <SparklesIcon className="size-4" />
                      <span>Création</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 2. Bots — réservés aux forfaits payants — avant
                    Applications (ordre produit validé). La clé de montée en
                    niveau reste « agents » : elle est technique, pas affichée. */}
                <SidebarMenuItem>
                  <LockedSidebarNavItem
                    closeMobile={handleNavClick}
                    href="/agents"
                    icon={<BotGlyph className="size-4" />}
                    label="Bots"
                    onLockedClick={() => setUpgradeFeature("agents")}
                    tooltip="Bots IA"
                  />
                </SidebarMenuItem>

                {/* 3. Applications : Plugins, MCP & Skills sur une page unifiée */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      isToolsActive &&
                        "bg-sidebar-accent font-semibold text-sidebar-foreground"
                    )}
                    tooltip="Applications (Plugins, MCP & Skills)"
                  >
                    <Link
                      aria-label="Applications (Plugins, MCP & Skills)"
                      data-onboarding="nav-tools"
                      href="/tools"
                      onClick={handleNavClick}
                    >
                      <PuzzleIcon className="size-4" />
                      <span>Applications</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 4. Plus : Paramètres, Messages archivés et Planification */}
                <SidebarNavCollapsible
                  dropdownItems={
                    <>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-xs py-1.5"
                      >
                        <Link
                          className="flex items-center gap-2"
                          href="/settings"
                          onClick={handleNavClick}
                        >
                          <SettingsIcon className="size-4" />
                          <span>Paramètres</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-xs py-1.5"
                      >
                        <Link
                          className="flex items-center gap-2"
                          href="/archived"
                          onClick={handleNavClick}
                        >
                          <ArchiveIcon className="size-4" />
                          <span>Messages Archivés</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-xs py-1.5"
                      >
                        <Link
                          className="flex items-center gap-2"
                          href="/planning"
                          onClick={handleNavClick}
                        >
                          <CalendarClockIcon className="size-4" />
                          <span>Planification</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  }
                  icon={MoreHorizontalIcon}
                  isActive={isPlusActive}
                  isOpen={openMenu === "plus"}
                  label="Plus"
                  onOpenChange={(open) => setOpenMenu(open ? "plus" : null)}
                  tooltip="Plus (Paramètres, archivés, Planification)"
                >
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      isActive={pathname?.startsWith("/settings")}
                    >
                      <Link
                        data-onboarding="nav-settings"
                        href="/settings"
                        onClick={handleNavClick}
                      >
                        <SettingsIcon className="size-3.5" />
                        <span>Paramètres</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      isActive={pathname?.startsWith("/archived")}
                    >
                      <Link href="/archived" onClick={handleNavClick}>
                        <ArchiveIcon className="size-3.5" />
                        <span>Messages Archivés</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      isActive={pathname?.startsWith("/planning")}
                    >
                      <Link href="/planning" onClick={handleNavClick}>
                        <CalendarClockIcon className="size-3.5" />
                        <span>Planification</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarNavCollapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user ? <SidebarProjects /> : null}

          <SidebarHistory
            hasDeadSession={hasDeadSession}
            user={user ? { email: user.email, id: user.id } : undefined}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          {user ? <SidebarUserNav user={user} /> : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <UpgradeDialog
        feature={upgradeFeature ?? "generic"}
        onOpenChange={(open) => !open && setUpgradeFeature(null)}
        open={Boolean(upgradeFeature)}
      />
    </>
  );
}
