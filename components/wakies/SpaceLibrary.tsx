"use client";

import {
  ArrowUpRight,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Page } from "@/lib/wakies/pages";
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
export function SpaceLibrary({
  space,
  pages,
  onPage,
  onNew,
}: {
  space: Space;
  pages: Page[];
  onPage: (id: string) => void;
  onNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  const filtered = useMemo(
    () =>
      pages
        .filter((page) =>
          `${page.title} ${page.content}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title)
            : b.updatedAt - a.updatedAt || a.title.localeCompare(b.title)
        ),
    [pages, query, sort]
  );
  return (
    <section
      aria-label={`${space.name} page library`}
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
            <button
              className="library-page-card"
              key={page.id}
              onClick={() => onPage(page.id)}
            >
              <span className="library-page-icon">
                <FileText size={20} strokeWidth={1.5} />
              </span>
              <div className="library-card-body">
                <h3>{page.title}</h3>
                <p>
                  {pageExcerpt(page.content) ||
                    "Une page vide, prête à être écrite."}
                </p>
                <div className="library-page-meta">
                  <span title={new Date(page.updatedAt).toLocaleString()}>
                    Edited{" "}
                    {new Date(page.updatedAt).toLocaleDateString(undefined, {
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
              <Plus size={16} /> New page
            </button>
          )}
        </div>
      )}
    </section>
  );
}
