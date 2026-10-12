/** Présentation en lecture seule de la fiche publiée, accessible avant la connexion. */
import Link from "next/link";
import { Mascot } from "@/components/wakies/Mascot";
import { WakieShare } from "@/components/wakies/WakieShare";
import type { FicheWakiePartagee } from "@/lib/wakies/shared/sharing";

export function WakieSharedProfile({ fiche }: { fiche: FicheWakiePartagee }) {
  return (
    <main className="wakies-shared-page">
      <header className="wakies-shared-navigation">
        <Link href="/site">mAI</Link>
        <span>Wakies · Fiche publique</span>
      </header>
      <article className="wakies-public-card">
        {fiche.profil.bannerUrl ? (
          <div className="wakies-public-banner">
            <img alt="" src={fiche.profil.bannerUrl} />
          </div>
        ) : null}
        <header className="wakies-public-head">
          {fiche.profil.avatarUrl ? (
            <img
              alt=""
              className="wakies-public-avatar"
              src={fiche.profil.avatarUrl}
            />
          ) : (
            <Mascot
              avatar={fiche.avatar}
              decorative
              identity={fiche.id}
              name={fiche.profil.name}
            />
          )}
          <div>
            <h1>{fiche.profil.name}</h1>
            {fiche.profil.handle ? (
              <p className="muted">@{fiche.profil.handle}</p>
            ) : null}
          </div>
        </header>
        {fiche.profil.bio ? <p>{fiche.profil.bio}</p> : null}
        {fiche.profil.personaPubliee ? (
          <section className="surface-muted">
            <h2>Persona publiée</h2>
            <p>{fiche.profil.personaPubliee}</p>
          </section>
        ) : null}
        {fiche.profil.links.length > 0 ? (
          <ul className="wakies-public-links">
            {fiche.profil.links.map((lien) => (
              <li key={lien}>
                <a href={lien} rel="noopener noreferrer" target="_blank">
                  {lien}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {fiche.images.length > 0 ? (
          <section className="wakies-public-gallery">
            <h2>Images</h2>
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
          </section>
        ) : null}
        <footer className="wakies-public-actions">
          <Link
            className="md-button md-button-solid md-button-md"
            href={`/wakies?fiche=${encodeURIComponent(fiche.id)}`}
          >
            Ajouter ou cloner dans Wakies
          </Link>
          <WakieShare id={fiche.id} isPublic name={fiche.profil.name} />
        </footer>
        <p className="muted">
          Pour discuter avec ce Wakie, connectez-vous à mAI et clonez-le dans
          votre espace. Wakies est disponible avec Plus, Pro et Max.
        </p>
      </article>
    </main>
  );
}
