"use client";

import { FileTextIcon } from "@mdevs/icons/files/file-text";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import { fetcher } from "@/lib/utils";

type Preferences = {
  pagesDefaultModel?: string | null;
  pagesDefaultPrompt?: string;
};

/**
 * Défauts des pages nouvelles. Le modèle et la consigne d'une page déjà
 * ouverte restent ceux du document : cet écran ne les réécrit pas.
 */
export function PagesSettingsSection() {
  const { data, mutate } = useSWR<Preferences>(
    "/api/user/preferences",
    fetcher,
    { dedupingInterval: 15_000 }
  );
  const [modelId, setModelId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }
    setModelId(data.pagesDefaultModel?.trim() || null);
    setPrompt(data.pagesDefaultPrompt ?? "");
  }, [data]);

  const values = useMemo(
    () => ({
      pagesDefaultModel: modelId,
      pagesDefaultPrompt: prompt,
    }),
    [modelId, prompt]
  );

  const apply = useCallback((etat: typeof values) => {
    setModelId(etat.pagesDefaultModel);
    setPrompt(etat.pagesDefaultPrompt);
  }, []);

  useAutosaveSection({
    apply,
    enabled: Boolean(data),
    errorMessage: "Impossible d'enregistrer les paramètres de Pages.",
    successMessage: "Paramètres de Pages enregistrés",
    values,
    write: async (etat) => {
      const reponse = await fetch("/api/user/preferences", {
        body: JSON.stringify({
          pagesDefaultModel: etat.pagesDefaultModel,
          pagesDefaultPrompt: etat.pagesDefaultPrompt,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!reponse.ok) {
        throw new Error("Erreur lors de l'enregistrement des préférences.");
      }
      await mutate();
    },
  });

  return (
    <section
      className="flex scroll-mt-24 flex-col gap-6 border-t border-border/50 pt-4"
      id="pages"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileTextIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground sm:text-lg">
              Pages
            </h3>
            <p className="text-xs text-muted-foreground">
              Modèle et consigne des nouvelles pages
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Chaque réglage est enregistré dès que vous le modifiez.
        </p>
      </div>
      <div className="surface-card flex flex-col gap-4 p-5">
        <p className="text-xs text-muted-foreground">
          Ces valeurs sont copiées à la création d'une page. Une page déjà
          écrite garde son propre modèle et sa propre consigne.
        </p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Modèle
          </span>
          <ModelSelectorCompact
            allowEmpty
            emptyLabel="Modèle du compte"
            fallbackToFirst={false}
            onEmptySelect={() => setModelId(null)}
            onModelChange={setModelId}
            selectedModelId={modelId ?? ""}
            source="chat"
          />
        </div>
        <label className="flex flex-col gap-1.5" htmlFor="pages-default-prompt">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Consigne
          </span>
          <textarea
            className="field-input min-h-24 w-full rounded-lg border border-border/70 bg-card px-2.5 py-2 text-xs text-foreground"
            id="pages-default-prompt"
            onChange={(evenement) => setPrompt(evenement.target.value)}
            placeholder="Consignes ajoutées aux nouvelles pages. Laisser vide pour n'en ajouter aucune."
            value={prompt}
          />
        </label>
      </div>
    </section>
  );
}
