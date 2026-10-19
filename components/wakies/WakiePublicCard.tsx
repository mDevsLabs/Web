"use client";

/**
 * Fiche PUBLIQUE d'un Wakie : ce qu'un autre compte a le droit de voir.
 *
 * La fiche est en LECTURE SEULE pour l'auteur : ses instructions, ses
 * capacités et ses mémoires n'apparaissent nulle part, et l'interface le
 * reflète plutôt que de le sous-entendre. Les images arrivent déjà signées par
 * le serveur (`url`) ; une image dont le blob a disparu s'affiche
 * « indisponible » au lieu de casser la fiche.
 *
 * L'action principale dépend de la relation : « Discuter » pour un Wakie qui
 * m'appartient, « Ajouter » / « Retirer » pour un ami, « Cloner » dès qu'une
 * persona est publiée — un ami reste une vitrine, et le clone est le seul
 * moyen d'en faire un interlocuteur.
 */

import { Button } from "@mdevs/ui/primitives/button";
import { Mascot } from "@/components/wakies/Mascot";
import { WakieShare } from "@/components/wakies/WakieShare";

/** Ligne d'annuaire, telle que `GET /api/wakies/directory` la renvoie. */
export type InscritAnnuaire = {
  accent: string | null;
  avatar: string | null;
  bio: string;
  estAmi: boolean;
  estMien: boolean;
  handle: string | null;
  name: string;
  nombreImages: number;
  personaPubliee: string;
  wakieId: string;
};

/** Fiche détaillée, telle que la route de profil la renvoie. */
export type FichePublique = {
  images: Array<{ alt: string; id: string; url: string | null }>;
  profil: {
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string;
    handle: string | null;
    links: string[];
    name: string;
    personaPubliee?: string;
    isPublic?: boolean;
    avatar?: string | null;
  };
};

export function WakiePublicCard({
  busy,
  clonageDisponible = true,
  erreurFiche,
  fiche,
  inscription,
  onAjouter,
  onCloner,
  onDiscuter,
  onRetirer,
  onReessayer,
}: {
  busy: boolean;
  clonageDisponible?: boolean;
  erreurFiche?: string;
  /** Null tant que la fiche détaillée n'est pas chargée. */
  fiche: FichePublique | null;
  inscription: InscritAnnuaire;
  onAjouter: (wakieId: string) => void;
  onCloner: (wakieId: string) => void;
  onDiscuter: (wakieId: string) => void;
  onRetirer: (wakieId: string) => void;
  onReessayer?: () => void;
}) {
  const bio = fiche?.profil.bio || inscription.bio;
  const persona = fiche?.profil.personaPubliee ?? inscription.personaPubliee;
  const liens = fiche?.profil.links ?? [];
  const banniere = fiche?.profil.bannerUrl ?? null;
  const portrait = fiche?.profil.avatarUrl ?? null;
  const nombreImages = fiche?.images.length ?? inscription.nombreImages;
  return (
    <article className="wakies-public-card">
      <div className={`wakies-public-banner${banniere ? "" : " is-vide"}`}>
        {banniere ? <img alt="" src={banniere} /> : null}
      </div>
      <header className="wakies-public-head">
        {portrait ? (
          <img alt="" className="wakies-public-avatar" src={portrait} />
        ) : (
          <Mascot
            avatar={inscription.avatar}
            decorative
            identity={inscription.wakieId}
            name={inscription.name}
          />
        )}
        <div>
          <strong>{fiche?.profil.name ?? inscription.name}</strong>
          {inscription.handle ? <small> @{inscription.handle}</small> : null}
          <p className="muted">
            {nombreImages} image
            {nombreImages > 1 ? "s" : ""} publiée
            {nombreImages > 1 ? "s" : ""}
          </p>
        </div>
      </header>
      <div className="wakies-public-badges">
        <span className="chip" data-active="true">
          Public
        </span>
        {inscription.estMien ? <span className="chip">Le vôtre</span> : null}
        {inscription.estAmi && !inscription.estMien ? (
          <span className="chip" data-active="true">
            Ami
          </span>
        ) : null}
      </div>
      {bio ? <p>{bio}</p> : null}
      {persona ? (
        <div className="surface-muted">
          <strong>Persona publiée</strong>
          <p>{persona}</p>
        </div>
      ) : (
        <p className="muted">
          Ce Wakie n&apos;a rien publié : il ne peut pas être cloné et
          n&apos;apporte aucun contexte si on le mentionne.
        </p>
      )}
      {liens.length ? (
        <ul className="wakies-public-links">
          {liens.map((lien) => (
            <li key={lien}>
              <a href={lien} rel="noreferrer noopener" target="_blank">
                {lien}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <section className="wakies-public-gallery">
        <h3>Images</h3>
        {erreurFiche ? (
          <div className="sidebar-error" role="alert">
            <p>{erreurFiche}</p>
            {onReessayer ? (
              <Button onClick={onReessayer} variant="outline">
                Recharger la fiche
              </Button>
            ) : null}
          </div>
        ) : fiche === null ? (
          <p className="muted" role="status">
            Chargement de la galerie…
          </p>
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
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer className="wakies-public-actions">
        <WakieShare
          disabled={busy || !fiche || Boolean(erreurFiche)}
          id={inscription.wakieId}
          isPublic={fiche?.profil.isPublic !== false}
          key={inscription.wakieId}
          name={inscription.name}
        />
        {inscription.estMien ? (
          <Button onClick={() => onDiscuter(inscription.wakieId)} type="button">
            Discuter
          </Button>
        ) : inscription.estAmi ? (
          <Button
            disabled={busy}
            onClick={() => onRetirer(inscription.wakieId)}
            type="button"
            variant="outline"
          >
            Retirer des amis
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => onAjouter(inscription.wakieId)}
            type="button"
          >
            Ajouter en ami
          </Button>
        )}
        {inscription.estMien ? null : (
          <Button
            disabled={busy || !persona || !clonageDisponible}
            onClick={() => onCloner(inscription.wakieId)}
            title={
              clonageDisponible
                ? undefined
                : "Créez un Espace avant de cloner ce Wakie."
            }
            type="button"
            variant="outline"
          >
            Cloner et discuter
          </Button>
        )}
      </footer>
    </article>
  );
}
