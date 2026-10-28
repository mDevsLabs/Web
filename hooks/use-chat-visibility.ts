"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { updateChatVisibility } from "@/app/(chat)/actions";
import {
  type ChatHistory,
  getChatHistoryPaginationKey,
} from "@/components/chat/sidebar-history";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { apiEndpoints } from "@/lib/client/api-endpoints";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
  isSecure = false,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
  isSecure?: boolean;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: ChatHistory = cache.get(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`
  )?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    }
  );

  const visibilityType = useMemo(() => {
    if (!history) {
      return localVisibility;
    }
    const chat = history.chats.find((currentChat) => currentChat.id === chatId);
    if (!chat) {
      return "private";
    }
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    mutate(unstable_serialize(getChatHistoryPaginationKey));

    updateChatVisibility({
      chatId,
      visibility: updatedVisibilityType,
    })
      .then(() => {
        if (updatedVisibilityType === "public") {
          if (typeof window !== "undefined") {
            const shareUrl = `${window.location.origin}${apiEndpoints.chatPath(chatId)}`;
            navigator.clipboard.writeText(shareUrl).then(
              () =>
                toast.success(
                  "Discussion publique : lien copié dans le presse-papiers !"
                ),
              () => toast.success("Discussion rendue publique !")
            );
          }
        } else {
          // Le passage en privé supprime le PIN côté serveur (invariant
          // ChatSecurity) : rafraîchir la conversation ouverte pour que le
          // badge et la description de partage disparaissent immédiatement.
          if (isSecure) {
            mutate(apiEndpoints.chatById(chatId));
            mutate(apiEndpoints.messagesForChat(chatId));
          }
          toast.success(
            isSecure
              ? "Discussion rendue privée : la protection PIN a été retirée."
              : "Discussion rendue privée"
          );
        }
      })
      .catch(() => {
        setLocalVisibility(initialVisibilityType);
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        toast.error(
          isSecure && updatedVisibilityType === "private"
            ? "Déverrouillez la conversation avec son code PIN pour changer sa visibilité."
            : "Impossible de changer la visibilité de la conversation."
        );
      });
  };

  return { setVisibilityType, visibilityType };
}
