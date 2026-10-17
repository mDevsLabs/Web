"use client";

/**
 * Tiroir de FICHE d'un Wakie : ce que le compte publie de lui.
 *
 * Pourquoi ce composant existe à côté du dialogue « Personnaliser le Wakie » :
 * ils ne parlent pas de la même chose. Le dialogue règle le TRAVAIL (nom,
 * instructions, modèle, capacités) et n'appartient qu'au propriétaire. La fiche
 * règle la VITRINE (pseudo, bio, liens, persona publiée, images) — c'est ce
 * qu'un autre compte voit, et c'est donc la seule surface où l'on décide d'être
 * visible.
 *
 * La galerie est SIGNÉE par le serveur : les `pathname` de blobs ne sont pas
 * des URL. L'image téléversée ici passe par le même chemin que les pièces
 * jointes d'une conversation (`televerser`), et le quota affiché est celui que
 * le serveur applique — `quota: null` veut dire illimité, pas « inconnu ».
 *
 * Une image au blob disparu s'affiche « indisponible » : la fiche ne casse pas
 * et n'invente pas de vignette.
 */

import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/components/wakies/api";
import { motifRefus, televerser } from "@/components/wakies/attachments";
import { Mascot } from "@/components/wakies/Mascot";
import { WakieShare } from "@/components/wakies/WakieShare";
import { acceptePiece } from "@/lib/wakies/shared/model-attachments";
import type { Wakie } from "@/lib/wakies/shared/types";

type Fiche = {
  images: Array<{ alt: string; id: string; url: string | null }>;
  profil: {
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string;
    handle: string | null;
    // `isPublic` peut manquer sur un profil fraîchement créé : la fiche
    // affiche alors les valeurs du Wakie, jamais un faux « privé ».
    isPublic?: boolean;
    links: string[];
    name: string;
    personaPubliee?: string;
  };
};

export function WakieProfileDrawer({
  onChanged,
  onClose,
  wakie,
}: {
  /** Recharge l'espace de travail après une publication. */
  onChanged?: () => Promise<void>;
  onClose: () => void;
  wakie: Wakie;
}) {
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [quota, setQuota] = useState<number | null>();
  const [chargement, setChargement] = useState(true);
  const [reprise, setReprise] = useState(0);
  const [bio, setBio] = useState("");
  const [handle, setHandle] = useState("");
  const [liens, setLiens] = useState("");
  const [persona, setPersona] = useState("");
  const [publie, setPublie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [avis, setAvis] = useState("");
  const [busy, setBusy] = useState(false);
  const [televerse, setTeleverse] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const operation = useRef(false);
  const formulaireCharge = useRef(false);
  const publicInitial = useRef(wakie.isPublic ?? false);
  const indisponible = chargement || fiche === null || busy || televerse;
  const limiteAtteinte =
    quota !== undefined &&
    quota !== null &&
    (fiche?.images.length ?? 0) >= quota;
  const brouillonModifie =
    fiche !== null &&
    (bio !== (fiche.profil.bio ?? "") ||
      handle !== (fiche.profil.handle ?? "") ||
      liens !== (fiche.profil.links ?? []).join("\n") ||
      persona !== (fiche.profil.personaPubliee ?? "") ||
      publie !== (fiche.profil.isPublic ?? publicInitial.current));

  /**
   * Recharge la fiche ET la galerie. Seule la lecture initiale ou la sauvegarde
   * remplit le formulaire : modifier la galerie ne doit pas effacer le brouillon.
   *
   * Elle dépend de l'identifiant du Wakie — donc changer de Wakie recharge la
   * fiche, et modifier un champ du formulaire ne la recharge pas.
   */
  const charger = useCallback(
    async (remplir = false, signal?: AbortSignal) => {
      const [donnees, galerie] = await Promise.all([
        api<Fiche>(`/wakies/${wakie.id}/profile`, "GET", undefined, signal),
        api<{ images: Fiche["images"]; quota: number | null }>(
          `/wakies/${wakie.id}/images`,
          "GET",
          undefined,
          signal
        ),
      ]);
      if (signal?.aborted) return;
      setFiche({ ...donnees, images: galerie.images });
      setQuota(galerie.quota);
      if (remplir) {
        setBio(donnees.profil.bio ?? "");
        setHandle(donnees.profil.handle ?? "");
        setLiens((donnees.profil.links ?? []).join("\n"));
        setPersona(donnees.profil.personaPubliee ?? "");
        setPublie(donnees.profil.isPublic ?? publicInitial.current);
        formulaireCharge.current = true;
      }
    },
    [wakie.id]
  );

  useEffect(() => {
    const controleur = new AbortController();
    setChargement(true);
    setErreur("");
    void charger(!formulaireCharge.current, controleur.signal)
      .catch((probleme) => {
        if (!controleur.signal.aborted) {
          setErreur(
            probleme instanceof Error
              ? probleme.message
              : "La fiche n'a pas pu être chargée."
          );
        }
      })
      .finally(() => {
        if (!controleur.signal.aborted) setChargement(false);
      });
    return () => controleur.abort();
  }, [charger, reprise]);

  const enregistrer = async () => {
    if (indisponible || operation.current) return;
    operation.current = true;
    setBusy(true);
    setErreur("");
    setAvis("");
    let enregistre = false;
    try {
      const liensPropres = liens
        .split("\n")
        .map((ligne) => ligne.trim())
        .filter(Boolean)
        .slice(0, 5);
      await api(`/wakies/${wakie.id}/profile`, "PATCH", {
        bio,
        handle: handle.trim() ? handle.trim() : null,
        isPublic: publie,
        links: liensPropres,
        publicPersona: persona,
      });
      enregistre = true;
      setAvis(publie ? "Fiche publiée." : "Fiche privée enregistrée.");
      await charger(true);
      await onChanged?.();
    } catch (probleme) {
      setErreur(
        enregistre
          ? "La fiche a été enregistrée, mais son actualisation a échoué. Réessayez la lecture."
          : probleme instanceof Error
            ? probleme.message
            : "Publication impossible."
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  const ajouterImage = async (fichiers: File[]) => {
    if (indisponible || operation.current || quota === undefined) return;
    if (fichiers.length > 4) {
      setErreur("Sélectionnez au maximum quatre images à la fois.");
      return;
    }
    if (
      limiteAtteinte ||
      (quota !== null && fichiers.length > quota - (fiche?.images.length ?? 0))
    ) {
      setErreur("Cette sélection dépasse la limite d’images de votre fiche.");
      return;
    }
    if (
      fichiers.some(
        (image) => !acceptePiece(image.type, { documents: false, images: true })
      )
    ) {
      setErreur("Choisissez une image JPEG, PNG, WebP ou GIF.");
      return;
    }
    const refus = fichiers.map(motifRefus).find(Boolean);
    if (refus) {
      setErreur(refus);
      return;
    }
    operation.current = true;
    setTeleverse(true);
    setErreur("");
    setAvis("");
    try {
      for (const image of fichiers) {
        const { pathname } = await televerser(image);
        await api(`/wakies/${wakie.id}/images`, "POST", {
          alt: image.name.slice(0, 140),
          blobPathname: pathname,
        });
      }
      await charger();
      setAvis("Image publiée.");
    } catch (probleme) {
      setErreur(
        probleme instanceof Error
          ? probleme.message
          : "L'image n'a pas pu être publiée."
      );
    } finally {
      operation.current = false;
      setTeleverse(false);
    }
  };

  const retirerImage = async (imageId: string) => {
    if (indisponible || operation.current) return;
    operation.current = true;
    setBusy(true);
    setErreur("");
    try {
      await api(
        `/wakies/${wakie.id}/images?imageId=${encodeURIComponent(imageId)}`,
        "DELETE"
      );
      await charger();
    } catch (probleme) {
      setErreur(
        probleme instanceof Error
          ? probleme.message
          : "L'image n'a pas pu être retirée."
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  return (
    <aside
      aria-busy={chargement || busy || televerse}
      aria-label={`Fiche de ${wakie.name}`}
      className="wakies-profile-drawer"
      data-app-update-blocked={busy || televerse || brouillonModifie}
    >
      <header className="wakies-profile-head">
        {fiche?.profil.avatarUrl ? (
          <img alt="" src={fiche.profil.avatarUrl} />
        ) : (
          <Mascot
            avatar={wakie.avatar}
            decorative
            identity={wakie.id}
            name={wakie.name}
            small
          />
        )}
        <div>
          <strong>{fiche?.profil.name ?? wakie.name}</strong>
          <small className="muted">
            {fiche?.profil.handle ? `@${fiche.profil.handle}` : "Sans pseudo"}
          </small>
        </div>
        <Button
          aria-label="Fermer la fiche"
          className="icon-button"
          disabled={busy || televerse}
          onClick={onClose}
          type="button"
          variant="ghost"
        >
          Fermer
        </Button>
      </header>

      {erreur ? (
        <p className="sidebar-error" role="alert">
          {erreur}
        </p>
      ) : null}
      {erreur && !chargement ? (
        <Button
          disabled={busy || televerse}
          onClick={() => setReprise((value) => value + 1)}
          variant="outline"
        >
          Recharger la fiche
        </Button>
      ) : null}
      {avis ? (
        <p className="sidebar-note" role="status">
          {avis}
        </p>
      ) : null}

      {chargement ? (
        <p className="muted" role="status">
          Chargement de la fiche…
        </p>
      ) : null}
      <fieldset className="wakies-profile-form" disabled={indisponible}>
        <legend className="visually-hidden">
          Informations publiques du Wakie
        </legend>
        <label className="field-label">
          Pseudo public
          <Input
            maxLength={33}
            onChange={(evenement) => setHandle(evenement.target.value)}
            placeholder="pseudo"
            value={handle}
          />
        </label>
        <label className="field-label">
          Bio
          <Textarea
            maxLength={500}
            onChange={(evenement) => setBio(evenement.target.value)}
            rows={3}
            value={bio}
          />
        </label>
        <label className="field-label">
          Liens (un par ligne, 5 au maximum)
          <Textarea
            onChange={(evenement) => setLiens(evenement.target.value)}
            rows={2}
            value={liens}
          />
        </label>
        <label className="field-label">
          Persona publiée — le texte qu&apos;un autre compte peut cloner
          <Textarea
            maxLength={2000}
            onChange={(evenement) => setPersona(evenement.target.value)}
            rows={4}
            value={persona}
          />
        </label>
        <label className="field-label checkbox">
          <input
            checked={publie}
            onChange={(evenement) => setPublie(evenement.target.checked)}
            type="checkbox"
          />
          Visible dans l&apos;annuaire public
        </label>
        <Button
          disabled={indisponible}
          onClick={() => void enregistrer()}
          type="button"
          variant="solid"
        >
          {busy
            ? "Enregistrement…"
            : publie
              ? "Publier la fiche"
              : "Enregistrer la fiche privée"}
        </Button>
      </fieldset>
      {fiche ? (
        <WakieShare
          disabled={indisponible}
          id={wakie.id}
          isPublic={fiche.profil.isPublic ?? publicInitial.current}
          name={wakie.name}
        />
      ) : null}

      <section className="wakies-profile-gallery">
        <h3>
          Images
          <small className="muted">
            {fiche ? ` ${fiche.images.length}` : " …"}
            {quota === undefined
              ? " · limite indisponible"
              : quota === null
                ? " · illimitées"
                : ` / ${quota}`}
          </small>
        </h3>
        {fiche === null ? (
          !chargement && erreur ? (
            <p className="muted">Galerie indisponible.</p>
          ) : (
            <p className="muted" role="status">
              Chargement de la galerie…
            </p>
          )
        ) : fiche.images.length === 0 ? (
          <p className="muted">Aucune image publiée.</p>
        ) : (
          <ul>
            {fiche.images.map((image, index) => (
              <li key={image.id}>
                {image.url ? (
                  <img alt={image.alt} src={image.url} />
                ) : (
                  <span className="muted">Image indisponible</span>
                )}
                <Button
                  aria-label={`Retirer l’image ${index + 1}`}
                  className="icon-button"
                  disabled={indisponible}
                  onClick={() => void retirerImage(image.id)}
                  variant="ghost"
                >
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        )}
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Importer des images dans la fiche"
          className="visually-hidden-input"
          disabled={indisponible || limiteAtteinte || quota === undefined}
          multiple
          onChange={(evenement) => {
            const choisis = [...(evenement.target.files ?? [])];
            if (choisis.length > 0) void ajouterImage(choisis);
            // Re-sélectionner le MÊME fichier doit fonctionner : sans ce
            // nettoyage, le `change` ne se déclencherait pas la seconde fois.
            evenement.target.value = "";
          }}
          ref={fichier}
          tabIndex={-1}
          type="file"
        />
        <Button
          disabled={indisponible || limiteAtteinte || quota === undefined}
          onClick={() => fichier.current?.click()}
          type="button"
          variant="outline"
        >
          {televerse ? "Envoi…" : "Ajouter une image"}
        </Button>
      </section>
      {limiteAtteinte ? (
        <p className="muted">Limite d’images atteinte pour votre forfait.</p>
      ) : null}
    </aside>
  );
}
