"use client";

import { FileTextIcon } from "@mdevs/icons/files/file-text";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import {
  normalizePageFont,
  PAGE_FONT_LABELS,
  PAGE_FONTS,
  type PageFont,
} from "@/lib/pages/style";
import { fetcher } from "@/lib/utils";

type Preferences = {
  pagesDefaultFont?: string | null;
  pagesDefaultModel?: string | null;
  pagesDefaultPrompt?: string;
};

/**
 * Défauts des pages. Le modèle et la consigne sont copiés à la création :
 * une page déjà ouverte les garde. La police est un réglage de lecture du
 * compte, appliqué au texte sans marque de toutes les pages.
 */
export function PagesSettingsSection() {
  const { data, mutate } = useSWR<Preferences>(
    "/api/user/preferences",
    fetcher,
    { dedupingInterval: 15_000 }
  );
  const [modelId, setModelId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [font, setFont] = useState<PageFont>("sans");

  useEffect(() => {
    if (!data) {
      return;
    }
    setModelId(data.pagesDefaultModel?.trim() || null);
    setPrompt(data.pagesDefaultPrompt ?? "");
    setFont(normalizePageFont(data.pagesDefaultFont));
  }, [data]);

  const values = useMemo(
    () => ({
      pagesDefaultFont: font,
      pagesDefaultModel: modelId,
      pagesDefaultPrompt: prompt,
    }),
    [font, modelId, prompt]
  );

  const apply = useCallback((etat: typeof values) => {
    setFont(etat.pagesDefaultFont);
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
          pagesDefaultFont: etat.pagesDefaultFont,
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
              Modèle, consigne et police de lecture
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Chaque réglage est enregistré dès que vous le modifiez.
        </p>
      </div>
      <div className="surface-card flex flex-col gap-4 p-5">
        <p className="text-xs text-muted-foreground">
          Le modèle et la consigne sont copiés à la création d'une page. Une
          page déjà écrite les garde. La police s'applique tout de suite au
          texte qui n'a pas la sienne.
        </p>
        <label className="flex flex-col gap-1.5" htmlFor="pages-default-font">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Police
          </span>
          <select
            className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-2 text-xs text-foreground"
            id="pages-default-font"
            onChange={(evenement) =>
              setFont(normalizePageFont(evenement.target.value))
            }
            value={font}
          >
            {PAGE_FONTS.map((value) => (
              <option key={value} value={value}>
                {PAGE_FONT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
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
