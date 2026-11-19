"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  DrawerMessage,
  SummaryTarget,
  TargetConversationState,
} from "@/components/search/search-drawer-conversation";
import {
  mergeStreamText,
  readSummaryStream,
} from "@/lib/search/summary-stream";

export function useTargetConversation({
  submittedQuery,
  selectedModelId,
}: {
  submittedQuery: string;
  selectedModelId: string;
}) {
  const router = useRouter();

  const [targetConversation, setTargetConversation] =
    useState<TargetConversationState>({
      isLoading: false,
      isOpen: false,
      messages: [],
      modelId: selectedModelId,
      target: null,
    });
  const [followupInput, setFollowupInput] = useState("");
  const [hasCopiedDrawer, setHasCopiedDrawer] = useState(false);
  const drawerAbortControllerRef = useRef<AbortController | null>(null);

  const handleCloseTargetConversation = useCallback(() => {
    if (drawerAbortControllerRef.current) {
      drawerAbortControllerRef.current.abort();
    }
    setTargetConversation((prev) => ({
      ...prev,
      isLoading: false,
      isOpen: false,
    }));
  }, []);

  const handleRequestTargetSummary = useCallback(
    async (target: SummaryTarget) => {
      if (drawerAbortControllerRef.current) {
        drawerAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      drawerAbortControllerRef.current = controller;

      setTargetConversation({
        isLoading: true,
        isOpen: true,
        messages: [
          {
            content: "",
            id: `summary-${Date.now()}`,
            role: "assistant",
            sources: [],
          },
        ],
        modelId: selectedModelId,
        target,
      });

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            messages: [],
            modelId: selectedModelId,
            query: submittedQuery,
            target,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la génération du résumé.");
        }

        let accumulated = "";
        let reasoningAccumulator = "";
        await readSummaryStream(response, (event) => {
          if (event.type === "reasoning-delta") {
            reasoningAccumulator = mergeStreamText(
              reasoningAccumulator,
              event.delta
            );
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              if (msgs[0]) {
                msgs[0] = { ...msgs[0], reasoning: reasoningAccumulator };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "text-delta") {
            accumulated = mergeStreamText(accumulated, event.delta);
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              if (msgs[0]) {
                msgs[0] = { ...msgs[0], content: accumulated };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "sources") {
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              if (msgs[0]) {
                msgs[0] = { ...msgs[0], sources: event.sources };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de résumer cette ressource.";
        toast.error(message);
        setTargetConversation((prev) => ({
          ...prev,
          messages: [
            {
              content: `Erreur : ${message}`,
              id: `err-${Date.now()}`,
              role: "assistant",
            },
          ],
        }));
      } finally {
        if (!controller.signal.aborted) {
          setTargetConversation((prev) => ({ ...prev, isLoading: false }));
        }
      }
    },
    [submittedQuery, selectedModelId]
  );

  const handleSendFollowupMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = followupInput.trim();
      if (!text || targetConversation.isLoading || !targetConversation.target)
        return;

      const userMsg: DrawerMessage = {
        content: text,
        id: `user-${Date.now()}`,
        role: "user",
      };

      const newHistory = [...targetConversation.messages, userMsg];
      setFollowupInput("");

      const assistantMsg: DrawerMessage = {
        content: "",
        id: `assistant-${Date.now()}`,
        role: "assistant",
        sources: [],
      };

      setTargetConversation((prev) => ({
        ...prev,
        isLoading: true,
        messages: [...newHistory, assistantMsg],
      }));

      if (drawerAbortControllerRef.current) {
        drawerAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      drawerAbortControllerRef.current = controller;

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            messages: newHistory.map((m) => ({
              content: m.content,
              role: m.role,
            })),
            modelId: selectedModelId,
            query: submittedQuery,
            target: targetConversation.target,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la réponse de l'assistant.");
        }

        let accumulated = "";
        let reasoningAccumulator = "";
        await readSummaryStream(response, (event) => {
          if (event.type === "reasoning-delta") {
            reasoningAccumulator = mergeStreamText(
              reasoningAccumulator,
              event.delta
            );
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  reasoning: reasoningAccumulator,
                };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "text-delta") {
            accumulated = mergeStreamText(accumulated, event.delta);
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                msgs[lastIdx] = { ...msgs[lastIdx], content: accumulated };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "sources") {
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                msgs[lastIdx] = { ...msgs[lastIdx], sources: event.sources };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Erreur lors de l'échange.";
        toast.error(message);
        setTargetConversation((prev) => {
          const msgs = [...prev.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `Erreur : ${message}`,
            };
          }
          return { ...prev, messages: msgs };
        });
      } finally {
        if (!controller.signal.aborted) {
          setTargetConversation((prev) => ({ ...prev, isLoading: false }));
        }
      }
    },
    [
      followupInput,
      targetConversation.isLoading,
      targetConversation.target,
      targetConversation.messages,
      selectedModelId,
      submittedQuery,
    ]
  );

  const handleCopyDrawerContent = useCallback(() => {
    const lastAssistant = targetConversation.messages
      .slice()
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant?.content) return;

    navigator.clipboard
      .writeText(lastAssistant.content)
      .then(() => {
        setHasCopiedDrawer(true);
        window.setTimeout(() => setHasCopiedDrawer(false), 2000);
        toast.success("Contenu copié dans le presse-papier !");
      })
      .catch(() => {
        toast.error("Impossible de copier le contenu.");
      });
  }, [targetConversation.messages]);

  const handleSendDrawerToChat = useCallback(() => {
    if (!targetConversation.target) return;
    const conversationSummary = targetConversation.messages
      .map(
        (m) =>
          `**${m.role === "user" ? "Moi" : "mAI Assistant"}** :\n${m.content}`
      )
      .join("\n\n");

    const prefilled = `Je consultais cette ressource sur mAI Search :\n**${targetConversation.target.title}** (${targetConversation.target.url})\n\nVoici notre échange dessus :\n${conversationSummary}\n\nPeux-tu m'en dire plus et m'aider à aller plus loin ?`;

    try {
      sessionStorage.setItem("mai_pending_chat_prompt", prefilled);
    } catch {}

    router.push(`/?prompt=${encodeURIComponent(prefilled)}`);
  }, [router, targetConversation.messages, targetConversation.target]);

  return {
    drawerAbortControllerRef,
    followupInput,
    handleCloseTargetConversation,
    handleCopyDrawerContent,
    handleRequestTargetSummary,
    handleSendDrawerToChat,
    handleSendFollowupMessage,
    hasCopiedDrawer,
    setFollowupInput,
    targetConversation,
  };
}
