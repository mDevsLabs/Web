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
import { televerser } from "@/components/wakies/attachments";
import { Mascot } from "@/components/wakies/Mascot";
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
  const [quota, setQuota] = useState<number | null>(null);
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

  /**
   * Recharge la fiche ET la galerie, puis remplit le formulaire.
   *
   * Elle dépend de l'identifiant du Wakie — donc changer de Wakie recharge la
   * fiche, et modifier un champ du formulaire ne la recharge pas.
   */
  const charger = useCallback(async () => {
    const [donnees, galerie] = await Promise.all([
      api<Fiche>(`/wakies/${wakie.id}/profile`),
      api<{ images: Fiche["images"]; quota: number | null }>(
        `/wakies/${wakie.id}/images`
      ),
    ]);
    setFiche({ ...donnees, images: galerie.images });
    setQuota(galerie.quota ?? null);
    setBio(donnees.profil.bio ?? "");
    setHandle(donnees.profil.handle ?? "");
    setLiens((donnees.profil.links ?? []).join("\n"));
    setPersona(donnees.profil.personaPubliee ?? "");
    setPublie(donnees.profil.isPublic ?? wakie.isPublic ?? false);
  }, [wakie.id, wakie.isPublic]);

  useEffect(() => {
    let actif = true;
    setErreur("");
    void charger().catch((probleme) => {
      if (actif) {
        setErreur(
          probleme instanceof Error
            ? probleme.message
            : "La fiche n'a pas pu être chargée."
        );
      }
    });
    return () => {
      actif = false;
    };
  }, [charger]);

  const enregistrer = async () => {
    setBusy(true);
    setErreur("");
    setAvis("");
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
      await charger();
      await onChanged?.();
      setAvis("Fiche publiée.");
    } catch (probleme) {
      setErreur(
        probleme instanceof Error ? probleme.message : "Publication impossible."
      );
    } finally {
      setBusy(false);
    }
  };

  const ajouterImage = async (fichiers: File[]) => {
    setTeleverse(true);
    setErreur("");
    setAvis("");
    try {
      for (const image of fichiers.slice(0, 4)) {
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
      setTeleverse(false);
    }
  };

  const retirerImage = async (imageId: string) => {
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
      setBusy(false);
    }
  };

  return (
    <aside
      aria-label={`Fiche de ${wakie.name}`}
      className="wakies-profile-drawer"
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
          onClick={onClose}
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
      {avis ? (
        <p className="sidebar-note" role="status">
          {avis}
        </p>
      ) : null}

      <section className="wakies-profile-form">
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
          disabled={busy}
          onClick={() => void enregistrer()}
          type="button"
          variant="solid"
        >
          {busy ? "Enregistrement…" : "Publier la fiche"}
        </Button>
      </section>

      <section className="wakies-profile-gallery">
        <h3>
          Images
          <small className="muted">
            {fiche ? ` ${fiche.images.length}` : " …"}
            {quota === null ? " · illimitées" : ` / ${quota}`}
          </small>
        </h3>
        {fiche === null ? (
          <p className="muted">Chargement de la galerie…</p>
        ) : fiche.images.length === 0 ? (
          <p className="muted">Aucune image publiée.</p>
        ) : (
          <ul>
            {fiche.images.map((image) => (
              <li key={image.id}>
                {image.url ? (
                  <img alt={image.alt} src={image.url} />
                ) : (
                  <span className="muted">Image indisponible</span>
                )}
                <Button
                  aria-label="Retirer cette image"
                  className="icon-button"
                  disabled={busy}
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
          accept="image/*"
          className="visually-hidden-input"
          multiple
          onChange={(evenement) => {
            const choisis = [...(evenement.target.files ?? [])];
            if (choisis.length > 0) void ajouterImage(choisis);
            // Re-sélectionner le MÊME fichier doit fonctionner : sans ce
            // nettoyage, le `change` ne se déclencherait pas la seconde fois.
            evenement.target.value = "";
          }}
          ref={fichier}
          type="file"
        />
        <Button
          disabled={televerse || busy}
          onClick={() => fichier.current?.click()}
          type="button"
          variant="outline"
        >
          {televerse ? "Envoi…" : "Ajouter une image"}
        </Button>
      </section>
    </aside>
  );
}
