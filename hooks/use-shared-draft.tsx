"use client";

import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { Attachment } from "@/lib/types";

// Brouillon partagé entre le mode Chat et le mode Agent.
//
// ── Le bug ─────────────────────────────────────────────────────────────────
// `components/chat/shell.tsx` rend DEUX branches exclusives : `AgentShell` d'un
// côté, le Chat de l'autre. Basculer DÉMONTE le compositeur et en monte un neuf.
// Avant ce module :
//
// - le texte du Chat vivait dans `ActiveChatProvider` — il survit en mémoire
//   mais reste invisible en mode Agent ;
// - les pièces jointes du Chat vivaient dans un `useState` de `ChatShell`,
//   effacées par l'effet de changement de conversation (`shell.tsx`) ;
// - TOUT l'état de l'Agent vivait dans des `useState` locaux de `AgentComposer`,
//   donc perdus à chaque bascule, dans les deux sens, sans aucune persistance.
//
// Aggravant : les deux gestionnaires de bascule font `router.push("/")`, ce qui
// change le `chatId` et déclenche deux effets de purge — `use-active-chat.tsx`
// (vide l'input) et `shell.tsx` (vide les pièces jointes). Sans exception, le
// brouillon disparaît même si le compositeur survivait.
//
// ── Pourquoi UN SEUL module suffit, sans miroir de texte ───────────────────
// Le store ne porte QUE les pièces jointes. Le texte garde son propriétaire
// actuel, `ActiveChatProvider.input`, qui est déjà monté au-dessus du point de
// bascule : il survit donc déjà à la bascule, il était seulement inaccessible au
// compositeur de l'Agent. Dupliquer le texte dans un second store créerait deux
// vérités à synchroniser et une dérive silencieuse ; `AgentComposer` lit donc
// directement `input`/`setInput` du contexte actif.
//
// ── Portée ─────────────────────────────────────────────────────────────────
// Rien n'est écrit en `localStorage`. Le brouillon par conversation existe déjà
// (`lib/chat/drafts.ts`, via `use-drafts`) et continue de gérer la persistance au
// rechargement pour le mode Chat. Ce store ne tient que l'état en mémoire à
// travers une bascule de mode — exactement le périmètre du bug. On n'ajoute pas
// le mode Agent au TTL des brouillons sans l'avoir décidé.
//
// ── Pièces jointes ─────────────────────────────────────────────────────────
// Ce sont déjà des URL HTTP permanentes (`lib/types.ts` : `Attachment` porte une
// `url`, pas un `File`). Transférer un `Attachment[]` d'un mode à l'autre ne
// demande donc AUCUN ré-upload : c'est ce qui rend ce correctif peu coûteux.

type SharedDraftContextValue = {
  /** Pièces jointes courantes, déjà uploadées. */
  attachments: Attachment[];
  clearAttachments: () => void;
  consumePreserveRequest: () => boolean;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  requestPreserveDraft: () => void;
};

/**
 * Signal à durée d'UNE navigation, isolé dans une closure pure pour être
 * testable sans React (ce dépôt teste en environnement `node`, sans
 * testing-library).
 *
 * Consommer plutôt que lire est délibéré : le signal vaut pour une seule
 * navigation. Un second changement de conversation — pour un vrai motif, pas
 * pour une bascule — doit donc purger normalement, sinon l'exception ponctuelle
 * deviendrait une fuite qui garde le texte d'une conversation dans une autre.
 */
export function createPreserveSignal(): {
  consume: () => boolean;
  request: () => void;
} {
  let pending = false;
  return {
    consume: () => {
      const wasPending = pending;
      pending = false;
      return wasPending;
    },
    request: () => {
      pending = true;
    },
  };
}

const SharedDraftContext = createContext<SharedDraftContextValue | null>(null);

export function SharedDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const signal = useRef(createPreserveSignal()).current;

  const value = useMemo<SharedDraftContextValue>(
    () => ({
      attachments,
      clearAttachments: () => setAttachments([]),
      consumePreserveRequest: signal.consume,
      requestPreserveDraft: signal.request,
      setAttachments,
    }),
    [attachments, signal]
  );

  return (
    <SharedDraftContext.Provider value={value}>
      {children}
    </SharedDraftContext.Provider>
  );
}

/**
 * Accès au brouillon partagé. Lève hors provider : une page qui l'utiliserait
 * hors de `app/(chat)/layout.tsx` perdrait silencieusement les pièces jointes,
 * ce qu'on préfère voir échouer au premier rendu plutôt qu'à l'envoi d'un
 * message sans ses images.
 */
export function useSharedDraft(): SharedDraftContextValue {
  const context = useContext(SharedDraftContext);
  if (!context) {
    throw new Error(
      "useSharedDraft doit être utilisé dans un <SharedDraftProvider>."
    );
  }
  return context;
}
