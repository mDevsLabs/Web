"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import { PageDocument } from "@/components/wakies/PageDocument";
import { PageOutline } from "@/components/wakies/PageOutline";
import { mergePageSnapshot } from "@/components/wakies/page-snapshots";
import { SpaceLibrary } from "@/components/wakies/SpaceLibrary";
import type { Page } from "@/lib/wakies/pages";
import type { Space, WorkspaceState } from "@/lib/wakies/shared/types";
export function SpaceWorkspace({
  space,
  pageId,
  workspace,
  paused,
  onPage,
  onDirty,
  onRefresh,
  onSchedule,
  onThread,
  onSettings,
  onCreateWakie,
}: {
  space: Space;
  pageId?: string;
  workspace: WorkspaceState;
  paused: boolean;
  onPage: (id?: string) => void;
  onDirty: (value: boolean) => void;
  onRefresh: () => void;
  onSchedule: (conversationId: string) => void;
  onThread: (conversationId: string) => void;
  onSettings: () => void;
  onCreateWakie: () => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [outline, setOutline] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await api<Page[]>(`/spaces/${space.id}/pages`);
        if (active) {
          setPages((previous) => mergePageSnapshot(previous, next));
          setLoaded(true);
          setError("");
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Impossible de charger les pages."
          );
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [space.id]);
  const page = pages.find((item) => item.id === pageId);
  const saved = useCallback(
    (next: Page) =>
      setPages((previous) =>
        previous.map((item) =>
          item.id === next.id && item.revision < next.revision ? next : item
        )
      ),
    []
  );
  const create = async (parentId: string | null) => {
    try {
      const next = await api<Page>(`/spaces/${space.id}/pages`, "POST", {
        content: "",
        parentId,
        title: "Page sans titre",
      });
      setPages((previous) => [...previous, next]);
      onPage(next.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de créer la page.");
    }
  };
  return (
    <main
      aria-label="Documents de l’Espace"
      className={`spaces-surface ${pageId ? "writing" : "library"}`}
    >
      {error && (
        <div className="document-load-error" role="alert">
          {error}
        </div>
      )}
      {pageId ? (
        page ? (
          <div className="space-writing-layout">
            {outline && (
              <PageOutline
                onClose={() => setOutline(false)}
                onNew={() => void create(null)}
                onPage={(id) => {
                  onPage(id);
                  if (window.innerWidth < 760) setOutline(false);
                }}
                pages={pages}
                selected={page.id}
              />
            )}
            <PageDocument
              key={page.id}
              onCreateWakie={onCreateWakie}
              onDirty={onDirty}
              onHome={() => onPage()}
              onOutline={() => setOutline(!outline)}
              onRefresh={onRefresh}
              onSaved={saved}
              onSchedule={onSchedule}
              onSettings={onSettings}
              onSubpage={() => void create(page.id)}
              onThread={onThread}
              page={page}
              pages={pages}
              paused={paused}
              workspace={workspace}
            />
          </div>
        ) : (
          <div className="library-empty">
            <h2>{loaded ? "Page introuvable" : "Chargement de la page…"}</h2>
            {loaded && (
              <button className="document-primary" onClick={() => onPage()}>
                Retour à toutes les pages
              </button>
            )}
          </div>
        )
      ) : (
        <SpaceLibrary
          onNew={() => void create(null)}
          onPage={onPage}
          pages={pages}
          space={space}
        />
      )}
    </main>
  );
}
