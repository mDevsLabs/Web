"use client";

import {
  FileTextIcon as FileText,
  PlusIcon as Plus,
  XIcon as X,
} from "@mdevs/icons";
import { useMemo } from "react";
import type { Page } from "@/lib/wakies/pages";
export function PageOutline({
  pages,
  selected,
  onPage,
  onNew,
  onClose,
}: {
  pages: Page[];
  selected: string;
  onPage: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  // Les données historiques peuvent contenir un parent supprimé, un parent
  // d'un autre Espace ou un cycle. Ces pages ne doivent PAS disparaître du
  // plan : elles sont affichées à la racine, avec une explication, et ne sont
  // jamais supprimées silencieusement.
  const { childrenByParent, roots, orphanIds } = useMemo(() => {
    const ids = new Set(pages.map((page) => page.id));
    const byParent = new Map<string | null, Page[]>();
    const orphans = new Set<string>();
    for (const page of pages) {
      const validParent =
        page.parentId && ids.has(page.parentId) && page.parentId !== page.id
          ? page.parentId
          : null;
      if (page.parentId && !validParent) {
        orphans.add(page.id);
      }
      const key = validParent ?? null;
      const list = byParent.get(key) ?? [];
      list.push(page);
      byParent.set(key, list);
    }
    const reachable = new Set<string>();
    const visit = (parentId: string | null) => {
      for (const page of byParent.get(parentId) ?? []) {
        if (reachable.has(page.id)) continue;
        reachable.add(page.id);
        visit(page.id);
      }
    };
    visit(null);
    const rootList = [...(byParent.get(null) ?? [])];
    // Cycles : aucun nœud n'est atteignable depuis une racine. On en promeut
    // un par composant pour que le plan reste navigable.
    for (const page of pages) {
      if (!reachable.has(page.id)) {
        rootsMark(page.id);
      }
    }
    function rootsMark(id: string) {
      if (reachable.has(id)) return;
      const page = pages.find((candidate) => candidate.id === id);
      if (!page) return;
      rootList.push(page);
      reachable.add(id);
      visit(id);
    }
    return { childrenByParent: byParent, orphanIds: orphans, roots: rootList };
  }, [pages]);

  const seen = new Set<string>();
  const renderPage = (page: Page, depth: number): React.ReactNode => {
    if (seen.has(page.id)) return null;
    seen.add(page.id);
    const orphan = orphanIds.has(page.id);
    return (
      <li data-orphan={orphan || undefined} key={page.id}>
        <button
          aria-current={selected === page.id ? "page" : undefined}
          aria-label={
            orphan
              ? `${page.title} (parent introuvable, affichée à la racine)`
              : page.title
          }
          onClick={() => onPage(page.id)}
          style={{ paddingLeft: 12 + depth * 12 }}
          title={
            orphan
              ? "Le parent de cette page est introuvable : elle est affichée à la racine."
              : undefined
          }
        >
          <FileText size={14} />
          <span>{page.title}</span>
        </button>
        {childrenByParent.has(page.id) && <ul>{render(page.id, depth + 1)}</ul>}
      </li>
    );
  };
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    (childrenByParent.get(parentId) ?? []).map((page) =>
      renderPage(page, depth)
    );
  return (
    <nav aria-label="Pages de cet Espace" className="document-outline">
      <div>
        <strong>Pages</strong>
        <button
          aria-label="Nouvelle page dans le plan"
          className="document-icon"
          onClick={onNew}
        >
          <Plus size={16} />
        </button>
        <button
          aria-label="Fermer le plan de la page"
          className="document-icon"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <ul>{roots.map((page) => renderPage(page, 0))}</ul>
    </nav>
  );
}
