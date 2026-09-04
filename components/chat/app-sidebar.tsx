"use client";

import {
  ArchiveIcon,
  ArrowRightIcon,
  BotIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  CloudIcon,
  CpuIcon,
  FolderKanbanIcon,
  HomeIcon,
  ImageIcon,
  LockIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PenSquareIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TrashIcon,
  Volume2Icon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ProjectIcon } from "@/components/chat/project-icon";
import { SearchDialog } from "@/components/chat/search-dialog";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
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
import { useProjects } from "@/hooks/use-projects";
import { useTier } from "@/hooks/use-tier";
import type { MaiUser } from "@/lib/auth/session";
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

function LockedNavSubItem({
  closeMobile,
  href,
  icon: Icon,
  label,
  lockedFeature,
  onLockedClick,
}: {
  closeMobile: () => void;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lockedFeature: "skills" | "mcp" | "agents";
  onLockedClick: (feature: "skills" | "mcp" | "agents") => void;
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
        onLockedClick(lockedFeature);
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
    [closeMobile, label, locked, lockedFeature, onLockedClick]
  );

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        aria-disabled={locked}
        asChild
        className={cn(
          "h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isActive && "bg-sidebar-accent text-sidebar-foreground font-medium",
          locked &&
            "opacity-55 cursor-not-allowed text-sidebar-foreground/50 hover:bg-transparent hover:text-sidebar-foreground/50"
        )}
        isActive={isActive}
      >
        <Link
          aria-disabled={locked}
          href={locked ? "#" : href}
          onClick={handleClick}
          tabIndex={locked ? -1 : 0}
        >
          <Icon className={cn("size-3.5", isActive && "text-primary")} />
          <span className="truncate">{label}</span>
          {locked && <LockIcon className="ml-auto size-3 text-amber-500" />}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function LockedDropdownItem({
  closeMobile,
  href,
  icon: Icon,
  label,
  lockedFeature,
  onLockedClick,
}: {
  closeMobile: () => void;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lockedFeature: "skills" | "mcp" | "agents";
  onLockedClick: (feature: "skills" | "mcp" | "agents") => void;
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
        onLockedClick(lockedFeature);
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
    [closeMobile, label, locked, lockedFeature, onLockedClick]
  );

  return (
    <DropdownMenuItem
      asChild
      className={cn(
        "flex items-center gap-2 cursor-pointer text-xs py-1.5",
        locked && "opacity-60 cursor-not-allowed"
      )}
    >
      <Link href={locked ? "#" : href} onClick={handleClick}>
        <Icon className={cn("size-4", isActive && "text-primary")} />
        <span className="flex-1">{label}</span>
        {locked && <LockIcon className="size-3 text-amber-500" />}
      </Link>
    </DropdownMenuItem>
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

export function AppSidebar({ user }: { user?: MaiUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    "skills" | "mcp" | "agents" | null
  >(null);

  type NavMenuKey = "creation" | "config" | "plus";
  const [openMenu, setOpenMenu] = useState<NavMenuKey | null>(null);

  const isCreationActive = Boolean(
    pathname?.startsWith("/images") || pathname?.startsWith("/audio")
  );
  const isConfigActive = Boolean(
    pathname?.startsWith("/skills") ||
      pathname?.startsWith("/mcp") ||
      pathname?.startsWith("/agents")
  );
  const isPlusActive = Boolean(
    pathname?.startsWith("/settings") || pathname?.startsWith("/archived")
  );

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
  }, [pathname, setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleGoHome = useCallback(() => {
    handleNavClick();
    resetChat();
    router.push("/");
  }, [handleNavClick, resetChat, router]);

  const handleNewChat = useCallback(() => {
    handleNavClick();
    resetChat();
    router.push("/");
  }, [handleNavClick, resetChat, router]);

  const handleShowDeleteAllDialog = useCallback(() => {
    setShowDeleteAllDialog(true);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setShowDeleteAllDialog(false);
    resetChat();
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success("Toutes les discussions ont été supprimées");
  }, [mutate, resetChat, router]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip="mAI Web — Accueil"
                >
                  <Link
                    className="flex items-center justify-center"
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      handleGoHome();
                    }}
                  >
                    <Image
                      alt="mAI"
                      className="rounded-md"
                      height={22}
                      src="/logo.png"
                      width={22}
                    />
                  </Link>
                </SidebarMenuButton>
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
              <button
                className="group-data-[collapsible=icon]:hidden flex items-center gap-1.5 cursor-pointer text-left focus:outline-hidden"
                onClick={handleGoHome}
                title="Aller à l'accueil"
                type="button"
              >
                <span className="font-bold text-sm tracking-tight text-foreground hover:text-primary transition-colors">
                  mAI
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors">
                  Web
                </span>
              </button>
              <div className="group-data-[collapsible=icon]:hidden">
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
                    className={cn(
                      "h-8 rounded-lg text-[13px] transition-colors duration-150",
                      pathname === "/"
                        ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    onClick={handleGoHome}
                    tooltip="Accueil"
                  >
                    <HomeIcon className="size-4" />
                    <span className="font-medium">Accueil</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    data-search-trigger
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open-search-dialog")
                      )
                    }
                    tooltip="Rechercher (Cmd+K ou /search)"
                  >
                    <SearchIcon className="size-4" />
                    <span className="font-medium">Rechercher</span>
                    <span className="ml-auto hidden group-data-[collapsible=icon]:hidden md:inline text-[10px] text-muted-foreground border border-border/50 rounded px-1 py-0.5">
                      ⌘K
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Stockage"
                  >
                    <Link
                      data-onboarding="nav-library"
                      href="/library"
                      onClick={handleNavClick}
                    >
                      <CloudIcon className="size-4" />
                      <span>Stockage</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

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

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Planification"
                  >
                    <Link href="/planning" onClick={handleNavClick}>
                      <CalendarClockIcon className="size-4" />
                      <span>Planification</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 1. Création : Images & Audio */}
                <SidebarNavCollapsible
                  dropdownItems={
                    <>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-xs py-1.5"
                      >
                        <Link
                          className="flex items-center gap-2"
                          href="/images"
                          onClick={handleNavClick}
                        >
                          <ImageIcon className="size-4" />
                          <span>Images</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-xs py-1.5"
                      >
                        <Link
                          className="flex items-center gap-2"
                          href="/audio"
                          onClick={handleNavClick}
                        >
                          <Volume2Icon className="size-4" />
                          <span>Audio</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  }
                  icon={SparklesIcon}
                  isActive={isCreationActive}
                  isOpen={openMenu === "creation"}
                  label="Création"
                  onOpenChange={(open) => setOpenMenu(open ? "creation" : null)}
                  tooltip="Création (Images & Audio)"
                >
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      isActive={pathname?.startsWith("/images")}
                    >
                      <Link
                        data-onboarding="nav-images"
                        href="/images"
                        onClick={handleNavClick}
                      >
                        <ImageIcon className="size-3.5" />
                        <span>Images</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className="h-7 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      isActive={pathname?.startsWith("/audio")}
                    >
                      <Link
                        data-onboarding="nav-audio"
                        href="/audio"
                        onClick={handleNavClick}
                      >
                        <Volume2Icon className="size-3.5" />
                        <span>Audio</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarNavCollapsible>

                {/* 2. Outils : Skills, MCP & Agents */}
                <SidebarNavCollapsible
                  dropdownItems={
                    <>
                      <LockedDropdownItem
                        closeMobile={handleNavClick}
                        href="/skills"
                        icon={WrenchIcon}
                        label="Skills"
                        lockedFeature="skills"
                        onLockedClick={setUpgradeFeature}
                      />
                      <LockedDropdownItem
                        closeMobile={handleNavClick}
                        href="/mcp"
                        icon={CpuIcon}
                        label="MCP"
                        lockedFeature="mcp"
                        onLockedClick={setUpgradeFeature}
                      />
                      <LockedDropdownItem
                        closeMobile={handleNavClick}
                        href="/agents"
                        icon={BotIcon}
                        label="Agents"
                        lockedFeature="agents"
                        onLockedClick={setUpgradeFeature}
                      />
                    </>
                  }
                  icon={WrenchIcon}
                  isActive={isConfigActive}
                  isOpen={openMenu === "config"}
                  label="Outils"
                  onOpenChange={(open) => setOpenMenu(open ? "config" : null)}
                  tooltip="Outils (Skills, MCP & Agents)"
                >
                  <LockedNavSubItem
                    closeMobile={handleNavClick}
                    href="/skills"
                    icon={WrenchIcon}
                    label="Skills"
                    lockedFeature="skills"
                    onLockedClick={setUpgradeFeature}
                  />
                  <LockedNavSubItem
                    closeMobile={handleNavClick}
                    href="/mcp"
                    icon={CpuIcon}
                    label="MCP"
                    lockedFeature="mcp"
                    onLockedClick={setUpgradeFeature}
                  />
                  <LockedNavSubItem
                    closeMobile={handleNavClick}
                    href="/agents"
                    icon={BotIcon}
                    label="Agents"
                    lockedFeature="agents"
                    onLockedClick={setUpgradeFeature}
                  />
                </SidebarNavCollapsible>

                {/* 3. Plus : Paramètres, Messages Archivés, Supprimer l'historique */}
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
                      {user ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer text-xs py-1.5"
                            onClick={() => {
                              handleNavClick();
                              handleShowDeleteAllDialog();
                            }}
                          >
                            <TrashIcon className="size-4" />
                            <span>Supprimer l'historique</span>
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </>
                  }
                  icon={MoreHorizontalIcon}
                  isActive={isPlusActive}
                  isOpen={openMenu === "plus"}
                  label="Plus"
                  onOpenChange={(open) => setOpenMenu(open ? "plus" : null)}
                  tooltip="Plus (Paramètres, Archives, Historique)"
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
                  {user ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className="h-7 rounded-lg text-[13px] text-sidebar-foreground/50 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        onClick={() => {
                          handleNavClick();
                          handleShowDeleteAllDialog();
                        }}
                      >
                        <TrashIcon className="size-3.5" />
                        <span>Supprimer l'historique</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : null}
                </SidebarNavCollapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user ? <SidebarProjects /> : null}

          <SidebarHistory
            user={user ? { email: user.email, id: user.id } : undefined}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          {user ? <SidebarUserNav user={user} /> : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer toutes les discussions ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes vos conversations seront
              définitivement effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAll}
            >
              Tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeDialog
        feature={upgradeFeature ?? "generic"}
        onOpenChange={(open) => !open && setUpgradeFeature(null)}
        open={Boolean(upgradeFeature)}
      />
    </>
  );
}
