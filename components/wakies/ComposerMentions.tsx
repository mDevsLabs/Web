"use client";

/**
 * Menu `@` du composeur Wakies : capacités, documents et agents invoquables.
 *
 * POURQUOI CE COMPOSANT EST DANS L'ARBRE ET NON DANS UN PORTAIL
 *
 * Radix pose ses popovers sur `document.body`, donc hors de `.wakies-root` :
 * ils héritent des styles de l'hôte et plus d'`wakies.css` (c'est voulu pour le
 * sélecteur de modèle, qui doit ressembler au Chat). Un menu de mentions est un
 * objet de l'atelier : il doit prendre les styles Wakies, et le test
 * d'isolation CSS (`tests/unit/wakies-style-isolation.test.ts`) exige que ses
 * règles soient ancrées sous `.wakies-root` — ce qui serait impossible depuis
 * un portail. `app/(wakies)/wakies/layout.tsx` pose aussi un
 * `overflow-hidden` : le menu s'ouvre donc VERS LE HAUT, au-dessus du champ.
 *
 * `@` et `@@` n'ont pas le même effet, et ce n'est pas un détail de frappe :
 * `@jeton` vaut pour ce tour, `@@jeton` règle le fil. L'interface le dit dans
 * son en-tête et le déclenche par Maj+Entrée (ou Maj+Tab) à l'insertion.
 */

import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import { jetonAInserer, motEnCours } from "@/components/wakies/composer-caret";
import type { SuggestionMention } from "@/lib/wakies/mentions";

const LIBELLES_SECTION: Record<string, string> = {
  agents: "Wakies, projets, amis",
  competences: "Compétences & outils",
  documents: "Pages & Espaces",
  extensions: "Extensions & MCP",
};

const ORDRE_SECTIONS = ["extensions", "competences", "documents", "agents"];

export type ComposerMentionsHandle = {
  /** Vrai si la touche est consommée par le menu (et ne doit pas envoyer). */
  traiterCle: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

export function ComposerMentions({
  brouillon,
  onChoisir,
  handleRef,
  textareaRef,
}: {
  brouillon: string;
  /** La ref du champ : le menu s'y ancre et y branche ses écouteurs. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /**
   * Sortie impérative vers le composeur : la priorité des touches se décide
   * dans son `onKeyDown` (IME d'abord, menu ensuite, `Entrée`-envoi enfin),
   * donc le parent doit pouvoir demander au menu s'il consomme la touche.
   */
  handleRef: React.RefObject<ComposerMentionsHandle | null>;
  onChoisir: (texte: string, curseurApres: number) => void;
}) {
  const [mot, setMot] = useState<ReturnType<typeof motEnCours>>(null);
  const [suggestions, setSuggestions] = useState<SuggestionMention[]>([]);
  const [index, setIndex] = useState(0);

  // Le mot en cours est relevé à la frappe, au clic ET à la fin d'une
  // composition IME : pendant une composition, `selectionStart` n'est pas
  // encore la position finale et un `@` tapé en japonais ne serait jamais vu.
  useEffect(() => {
    const zone = textareaRef.current;
    if (!zone) return;
    const relever = () => {
      const trouve = motEnCours(
        zone.value,
        zone.selectionStart ?? zone.value.length
      );
      // Un `/` appartient aux commandes : ce menu ne traite que `@` et `@@`.
      setMot(trouve?.mot.startsWith("@") ? trouve : null);
    };
    zone.addEventListener("input", relever);
    zone.addEventListener("click", relever);
    zone.addEventListener("keyup", (event) => {
      if (event.key !== "Process" && !event.isComposing) relever();
    });
    zone.addEventListener("compositionend", relever);
    return () => {
      zone.removeEventListener("input", relever);
      zone.removeEventListener("click", relever);
      zone.removeEventListener("keyup", relever);
      zone.removeEventListener("compositionend", relever);
    };
  }, [brouillon, textareaRef]);

  const recherche = mot?.mot.startsWith("@")
    ? mot.mot.replace(/^@+/, "")
    : null;

  useEffect(() => {
    if (recherche === null || recherche.length < 1) {
      setSuggestions([]);
      return;
    }
    let annule = false;
    const minuteur = setTimeout(async () => {
      try {
        const data = await api<{ suggestions: SuggestionMention[] }>(
          `/mentions?q=${encodeURIComponent(recherche)}`
        );
        if (!annule) {
          setSuggestions(data.suggestions);
          setIndex(0);
        }
      } catch {
        if (!annule) setSuggestions([]);
      }
    }, 200);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [recherche]);

  const inserer = (suggestion: SuggestionMention, persistant: boolean) => {
    if (!mot) return;
    const cible = persistant && suggestion.persistable;
    const jeton = jetonAInserer(
      suggestion.cite ? suggestion.label : suggestion.jeton,
      {
        cite: suggestion.cite,
        persistant: cible,
      }
    );
    onChoisir(
      `${brouillon.slice(0, mot.debut)}${jeton} ${brouillon.slice(mot.fin)}`,
      mot.debut + jeton.length + 1
    );
    setMot(null);
  };

  const traiterCle = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mot || suggestions.length === 0) return false;
    if (event.key === "Escape") {
      setMot(null);
      return true;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const pas = event.key === "ArrowDown" ? 1 : -1;
      setIndex(
        (actuel) => (actuel + pas + suggestions.length) % suggestions.length
      );
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      // `Enter` INSÈRE et n'envoie jamais : laisser filer la touche enverrait un
      // demi-message alors que l'utilisateur choisissait une ligne.
      const choix = suggestions[index];
      if (choix) inserer(choix, event.shiftKey);
      return true;
    }
    return false;
  };

  // Le pont vers le composeur : le parent appelle `traiterCle` depuis son
  // `onKeyDown`. Reposé à chaque rendu, parce que la closure lit `mot`,
  // `suggestions` et `index` — figée, elle choisirait une ligne périmée.
  useEffect(() => {
    handleRef.current = { traiterCle };
  });

  if (!mot || suggestions.length === 0) return null;

  const groups = ORDRE_SECTIONS.map((section) => ({
    items: suggestions.filter((suggestion) => suggestion.section === section),
    section,
  })).filter((groupe) => groupe.items.length > 0);

  let pied = -1;

  return (
    <div
      aria-label="Mentions disponibles"
      className="composer-mentions"
      role="listbox"
    >
      <p className="composer-mentions-aide">
        <code>@</code> pour ce tour · <code>Maj+Entrée</code> pour ce fil ·
        flèches pour choisir
      </p>
      {groups.map((groupe) => (
        <div className="composer-mentions-groupe" key={groupe.section}>
          <span className="composer-mentions-titre">
            {LIBELLES_SECTION[groupe.section] ?? groupe.section}
          </span>
          {groupe.items.map((suggestion) => {
            pied += 1;
            const position = pied;
            return (
              <button
                aria-selected={position === index}
                className={`composer-mentions-item${position === index ? " is-active" : ""}${suggestion.indisponible ? " is-indisponible" : ""}`}
                key={`${suggestion.famille}-${suggestion.id}`}
                onClick={() => inserer(suggestion, false)}
                // Une souris qui survole aligne la sélection clavier : sinon
                // `Entrée` n'insère pas ce que l'œil désignait.
                onMouseEnter={() => setIndex(position)}
                role="option"
                type="button"
              >
                <span className="composer-mentions-jeton">
                  {suggestion.cite
                    ? `@"${suggestion.label}"`
                    : `@${suggestion.jeton}`}
                </span>
                <span className="composer-mentions-nom">
                  {suggestion.label}
                </span>
                {suggestion.sousLabel ? (
                  <span className="composer-mentions-meta">
                    {suggestion.sousLabel}
                  </span>
                ) : null}
                {suggestion.indisponible ? (
                  <span className="composer-mentions-refus">
                    {suggestion.indisponible}
                  </span>
                ) : (
                  suggestion.badges.map((badge) => (
                    <span className="composer-mentions-badge" key={badge}>
                      {badge}
                    </span>
                  ))
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
