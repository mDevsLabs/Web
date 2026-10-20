"use client";

/**
 * Terrain de jeu — Site officiel.
 *
 * Trois terrains dans une même page : texte, image, audio. Chacun a son
 * catalogue, son modèle sélectionné et son exécution.
 *
 * Deux règles structurantes :
 *
 * 1. **Aucune clé ni URL d'API en client.** Les requêtes passent par
 *    l'exécuteur BFF (`/api/site/account/api-executor`), qui résout la clé
 *    côté serveur et n'autorise que les routes de l'allowlist
 *    (`lib/site/api-key-routes.ts`).
 * 2. **Le catalogue se rafraîchit tout seul** (toutes les 10 minutes) et à
 *    chaque changement de modèle : c'est le moment où l'utilisateur regarde
 *    le catalogue, donc le moment où il doit être à jour. Le bouton du
 *    sélecteur force une revalidation immédiate.
 */

import {
  ArrowRightIcon as ArrowRight,
  ImageIcon as ImageIconGlyph,
  KeyIcon as Key,
  Loader2Icon as Loader2,
  MessageSquareIcon as MessageSquare,
  SendIcon as Send,
  Volume2Icon as Volume2,
  Wand2Icon as WandSparkles,
} from "@mdevs/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import type {
  CatalogResponse,
  ChatCompletionResponse,
  PlaygroundMode,
} from "@/app/(chat)/site/playground/playground-types";
import { readPlaygroundError } from "@/app/(chat)/site/playground/playground-types";
import { useAuth } from "@/components/site/auth-provider";
import { SiteModelSelector } from "@/components/site/model-selector-groups";
import Link from "@/components/site/router";
import {
  MODEL_CATALOG_REFRESH_INTERVAL,
  modelCatalogKey,
  SITE_MODEL_CATALOG_ENDPOINTS,
} from "@/lib/ai/model-catalog";
import {
  PROVIDER_NAMES,
  resolveProviderKey,
} from "@/lib/ai/model-selector/provider";
import { groupModelsByProvider } from "@/lib/ai/model-selector/order";
import type { SharedModel } from "@/lib/ai/model-selector/types";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";
import { cn } from "@/lib/utils";

const MODES: Array<{
  id: PlaygroundMode;
  icon: typeof MessageSquare;
  label: string;
}> = [
  { icon: MessageSquare, id: "chat", label: "Texte" },
  { icon: ImageIconGlyph, id: "images", label: "Image" },
  { icon: Volume2, id: "speech", label: "Audio" },
];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Catalogue indisponible.");
  }
  return response.json();
};

export function PlaygroundClient() {
  const { isAuthenticated, token } = useAuth();
  const [mode, setMode] = useState<PlaygroundMode>("chat");
  const [selectedModels, setSelectedModels] = useState<
    Record<PlaygroundMode, string>
  >({ chat: "", images: "", speech: "" });
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [outputAudio, setOutputAudio] = useState<string | null>(null);

  const endpoint = SITE_MODEL_CATALOG_ENDPOINTS[mode];

  const {
    data: catalog,
    isLoading: isLoadingCatalog,
    mutate: mutateCatalog,
  } = useSWR<CatalogResponse>(modelCatalogKey(endpoint), fetcher, {
    dedupingInterval: 60_000,
    // Le catalogue bouge : on le relit périodiquement (toutes les 10
    // minutes) sans attendre une interaction.
    refreshInterval: MODEL_CATALOG_REFRESH_INTERVAL,
    revalidateOnFocus: true,
  });

  const models: SharedModel[] = useMemo(
    () => (Array.isArray(catalog?.data) ? catalog.data : []),
    [catalog]
  );

  // Regroupement par fournisseur, comme le fait le sélecteur de l'hôte.
  // L'ordre d'affichage est partagé (lib/ai/model-selector/order.ts) : la
  // famille mAI-2 ouvre la liste, le groupe mAI suit.
  const modelGroups = useMemo(
    () =>
      groupModelsByProvider(models).map(({ models: groupModels, providerKey }) => ({
        heading: PROVIDER_NAMES[providerKey.toLowerCase()] ?? providerKey.toUpperCase(),
        models: groupModels,
      })),
    [models]
  );

  // Le modèle sélectionné doit exister dans le catalogue courant : un
  // modèle retiré entre deux rafraîchissements ne doit pas rester actif.
  useEffect(() => {
    if (models.length === 0) return;
    const current = selectedModels[mode];
    if (current && models.some((model) => model.id === current)) return;
    setSelectedModels((previous) => ({ ...previous, [mode]: models[0].id }));
  }, [mode, models, selectedModels]);

  const handleSelectModel = useCallback(
    (modelId: string) => {
      setSelectedModels((previous) => ({ ...previous, [mode]: modelId }));
      // Changer de modèle, c'est regarder le catalogue : on le remet à jour
      // dans la foulée (même règle que le sélecteur de l'hôte).
      void mutateCatalog();
    },
    [mode, mutateCatalog]
  );

  const handleRefresh = useCallback(async () => {
    await mutateCatalog();
    toast.success("Catalogue rafraîchi.");
  }, [mutateCatalog]);

  const handleRun = useCallback(async () => {
    const modelId = selectedModels[mode];
    if (!modelId) {
      toast.error("Choisissez d'abord un modèle.");
      return;
    }
    if (mode !== "chat" && !prompt.trim()) {
      toast.error("Saisissez un prompt.");
      return;
    }
    if (!token) {
      toast.error("Connectez-vous pour exécuter une requête.");
      return;
    }

    setIsRunning(true);
    setOutput("");
    setOutputImage(null);
    setOutputAudio(null);

    try {
      const body =
        mode === "chat"
          ? {
              messages: [{ content: prompt, role: "user" }],
              model: modelId,
              stream: false,
            }
          : mode === "images"
            ? {
                model: modelId,
                prompt,
                response_format: "url",
                size: "1024x1024",
              }
            : {
                input: prompt,
                model: modelId,
                response_format: "mp3",
              };

      const path =
        mode === "chat"
          ? "v1/chat/completions"
          : mode === "images"
            ? "v1/images/generations"
            : "v1/audio/speech";

      const response = await fetch(SITE_API_ROUTES.apiExecutor, {
        body: JSON.stringify({
          body,
          method: "POST",
          path,
          target: "mai",
        }),
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (mode === "speech" && !contentType.includes("application/json")) {
        // La synthèse vocale renvoie un fichier binaire : on en fait un objet
        // local, l'URL est révocable à chaque nouvelle génération.
        const blob = await response.blob();
        setOutputAudio(URL.createObjectURL(blob));
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        toast.error(readPlaygroundError(payload));
        return;
      }

      if (mode === "chat") {
        const result = payload as ChatCompletionResponse;
        const content = result.choices?.[0]?.message?.content ?? "";
        const reasoning = result.choices?.[0]?.message?.reasoning ?? "";
        setOutput(
          [reasoning ? `> Réflexion\n\n${reasoning}` : "", content]
            .filter(Boolean)
            .join("\n\n---\n\n")
        );
        return;
      }

      if (mode === "images") {
        const url = payload?.data?.[0]?.url;
        if (url) {
          setOutputImage(url);
        } else {
          setOutput("Aucune image retournée par l'API.");
        }
        return;
      }

      // Audio : la réponse JSON porte l'audio en base64.
      const audio = (payload as { audio?: string }).audio;
      if (audio) {
        setOutputAudio(`data:audio/mp3;base64,${audio}`);
      } else {
        setOutput(readPlaygroundError(payload));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de l'exécution."
      );
    } finally {
      setIsRunning(false);
    }
  }, [mode, prompt, selectedModels, token]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase sm:text-5xl">
          Terrain de{" "}
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
            jeu
          </span>
        </h1>
        <p className="max-w-2xl text-sm font-light text-slate-500 sm:text-base">
          Testez les modèles mAI directement depuis le navigateur : texte,
          génération d&apos;images et synthèse vocale, avec la même API que vos
          applications.
        </p>
      </div>

      {/* Sans session, l'exécution est impossible : on le dit clairement
          plutôt que de laisser croire à une panne. */}
      {isAuthenticated ? null : (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-purple-100 bg-purple-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Key className="mt-0.5 size-5 shrink-0 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Connectez-vous pour exécuter une requête
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Le terrain de jeu utilise votre clé API. Le catalogue reste
                consultable sans compte.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-purple-700"
            href="/account/login"
          >
            Se connecter
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Bascule des terrains */}
      <div className="flex w-fit items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-200/50 p-1.5">
        {MODES.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === mode;
          return (
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all",
                isActive
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
              key={item.id}
              onClick={() => setMode(item.id)}
              type="button"
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Colonne de commande */}
        <div className="space-y-5 lg:col-span-5">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <WandSparkles className="size-4 text-purple-600" />
              Modèle
            </label>
            {isLoadingCatalog && models.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin text-purple-600" />
                Chargement du catalogue…
              </div>
            ) : (
              <SiteModelSelector
                groups={modelGroups}
                onRefresh={handleRefresh}
                onSelectModel={handleSelectModel}
                selectedModelId={selectedModels[mode]}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <MessageSquare className="size-4 text-purple-600" />
              {mode === "chat" ? "Prompt" : "Description"}
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-900 shadow-xs transition-colors focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                mode === "chat"
                  ? "Posez votre question à un modèle mAI…"
                  : mode === "images"
                    ? "Décrivez l'image à générer…"
                    : "Saisissez le texte à lire à voix haute…"
              }
              rows={6}
              value={prompt}
            />
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-50"
            disabled={isRunning}
            onClick={handleRun}
            type="button"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Exécution…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Exécuter
              </>
            )}
          </button>
        </div>

        {/* Colonne de réponse */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xs backdrop-blur-md">
            <h2 className="mb-4 text-sm font-bold text-slate-900">
              Réponse de l&apos;API
            </h2>

            {isRunning ? (
              <div className="flex items-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin text-purple-600" />
                Le modèle travaille…
              </div>
            ) : outputImage ? (
              <img
                alt="Résultat généré par l'API mAI"
                className="w-full rounded-2xl border border-slate-200"
                src={outputImage}
              />
            ) : outputAudio ? (
              <audio className="w-full" controls src={outputAudio} />
            ) : output ? (
              <pre className="max-h-[520px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700">
                {output}
              </pre>
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">
                Aucune exécution pour le moment. Choisissez un modèle, saisissez
                un prompt et lancez la requête.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
