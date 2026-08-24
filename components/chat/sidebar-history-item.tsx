import Link from "next/link";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import { getChatHistoryPaginationKey } from "./sidebar-history";
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !(chat as any).pinned }),
    });
    if (res.ok) {
      toast.success((chat as any).pinned ? "Désépinglé" : "Épinglé");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  }, [chat, mutate]);

  const handleToggleArchive = useCallback(async () => {
    const res = await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !(chat as any).isArchived }),
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
              <span>📁 Dossier</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleMoveToProject(null)}>Sans dossier</DropdownMenuItem>
                {projects?.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(p.id)}>
                    <span className="mr-2">{p.icon}</span> {p.name}
                    {(chat as any).projectId === p.id ? " ✓" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer">
            <span>{(chat as any).pinned ? "📌 Désépingler" : "📌 Épingler"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleArchive} className="cursor-pointer">
            <span>{(chat as any).isArchived ? "📂 Désarchiver" : "📦 Archiver"}</span>
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
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.id !== nextProps.chat.id) return false;
  if ((prevProps.chat as any).projectId !== (nextProps.chat as any).projectId) return false;
  if ((prevProps.chat as any).pinned !== (nextProps.chat as any).pinned) return false;
  if ((prevProps.chat as any).isArchived !== (nextProps.chat as any).isArchived) return false;
  if (prevProps.projects !== nextProps.projects) return false;
  return true;
});
