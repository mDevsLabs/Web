"use client";

import type React from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  Loader2Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
  Wand2Icon,
} from "@mdevs/icons";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { APP_PRICING_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ImageModel } from "./types";
import { ASPECT_RATIOS, PROMPT_SUGGESTIONS } from "./types";

export function ImagePromptControls({
  models,
  isLoadingModels,
  selectedModelId,
  selectedModel,
  onModelChange,
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  aspectRatio,
  onAspectRatioChange,
  showAdvanced,
  onToggleAdvanced,
  isGenerating,
  isQuotaExhausted,
  quotaRemaining,
  onGenerate,
  children,
}: {
  models: ImageModel[];
  isLoadingModels: boolean;
  selectedModelId: string;
  selectedModel?: ImageModel;
  onModelChange: (modelId: string) => void;
  prompt: string;
  onPromptChange: (val: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (val: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratioId: string) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  isGenerating: boolean;
  isQuotaExhausted: boolean;
  quotaRemaining: number;
  onGenerate: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:col-span-5">
      {/* Carte Sélection du Modèle */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <SparklesIcon className="size-3.5 text-info" />
            <span>Modèle d'Image</span>
          </label>
          {selectedModel && (
            <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
              {selectedModel.id}
            </span>
          )}
        </div>

        {isLoadingModels ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin text-primary" />
            <span>Chargement des modèles disponibles...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ModelSelectorCompact
              models={models}
              onModelChange={onModelChange}
              placeholder="Modèle d'image"
              selectedModelId={selectedModelId}
              source="images"
              variant="block"
            />

            {selectedModel && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {selectedModel.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Carte Prompt & Source */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-md">
        {/* Description de l'image (Prompt) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wand2Icon className="size-3.5 text-info" />
              <span>Description de l'image (Prompt)</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {prompt.length}/2000
            </span>
          </div>

          <textarea
            className="w-full rounded-xl border border-border/80 bg-background/90 p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Décrivez précisément ce que vous souhaitez générer (sujet, style artistique, éclairage, ambiance, détails)..."
            rows={4}
            value={prompt}
          />

          {/* Suggestions rapides */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground py-0.5">
              Idées :
            </span>
            {PROMPT_SUGGESTIONS.slice(0, 3).map((sug, i) => (
              <button
                className="rounded-lg border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground truncate max-w-[200px]"
                key={i}
                onClick={() => onPromptChange(sug)}
                type="button"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Uploader d'image source injecté */}
        {children}

        {/* Format & Ratio d'aspect */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Format & Dimensions
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ASPECT_RATIOS.map((r) => (
              <button
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all",
                  aspectRatio === r.id
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                )}
                key={r.id}
                onClick={() => onAspectRatioChange(r.id)}
                type="button"
              >
                <r.icon className="size-4 mb-1" />
                <span className="text-xs font-bold">{r.id}</span>
                <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                  {r.width}x{r.height}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Paramètres avancés (Prompt négatif) */}
        <div>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            onClick={onToggleAdvanced}
            type="button"
          >
            <SlidersHorizontalIcon className="size-3.5" />
            <span>
              {showAdvanced
                ? "Masquer les options avancées"
                : "Options avancées (Prompt négatif)"}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/60 bg-background/50 p-3">
              <label className="text-xs font-semibold text-foreground">
                Prompt Négatif (éléments à exclure)
              </label>
              <textarea
                className="w-full rounded-lg border border-border/80 bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                onChange={(e) => onNegativePromptChange(e.target.value)}
                placeholder="flou, basse qualité, artefacts, texte déformé, filigrane..."
                rows={2}
                value={negativePrompt}
              />
            </div>
          )}
        </div>

        {/* Bouton de génération & Quota */}
        <div className="pt-2">
          <button
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]",
              isQuotaExhausted
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 hover:shadow-indigo-500/25"
            )}
            disabled={isGenerating || !prompt.trim() || isQuotaExhausted}
            onClick={onGenerate}
            type="button"
          >
            {isGenerating ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>Création de l'image en cours...</span>
              </>
            ) : isQuotaExhausted ? (
              <>
                <AlertCircleIcon className="size-4" />
                <span>Quota journalier épuisé</span>
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" />
                <span>
                  Générer l'image ({quotaRemaining} restant
                  {quotaRemaining > 1 ? "s" : ""})
                </span>
              </>
            )}
          </button>

          {isQuotaExhausted && (
            <p className="mt-2 text-center text-xs text-warning">
              Quota journalier atteint. Réinitialisation automatique à minuit
              UTC ou{" "}
              <Link className="underline font-semibold" href={APP_PRICING_URL}>
                passez à un forfait supérieur
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
