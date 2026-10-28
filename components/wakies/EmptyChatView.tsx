"use client";

import { ArrowUpIcon } from "@mdevs/icons/arrows/arrow-up";
import { ArrowUpRightIcon } from "@mdevs/icons/arrows/arrow-up-right";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { Settings2Icon } from "@mdevs/icons/controls/settings-2";
import { XIcon } from "@mdevs/icons/controls/x";
import { EllipsisVerticalIcon } from "@mdevs/icons/interface/ellipsis-vertical";
import { LinkIcon } from "@mdevs/icons/misc/link";
import { Button } from "@mdevs/ui/primitives/button";
import { DropdownMenu } from "@mdevs/ui/primitives/dropdown-menu";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";
import type React from "react";
import { FileLibrary } from "@/components/wakies/FileLibrary";
import { Mascot } from "@/components/wakies/Mascot";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import type { Dialog } from "@/components/wakies/WorkspaceDialog";
import {
  type CapacitesPieces,
  formatsPieces,
} from "@/lib/wakies/shared/model-attachments";
import type { State, Wakie, WorkspaceState } from "@/lib/wakies/shared/types";

export interface EmptyChatViewProps {
  accepteFichiers: boolean;
  bibliothequeOuverte: boolean;
  busy: boolean;
  capacitesFichiers: CapacitesPieces;
  configured: boolean;
  inputFichier: React.RefObject<HTMLInputElement | null>;
  newConvModel: string;
  onNewConversation: (text?: string) => Promise<void>;
  ouvrirReglages: () => void;
  prompt: string;
  selectedThread?: string;
  setBibliothequeOuverte: (val: boolean) => void;
  setCapacitesFichiers: (c: CapacitesPieces) => void;
  setDialog: (d: Dialog | undefined) => void;
  setNewConvModel: (val: string) => void;
  setPrompt: (val: string) => void;
  setSource: (val: string) => void;
  setSourceOpen: (val: boolean) => void;
  source: string;
  sourceOpen: boolean;
  state: State;
  wakie: Wakie;
  workspace: WorkspaceState;
}

export const EmptyChatView: React.FC<EmptyChatViewProps> = ({
  wakie,
  state,
  workspace,
  configured,
  busy,
  prompt,
  setPrompt,
  source,
  setSource,
  sourceOpen,
  setSourceOpen,
  newConvModel,
  setNewConvModel,
  capacitesFichiers,
  setCapacitesFichiers,
  accepteFichiers,
  bibliothequeOuverte,
  setBibliothequeOuverte,
  inputFichier,
  selectedThread,
  onNewConversation,
  setDialog,
  ouvrirReglages,
}) => (
  <div className="new-conversation">
    <div className="empty-chat-persona">
      <Mascot
        avatar={wakie.avatar}
        identity={wakie.id}
        name={wakie.name}
        state={state.settings.paused ? "paused" : "idle"}
      />
      <h2>{wakie.name}</h2>
      <p>{wakie.instructions}</p>
      <Button
        className="text-button"
        onClick={() =>
          setDialog({
            spaceId: wakie.spaceId ?? workspace.spaces[0]?.id ?? "",
            type: "wakie",
            wakie,
          })
        }
        variant="outline"
      >
        Modifier le spécialiste <EllipsisVerticalIcon size={14} />
      </Button>
    </div>
    {!configured && (
      <div className="setup-card">
        <span className="setup-icon">
          <Settings2Icon size={20} />
        </span>
        <div>
          <strong>Terminez la configuration</strong>
          <p>
            Choisissez un nom, une mascotte et des consignes de rôle pour ce
            Wakie. Vos Espaces et vos préférences sont déjà prêts.
          </p>
          <Button
            className="text-button"
            onClick={() =>
              setDialog({
                spaceId: wakie.spaceId ?? workspace.spaces[0]?.id ?? "",
                type: "wakie",
                wakie,
              })
            }
            type="button"
            variant="outline"
          >
            Personnaliser ce Wakie
            <ArrowUpRightIcon size={12} />
          </Button>
        </div>
      </div>
    )}
    <div className="chat-composer">
      {sourceOpen && (
        <div className="chat-composer-source">
          <LinkIcon size={14} />
          <Input
            aria-label="Lien source ou référence web"
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://exemple.fr/article-ou-documentation"
            value={source}
          />
          <Button
            aria-label="Retirer le lien source"
            className="icon-button"
            onClick={() => {
              setSourceOpen(false);
              setSource("");
            }}
            type="button"
            variant="ghost"
          >
            <XIcon size={14} />
          </Button>
        </div>
      )}
      <form
        className="composer chat-composer-box"
        onSubmit={(e) => {
          e.preventDefault();
          const fullText = source.trim()
            ? `${source.trim()}\n\n${prompt}`
            : prompt;
          void onNewConversation(fullText);
        }}
      >
        <div className="chat-compose-row">
          {accepteFichiers && (
            <FileLibrary
              onOpenChange={setBibliothequeOuverte}
              onSelect={(piece) => {
                void onNewConversation(
                  prompt
                    ? `${prompt}\n[Fichier: ${piece.nom}]`
                    : `Consultons le document : ${piece.nom}`
                );
              }}
              open={bibliothequeOuverte}
              sansDeclencheur
            />
          )}
          <input
            accept={formatsPieces(capacitesFichiers)}
            className="visually-hidden-input"
            disabled={!configured || busy}
            multiple
            onChange={(event) => {
              const fichiers = [...(event.target.files ?? [])];
              if (fichiers.length > 0) {
                void onNewConversation(
                  prompt
                    ? `${prompt}\n[Fichiers joints : ${fichiers.map((f) => f.name).join(", ")}]`
                    : `Fichiers joints : ${fichiers.map((f) => f.name).join(", ")}`
                );
              }
              event.target.value = "";
            }}
            ref={inputFichier}
            tabIndex={-1}
            type="file"
          />
          <DropdownMenu
            items={[
              ...(accepteFichiers
                ? [
                    {
                      id: "importer",
                      label: "Importer un fichier",
                      onSelect: () => inputFichier.current?.click(),
                    },
                    {
                      id: "bibliotheque",
                      label: "Choisir dans Mes fichiers",
                      onSelect: () => setBibliothequeOuverte(true),
                    },
                  ]
                : []),
              ...(selectedThread
                ? [
                    {
                      id: "tache",
                      label: "Planifier une tâche",
                      onSelect: () =>
                        setDialog({
                          conversationId: selectedThread,
                          type: "schedule",
                        }),
                    },
                  ]
                : []),
              {
                id: "source",
                label: sourceOpen
                  ? "Retirer le lien source"
                  : "Ajouter un lien source",
                onSelect: () => {
                  if (sourceOpen) setSource("");
                  setSourceOpen(!sourceOpen);
                },
              },
            ]}
            label="Ajouter au message"
            trigger={
              <Button
                aria-label="Ajouter au message"
                className="icon-button"
                type="button"
                variant="ghost"
              >
                <PlusIcon size={19} />
              </Button>
            }
          />
          <span className="wakies-model-picker">
            <ModelPicker
              disabled={busy}
              modeleEffectif={newConvModel || wakie.model || undefined}
              onCapacitesPieces={setCapacitesFichiers}
              onChoisir={(choisi) => setNewConvModel(choisi ?? "")}
              valeur={newConvModel}
            />
          </span>
          <Textarea
            aria-label={`Message à ${wakie.name}`}
            disabled={!configured}
            maxLength={4000}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              configured
                ? `Message à ${wakie.name}…`
                : "Votre première conversation démarre après la configuration."
            }
            rows={1}
            value={prompt}
          />
          <Button
            aria-label="Démarrer la conversation"
            className="send-button"
            disabled={!configured || busy || !prompt.trim()}
            type="submit"
            variant="solid"
          >
            <ArrowUpIcon size={19} />
          </Button>
        </div>
      </form>
    </div>
    <div className="starter-suggestions">
      {[
        "Aidez-moi à réfléchir à cela",
        "Étudier une page publique",
        "Établir un plan que je puisse suivre",
      ].map((text) => (
        <Button
          disabled={!configured}
          key={text}
          onClick={() => setPrompt(text)}
          variant="outline"
        >
          {text}
          <ArrowUpRightIcon size={12} />
        </Button>
      ))}
    </div>
    <div className="connection-note">
      <span className={`online-dot ${workspace.setup.model ? "" : "off"}`} />
      Modèle servi par votre compte mAI
      <Button
        className="text-button"
        onClick={() => ouvrirReglages()}
        variant="outline"
      >
        Détails de la configuration
      </Button>
    </div>
  </div>
);
