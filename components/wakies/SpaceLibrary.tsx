"use client";

/**
 * Bibliothèque de pages d'un Espace.
 *
 * Chaque carte porte le menu « … » de la page — épingler, renommer, régler la
 * lecture, exporter, supprimer — avec les mêmes actions que le menu du
 * document ouvert. Le menu est `SpaceMenu`, pas un `DropdownMenu` de
 * `@mdevs/ui` : un portail posé sur `document.body` sortirait de `.wakies-root`
 * et perdrait le thème de l'atelier.
 *
 * L'ordre vient du SERVEUR (`listPages` trie sur la colonne épinglée) ; le tri
 * local ne fait que reprendre cet ordre, il n'invente pas une hiérarchie que la
 * base a déjà décidée.
 */

import {
  ArrowUpRightIcon as ArrowUpRight,
  FileTextIcon as FileText,
  LayoutGridIcon as LayoutGrid,
  ListIcon as List,
  PlusIcon as Plus,
  SearchIcon as Search,
} from "@mdevs/icons";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/components/wakies/api";
import {
  type EspaceMenuAction,
  SpaceMenu,
} from "@/components/wakies/SpaceMenu";
import { type Page, type PageSettings, pageSettings } from "@/lib/wakies/pages";
import type { Space } from "@/lib/wakies/shared/types";

export function pageExcerpt(content: string) {
  return content
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, "")
    .replace(/```[\s\S]*?```/g, "Bloc de code")
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

/** Le nom du fichier exporté reste lisible en français, sans caractères interdits. */
function nomFichier(titre: string, extension: string) {
  return `${titre.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "page"}${extension}`;
}

function telecharger(nom: string, contenu: string, type: string) {
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(new Blob([contenu], { type }));
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(lien.href);
}

/** Une page sans réglage écrit vaut `null` en base : le rendu par défaut. */
function reglagesDe(page: Page) {
  return pageSettings.parse(page.settings ?? {});
}

export function SpaceLibrary({
  onAfterChange,
  onNew,
  onPage,
  pages,
  space,
}: {
  /** Une carte a changé une page : le parent relit la liste sans attendre. */
  onAfterChange: () => void;
  onNew: () => void;
  onPage: (id: string) => void;
  pages: Page[];
  space: Space;
}) {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  /** Carte en cours de renommage : un champ remplace le titre. */
  const [renommeId, setRenommeId] = useState<string>();
  /** Suppression armée : un second clic confirme, rien n'est irréversible d'emblée. */
  const [armedId, setArmedId] = useState<string>();
  const [erreur, setErreur] = useState("");

  const signaler = useCallback(
    (recue: unknown, defaut: string) =>
      setErreur(recue instanceof Error ? recue.message : defaut),
    []
  );

  const regler = useCallback(
    async (page: Page, reglages: Partial<PageSettings>) => {
      try {
        await api(`/pages/${page.id}/settings`, "POST", {
          settings: reglages,
        });
        onAfterChange();
      } catch (recue) {
        signaler(recue, "Réglage impossible.");
      }
    },
    [onAfterChange, signaler]
  );

  /**
   * Le titre, lui, EST le document : il passe par le PATCH, qui contrôle la
   * révision. Un renommage concurrent avec une édition en cours répond 409,
   * et la carte affiche la raison au lieu d'écraser la saisie.
   */
  const renommer = useCallback(
    async (page: Page, titre: string) => {
      try {
        await api<Page>(`/pages/${page.id}`, "PATCH", {
          expectedRevision: page.revision,
          title: titre,
        });
        onAfterChange();
      } catch (recue) {
        signaler(recue, "Renommage impossible.");
      }
    },
    [onAfterChange, signaler]
  );

  const actionsDe = (page: Page): EspaceMenuAction[] => {
    const reglages = reglagesDe(page);
    return [
      {
        id: "ouvrir",
        kind: "action",
        label: "Ouvrir la page",
        onSelect: () => onPage(page.id),
      },
      {
        id: "epingle",
        kind: "action",
        label: page.pinned ? "Désépingler" : "Épingler",
        onSelect: () => {
          void (async () => {
            try {
              await api(`/pages/${page.id}/pin`, "POST", {
                pinned: !page.pinned,
              });
              onAfterChange();
            } catch (recue) {
              signaler(recue, "Épingle impossible.");
            }
          })();
        },
      },
      {
        id: "renommer",
        kind: "action",
        label: "Renommer",
        onSelect: () => setRenommeId(page.id),
      },
      {
        id: "reglages",
        kind: "groupe",
        label: "Réglages de lecture",
        options: [
          {
            id: "large",
            label: reglages.large ? "Colonne standard" : "Colonne élargie",
            onSelect: () => void regler(page, { large: !reglages.large }),
          },
          {
            id: "signe",
            label: reglages.icon ? "Retirer le signe" : "Signe « ★ »",
            onSelect: () =>
              void regler(page, { icon: reglages.icon ? null : "★" }),
          },
        ],
      },
      {
        id: "exporter",
        kind: "groupe",
        label: "Exporter",
        options: [
          {
            id: "md",
            label: "Markdown",
            onSelect: () =>
              telecharger(
                nomFichier(page.title, ".md"),
                page.content,
                "text/markdown;charset=utf-8"
              ),
          },
          {
            id: "json",
            label: "JSON",
            onSelect: () =>
              telecharger(
                nomFichier(page.title, ".json"),
                JSON.stringify(
                  {
                    content: page.content,
                    pinned: page.pinned,
                    settings: page.settings ?? null,
                    title: page.title,
                    updatedAt: new Date(page.updatedAt).toISOString(),
                  },
                  null,
                  2
                ),
                "application/json;charset=utf-8"
              ),
          },
        ],
      },
      {
        danger: true,
        id: "supprimer",
        kind: "action",
        label: armedId === page.id ? "Confirmer la suppression" : "Supprimer",
        onSelect: () => {
          if (armedId !== page.id) {
            setArmedId(page.id);
            return;
          }
          setArmedId(undefined);
          void (async () => {
            try {
              await api(`/pages/${page.id}`, "DELETE");
              onAfterChange();
            } catch (recue) {
              signaler(recue, "Suppression impossible.");
            }
          })();
        },
      },
    ];
  };

  const filtered = useMemo(
    () =>
      pages
        .filter((page) =>
          `${page.title} ${page.content}`
            .toLocaleLowerCase("fr")
            .includes(query.toLocaleLowerCase("fr"))
        )
        .sort((a, b) => {
          // L'épingle passe avant tout tri local : c'est ce que la base décide.
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return sort === "name"
            ? a.title.localeCompare(b.title, "fr")
            : b.updatedAt - a.updatedAt || a.title.localeCompare(b.title, "fr");
        }),
    [pages, query, sort]
  );

  return (
    <section
      aria-label={`Bibliothèque de pages de ${space.name}`}
      className="space-library"
    >
      <header className="library-heading">
        <div>
          <span className="library-eyebrow">ESPACE</span>
          <h1>{space.name}</h1>
          {space.description && <p>{space.description}</p>}
        </div>
        <button className="document-primary" onClick={onNew}>
          <Plus size={17} /> Nouvelle page
        </button>
      </header>
      {erreur && (
        <div className="document-load-error" role="alert">
          {erreur}
        </div>
      )}
      <div className="library-tools">
        <label className="library-search">
          <Search size={17} />
          <input
            aria-label="Rechercher des pages"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des pages"
            value={query}
          />
        </label>
        <label className="library-sort">
          <span className="sr-only">Trier les pages</span>
          <select
            aria-label="Trier les pages"
            onChange={(e) => setSort(e.target.value)}
            value={sort}
          >
            <option value="recent">Modifiées récemment</option>
            <option value="name">Nom A–Z</option>
          </select>
        </label>
        <fieldset
          aria-label="Vue de la bibliothèque"
          className="library-view-toggle"
        >
          <button
            aria-label="Vue en grille"
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label="Vue en liste"
            aria-pressed={layout === "list"}
            onClick={() => setLayout("list")}
          >
            <List size={18} />
          </button>
        </fieldset>
      </div>
      <div className="library-section-label">
        <h2>{query ? "Résultats de recherche" : "Toutes les pages"}</h2>
        <span>
          {filtered.length} {filtered.length === 1 ? "page" : "pages"}
        </span>
      </div>
      {filtered.length ? (
        <div className={`library-pages ${layout}`}>
          {filtered.map((page) => (
            <div className="library-page-item" key={page.id}>
              <button
                className="library-page-card"
                onClick={() => onPage(page.id)}
              >
                <span className="library-page-icon">
                  {reglagesDe(page).icon ? (
                    <span className="library-page-sign">
                      {reglagesDe(page).icon}
                    </span>
                  ) : (
                    <FileText size={20} strokeWidth={1.5} />
                  )}
                </span>
                <div className="library-card-body">
                  {renommeId === page.id ? (
                    <input
                      aria-label="Nouveau titre de la page"
                      autoFocus
                      defaultValue={page.title}
                      onBlur={(event) => {
                        const titre = event.target.value.trim();
                        setRenommeId(undefined);
                        if (titre && titre !== page.title) {
                          void renommer(page, titre);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") setRenommeId(undefined);
                      }}
                    />
                  ) : (
                    <h3>
                      {page.title}
                      {page.pinned ? (
                        // Un point coloré seul ne dirait rien à qui ne perçoit
                        // pas les couleurs : l'état est écrit.
                        <small className="library-pin">Épinglée</small>
                      ) : null}
                    </h3>
                  )}
                  <p>
                    {pageExcerpt(page.content) ||
                      "Une page vide, prête à être écrite."}
                  </p>
                  <div className="library-page-meta">
                    <span title={new Date(page.updatedAt).toLocaleString("fr")}>
                      Modifiée{" "}
                      {new Date(page.updatedAt).toLocaleDateString("fr", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {page.parentId && (
                      <span className="library-parent">
                        {
                          pages.find((parent) => parent.id === page.parentId)
                            ?.title
                        }
                      </span>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="library-card-arrow" size={15} />
              </button>
              <SpaceMenu actions={actionsDe(page)} libelle={page.title} />
            </div>
          ))}
        </div>
      ) : (
        <div className="library-empty">
          <FileText size={30} strokeWidth={1.3} />
          <h2>
            {query
              ? "Aucune page correspondante"
              : "Aucune page pour l’instant"}
          </h2>
          <p>
            {query
              ? "Essayez un autre titre ou une autre expression."
              : "Créez votre première page pour organiser cet Espace."}
          </p>
          {!query && (
            <button className="document-primary" onClick={onNew}>
              <Plus size={16} /> Nouvelle page
            </button>
          )}
        </div>
      )}
    </section>
  );
}
