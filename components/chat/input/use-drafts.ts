"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import type { Attachment } from "@/lib/types";

const DRAFT_COOKIE = "mai-draft";
const DRAFT_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export const DRAFT_COOKIE_NAME = DRAFT_COOKIE;

// Persistance des brouillons : localStorage par discussion + cookie global
// 30 jours pour les nouvelles conversations + handoff pièce jointe cloud.
export function useDrafts(params: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  isNewChatInput: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const {
    chatId,
    input,
    setInput,
    setAttachments,
    isNewChatInput,
    textareaRef,
  } = params;

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    `input:${chatId}`,
    ""
  );

  const didRestoreDraftRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: restauration unique au montage, dépendances volontairement gelées
  useEffect(() => {
    if (didRestoreDraftRef.current || !textareaRef.current) {
      return;
    }
    didRestoreDraftRef.current = true;

    let finalValue = textareaRef.current.value;
    if (!finalValue && localStorageInput) {
      finalValue = localStorageInput;
    }
    if (!finalValue && isNewChatInput) {
      const draft = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${DRAFT_COOKIE}=`))
        ?.split("=")[1];
      if (draft) {
        finalValue = decodeURIComponent(draft);
      }
    }
    if (finalValue) {
      setInput(finalValue);
    }
  }, [setInput, isNewChatInput]);

  // Brouillon global persisté 30 jours (cookie) pour les nouvelles conversations
  useEffect(() => {
    if (!isNewChatInput) {
      return;
    }
    const timer = setTimeout(() => {
      if (typeof document !== "undefined") {
        if (input.trim()) {
          document.cookie = `${DRAFT_COOKIE}=${encodeURIComponent(input)}; path=/; max-age=${DRAFT_MAX_AGE}`;
        } else {
          document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0`;
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [input, isNewChatInput]);

  // Handoff Cloud -> chat : consommer la pièce jointe en attente
  // biome-ignore lint/correctness/useExhaustiveDependencies: consommation unique au montage, dépendances volontairement gelées
  useEffect(() => {
    if (!isNewChatInput || typeof window === "undefined") {
      return;
    }
    try {
      const raw = sessionStorage.getItem(MAI_PENDING_ATTACHMENT_KEY);
      if (!raw) {
        return;
      }
      sessionStorage.removeItem(MAI_PENDING_ATTACHMENT_KEY);
      const pending = JSON.parse(raw) as {
        mediaType?: string;
        name?: string;
        prompt?: string;
        url?: string;
      };
      if (pending.url && pending.name) {
        setAttachments((prev) => [
          ...prev,
          {
            contentType: pending.mediaType,
            name: pending.name,
            url: pending.url,
          } as Attachment,
        ]);
      }
      if (pending.prompt) {
        setInput(pending.prompt);
      }
    } catch {}
  }, [isNewChatInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  /** Efface le brouillon global (après envoi). */
  const clearGlobalDraft = () => {
    if (typeof document !== "undefined") {
      document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0`;
    }
  };

  return { clearGlobalDraft, localStorageInput, setLocalStorageInput };
}
