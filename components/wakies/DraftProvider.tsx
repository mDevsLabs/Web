"use client";

/** Brouillons en mémoire de la session d'interface, isolés par conversation ; aucune promesse d'exécution en arrière-plan. */
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ConversationQueue } from "@/lib/wakies/shared/conversation-queue";

type Drafts = Record<string, string>;
const Context = createContext<{
  drafts: Drafts;
  setDrafts: Dispatch<SetStateAction<Drafts>>;
  queues: Map<string, ConversationQueue>;
} | null>(null);
export function WakiesDraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Drafts>({});
  const queues = useRef(new Map<string, ConversationQueue>());
  return (
    <Context.Provider value={{ drafts, queues: queues.current, setDrafts }}>
      {children}
    </Context.Provider>
  );
}
export function useConversationDraft(
  id: string
): [string, Dispatch<SetStateAction<string>>, ConversationQueue] {
  const state = useContext(Context);
  const setDraft = useCallback<Dispatch<SetStateAction<string>>>(
    (value) => {
      state?.setDrafts((prior) => ({
        ...prior,
        [id]: typeof value === "function" ? value(prior[id] ?? "") : value,
      }));
    },
    [id, state?.setDrafts]
  );
  if (!state) throw new Error("Fournisseur de brouillons Wakies absent.");
  if (!state.queues.has(id)) state.queues.set(id, new ConversationQueue());
  return [
    state.drafts[id] ?? "",
    setDraft,
    state.queues.get(id) as ConversationQueue,
  ];
}
