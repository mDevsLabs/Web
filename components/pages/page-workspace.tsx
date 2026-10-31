"use client";

import {
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  PanelRightIcon,
  Trash2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { AssistantPanel } from "@/components/pages/assistant-panel";
import { MarkdownEditor } from "@/components/pages/markdown-editor";
import { useProjects } from "@/hooks/use-projects";
import { countWords } from "@/lib/pages/text";
import type {
  PageDetail,
  PageRevisionView,
  PageUpdatedEvent,
} from "@/lib/pages/types";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn, fetcher } from "@/lib/utils";

const PANEL_KEY = "mai.pages-assistant-open";

type SaveStatus = "conflict" | "dirty" | "error" | "saved" | "saving";

const STATUS_LABEL: Record<SaveStatus, string> = {
  conflict: "Conflit",
  dirty: "Modifications locales",
  error: "Échec de l'enregistrement",
  saved: "Enregistré",
  saving: "Enregistrement…",
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.message === "string") {
    return body.message;
  }
  return "La requête n'a pas abouti.";
}

export function PageWorkspace({ pageId }: { pageId: string }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ page: PageDetail }>(
    `/api/pages/${pageId}`,
    fetcher
  );
  const { projects } = useProjects();
  const page = data?.page;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [revision, setRevision] = useState(1);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [selection, setSelection] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<PageRevisionView[]>([]);
  const [ready, setReady] = useState(false);
  const revisionRef = useRef(1);
  const saved = useRef({ content: "", title: "" });
  const latest = useRef({ content: "", title: "" });
  const saving = useRef(false);
  const queued = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PANEL_KEY);
    if (stored === "0") {
      setPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!page || ready) {
      return;
    }
    setTitle(page.title);
    setContent(page.content);
    setRevision(page.revision);
    revisionRef.current = page.revision;
    saved.current = { content: page.content, title: page.title };
    latest.current = { content: page.content, title: page.title };
    setReady(true);
  }, [page, ready]);

  const save = useCallback(async () => {
    if (!page?.canEdit) {
      return;
    }
    if (saving.current) {
      queued.current = true;
      return;
    }
    const payload = latest.current;
    if (
      payload.content === saved.current.content &&
      payload.title === saved.current.title
    ) {
      setStatus("saved");
      return;
    }
    saving.current = true;
    setStatus("saving");
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        body: JSON.stringify({
          content: payload.content,
          revision: revisionRef.current,
          title: payload.title,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (response.status === 409) {
        setStatus("conflict");
        toast.message("Cette page a été modifiée ailleurs. Rechargement.");
        const fresh = await mutate();
        if (fresh?.page) {
          setTitle(fresh.page.title);
          setContent(fresh.page.content);
          setRevision(fresh.page.revision);
          revisionRef.current = fresh.page.revision;
          saved.current = {
            content: fresh.page.content,
            title: fresh.page.title,
          };
          latest.current = saved.current;
        }
        return;
      }
      if (!response.ok) {
        setStatus("error");
        toast.error(await readError(response));
        return;
      }
      const body = await response.json();
      revisionRef.current = body.page.revision;
      setRevision(body.page.revision);
      saved.current = payload;
      setStatus("saved");
      await mutate(
        (current) =>
          current
            ? {
                page: {
                  ...current.page,
                  content: payload.content,
                  revision: body.page.revision,
                  title: payload.title,
                  wordCount: countWords(payload.content),
                },
              }
            : current,
        false
      );
    } finally {
      saving.current = false;
      if (queued.current) {
        queued.current = false;
        void save();
      }
    }
  }, [mutate, page?.canEdit, pageId]);

  useEffect(() => {
    if (!ready || !page?.canEdit) {
      return;
    }
    if (content === saved.current.content && title === saved.current.title) {
      return;
    }
    setStatus("dirty");
    const timer = window.setTimeout(() => {
      void save();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [content, page?.canEdit, ready, save, title]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  function applyRemote(event: PageUpdatedEvent) {
    latest.current = { content: event.content, title: event.title };
    saved.current = { content: event.content, title: event.title };
    revisionRef.current = event.revision;
    setContent(event.content);
    setTitle(event.title);
    setRevision(event.revision);
    setStatus("saved");
    void mutate(
      (current) =>
        current
          ? {
              page: {
                ...current.page,
                content: event.content,
                revision: event.revision,
                title: event.title,
                wordCount: countWords(event.content),
              },
            }
          : current,
      false
    );
  }

  async function patchMeta(body: Record<string, unknown>) {
    const response = await fetch(`/api/pages/${pageId}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    await mutate();
  }

  async function openVersions() {
    const response = await fetch(`/api/pages/${pageId}/revisions`);
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    const body = await response.json();
    setVersions(body.revisions ?? []);
    setVersionsOpen(true);
  }

  async function restore(revisionId: string) {
    const response = await fetch(`/api/pages/${pageId}/revisions`, {
      body: JSON.stringify({
        restoreId: revisionId,
        revision: revisionRef.current,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    const body = await response.json();
    applyRemote(body.page);
    setVersionsOpen(false);
  }

  async function snapshot() {
    const response = await fetch(`/api/pages/${pageId}/revisions`, {
      body: "{}",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    toast.success("Version enregistrée");
  }

  async function importMarkdown(file: File) {
    const text = await file.text();
    if (content.trim()) {
      const ok = await confirmInApp(
        "Remplacer le contenu actuel ? Une version sera conservée avant."
      );
      if (!ok) {
        return;
      }
      await fetch(`/api/pages/${pageId}`, {
        body: JSON.stringify({
          revision: revisionRef.current,
          snapshot: true,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
    }
    latest.current = { ...latest.current, content: text };
    setContent(text);
  }

  async function remove() {
    const ok = await confirmInApp("Supprimer cette page ?");
    if (!ok) {
      return;
    }
    const response = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    router.push("/pages");
  }

  function togglePanel() {
    setPanelOpen((current) => {
      const next = !current;
      localStorage.setItem(PANEL_KEY, next ? "1" : "0");
      return next;
    });
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">Cette page est introuvable.</p>
        <Link className="mt-3 inline-block text-sm underline" href="/pages">
          Retour aux pages
        </Link>
      </div>
    );
  }
  if (isLoading || !page || !ready) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Chargement de la page…
      </p>
    );
  }

  const showPanel = panelOpen && page.canEdit;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
        <PageBackButton />
        <FileTextIcon className="size-4 text-muted-foreground" />
        <input
          aria-label="Titre de la page"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none"
          disabled={!page.canEdit}
          onChange={(event) => {
            const next = event.target.value;
            latest.current = { ...latest.current, title: next };
            setTitle(next);
          }}
          value={title}
        />
        <span className="text-xs text-muted-foreground">
          {countWords(content)} mots · {STATUS_LABEL[status]}
        </span>
        {page.canEdit ? (
          <select
            aria-label="Projet"
            className="field-input h-8 max-w-40 px-2 text-xs"
            onChange={(event) => {
              const value = event.target.value;
              void patchMeta({ projectId: value || null });
            }}
            value={page.projectId ?? ""}
          >
            <option value="">Sans projet</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground">
            {page.projectName ?? "Lecture seule"}
          </span>
        )}
        {page.canEdit ? (
          <>
            <button
              className="chip"
              onClick={() => void snapshot()}
              type="button"
            >
              Version
            </button>
            <button
              className="chip"
              onClick={() => void openVersions()}
              type="button"
            >
              <HistoryIcon className="size-3.5" /> Historique
            </button>
            <input
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importMarkdown(file);
                }
                event.target.value = "";
              }}
              ref={fileRef}
              type="file"
            />
            <button
              className="chip"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              Importer
            </button>
            <details className="relative">
              <summary className="chip cursor-pointer list-none">
                <DownloadIcon className="size-3.5" /> Télécharger
              </summary>
              <div className="absolute right-0 z-20 mt-1 flex w-36 flex-col rounded-xl border border-border bg-popover p-1 shadow-lg">
                {(
                  [
                    ["md", "Markdown"],
                    ["txt", "Texte"],
                    ["html", "HTML"],
                    ["docx", "Word"],
                    ["pdf", "PDF"],
                  ] as const
                ).map(([format, label]) => (
                  <a
                    className="rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                    href={`/api/pages/${pageId}/export?format=${format}`}
                    key={format}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </details>
            <button
              className="chip"
              onClick={() => void remove()}
              type="button"
            >
              <Trash2Icon className="size-3.5" />
            </button>
            <button
              aria-expanded={panelOpen}
              aria-label="Afficher ou masquer mAI"
              className={cn("chip", panelOpen && "data-[active=true]")}
              data-active={panelOpen ? "true" : "false"}
              onClick={togglePanel}
              type="button"
            >
              <PanelRightIcon className="size-3.5" /> mAI
            </button>
          </>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1">
        <MarkdownEditor
          onChange={(next) => {
            latest.current = { ...latest.current, content: next };
            setContent(next);
          }}
          onSelection={setSelection}
          readOnly={!page.canEdit}
          value={content}
        />
        {showPanel ? (
          <aside className="fixed inset-0 z-40 flex w-full flex-col border-border/60 bg-background sm:static sm:z-auto sm:w-[420px] sm:shrink-0 sm:border-l">
            <AssistantPanel
              key={pageId}
              messages={page.messages}
              modelId={page.modelId}
              onModelChange={(model) => {
                void patchMeta({ modelId: model });
              }}
              onPromptSaved={(customPrompt) => {
                void patchMeta({ customPrompt });
              }}
              onProposal={() => {
                void mutate();
              }}
              onUpdated={applyRemote}
              pageId={pageId}
              pendingProposals={page.pendingProposals}
              prompt={page.customPrompt ?? ""}
              revision={revision}
              selection={selection}
            />
          </aside>
        ) : null}
      </div>
      {versionsOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="flex h-full w-full max-w-md flex-col bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Historique</h2>
              <button
                className="chip"
                onClick={() => setVersionsOpen(false)}
                type="button"
              >
                Fermer
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune version enregistrée.
              </p>
            ) : (
              <ul className="space-y-2 overflow-y-auto">
                {versions.map((version) => (
                  <li
                    className="surface-card flex items-center justify-between gap-2"
                    key={version.id}
                  >
                    <div>
                      <p className="text-sm font-medium">{version.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {version.source} ·{" "}
                        {new Date(version.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <button
                      className="chip"
                      onClick={() => void restore(version.id)}
                      type="button"
                    >
                      Restaurer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
