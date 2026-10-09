"use client";

import {
  ArrowLeftIcon as ArrowLeft,
  CheckIcon as Check,
  FileCode2Icon as FileCode2,
  LoaderCircleIcon as LoaderCircle,
  PanelLeftIcon as PanelLeft,
} from "@mdevs/icons";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/components/wakies/api";
import { DocumentMenu } from "@/components/wakies/editor/DocumentMenu";
import { inspectMarkdown } from "@/components/wakies/editor/markdown";
import { usePageAutosave } from "@/components/wakies/editor/use-page-autosave";
import { PageConversation } from "@/components/wakies/PageConversation";
import type { Page } from "@/lib/wakies/pages";
import type { WorkspaceState } from "@/lib/wakies/shared/types";

const RichEditor = lazy(() => import("@/components/wakies/editor/RichEditor"));
export function PageDocument({
  page,
  pages,
  workspace,
  paused,
  onHome,
  onOutline,
  onSubpage,
  onDirty,
  onSaved,
  onRefresh,
  onSchedule,
  onThread,
  onSettings,
  onCreateWakie,
}: {
  page: Page;
  pages: Page[];
  workspace: WorkspaceState;
  paused: boolean;
  onHome: () => void;
  onOutline: () => void;
  onSubpage: () => void;
  onDirty: (value: boolean) => void;
  onSaved: (page: Page) => void;
  onRefresh: () => void;
  onSchedule: (id: string) => void;
  onThread: (id: string) => void;
  onSettings: () => void;
  onCreateWakie: () => void;
}) {
  const { controller, state } = usePageAutosave(page, onSaved);
  const draft = state.draft!;
  const [source, setSource] = useState(false);
  const [move, setMove] = useState(false);
  const [notice, setNotice] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const safety = useMemo(() => inspectMarkdown(draft.content), [draft.content]);
  const sourceMode = source || !safety.supported;
  useEffect(() => {
    onDirty(controller.dirty);
    return () => onDirty(false);
  }, [state, controller, onDirty]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (controller.dirty) event.preventDefault();
    };
    const save = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s" &&
        !event.isComposing
      ) {
        event.preventDefault();
        void controller.flush(true);
      }
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("keydown", save);
    return () => {
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("keydown", save);
    };
  }, [controller]);
  const beforeChat = useCallback(() => controller.flush(true), [controller]);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([draft.content], { type: "text/markdown;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.title.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "page"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const latest = async () => {
    if (
      !window.confirm(
        "Charger la dernière version enregistrée de la page et remplacer ce brouillon ? Téléchargez d’abord le brouillon si vous voulez le conserver."
      )
    )
      return;
    try {
      controller.receive(
        await api<Page>(`/spaces/${page.spaceId}/pages/${page.id}`)
      );
      controller.useLatest();
      setNotice("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Impossible de charger la dernière version de la page. Votre brouillon est inchangé."
      );
    }
  };
  const descendants = new Set([page.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of pages)
      if (
        item.parentId &&
        descendants.has(item.parentId) &&
        !descendants.has(item.id)
      ) {
        descendants.add(item.id);
        changed = true;
      }
  }
  const status =
    state.status === "saving"
      ? "Enregistrement…"
      : state.status === "saved"
        ? "Toutes les modifications sont enregistrées"
        : state.status === "dirty"
          ? "Modifications non enregistrées"
          : state.status === "conflict"
            ? "Modifications à vérifier"
            : "Enregistrement impossible";
  return (
    <section
      aria-label="Espace de travail du document"
      className={`document-session ${chatOpen ? "chat-visible" : ""}`}
    >
      <div className="document-column">
        <header className="document-topbar">
          <button className="document-back" onClick={onHome}>
            <ArrowLeft size={16} />
            <span>Toutes les pages</span>
          </button>
          <button
            aria-label="Afficher ou masquer le plan de la page"
            className="document-icon"
            onClick={onOutline}
          >
            <PanelLeft size={17} />
          </button>
          <span
            aria-live="polite"
            className={`document-save-status ${state.status}`}
            role="status"
          >
            {state.status === "saved" ? (
              <Check size={13} />
            ) : state.status === "saving" ? (
              <LoaderCircle className="saving-spinner" size={13} />
            ) : null}
            {status}
          </span>
          <DocumentMenu
            items={[
              {
                action: () => void controller.flush(true),
                label: "Enregistrer · ⌘/Ctrl S",
              },
              {
                action: () => {
                  if (sourceMode && !safety.supported) {
                    setNotice(
                      safety.reason ?? "Ce document nécessite le mode source."
                    );
                    return;
                  }
                  setSource(!sourceMode);
                },
                label: sourceMode ? "Éditeur visuel" : "Source Markdown",
              },
              { action: () => setMove(!move), label: "Déplacer la page" },
              { action: onSubpage, label: "Nouvelle sous-page" },
              { action: download, label: "Télécharger le Markdown" },
              ...(page.sourceThreadId
                ? [
                    {
                      action: () => onThread(page.sourceThreadId!),
                      label: "Ouvrir la conversation source",
                    },
                  ]
                : []),
            ]}
          />
        </header>
        <div className="document-scroll">
          <article className="document-reading-column">
            {state.error && (
              <div
                className={`document-save-notice ${state.status}`}
                role="alert"
              >
                <p>{state.error}</p>
                <div>
                  {state.status === "error" && (
                    <button onClick={() => void controller.flush(true)}>
                      Réessayer l’enregistrement
                    </button>
                  )}
                  <button onClick={download}>Télécharger le brouillon</button>
                  {state.status === "conflict" && (
                    <button onClick={() => void latest()}>
                      Charger la dernière version
                    </button>
                  )}
                </div>
              </div>
            )}
            {notice && (
              <div className="document-notice" role="status">
                {notice}
                <button onClick={() => setNotice("")}>Ignorer</button>
              </div>
            )}
            {move && (
              <div
                className="document-move"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMove(false);
                }}
              >
                <label>
                  Déplacer sous
                  <select
                    aria-label="Page parente"
                    autoFocus
                    onChange={(e) =>
                      controller.edit({ parentId: e.target.value || null })
                    }
                    value={draft.parentId ?? ""}
                  >
                    <option value="">Racine de l’Espace</option>
                    {pages
                      .filter((p) => !descendants.has(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </label>
                <button onClick={() => setMove(false)}>Terminé</button>
              </div>
            )}
            <input
              aria-label="Titre de la page"
              className="document-title"
              maxLength={160}
              onChange={(event) =>
                controller.edit({ title: event.target.value })
              }
              placeholder="Page sans titre"
              value={draft.title}
            />
            {sourceMode ? (
              <>
                <div className="source-mode-label">
                  <FileCode2 size={15} />
                  <span>Source Markdown</span>
                </div>
                {!safety.supported && (
                  <p className="source-mode-reason">{safety.reason}</p>
                )}
                <textarea
                  aria-label="Markdown de la page"
                  className="document-source"
                  maxLength={100_000}
                  onChange={(event) =>
                    controller.edit({ content: event.target.value })
                  }
                  spellCheck={false}
                  value={draft.content}
                />
              </>
            ) : (
              <Suspense
                fallback={
                  <div className="editor-loading">Chargement de l’éditeur…</div>
                }
              >
                <RichEditor
                  onChange={(content) => controller.edit({ content })}
                  onNotice={setNotice}
                  value={draft.content}
                />
              </Suspense>
            )}
          </article>
        </div>
      </div>
      <div className={`document-assistant ${chatOpen ? "open" : ""}`}>
        <PageConversation
          beforeChat={beforeChat}
          onCreateWakie={onCreateWakie}
          onOpenChange={setChatOpen}
          onRefresh={onRefresh}
          onSchedule={onSchedule}
          onSettings={onSettings}
          page={page}
          paused={paused}
          workspace={workspace}
        />
      </div>
    </section>
  );
}
