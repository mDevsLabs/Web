"use client";

import { BookOpenIcon } from "@mdevs/icons/files/book-open";
import { EllipsisVerticalIcon } from "@mdevs/icons/interface/ellipsis-vertical";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { Button } from "@mdevs/ui/primitives/button";
import type React from "react";
import { Mascot } from "@/components/wakies/Mascot";
import type { Dialog } from "@/components/wakies/WorkspaceDialog";
import type { State } from "@/lib/wakies/shared/types";

export interface MemoriesScreenProps {
  memories: State["memories"];
  settings: State["settings"];
  setDialog: (d: Dialog | undefined) => void;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  memories,
  settings,
  setDialog,
  onDeleteMemory,
}) => {
  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">VOTRE ESPACE DE TRAVAIL</span>
          <h1>Mémoires</h1>
          <p>
            Les préférences que vous choisissez de partager avec vos Wakies.
          </p>
        </div>
        <Button
          className="primary"
          onClick={() => setDialog({ type: "memory" })}
          variant="solid"
        >
          <PlusIcon size={15} />
          Ajouter une mémoire
        </Button>
      </div>

      <div className="memory-grid">
        {memories.map((memory) => (
          <article className="memory-card" key={memory.id}>
            <BookOpenIcon size={18} />
            <p>{memory.text}</p>
            <div>
              <small>
                {settings.memoryAllowed
                  ? "Disponible pour les Wakies autorisés"
                  : "Utilisation des mémoires désactivée"}
              </small>
              <Button
                aria-label="Modifier la mémoire"
                className="icon-button"
                onClick={() => setDialog({ memory, type: "memory" })}
                variant="ghost"
              >
                <EllipsisVerticalIcon size={17} />
              </Button>
              <Button
                aria-label="Supprimer la mémoire"
                className="icon-button"
                onClick={() => void onDeleteMemory(memory.id)}
                variant="ghost"
              >
                <Trash2Icon size={15} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!memories.length && (
        <div className="large-empty">
          <Mascot />
          <h2>Un peu de contexte change beaucoup de choses.</h2>
          <p>
            Ajoutez une préférence comme « Garder mes synthèses de recherche
            courtes ». Vous pourrez la modifier ou la supprimer à tout moment.
          </p>
        </div>
      )}
    </main>
  );
};
