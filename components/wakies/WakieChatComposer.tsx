"use client";

import { ArrowUpIcon } from "@mdevs/icons/arrows/arrow-up";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { XIcon } from "@mdevs/icons/controls/x";
import { SquareStopIcon } from "@mdevs/icons/interface/square-stop";
import { LinkIcon } from "@mdevs/icons/misc/link";
import { ReplyIcon } from "@mdevs/icons/misc/reply";
import { Button } from "@mdevs/ui/primitives/button";
import { DropdownMenu } from "@mdevs/ui/primitives/dropdown-menu";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";
import type { UIMessage } from "ai";
import type React from "react";
import {
  assainirNom,
  type EtatPiece,
  formaterTaille,
} from "@/components/wakies/attachments";
import { ComposerAides } from "@/components/wakies/ComposerAides";
import {
  ComposerMentions,
  type ComposerMentionsHandle,
} from "@/components/wakies/ComposerMentions";
import { FileLibrary } from "@/components/wakies/FileLibrary";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import {
  acceptePiece,
  type CapacitesPieces,
  formatsPieces,
} from "@/lib/wakies/shared/model-attachments";
import { texteDe } from "@/lib/wakies/shared/transcript";
import type { Conversation, Wakie } from "@/lib/wakies/shared/types";

export interface WakieChatComposerProps {
  depotActif: boolean;
  setDepotActif: (val: boolean) => void;
  ajouterPieces: (fichiers: File[]) => Promise<void>;
  retirerPiece: (idLocal: string) => void;
  enCours: boolean;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  pieces: EtatPiece[];
  setPieces: React.Dispatch<React.SetStateAction<EtatPiece[]>>;
  source: string;
  setSource: (val: string) => void;
  sourceOpen: boolean;
  setSourceOpen: (val: boolean) => void;
  queue: {
    enqueue: (item: { id: string; text: string }) => void;
    pause: () => void;
    resume: () => void;
    remove: (id: string) => void;
  };
  setErreur: (err: string) => void;
  envoyer: (texte: string, avecPieces?: boolean, messageId?: string) => Promise<void>;
  reponseA: UIMessage | null;
  setReponseA: (msg: UIMessage | null) => void;
  reponseRef: React.MutableRefObject<string | null>;
  nomsWakies: Map<string, string>;
  accepteFichiers: boolean;
  capacitesFichiers: CapacitesPieces;
  setCapacitesFichiers: (c: CapacitesPieces) => void;
  bibliothequeOuverte: boolean;
  setBibliothequeOuverte: (val: boolean) => void;
  inputFichier: React.RefObject<HTMLInputElement | null>;
  modeleEnCours: boolean;
  paused: boolean;
  onSchedule: () => void;
  thread: Conversation;
  wakie: Wakie;
  changerModele: (modele: string | null) => Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  composition: React.MutableRefObject<boolean>;
  mentionsRef: React.RefObject<ComposerMentionsHandle | null>;
  insererMention: (texte: string, curseurApres: number) => void;
  envoiEnCours: boolean;
  contextePret: boolean;
  stop: () => Promise<void> | void;
  pieceEnEchec?: EtatPiece;
}

export const WakieChatComposer: React.FC<WakieChatComposerProps> = ({
  depotActif,
  setDepotActif,
  ajouterPieces,
  retirerPiece,
  enCours,
  draft,
  setDraft,
  pieces,
  setPieces,
  source,
  setSource,
  sourceOpen,
  setSourceOpen,
  queue,
  setErreur,
  envoyer,
  reponseA,
  setReponseA,
  reponseRef,
  nomsWakies,
  accepteFichiers,
  capacitesFichiers,
  setCapacitesFichiers,
  bibliothequeOuverte,
  setBibliothequeOuverte,
  inputFichier,
  modeleEnCours,
  paused,
  onSchedule,
  thread,
  wakie,
  changerModele,
  textareaRef,
  composition,
  mentionsRef,
  insererMention,
  envoiEnCours,
  contextePret,
  stop,
  pieceEnEchec,
}) => {
  return (
    <form
      className="chat-composer"
      onDragLeave={() => setDepotActif(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setDepotActif(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDepotActif(false);
        const fichiers = [...(event.dataTransfer?.files ?? [])];
        if (fichiers.length > 0) {
          void ajouterPieces(fichiers);
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (enCours) {
          if (!draft.trim()) return;
          if (pieces.length || source) {
            setErreur(
              "La file temporaire accepte du texte. Gardez les pièces jointes pour le prochain envoi."
            );
            return;
          }
          queue.enqueue({ id: crypto.randomUUID(), text: draft });
          setDraft("");
        } else void envoyer(draft).catch(() => {});
      }}
    >
      {/* La citation de réponse est EN TÊTE du composer */}
      {reponseA ? (
        <div className="chat-reply-banner">
          <ReplyIcon size={13} />
          <span className="chat-reply-auteur">
            {reponseA.role === "user"
              ? "Vous"
              : (nomsWakies.get(
                  ((reponseA.metadata ?? {}) as { authorWakieId?: string })
                    .authorWakieId ?? ""
                ) ?? "Wakie")}
          </span>
          <span className="chat-reply-extrait">
            {texteDe(reponseA).replace(/\s+/g, " ").trim().slice(0, 120) ||
              "Pièce jointe"}
          </span>
          <Button
            aria-label="Annuler la réponse"
            className="icon-button"
            onClick={() => {
              setReponseA(null);
              reponseRef.current = null;
            }}
            type="button"
            variant="ghost"
          >
            <XIcon size={13} />
          </Button>
        </div>
      ) : null}

      {depotActif ? (
        <div className="composer-dropzone" role="presentation">
          Déposez vos fichiers ici
        </div>
      ) : null}

      {pieces.length > 0 ? (
        <ul className="composer-pieces">
          {pieces.map((piece) => (
            <li
              className={`composer-piece is-${piece.etat}`}
              key={piece.idLocal}
            >
              <span className="composer-piece-name">
                {assainirNom(piece.nom)}
              </span>
              <span className="composer-piece-meta">
                {formaterTaille(piece.taille)}
                {piece.etat === "envoi"
                  ? " · envoi en cours…"
                  : piece.etat === "pret"
                    ? " · prêt"
                    : piece.etat === "echec"
                      ? ` · échec — ${piece.erreur ?? "raison inconnue"}`
                      : " · en attente"}
              </span>
              {piece.biblio ? (
                <span className={`composer-piece-biblio is-${piece.biblio}`}>
                  {piece.biblio === "ok"
                    ? "copié dans votre bibliothèque"
                    : piece.biblio === "deja"
                      ? "déjà dans votre bibliothèque"
                      : piece.biblio === "plein"
                        ? "bibliothèque cloud pleine — non importé"
                        : "bibliothèque injoignable — non importé"}
                </span>
              ) : null}
              <Button
                aria-label={`Retirer ${assainirNom(piece.nom)}`}
                className="icon-button"
                onClick={() => retirerPiece(piece.idLocal)}
                type="button"
                variant="ghost"
              >
                <XIcon size={13} />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {sourceOpen && (
        <div className="source-input">
          <LinkIcon size={15} />
          <Input
            aria-label="Adresse de la page source"
            onChange={(event) => setSource(event.target.value)}
            placeholder="https://exemple.fr/page"
            type="url"
            value={source}
          />
          <Button
            aria-label="Retirer la source"
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

      <div className="chat-compose-row">
        {accepteFichiers && (
          <FileLibrary
            onOpenChange={setBibliothequeOuverte}
            onSelect={(piece) => {
              if (!acceptePiece(piece.type, capacitesFichiers))
                throw new Error(
                  "Ce fichier est incompatible avec le modèle choisi."
                );
              setPieces((current) =>
                current.some(
                  (item) => item.pathname === piece.pathname && !item.retire
                )
                  ? current
                  : [...current, piece]
              );
            }}
            open={bibliothequeOuverte}
            sansDeclencheur
          />
        )}
        <input
          accept={formatsPieces(capacitesFichiers)}
          className="visually-hidden-input"
          disabled={!accepteFichiers || modeleEnCours || paused || enCours}
          multiple
          onChange={(event) => {
            const fichiers = [...(event.target.files ?? [])];
            if (fichiers.length > 0) {
              void ajouterPieces(fichiers);
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
            {
              id: "tache",
              label: "Planifier une tâche",
              onSelect: onSchedule,
            },
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
            disabled={enCours || modeleEnCours}
            modeleEffectif={thread.model || wakie.model || undefined}
            onCapacitesPieces={setCapacitesFichiers}
            onChoisir={(choisi) => void changerModele(choisi)}
            valeur={thread.model ?? ""}
          />
        </span>
        {modeleEnCours ? (
          <span className="wakies-model-saving" role="status">
            Enregistrement…
          </span>
        ) : null}
        <Textarea
          aria-label={`Message à ${wakie.name}`}
          maxLength={4000}
          onChange={(event) => {
            setDraft(event.target.value);
            event.target.style.height = "auto";
            event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`;
          }}
          onCompositionEnd={() => {
            composition.current = false;
          }}
          onCompositionStart={() => {
            composition.current = true;
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || composition.current) {
              return;
            }
            if (mentionsRef.current?.traiterCle(event)) {
              event.preventDefault();
              return;
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`Message à ${wakie.name}…`}
          ref={textareaRef}
          rows={1}
          value={draft}
        />
        {enCours && draft.trim() && (
          <Button
            disabled={paused || envoiEnCours}
            type="submit"
            variant="outline"
          >
            Mettre en attente
          </Button>
        )}
        {enCours ? (
          <Button
            aria-label="Arrêter la réponse"
            className="send-button"
            onClick={() => {
              queue.pause();
              void stop();
            }}
            type="button"
            variant="solid"
          >
            <SquareStopIcon size={16} />
          </Button>
        ) : (
          <Button
            aria-label="Envoyer le message"
            className="send-button"
            disabled={
              !draft.trim() ||
              !contextePret ||
              paused ||
              envoiEnCours ||
              modeleEnCours
            }
            type="submit"
            variant="solid"
          >
            <ArrowUpIcon size={19} />
          </Button>
        )}
      </div>
      <ComposerAides
        brouillon={draft}
        onChoisir={setDraft}
        textareaRef={textareaRef}
      />
      <ComposerMentions
        brouillon={draft}
        handleRef={mentionsRef}
        onChoisir={insererMention}
        textareaRef={textareaRef}
      />
      {/*
        Aucune note de bas de champ à l'état nominal : l'ancienne promesse
        « Le texte est prêt. La voix temps réel arrive dans une phase
        suivante. » s'affichait en permanence parce que
        `lib/wakies/setup.ts` fige `voice: false`, et n'annonçait rien qui ne
        soit déjà écrit dans docs/3-wakies/INTEGRATION.md § 6. Il ne reste que
        l'échec, qui doit, lui, rester visible.
      */}
      {pieceEnEchec && (
        <div className="chat-compose-note is-error">
          {pieceEnEchec.erreur ?? "Un fichier n'a pas pu être envoyé."} Le
          texte reste prêt à être envoyé.
        </div>
      )}
    </form>
  );
};
