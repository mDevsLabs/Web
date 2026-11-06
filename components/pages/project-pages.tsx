"use client";

import { FileTextIcon, PlusIcon } from "@mdevs/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { PageListResponse } from "@/lib/pages/types";
import { fetcher } from "@/lib/utils";

export function ProjectPages({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data, mutate } = useSWR<PageListResponse>(
    `/api/pages?projectId=${projectId}`,
    fetcher
  );
  const { data: owned, mutate: mutateOwned } = useSWR<PageListResponse>(
    "/api/pages",
    fetcher
  );
  const [attachId, setAttachId] = useState("");
  const candidates =
    owned?.pages.filter(
      (page) => page.canEdit && page.projectId !== projectId
    ) ?? [];

  async function create() {
    const response = await fetch("/api/pages", {
      body: JSON.stringify({ projectId, title: "Sans titre" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.message ?? "Impossible de créer la page.");
      return;
    }
    router.push(`/pages/${body.page.id}`);
  }

  async function attach() {
    if (!attachId) {
      return;
    }
    const response = await fetch(`/api/pages/${attachId}`, {
      body: JSON.stringify({ projectId }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Impossible de rattacher la page.");
      return;
    }
    setAttachId("");
    await Promise.all([mutate(), mutateOwned()]);
  }

  async function detach(id: string) {
    const response = await fetch(`/api/pages/${id}`, {
      body: JSON.stringify({ projectId: null }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!response.ok) {
      toast.error("Impossible de détacher la page.");
      return;
    }
    await Promise.all([mutate(), mutateOwned()]);
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
        <h2 className="inline-flex items-center gap-2 font-semibold text-sm">
          <FileTextIcon className="size-4" /> Pages
        </h2>
        <button className="chip" onClick={() => void create()} type="button">
          <PlusIcon className="size-3.5" /> Créer
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {candidates.length > 0 ? (
          <div className="flex gap-2">
            <select
              aria-label="Rattacher une page existante"
              className="field-input h-8 flex-1 px-2 text-xs"
              onChange={(event) => setAttachId(event.target.value)}
              value={attachId}
            >
              <option value="">Rattacher une page…</option>
              {candidates.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
            <button
              className="chip"
              disabled={!attachId}
              onClick={() => void attach()}
              type="button"
            >
              Ajouter
            </button>
          </div>
        ) : null}
        {data && data.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune page dans ce projet.
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {data?.pages.map((page) => (
            <li
              className="flex items-center justify-between gap-2"
              key={page.id}
            >
              <Link
                className="truncate text-sm hover:underline"
                href={`/pages/${page.id}`}
              >
                {page.title}
                {page.canEdit ? "" : " · lecture seule"}
              </Link>
              {page.canDetach ? (
                <button
                  className="chip"
                  onClick={() => void detach(page.id)}
                  type="button"
                >
                  Détacher
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
