"use client";

// Le journal versionné (CHANGELOG.md) est déjà découpé en sections par le
// serveur : ici, seule la navigation. Un accordéon par publication — la plus
// récente ouverte au chargement — et une recherche locale qui ouvre d'un seul
// coup toutes les publications correspondant à la requête. Tout est calculé
// côté client sur des données déjà rendues : aucun appel API, la page
// reste lisible hors connexion.

import { ChevronDownIcon, SearchIcon, XIcon } from "@mdevs/icons";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { useMemo, useState } from "react";

export type ChangelogVersion = {
  /** Identifiant interne unique : le numéro de version, suffixé si le
   * fichier contient deux fois la même (deux sections « 0.9.1 » coexistent
   * dans CHANGELOG.md). Sert de valeur d'accordéon.
   */
  id: string;
  /** Numéro de version affiché, tel qu'écrit dans le `##` du CHANGELOG.md. */
  version: string;
  /** Contenu de la section, déjà rendu en HTML côté serveur. */
  html: string;
  /** Texte brut de la section, pour la recherche locale. */
  text: string;
};

// La recherche ignore la casse et les accents : une interface francisée doit
// retrouver « général » en tapant « general ». Même convention que la
// recherche du sélecteur de modèle.
const normaliser = (valeur: string) =>
  valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export default function ChangelogView({
  versions,
}: {
  versions: ChangelogVersion[];
}) {
  // La publication la plus récente est la première section du fichier :
  // elle seule est ouverte avant toute interaction de l'utilisateur.
  const [ouvertes, setOuvertes] = useState<string[]>(
    versions.length > 0 ? [versions[0].id] : []
  );
  const [recherche, setRecherche] = useState("");

  const requete = normaliser(recherche.trim());
  const enRecherche = requete !== "";

  const resultats = useMemo(
    () =>
      enRecherche
        ? versions.filter(
            (entree) =>
              normaliser(entree.version).includes(requete) ||
              normaliser(entree.text).includes(requete)
          )
        : versions,
    [enRecherche, requete, versions]
  );

  // Pendant la recherche, tous les résultats s'ouvrent d'un seul coup pour
  // être lisibles sans clic. À la remise à zéro, la main revient à l'état
  // choisi par l'utilisateur, jamais à un état figé.
  const ouverturesActives = enRecherche
    ? resultats.map((entree) => entree.id)
    : ouvertes;

  return (
    <div>
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          aria-label="Rechercher dans les notes de version"
          className="field-input pr-9 pl-9"
          enterKeyHint="search"
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Rechercher une version, une fonctionnalité, une correction…"
          value={recherche}
        />
        {recherche !== "" && (
          <button
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            onClick={() => setRecherche("")}
            type="button"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        )}
      </div>

      {enRecherche && (
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {resultats.length} version{resultats.length > 1 ? "s" : ""} sur{" "}
          {versions.length}
        </p>
      )}

      {resultats.length === 0 ? (
        <div className="surface-muted mt-6">
          <p>
            Aucune note de version ne correspond à votre recherche. Essayez un
            autre mot-clé : « Quizzly », « Vibe », « corrigé »…
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <AccordionPrimitive.Root
            onValueChange={setOuvertes}
            type="multiple"
            value={ouverturesActives}
          >
            {resultats.map((entree) => (
              <AccordionPrimitive.Item
                className="surface-card"
                key={entree.id}
                value={entree.id}
              >
                {/* Le titre est le seul texte du déclencheur : son nom
                    accessible reste le numéro de version, exactement. */}
                <AccordionPrimitive.Header asChild>
                  <h2 className="flex">
                    <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 rounded-lg py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-foreground/20">
                      <span className="text-lg font-semibold tracking-tight sm:text-xl">
                        {entree.version}
                      </span>
                      <ChevronDownIcon
                        aria-hidden
                        className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground group-data-[state=open]:rotate-180"
                      />
                    </AccordionPrimitive.Trigger>
                  </h2>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                  {/* HTML provenant exclusivement du fichier local avec
                      html:false — même garantie que l'ancien rendu monobloc. */}
                  <div
                    className="prose prose-sm mt-2 max-w-none break-words text-foreground dark:prose-invert sm:prose-base prose-headings:text-foreground prose-a:text-foreground prose-pre:overflow-x-auto"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown local versionné, HTML brut désactivé.
                    dangerouslySetInnerHTML={{ __html: entree.html }}
                  />
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>
      )}
    </div>
  );
}
