"use client";

import {
  FileTextIcon as FileText,
  PlusIcon as Plus,
  XIcon as X,
} from "@mdevs/icons";
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
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    pages
      .filter((page) => page.parentId === parentId)
      .map((page) => (
        <li key={page.id}>
          <button
            aria-current={selected === page.id ? "page" : undefined}
            onClick={() => onPage(page.id)}
            style={{ paddingLeft: 12 + depth * 12 }}
          >
            <FileText size={14} />
            <span>{page.title}</span>
          </button>
          {pages.some((child) => child.parentId === page.id) && (
            <ul>{render(page.id, depth + 1)}</ul>
          )}
        </li>
      ));
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
      <ul>{render(null)}</ul>
    </nav>
  );
}
