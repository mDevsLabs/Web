"use client";

import { CopyIcon } from "@mdevs/icons/misc/copy";
import { DownloadIcon } from "@mdevs/icons/misc/download";
import { Share2Icon } from "@mdevs/icons/misc/share-2";
/** Le QR code est généré localement à partir du lien public ; aucune publication implicite ni service externe. */
import { Button } from "@mdevs/ui/primitives/button";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { lienPartageWakie } from "@/lib/wakies/shared/sharing";

export function WakieShare({
  id,
  name,
  isPublic,
  disabled = false,
}: {
  id: string;
  name: string;
  isPublic: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lien, setLien] = useState("");
  const [qr, setQr] = useState("");
  const [erreur, setErreur] = useState("");
  const [avis, setAvis] = useState("");
  const [reprise, setReprise] = useState(0);
  const racine = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!open || !isPublic) return;
    let actif = true;
    setQr("");
    setErreur("");
    setAvis("");
    setLien("");
    void Promise.resolve()
      .then(() => {
        const url = lienPartageWakie(
          id,
          window.location.origin,
          process.env.NEXT_PUBLIC_BASE_PATH ?? ""
        );
        if (actif) setLien(url);
        return import("qrcode").then((module) => ({ module, url }));
      })
      .then(({ module, url }) =>
        module.default.toDataURL(url, {
          color: { dark: "#000000", light: "#ffffff" },
          errorCorrectionLevel: "M",
          margin: 4,
          width: 640,
        })
      )
      .then((data) => {
        if (actif) setQr(data);
      })
      .catch(() => {
        if (actif)
          setErreur(
            "Le QR code n’a pas pu être généré. Vous pouvez toujours copier le lien."
          );
      });
    return () => {
      actif = false;
    };
  }, [open, isPublic, id, reprise]);
  useEffect(() => {
    if (!isPublic) setOpen(false);
  }, [isPublic]);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setAvis("Lien copié.");
    } catch {
      setAvis(
        "Copie indisponible. Sélectionnez le lien pour le copier manuellement."
      );
    }
  };
  return (
    <div className="wakies-share" ref={racine}>
      <Dialog.Root onOpenChange={setOpen} open={open}>
        <Dialog.Trigger asChild>
          <Button
            disabled={disabled || !isPublic}
            onClick={() =>
              setContainer(
                racine.current?.closest<HTMLElement>(".wakies-root") ?? null
              )
            }
            type="button"
            variant="outline"
          >
            <Share2Icon aria-hidden="true" size={16} /> Partager ce Wakie
          </Button>
        </Dialog.Trigger>
        {isPublic ? null : (
          <p className="muted">
            Enregistrez la fiche avec « Visible dans l’annuaire public » pour
            activer le partage.
          </p>
        )}
        <Dialog.Portal container={container}>
          <Dialog.Overlay className="wakies-file-overlay" />
          <Dialog.Content
            className="wakies-file-dialog wakies-share-dialog"
            data-app-update-blocked={open ? "true" : undefined}
          >
            <Dialog.Title>Partager {name}</Dialog.Title>
            <Dialog.Description>
              Ce lien ouvre la fiche publique du Wakie. Scannez le QR code ou
              copiez le lien.
            </Dialog.Description>
            <label className="field-label">
              Lien de la fiche publique
              <input
                onFocus={(event) => event.currentTarget.select()}
                readOnly
                value={lien}
              />
            </label>
            <Button
              disabled={!lien}
              onClick={() => void copier()}
              variant="outline"
            >
              <CopyIcon aria-hidden="true" size={16} /> Copier le lien
            </Button>
            {qr ? (
              <div className="wakies-share-qr">
                <img
                  alt={`QR code vers la fiche publique de ${name}`}
                  height={256}
                  src={qr}
                  width={256}
                />
                <a
                  className="md-button md-button-outline md-button-md"
                  download={`wakie-${id}.png`}
                  href={qr}
                >
                  <DownloadIcon aria-hidden="true" size={16} /> Télécharger le
                  QR code
                </a>
              </div>
            ) : (
              <p className="muted" role="status">
                {erreur ? "QR code indisponible." : "Génération du QR code…"}
              </p>
            )}
            {erreur ? (
              <div className="sidebar-error" role="alert">
                <p>{erreur}</p>
                <Button
                  onClick={() => setReprise((value) => value + 1)}
                  variant="outline"
                >
                  Réessayer le QR code
                </Button>
              </div>
            ) : null}
            {avis ? (
              <p className="muted" role="status">
                {avis}
              </p>
            ) : null}
            <Dialog.Close asChild>
              <Button aria-label="Fermer le partage" variant="ghost">
                Fermer
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
