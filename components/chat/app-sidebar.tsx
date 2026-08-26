"use client";

import {
  ArrowRightIcon,
  CloudIcon,
  FolderKanbanIcon,
  ImageIcon,
  PanelLeftIcon,
  PenSquareIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
  Volume2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import type { MaiUser } from "@/lib/auth/session";
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

export function AppSidebar({ user }: { user?: MaiUser | null }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleNewChat = useCallback(() => {
    setOpenMobile(false);
    router.push("/");
  }, [router, setOpenMobile]);

  const handleShowDeleteAllDialog = useCallback(() => {
    setShowDeleteAllDialog(true);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success("Toutes les discussions ont été supprimées");
  }, [mutate, router]);

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
                  tooltip="mAI Web"
                >
                  <Link
                    className="flex items-center justify-center"
                    href="/"
                    onClick={closeMobile}
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
              <div className="group-data-[collapsible=icon]:hidden flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  mAI
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                  Web
                </span>
              </div>
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
                    <Link href="/library" onClick={closeMobile}>
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
                    <Link href="/projects" onClick={closeMobile}>
                      <FolderKanbanIcon className="size-4" />
                      <span>Projets</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Images"
                  >
                    <Link href="/images" onClick={closeMobile}>
                      <ImageIcon className="size-4" />
                      <span>Images</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Audio"
                  >
                    <Link href="/audio" onClick={closeMobile}>
                      <Volume2Icon className="size-4" />
                      <span>Audio</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Paramètres"
                  >
                    <Link href="/settings" onClick={closeMobile}>
                      <SettingsIcon className="size-4" />
                      <span>Paramètres</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {user ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleShowDeleteAllDialog}
                      tooltip="Supprimer toutes les discussions"
                    >
                      <TrashIcon className="size-4" />
                      <span className="text-[13px]">
                        Supprimer l'historique
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user ? <SidebarProjects /> : null}

          <SidebarHistory
            user={user ? { email: user.email, id: user.id } : undefined}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
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
    </>
  );
}
