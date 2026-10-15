"use client";

import { Button } from "@mdevs/ui/primitives/button";
import type React from "react";
import type { Conversation } from "@/lib/wakies/shared/types";

export interface ForwardMessageModalProps {
  transfert: string | null;
  setTransfert: (val: string | null) => void;
  transfertVers: string;
  setTransfertVers: (val: string) => void;
  transfertEnCours: boolean;
  onTransferer: () => Promise<void>;
  conversations?: Conversation[];
  threadId: string;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  transfert,
  setTransfert,
  transfertVers,
  setTransfertVers,
  transfertEnCours,
  onTransferer,
  conversations,
  threadId,
}) => {
  if (!transfert) return null;

  return (
    <section aria-label="Transférer le message" className="chat-forward">
      <strong>Transférer vers…</strong>
      <ul>
        {(conversations ?? [])
          .filter((conversation) => conversation.id !== threadId)
          .map((conversation) => (
            <li key={conversation.id}>
              <label>
                <input
                  checked={transfertVers === conversation.id}
                  name="transfert"
                  onChange={() => setTransfertVers(conversation.id)}
                  type="radio"
                  value={conversation.id}
                />
                <span>{conversation.title}</span>
              </label>
            </li>
          ))}
      </ul>
      {(conversations ?? []).length < 2 ? (
        <p className="muted">
          Aucune autre conversation : ouvrez-en une pour y transférer un
          message.
        </p>
      ) : null}
      <div className="chat-forward-actions">
        <Button
          disabled={!transfertVers || transfertEnCours}
          onClick={onTransferer}
          type="button"
          variant="solid"
        >
          Transférer
        </Button>
        <Button
          onClick={() => {
            setTransfert(null);
            setTransfertVers("");
          }}
          type="button"
          variant="outline"
        >
          Annuler
        </Button>
      </div>
    </section>
  );
};
