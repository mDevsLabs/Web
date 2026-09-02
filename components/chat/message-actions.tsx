import equal from "fast-deep-equal";
import {
  GitForkIcon,
  RefreshCwIcon,
  Share2Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { useActiveChat } from "@/hooks/use-active-chat";
import { speakText, stopSpeaking } from "@/hooks/use-speech";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CopyIcon, PencilEditIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  onEdit,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  onEdit?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const [_, copyToClipboard] = useCopyToClipboard();
  const { messages, setMessages, regenerate } = useActiveChat() as any;

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  // prefs for regenerate mode
  const { data: notifPrefs } = useSWR(
    "/api/notifications/preferences",
    fetcher,
    { dedupingInterval: 30_000 }
  );
  const regenerateMode: "truncate" | "fork" =
    notifPrefs?.regenerateMode === "fork" ? "fork" : "truncate";

  const { data: chatData } = useSWR(
    chatId ? `/api/chats/${chatId}` : null,
    fetcher,
    { dedupingInterval: 10_000 }
  );
  const visibility = (chatData as any)?.visibility ?? "private";

  const handleCopy = useCallback(async () => {
    if (!textFromParts) {
      toast.error("Aucun texte à copier !");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copié dans le presse-papiers !");
  }, [copyToClipboard, textFromParts]);

  const handleUpvote = useCallback(() => {
    const upvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "up",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );

    toast.promise(upvote, {
      error: "Échec de l'enregistrement du vote.",
      loading: "Envoi du vote...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: true,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Réponse appréciée !";
      },
    });
  }, [chatId, message.id, mutate]);

  const handleFork = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chats/${chatId}/fork`,
        {
          body: JSON.stringify({ upToMessageId: message.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur fork");
      }
      toast.success("Branche créée");
      router.push(`/chat/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Impossible de brancher");
    }
  }, [chatId, message.id, router]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    if (!textFromParts) {
      toast.error("Aucun texte à lire");
      return;
    }
    setIsSpeaking(true);
    speakText(textFromParts);
    // reset after utterance ends (approx)
    setTimeout(
      () => setIsSpeaking(false),
      Math.min(30_000, textFromParts.length * 60)
    );
  }, [isSpeaking, textFromParts]);

  const handleDownvote = useCallback(() => {
    const downvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "down",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );

    toast.promise(downvote, {
      error: "Échec de l'enregistrement du vote.",
      loading: "Envoi du vote...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: false,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Vote enregistré !";
      },
    });
  }, [chatId, message.id, mutate]);

  const handleRegenerate = useCallback(async () => {
    try {
      // Determine target user message id
      let targetUserId: string | null = null;
      let targetIndex = -1;
      if (message.role === "user") {
        targetUserId = message.id;
        targetIndex = messages.findIndex(
          (m: ChatMessage) => m.id === message.id
        );
      } else {
        // assistant: find preceding user
        const idx = messages.findIndex((m: ChatMessage) => m.id === message.id);
        for (let i = idx - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            targetUserId = messages[i].id;
            targetIndex = i;
            break;
          }
        }
        if (!targetUserId) {
          toast.error("Aucun message utilisateur précédent à régénérer");
          return;
        }
      }

      if (regenerateMode === "fork") {
        // Fork branch up to target user message
        const res = await fetch(`/api/chats/${chatId}/fork`, {
          body: JSON.stringify({ upToMessageId: targetUserId }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erreur fork");
        }
        toast.success(
          "Branche créée — régénération dans la nouvelle conversation"
        );
        router.push(`/chat/${data.id}`);
        return;
      }

      // truncate mode: delete trailing and regenerate immediately
      if (targetIndex >= 0) {
        setMessages((prev: ChatMessage[]) => prev.slice(0, targetIndex + 1));
        regenerate();
        toast.success("Régénération lancée");

        // Nettoyage asynchrone non-bloquant en base de données
        if (targetUserId) {
          import("@/app/(chat)/actions")
            .then(({ deleteTrailingMessages }) =>
              deleteTrailingMessages({ id: targetUserId })
            )
            .catch(() => {});
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur régénération");
    }
  }, [
    chatId,
    message,
    messages,
    regenerateMode,
    regenerate,
    router,
    setMessages,
  ]);

  const handleShare = useCallback(
    (platform: string) => {
      if (visibility !== "public") {
        toast.error(
          "La conversation doit être publique pour partager. Passez-la en public via le sélecteur de visibilité."
        );
        return;
      }
      const chatUrl = `${window.location.origin}/chat/${chatId}#${message.id}`;
      const text = textFromParts
        ? `${textFromParts.slice(0, 280)} — via mAI`
        : "Découvrez cette conversation mAI";
      const encodedText = encodeURIComponent(text);
      const encodedUrl = encodeURIComponent(chatUrl);
      const urls: Record<string, string> = {
        copy: chatUrl,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      };
      if (platform === "copy") {
        navigator.clipboard
          .writeText(`${text}\n${chatUrl}`)
          .then(() => toast.success("Lien copié !"))
          .catch(() => toast.error("Échec copie"));
        return;
      }
      if (platform === "native" && (navigator as any).share) {
        (navigator as any)
          .share({ text, title: "Partager message mAI", url: chatUrl })
          .catch(() => {});
        return;
      }
      const url = urls[platform];
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [chatId, message.id, textFromParts, visibility]
  );

  if (isLoading) {
    return null;
  }

  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end opacity-100 md:opacity-0 md:transition-opacity md:duration-150 md:group-hover/message:opacity-100">
        <div className="flex items-center gap-0.5">
          {onEdit ? (
            <Action
              className="size-7 text-muted-foreground/50 hover:text-foreground"
              data-testid="message-edit-button"
              onClick={onEdit}
              tooltip="Modifier"
            >
              <PencilEditIcon />
            </Action>
          ) : null}
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handleCopy}
            tooltip="Copier"
          >
            <CopyIcon />
          </Action>
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handleRegenerate}
            tooltip={`Régénérer (${regenerateMode})`}
          >
            <RefreshCwIcon className="size-4" />
          </Action>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Partager"
                className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
                type="button"
              >
                <Share2Icon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleShare("copy")}>
                Copier le texte + lien
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("x")}>
                Partager sur X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("facebook")}>
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("telegram")}>
                Telegram
              </DropdownMenuItem>
              {(navigator as any).share && (
                <DropdownMenuItem onClick={() => handleShare("native")}>
                  Partage natif
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5 opacity-100 md:opacity-0 md:transition-opacity md:duration-150 md:group-hover/message:opacity-100">
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copier"
      >
        <CopyIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleRegenerate}
        tooltip={`Régénérer (${regenerateMode})`}
      >
        <RefreshCwIcon className="size-4" />
      </Action>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Partager"
            className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
            type="button"
          >
            <Share2Icon className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleShare("copy")}>
            Copier le texte + lien
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("x")}>
            Partager sur X
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("facebook")}>
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("linkedin")}>
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("telegram")}>
            Telegram
          </DropdownMenuItem>
          {(navigator as any).share && (
            <DropdownMenuItem onClick={() => handleShare("native")}>
              Partage natif
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleSpeak}
        tooltip={isSpeaking ? "Stop" : "Écouter"}
      >
        {isSpeaking ? (
          <VolumeXIcon className="size-4" />
        ) : (
          <Volume2Icon className="size-4" />
        )}
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleFork}
        tooltip="Brancher (fork)"
      >
        <GitForkIcon className="size-4" />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={handleUpvote}
        tooltip="Bonne réponse"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={handleDownvote}
        tooltip="Mauvaise réponse"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }

    return true;
  }
);
