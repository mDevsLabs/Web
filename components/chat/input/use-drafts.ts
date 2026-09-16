"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  clearDraft,
  draftKeyForChatId,
  loadDraft,
  NEW_CHAT_DRAFT_KEY,
  resolveNewChatDraftKey,
  saveDraft,
} from "@/lib/chat/drafts";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import type { Attachment } from "@/lib/types";

const RESTORE_DEBOUNCE_MS = 200;

// Persistance du brouillon de saisie : exclusivement locale au navigateur.
//
// Contrats :
// - un brouillon par conversation (`mai.draft:v1:<chatId>`), le contexte de
//   création d'une nouvelle conversation ayant sa clé dédiée — jamais de
//   restauration croisée entre chats ;
// - restauration UNIQUEMENT si le compositeur est vide : le brouillon ne
//   masque jamais une saisie en cours (navigation vers un chat où l'utilisateur
//   vient de taper du texte) ;
// - sauvegarde débounée à chaque frappe, suppression nette après envoi
//   (clearDraft + clearLocalStorageInput).
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

  // Clé namespacée : identifiant de conversation réel, ou clé dédiée au
  // contexte de création. Aucune clé générique partagée entre chats.
  const draftKey = isNewChatInput
    ? resolveNewChatDraftKey()
    : draftKeyForChatId(chatId);

  // Restauration unique par clé : au montage et à chaque changement de
  // conversation (navigation SPA incluse), contrairement à l'ancien
  // comportement gelé au premier montage.
  const restoredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (restoredKeyRef.current === draftKey) {
      return;
    }
    restoredKeyRef.current = draftKey;

    // setState dans l'effet : volontairement après peinture pour laisser le
    // changement de page s'afficher d'abord. Une garde sur ref suffit — l'effet
    // ne se réexécute qu'au changement de chatId.
    const timer = setTimeout(() => {
      setInput((current) => {
        // Une saisie déjà présente (ex. l'utilisateur a commencé à écrire
        // avant la fin de l'hydratation) ne doit jamais être écrasée.
        if (current.trim()) {
          return current;
        }
        return loadDraft(draftKey);
      });
    }, RESTORE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draftKey, setInput, textareaRef]);

  // Sauvegarde débounée : chaque conversation écrit UNIQUEMENT dans sa propre
  // clé. La clé capturée au moment de l'effet protège contre une écriture
  // tardive dans la clé d'un chat quitté (course de navigation).
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(draftKey, input);
    }, RESTORE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draftKey, input]);

  // Handoff Cloud -> chat : consommer la pièce jointe en attente
  // (sessionStorage), une seule fois par montage du compositeur.
  const didConsumePendingAttachmentRef = useRef(false);
  useEffect(() => {
    if (!isNewChatInput || didConsumePendingAttachmentRef.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    didConsumePendingAttachmentRef.current = true;
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
            contentType: pending.mediaType ?? "",
            name: pending.name ?? "",
            url: pending.url ?? "",
          } satisfies Attachment,
        ]);
      }
      if (pending.prompt) {
        setInput(pending.prompt);
      }
    } catch (error) {
      console.warn(
        "[chat-draft] Pièce jointe en attente illisible :",
        error instanceof Error ? error.message : error
      );
    }
  }, [isNewChatInput, setInput, setAttachments]);

  // Efface le brouillon de la conversation courante (après envoi). Expose
  // également un effacement de l'ancienne clé de compatibilité si un
  // navigateur en porte encore une.
  const clearCurrentDraft = useCallback(() => {
    clearDraft(draftKey);
    clearDraft(NEW_CHAT_DRAFT_KEY);
  }, [draftKey]);

  return {
    clearCurrentDraft,
    draftKey,
  };
}
