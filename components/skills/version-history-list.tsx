"use client";

import { RefreshCwIcon } from "@mdevs/icons";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { Skill, SkillVersion } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function VersionHistoryList({
  skill,
  onRestored,
}: {
  skill: Skill;
  onRestored: () => void;
}) {
  const { data: versions = [], isLoading } = useSWR<SkillVersion[]>(
    `/api/skills/${skill.id}/versions`,
    fetcher
  );
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/skills/${skill.id}/versions`, {
        body: JSON.stringify({ versionId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          extractApiErrorMessage(data) || "Erreur lors de la restauration"
        );
      }
      toast.success("Version restaurée : un nouveau snapshot a été créé.");
      onRestored();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la restauration");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto py-2">
      {isLoading && (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      )}
      {!isLoading && versions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune version précédente. Modifiez le contenu du skill (nom,
          instructions, outils, paramètres…) puis enregistrez pour créer un
          premier snapshot.
        </p>
      )}
      {versions.map((v) => (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-2.5"
          key={v.id}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">
                {v.versionLabel}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(v.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground/80">
              {v.name}
              {v.description ? ` — ${v.description}` : ""}
            </p>
          </div>
          <Button
            disabled={restoringId === v.id}
            onClick={() => handleRestore(v.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCwIcon className="size-3 mr-1" />
            {restoringId === v.id ? "Restauration…" : "Restaurer"}
          </Button>
        </div>
      ))}
    </div>
  );
}
