"use client";

import { ChevronRight, FileText, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import type { Page } from "@/lib/wakies/pages";
import type { Space } from "@/lib/wakies/shared/types";

export function SpaceNav({
  space,
  active,
  pageId,
  onOpen,
}: {
  space: Space;
  active: boolean;
  pageId?: string;
  onOpen: (pageId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!expanded) return;
    let current = true;
    const load = async () => {
      try {
        const next = await api<Page[]>(`/spaces/${space.id}/pages`);
        if (current) {
          setPages(next);
          setError("");
        }
      } catch {
        if (current) setError("Impossible de charger les pages.");
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [expanded, space.id]);
  const branches = (parentId: string | null, depth = 0): React.ReactNode =>
    pages
      .filter((page) => page.parentId === parentId)
      .map((page) => (
        <div key={page.id}>
          <button
            aria-current={active && pageId === page.id ? "page" : undefined}
            className={`nav-item space-page-link ${active && pageId === page.id ? "active" : ""}`}
            onClick={() => onOpen(page.id)}
            style={{ paddingLeft: 28 + depth * 12 }}
          >
            <FileText size={14} />
            <span>{page.title}</span>
          </button>
          {branches(page.id, depth + 1)}
        </div>
      ));
  return (
    <div className="space-nav-group">
      <div className="space-nav-row">
        <button
          aria-controls={`space-pages-${space.id}`}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Replier" : "Déplier"} ${space.name}`}
          className="icon-button space-disclosure"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            size={13}
            style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          />
        </button>
        <button
          aria-current={active && !pageId ? "page" : undefined}
          className={`nav-item ${active && !pageId ? "active" : ""}`}
          onClick={() => onOpen()}
        >
          <Folder size={16} />
          <span>{space.name}</span>
        </button>
      </div>
      {expanded && (
        <div id={`space-pages-${space.id}`}>
          {error ? (
            <p className="sidebar-error" role="status">
              {error}
            </p>
          ) : (
            branches(null)
          )}
          {!error && !pages.length && (
            <p className="sidebar-empty">Aucune page pour l’instant</p>
          )}
        </div>
      )}
    </div>
  );
}
