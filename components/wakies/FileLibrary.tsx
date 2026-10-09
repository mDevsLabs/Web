"use client";
/** La bibliothèque des blobs privés mAI reste isolée par le serveur, sans clé ni URL durable dans le navigateur. */
import { FileTextIcon } from "@mdevs/icons/files/file-text";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { Button } from "@mdevs/ui/primitives/button";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import {
  type EtatPiece,
  FORMATS_TELEVERSABLES,
  formaterTaille,
} from "@/components/wakies/attachments";
import { safeAttachmentLink } from "@/lib/wakies/shared/messages";

type SavedFile = {
  pathname: string;
  name: string;
  size: number;
  uploadedAt: number;
};
type FilePage = { files: SavedFile[]; cursor: string | null };
type FileDetails = Omit<SavedFile, "uploadedAt"> & {
  mediaType: string;
  url: string | null;
};
export function FileLibrary({
  onSelect,
}: {
  onSelect: (piece: EtatPiece) => void;
}) {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<FileDetails | null>(null);
  useEffect(() => {
    if (typeof document !== "undefined") {
      setContainer(document.querySelector<HTMLElement>(".wakies-root"));
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setFiles([]);
    setPreview(null);
    setError("");
    setBusy(true);
    void api<FilePage>("/files", "GET", undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setFiles(data.files);
          setCursor(data.cursor);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Lecture impossible."
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [open]);
  const detail = (file: SavedFile) =>
    api<FileDetails>(`/files?pathname=${encodeURIComponent(file.pathname)}`);
  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <Button
          aria-label="Choisir un fichier enregistré"
          className="icon-button"
          onClick={() =>
            setContainer(document.querySelector<HTMLElement>(".wakies-root"))
          }
          type="button"
          variant="ghost"
        >
          <FileTextIcon size={18} />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="wakies-file-overlay" />
        <Dialog.Content className="wakies-file-dialog">
          <Dialog.Title>Mes fichiers mAI</Dialog.Title>
          <Dialog.Description>
            Les pièces jointes privées de votre compte, accessibles sur vos
            appareils.
          </Dialog.Description>
          {error && <p role="alert">{error}</p>}
          {busy && <p role="status">Chargement…</p>}
          {!busy && files.length === 0 && (
            <p>
              Aucun fichier enregistré. Téléversez un fichier depuis la
              conversation.
            </p>
          )}
          <ul className="wakies-file-list">
            {files.map((file) => (
              <li key={file.pathname}>
                <div>
                  <strong>{file.name}</strong>
                  <small>{formaterTaille(file.size)}</small>
                </div>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const metadata = await detail(file);
                      if (!FORMATS_TELEVERSABLES[metadata.mediaType])
                        throw new Error(
                          "Ce format ne peut pas être joint au chat."
                        );
                      onSelect({
                        etat: "pret",
                        idLocal: `library:${file.pathname}`,
                        nom: file.name,
                        pathname: file.pathname,
                        progression: 1,
                        taille: metadata.size,
                        type: metadata.mediaType,
                      });
                      setOpen(false);
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Sélection impossible."
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  type="button"
                  variant="outline"
                >
                  Joindre
                </Button>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      setPreview(await detail(file));
                    } catch {
                      setError("Ce fichier n’est plus disponible.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  type="button"
                  variant="outline"
                >
                  Consulter
                </Button>
                <Button
                  aria-label={`Supprimer ${file.name}`}
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Supprimer définitivement ce fichier ? Les pièces jointes existantes deviendront indisponibles."
                      )
                    )
                      return;
                    setBusy(true);
                    setError("");
                    try {
                      await api("/files", "DELETE", {
                        pathname: file.pathname,
                      });
                      setFiles((current) =>
                        current.filter(
                          (item) => item.pathname !== file.pathname
                        )
                      );
                      setPreview(null);
                    } catch {
                      setError("Suppression impossible. Réessayez.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  type="button"
                  variant="outline"
                >
                  <Trash2Icon size={16} />
                </Button>
              </li>
            ))}
          </ul>
          {preview && (
            <section>
              <h3>{preview.name}</h3>
              <p>
                {preview.mediaType} · {formaterTaille(preview.size)}
              </p>
              {safeAttachmentLink(preview.url) ? (
                <a
                  href={safeAttachmentLink(preview.url) ?? undefined}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ouvrir ou télécharger le fichier
                </a>
              ) : (
                <p>Fichier indisponible.</p>
              )}
            </section>
          )}
          {cursor && (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const next = await api<FilePage>(
                    `/files?cursor=${encodeURIComponent(cursor)}`
                  );
                  setFiles((current) => [
                    ...current,
                    ...next.files.filter(
                      (file) =>
                        !current.some((item) => item.pathname === file.pathname)
                    ),
                  ]);
                  setCursor(next.cursor);
                } catch {
                  setError("Les fichiers suivants n’ont pas pu être chargés.");
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
              variant="outline"
            >
              Charger les suivants
            </Button>
          )}
          <Dialog.Close asChild>
            <Button className="primary" type="button" variant="solid">
              Fermer
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
