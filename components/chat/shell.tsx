"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AgentShell } from "@/components/agent/agent-shell";
import { AgentUpgradeDialog } from "@/components/agent/agent-upgrade-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useAgentFlags } from "@/hooks/use-agent-flags";
import { useAgentMode } from "@/hooks/use-agent-mode";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import { useTier } from "@/hooks/use-tier";
import { resolveChatExperience } from "@/lib/agent/mode-gate";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Artifact } from "./artifact";
import { ChatHeader } from "./chat-header";
import { DataStreamHandler } from "./data-stream-handler";
import { HomeModeSwitcher } from "./home-mode-switcher";
import { submitEditedMessage } from "./message-editor";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function ChatShell() {
  const pathname = usePathname();
  const router = useRouter();
  const isChatRoute = pathname === "/" || pathname?.startsWith("/chat");
  const { mode, setMode } = useAgentMode();
  const { flags, isError: isFlagsError, tier: flagsTier } = useAgentFlags();
  // Tier indépendant de /api/agent/flags : useSettings est déjà chargé par le
  // compositeur (quota). Un échec de l'un des deux canaux ne doit plus forcer
  // un retour silencieux à Chat pour un abonné payant — le serveur arbitre.
  const { isFree: isSettingsFree, loaded: isSettingsTierLoaded } = useTier();
  const [agentUpgradeOpen, setAgentUpgradeOpen] = useState(false);

  // Le sélecteur est visible pour tout le monde, mais un utilisateur Free ne
  // peut pas activer Agent : la garde réelle reste côté serveur (plan_required),
  // ceci n'est que l'explication affichée.
  // Tier client = source chargée uniquement ; sinon null → pas de verrou client.

  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
    setCurrentModelId,
    showCreditCardAlert,
    setShowCreditCardAlert,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setArtifact(initialArtifactData);
      setEditingMessage(null);
      setAttachments([]);
    }
  }, [chatId, setArtifact]);

  const handleEditMessage = useCallback(
    (msg: ChatMessage) => {
      const text = msg.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");
      setInput(text ?? "");
      setEditingMessage(msg);
    },
    [setInput]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setInput("");
  }, [setInput]);

  const handleSendEditedMessage = useCallback(async () => {
    if (!editingMessage) {
      return;
    }

    const msg = editingMessage;
    setEditingMessage(null);
    await submitEditedMessage({
      message: msg,
      regenerate,
      setMessages,
      text: input,
    });
    setInput("");
  }, [editingMessage, input, regenerate, setInput, setMessages]);

  const handleActivateGateway = useCallback(() => {
    window.open(
      "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
      "_blank"
    );
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
  }, []);

  if (!isChatRoute) {
    return null;
  }

  // Tier « connu » : au moins un canal (flags ou settings) a répondu. Tant que
  // rien n'est chargé — ou que tout a échoué — on ne verrouille PAS côté
  // client : la garde serveur (plan_required) fait foi à l'envoi.
  const knownTier =
    flagsTier ?? (isSettingsTierLoaded ? (isSettingsFree ? "free" : "paid") : null);

  const experience = resolveChatExperience({
    agentEnabled: flags["agent.enabled"],
    mode,
    tier: knownTier,
  });

  const handleModeChange = (next: "chat" | "agent") => {
    // Garde d'interface : un clic « Agent » depuis Chat peut être bloqué si le
    // flag est coupé ou si le tier CONNU est free. Sinon, le choix est honoré
    // immédiatement — plus de réassignation silencieuse (bug Plus → Chat).
    const probe = resolveChatExperience({ agentEnabled: flags["agent.enabled"], mode: next, tier: knownTier });
    if (probe.status === "blocked") {
      handleBlockedAgentSelect();
      return;
    }
    setMode(next);
    if (next === "agent" && pathname !== "/") {
      router.push("/");
    }
  };

  const handleBlockedAgentSelect = () => {
    if (!flags["agent.enabled"]) {
      toast.error("Agent est momentanément indisponible.");
      return;
    }
    setAgentUpgradeOpen(true);
  };

  if (experience.status === "agent") {
    return (
      <>
        <AgentShell />
        <AgentUpgradeDialog
          onOpenChange={setAgentUpgradeOpen}
          open={agentUpgradeOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex h-[100dvh] w-full flex-row overflow-hidden supports-[height:100dvh]:h-[100dvh]">
        <div
          className={cn(
            "flex min-w-0 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,1)]",
            isArtifactVisible ? "w-full md:w-[40%]" : "w-full",
            isArtifactVisible && "hidden md:flex"
          )}
        >
          <ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
            {/* Le sélecteur Chat | Agent n'est plus une rangée autonome : il
                est rendu par la pile d'accueil (via `modeSwitcher`), à la
                même place que sur l'accueil Agent, et seulement quand
                l'accueil est affiché (aucune conversation). */}
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isArtifactVisible={isArtifactVisible}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              modeSwitcher={
                messages.length === 0 && !isLoading ? (
                  <HomeModeSwitcher
                    mode={experience.status === "blocked" ? "chat" : experience.status}
                    onBlockedAgentSelect={handleBlockedAgentSelect}
                    onModeChange={handleModeChange}
                  />
                ) : null
              }
              onEditMessage={handleEditMessage}
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={status}
              votes={votes}
            />

            {/* Barre de message collante en bas : mêmes largeur (max-w-3xl),
                paddings et bordure supérieure que la barre d'Agent, pour que
                l'accueil des deux modes partage le même gabarit. */}
            <div className="sticky bottom-0 z-30 mx-auto flex w-full max-w-3xl gap-2 border-t border-border/10 bg-background px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 md:px-4 md:pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pt-3 supports-[padding:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  editingMessage={editingMessage}
                  input={input}
                  isLoading={isLoading}
                  messages={messages}
                  onCancelEdit={handleCancelEdit}
                  onModelChange={setCurrentModelId}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={
                    editingMessage ? handleSendEditedMessage : sendMessage
                  }
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                />
              )}
            </div>
          </div>
        </div>

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          selectedVisibilityType={visibilityType}
          sendMessage={sendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={stop}
          votes={votes}
        />
      </div>

      <DataStreamHandler />

      <AgentUpgradeDialog
        onOpenChange={setAgentUpgradeOpen}
        open={agentUpgradeOpen}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateGateway}>
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
