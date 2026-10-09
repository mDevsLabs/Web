"use client";
import { Button } from "@mdevs/ui/primitives/button";

/** Apps d'OpenMuse devient une vue des capacités mAI : aucune installation ou connexion fictive. */
import Link from "next/link";
import { useCapabilities } from "@/components/wakies/CapacityPicker";
import type { Wakie } from "@/lib/wakies/shared/types";
export function AppsScreen({
  wakie,
  onCustomize,
}: {
  wakie: Wakie;
  onCustomize: () => void;
}) {
  const { capabilities, chargement, erreur, rafraichir } =
    useCapabilities(true);
  const competences = Array.isArray(capabilities?.competences)
    ? capabilities.competences
    : [];
  const extensions = Array.isArray(capabilities?.extensions)
    ? capabilities.extensions
    : [];
  const serveurs = Array.isArray(capabilities?.serveurs)
    ? capabilities.serveurs
    : [];

  return (
    <main className="main-content muse-screen">
      <header className="page-heading">
        <div>
          <h1>Vos applications</h1>
          <p>Les compétences, extensions et connexions de votre compte mAI.</p>
        </div>
        <Button
          className="primary"
          onClick={onCustomize}
          type="button"
          variant="solid"
        >
          Configurer {wakie.name}
        </Button>
      </header>
      {erreur && (
        <div className="chat-error" role="alert">
          {erreur}
          <Button
            onClick={() => void rafraichir()}
            type="button"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      )}
      {chargement && <p role="status">Chargement de vos capacités…</p>}
      <div className="muse-cards">
        {competences.map((item) => (
          <article className="muse-card" key={item.id}>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <small>
              Compétence mAI ·{" "}
              {wakie.skillIds?.includes(item.id)
                ? "sélectionnée"
                : "à sélectionner"}
            </small>
          </article>
        ))}
        {extensions.map((item) => (
          <article className="muse-card" key={item.id}>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <small>
              {item.locked
                ? "Forfait requis"
                : item.installed
                  ? item.enabled
                    ? "Installée et activée"
                    : "Installée et désactivée"
                  : "Non installée"}
            </small>
          </article>
        ))}
        {serveurs.map((item) => (
          <article className="muse-card" key={item.id}>
            <h2>{item.name}</h2>
            <small>Serveur MCP · gestion et autorisations dans mAI</small>
          </article>
        ))}
      </div>
      {!chargement &&
        !erreur &&
        !competences.length &&
        !extensions.length &&
        !serveurs.length && <p>Aucune capacité enregistrée sur ce compte.</p>}
      <div className="muse-links">
        <Link href="/skills">Gérer mes compétences</Link>
        <Link href="/tools">Gérer mes extensions et MCP</Link>
        <Link href="/library">Ouvrir ma bibliothèque de fichiers</Link>
      </div>
      <article className="muse-card">
        <h2>Ordinateur, navigateur et terminal</h2>
        <p>
          Non configurés dans mAI. Les modules sources sont conservés ; aucun
          worker ni environnement externe ne sera démarré depuis cette
          interface.
        </p>
      </article>
    </main>
  );
}
