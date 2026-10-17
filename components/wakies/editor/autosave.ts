"use client";

import type { Page } from "@/lib/wakies/pages";
export type PageDraft = Pick<Page, "title" | "content" | "parentId">;
export type SaveState = {
  page?: Page;
  draft?: PageDraft;
  remote?: Page;
  status: "saved" | "dirty" | "saving" | "error" | "conflict";
  error?: string;
};
export type SavePage = (
  id: string,
  patch: PageDraft & { expectedRevision: number },
  signal: AbortSignal
) => Promise<Page>;
const fields = (page: Page): PageDraft => ({
  content: page.content,
  parentId: page.parentId,
  title: page.title,
});
const equal = (a: PageDraft, b: PageDraft) =>
  a.title === b.title && a.content === b.content && a.parentId === b.parentId;
export class PageAutosave {
  private readonly save: SavePage;
  private state: SaveState = { status: "saved" };
  private readonly listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private controller?: AbortController;
  private pending?: Promise<boolean>;
  private generation = 0;

  constructor(save: SavePage) {
    this.save = save;
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(patch: Partial<SaveState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  private get changed() {
    return !!(
      this.state.page &&
      this.state.draft &&
      !equal(fields(this.state.page), this.state.draft)
    );
  }
  get dirty() {
    return (
      !!this.pending ||
      this.changed ||
      ["error", "conflict"].includes(this.state.status)
    );
  }
  receive(page: Page) {
    if (this.state.page?.id !== page.id) {
      this.generation++;
      clearTimeout(this.timer);
      this.controller?.abort();
      this.pending = undefined;
      this.publish({
        draft: fields(page),
        error: undefined,
        page,
        remote: page,
        status: "saved",
      });
      return;
    }
    if (page.revision <= (this.state.remote?.revision ?? 0)) return;
    if (this.pending) {
      this.publish({ remote: page });
      return;
    }
    if (this.changed || this.state.status === "conflict") {
      clearTimeout(this.timer);
      this.publish({
        error:
          "Cette page a été modifiée ailleurs. Votre brouillon est en sécurité. Copiez-le avant de charger la dernière version.",
        remote: page,
        status: "conflict",
      });
    } else
      this.publish({
        draft: fields(page),
        error: undefined,
        page,
        remote: page,
        status: "saved",
      });
  }
  edit(patch: Partial<PageDraft>) {
    if (!this.state.draft) return;
    this.publish({ draft: { ...this.state.draft, ...patch } });
    if (["error", "conflict"].includes(this.state.status)) return;
    this.publish({
      error: undefined,
      status: this.pending ? "saving" : this.changed ? "dirty" : "saved",
    });
    this.schedule();
  }
  private schedule() {
    clearTimeout(this.timer);
    if (
      this.changed &&
      !this.pending &&
      !["error", "conflict"].includes(this.state.status)
    )
      this.timer = setTimeout(() => void this.flush(), 800);
  }
  async flush(retry = false): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.pending) {
      await this.pending;
      return this.changed ? this.flush(retry) : this.state.status === "saved";
    }
    if (!this.state.page || !this.state.draft) return false;
    if (
      this.state.status === "conflict" ||
      (this.state.status === "error" && !retry)
    )
      return false;
    if (!this.changed && this.state.status !== "error") {
      this.publish({ error: undefined, status: "saved" });
      return true;
    }
    const page = this.state.page,
      draft = { ...this.state.draft },
      generation = this.generation;
    if (
      !draft.title.trim() ||
      draft.title.length > 160 ||
      draft.content.length > 100_000
    ) {
      this.publish({
        error:
          "Utilisez un titre de 160 caractères maximum et un document de 100 000 caractères maximum. Votre brouillon est toujours là.",
        status: "error",
      });
      return false;
    }
    this.controller = new AbortController();
    const controller = this.controller;
    this.publish({ error: undefined, status: "saving" });
    const pending = (async () => {
      let deadline: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          this.save(
            page.id,
            { ...draft, expectedRevision: page.revision },
            controller.signal
          ),
          new Promise<never>((_, reject) => {
            deadline = setTimeout(() => {
              controller.abort();
              reject(
                new Error(
                  "L’enregistrement a expiré. Votre brouillon est en sécurité ; réessayez une fois la connexion rétablie."
                )
              );
            }, 10_000);
          }),
        ]);
        if (generation !== this.generation) return false;
        const unchanged = equal(this.state.draft!, draft);
        const remote =
          this.state.remote && this.state.remote.revision > result.revision
            ? this.state.remote
            : result;
        this.publish({
          draft: unchanged ? fields(result) : this.state.draft,
          page: result,
          remote,
        });
        this.publish({
          error:
            remote.revision > result.revision
              ? "Une version plus récente existe. Votre brouillon est conservé."
              : undefined,
          status:
            remote.revision > result.revision
              ? "conflict"
              : this.changed
                ? "dirty"
                : "saved",
        });
        return this.state.status !== "conflict";
      } catch (error) {
        if (generation !== this.generation) return false;
        const conflict =
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 409;
        this.publish({
          error: conflict
            ? "Cette page a été modifiée ailleurs. Votre brouillon est en sécurité. Copiez-le avant de charger la dernière version."
            : error instanceof Error
              ? error.message
              : "Enregistrement impossible. Votre brouillon est en sécurité.",
          status: conflict ? "conflict" : "error",
        });
        return false;
      } finally {
        clearTimeout(deadline);
        if (generation === this.generation) {
          this.pending = undefined;
          this.publish({});
          this.schedule();
        }
      }
    })();
    this.pending = pending;
    const success = await pending;
    if (success && generation === this.generation && this.changed)
      return this.flush(retry);
    return success;
  }
  useLatest() {
    const page = this.state.remote;
    if (!page) return;
    this.generation++;
    clearTimeout(this.timer);
    this.controller?.abort();
    this.pending = undefined;
    this.publish({
      draft: fields(page),
      error: undefined,
      page,
      remote: page,
      status: "saved",
    });
  }
  dispose() {
    this.generation++;
    clearTimeout(this.timer);
    this.controller?.abort();
    this.pending = undefined;
    this.listeners.clear();
  }
}
