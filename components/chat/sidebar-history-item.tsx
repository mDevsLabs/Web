import {
  Archive as ArchiveIcon,
  ArchiveRestore as ArchiveRestoreIcon,
  Check as CheckIcon,
  Folder as FolderIcon,
  Pin as PinIcon,
  PinOff as PinOffIcon,
} from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";
import { ProjectIcon } from "./project-icon";
import { getChatHistoryPaginationKey } from "./sidebar-history";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  projects,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  projects?: { id: string; name: string; icon: string }[];
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleSetPrivate = useCallback(() => {
    setVisibilityType("private");
  }, [setVisibilityType]);

  const handleSetPublic = useCallback(() => {
    setVisibilityType("public");
  }, [setVisibilityType]);

  const { mutate } = useSWRConfig();
  const handleDelete = useCallback(() => {
    onDelete(chat.id);
  }, [chat.id, onDelete]);

  const handleMoveToProject = useCallback(
    async (projectId: string | null) => {
      const res = await fetch(`/api/chats/${chat.id}`, {
        body: JSON.stringify({ projectId }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (res.ok) {
        toast.success(projectId ? "Déplacé" : "Retiré du dossier");
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        mutate("/api/projects");
      } else {
        toast.error("Erreur déplacement");
      }
    },
    [chat.id, mutate]
  );

  const handleTogglePin = useCallback(async () => {
    const res = await fetch(`/api/chats/${chat.id}`, {
      body: JSON.stringify({ pinned: !(chat as any).pinned }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (res.ok) {
      toast.success((chat as any).pinned ? "Désépinglé" : "Épinglé");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  }, [chat, mutate]);

  const handleToggleArchive = useCallback(async () => {
    const res = await fetch(`/api/chats/${chat.id}`, {
      body: JSON.stringify({ isArchived: !(chat as any).isArchived }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (res.ok) {
      toast.success((chat as any).isArchived ? "Désarchivé" : "Archivé");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  }, [chat, mutate]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-8 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:border-b data-[active=true]:border-dashed data-[active=true]:border-sidebar-foreground/50"
        isActive={isActive}
      >
        <Link href={`/chat/${chat.id}`} onClick={closeMobile}>
          <span className="truncate">{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">Plus d'options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Partager</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={handleSetPrivate}
                >
                  <div className="flex flex-row items-center gap-2">
                    <LockIcon size={12} />
                    <span>Privé</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={handleSetPublic}
                >
                  <div className="flex flex-row items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <FolderIcon className="size-4 mr-2 shrink-0" />
              <span>Dossier</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleMoveToProject(null)}>
                  Sans dossier
                </DropdownMenuItem>
                {projects?.map((p) => (
                  <DropdownMenuItem
                    className="flex items-center justify-between gap-2"
                    key={p.id}
                    onClick={() => handleMoveToProject(p.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ProjectIcon className="size-4 shrink-0" name={p.icon} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {(chat as any).projectId === p.id && (
                      <CheckIcon className="size-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleTogglePin}
          >
            {(chat as any).pinned ? (
              <PinOffIcon className="size-4 mr-2" />
            ) : (
              <PinIcon className="size-4 mr-2" />
            )}
            <span>{(chat as any).pinned ? "Désépingler" : "Épingler"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleToggleArchive}
          >
            {(chat as any).isArchived ? (
              <ArchiveRestoreIcon className="size-4 mr-2" />
            ) : (
              <ArchiveIcon className="size-4 mr-2" />
            )}
            <span>{(chat as any).isArchived ? "Désarchiver" : "Archiver"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleDelete} variant="destructive">
            <TrashIcon />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  if (prevProps.chat.id !== nextProps.chat.id) {
    return false;
  }
  if ((prevProps.chat as any).projectId !== (nextProps.chat as any).projectId) {
    return false;
  }
  if ((prevProps.chat as any).pinned !== (nextProps.chat as any).pinned) {
    return false;
  }
  if (
    (prevProps.chat as any).isArchived !== (nextProps.chat as any).isArchived
  ) {
    return false;
  }
  if (prevProps.projects !== nextProps.projects) {
    return false;
  }
  return true;
});
