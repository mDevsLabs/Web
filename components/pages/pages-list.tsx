"use client";

import { FileTextIcon, PlusIcon, SearchIcon, Trash2Icon } from "@mdevs/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { useProjects } from "@/hooks/use-projects";
import type { PageListResponse } from "@/lib/pages/types";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn, fetcher } from "@/lib/utils";

export function PagesList() {
  const router = useRouter();
  const { projects } = useProjects();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const key = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (projectFilter === "none") {
      params.set("projectId", "none");
    } else if (projectFilter !== "all") {
      params.set("projectId", projectFilter);
    }
    const search = params.toString();
    return search ? `/api/pages?${search}` : "/api/pages";
  }, [projectFilter, query]);
  const { data, error, isLoading, mutate } = useSWR<PageListResponse>(
    key,
    fetcher
  );

  async function create() {
    setCreating(true);
    try {
      const response = await fetch("/api/pages", {
        body: JSON.stringify(
          projectFilter !== "all" && projectFilter !== "none"
            ? { projectId: projectFilter }
            : {}
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.message ?? "Impossible de créer la page.");
        return;
      }
      router.push(`/pages/${body.page.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function duplicate(id: string) {
    const response = await fetch("/api/pages", {
      body: JSON.stringify({ duplicateOf: id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.message ?? "Impossible de dupliquer la page.");
      return;
    }
    await mutate();
    router.push(`/pages/${body.page.id}`);
  }

  async function remove(id: string) {
    const ok = await confirmInApp("Supprimer cette page ?");
    if (!ok) {
      return;
    }
    const response = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Impossible de supprimer la page.");
      return;
    }
    await mutate();
  }

  const limitLabel =
    data?.limit === null || data?.limit === undefined
      ? `${data?.used ?? 0} pages`
      : `${data.used} / ${data.limit} pages`;
  const atLimit =
    data?.limit !== null &&
    data?.limit !== undefined &&
    data.used >= data.limit;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="border-b border-border/40 px-6 py-6 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <PageBackButton />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileTextIcon className="size-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Pages
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Rédigez en Markdown, exportez, et faites éditer par mAI.
              </p>
            </div>
          </div>
          <button
            className="chip"
            data-active="true"
            disabled={creating || atLimit}
            onClick={() => void create()}
            type="button"
          >
            <PlusIcon className="size-3.5" /> Nouvelle page
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{limitLabel}</p>
      </div>
      <div className="flex flex-col gap-3 px-6 py-4 sm:px-8">
        <div className="relative max-w-md">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <input
            aria-label="Rechercher une page"
            className="field-input h-9 w-full pr-3 pl-8 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une page"
            value={query}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className="chip"
            data-active={projectFilter === "all" ? "true" : "false"}
            onClick={() => setProjectFilter("all")}
            type="button"
          >
            Toutes
          </button>
          <button
            className="chip"
            data-active={projectFilter === "none" ? "true" : "false"}
            onClick={() => setProjectFilter("none")}
            type="button"
          >
            Sans projet
          </button>
          {projects.map((project) => (
            <button
              className="chip"
              data-active={projectFilter === project.id ? "true" : "false"}
              key={project.id}
              onClick={() => setProjectFilter(project.id)}
              type="button"
            >
              {project.name}
            </button>
          ))}
        </div>
        {error ? (
          <p className="text-sm text-destructive">
            Impossible de charger les pages.
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : null}
        {!isLoading && data && data.pages.length === 0 ? (
          <div className="surface-card text-sm text-muted-foreground">
            Aucune page pour l'instant. Créez-en une pour commencer.
          </div>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {data?.pages.map((item) => (
            <li className="surface-card flex flex-col gap-2" key={item.id}>
              <Link className="min-w-0" href={`/pages/${item.id}`}>
                <h2 className="truncate font-medium">{item.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.excerpt || "Page vide"}
                </p>
              </Link>
              <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {item.projectName ?? "Sans projet"} ·{" "}
                  {new Date(item.updatedAt).toLocaleDateString("fr-FR")}
                  {item.canEdit ? "" : " · lecture seule"}
                </span>
                {item.canEdit ? (
                  <span className="flex gap-1">
                    <button
                      className={cn("chip")}
                      onClick={() => void duplicate(item.id)}
                      type="button"
                    >
                      Dupliquer
                    </button>
                    <button
                      className="chip"
                      onClick={() => void remove(item.id)}
                      type="button"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
