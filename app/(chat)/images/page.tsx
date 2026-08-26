"use client";

import {
  AlertCircleIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  ImageIcon,
  LayersIcon,
  Loader2Icon,
  Maximize2Icon,
  MonitorIcon,
  PlusIcon,
  RectangleVerticalIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  UploadCloudIcon,
  Wand2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { useImagesUsage } from "@/hooks/use-settings";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { cn, downloadImage, formatImageSrc } from "@/lib/utils";

interface ImageModel {
  created?: number;
  description: string;
  features?: string[];
  id: string;
  name: string;
}

interface GeneratedImage {
  created_at: string;
  height: number;
  id: string;
  image_url: string;
  model: string;
  negative_prompt?: string;
  prompt: string;
  user_id: string;
  width: number;
}

const ASPECT_RATIOS: {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    height: 1024,
    icon: SquareIcon,
    id: "1:1",
    label: "1:1 Carré",
    width: 1024,
  },
  {
    height: 768,
    icon: MonitorIcon,
    id: "16:9",
    label: "16:9 Paysage",
    width: 1344,
  },
  {
    height: 1344,
    icon: SmartphoneIcon,
    id: "9:16",
    label: "9:16 Story / Mobile",
    width: 768,
  },
  {
    height: 864,
    icon: ImageIcon,
    id: "4:3",
    label: "4:3 Standard",
    width: 1152,
  },
  {
    height: 1152,
    icon: RectangleVerticalIcon,
    id: "3:4",
    label: "3:4 Portrait",
    width: 864,
  },
];

const PROMPT_SUGGESTIONS = [
  "Un paysage cyber-futuriste néon sous une pluie légère au coucher de soleil, ultra détaillé, 8k, photoréaliste",
  "Portrait artistique d'un renard astronaute explorant une planète cristalline luminescente, rendu cinématique octane",
  "Design d'intérieur scandinave minimaliste moderne avec grandes baies vitrées et vue sur les fjords enneigés",
  "Illustration vectorielle épurée d'une fusée spatiale décollant vers la lune avec des couleurs pastel douces",
  "Concept art d'une ville flottante dans les nuages avec des cascades volantes et des aéronefs à vapeur",
];

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Erreur de chargement");
    }
    return res.json();
  });

export default function ImagesPage() {
  // 1. Modèles d'images disponibles via /api/models/images
  const { data: modelsData, isLoading: isLoadingModels } = useSWR<{
    data: ImageModel[];
  }>("/api/models/images", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const models = useMemo(() => modelsData?.data || [], [modelsData]);

  // 2. Quota d'utilisation — source unique partagée avec les paramètres
  // (Consommation & Forfait) via le hook use-settings
  const {
    mutate: mutateUsage,
    usage: { dailyLimit, plan, usedToday },
  } = useImagesUsage();

  // 3. Historique des générations via /api/images/history
  const {
    data: historyData,
    mutate: mutateHistory,
    isLoading: isLoadingHistory,
  } = useSWR<{
    images: GeneratedImage[];
    total: number;
  }>("/api/images/history", fetcher, { revalidateOnFocus: false });
  const history = useMemo(() => historyData?.images || [], [historyData]);

  // États du formulaire
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Édition d'image (Image to Image)
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États de génération
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Modale plein écran
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sélectionner le premier modèle par défaut
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const defaultMod =
        models.find((m) => m.id.includes("schnell")) ||
        models.find((m) => m.id.includes("flux")) ||
        models[0];
      setSelectedModelId(defaultMod.id);
    }
  }, [models, selectedModelId]);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  const supportsImageToImage = useMemo(() => {
    if (!selectedModel) {
      return false;
    }
    const features = selectedModel.features || [];
    return (
      features.includes("image-to-image") ||
      selectedModel.id.toLowerCase().includes("diffusion") ||
      selectedModel.id.toLowerCase().includes("flux")
    );
  }, [selectedModel]);

  const currentSize = useMemo(
    () => ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0],
    [aspectRatio]
  );

  const quotaRemaining = useMemo(
    () => Math.max(0, dailyLimit - usedToday),
    [dailyLimit, usedToday]
  );

  const isQuotaExhausted = quotaRemaining <= 0;

  // Gestion de l'upload d'image source
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Veuillez sélectionner un fichier image valide (JPG, PNG, WebP)."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (maximum 10 Mo).");
      return;
    }

    setSourceImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      toast.success("Image source importée avec succès !");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSourceImage = () => {
    setSourceImage(null);
    setSourceImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Lancement de la génération
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(
        "Veuillez saisir une description (prompt) pour générer votre image."
      );
      return;
    }

    if (isQuotaExhausted) {
      toast.error(
        `Votre quota journalier est atteint (${usedToday}/${dailyLimit}). Mettez à niveau votre compte pour plus de générations !`
      );
      return;
    }

    setIsGenerating(true);
    setCurrentResult(null);

    try {
      // 1. Demande et validation du quota préalable
      const usageCheck = await fetch("/api/images/usage").then((r) => r.json());
      if (usageCheck.usedToday >= usageCheck.dailyLimit) {
        mutateUsage();
        throw new Error(
          `Quota journalier épuisé (${usageCheck.usedToday}/${usageCheck.dailyLimit}). Réinitialisation à minuit UTC.`
        );
      }

      // 2. Appel de la génération
      const payload: Record<string, any> = {
        height: currentSize.height,
        model: selectedModelId || "black-forest-labs/flux-1-schnell",
        negative_prompt: negativePrompt.trim() || undefined,
        prompt: prompt.trim(),
        size: `${currentSize.width}x${currentSize.height}`,
        width: currentSize.width,
      };

      if (sourceImage) {
        payload.image = sourceImage;
      }

      const res = await fetch("/api/images/generations", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          data?.error?.message || data?.error || "Erreur lors de la génération";
        throw new Error(errMsg);
      }

      const rawUrl =
        data?.data?.[0]?.url ||
        data?.data?.[0]?.b64_json ||
        data?.image_url ||
        data?.generatedImages?.[0]?.image?.uri ||
        data?.generatedImages?.[0]?.image?.imageBytes;
      if (!rawUrl) {
        throw new Error("Aucune image retournée par le fournisseur.");
      }
      const imageUrl = formatImageSrc(rawUrl);

      const generated: GeneratedImage = {
        created_at: new Date().toISOString(),
        height: currentSize.height,
        id: data.id || `img_${Date.now()}`,
        image_url: imageUrl,
        model: selectedModel?.name || selectedModelId,
        negative_prompt: negativePrompt.trim() || undefined,
        prompt: prompt.trim(),
        user_id: "",
        width: currentSize.width,
      };

      setCurrentResult(generated);
      toast.success("Image générée avec succès !");

      // Actualiser le quota et l'historique
      mutateUsage();
      mutateHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossible de générer l'image.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Suppression d'une image de l'historique
  const handleDeleteFromHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/images/history?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur de suppression");
      }
      toast.success("Image supprimée de l'historique");
      mutateHistory();
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  // Utiliser une image existante comme source pour édition
  const handleEditAsSource = (imgUrl: string, imgPrompt?: string) => {
    setSourceImage(imgUrl);
    if (imgPrompt && !prompt) {
      setPrompt(imgPrompt);
    }
    setActiveTab("create");
    toast.info("Image chargée comme référence pour l'édition !");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* En-tête de page */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <PageBackButton />
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-primary ring-1 ring-primary/25 shadow-sm">
            <ImageIcon className="size-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base truncate font-bold tracking-tight text-foreground sm:text-lg">
                Images mAI
              </h1>
              <span className="hidden rounded-full border border-indigo-500/30 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 md:inline">
                IA Générative
              </span>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Créez, éditez et explorez des images haute définition avec les
              modèles Flux & Diffusion
            </p>
          </div>
        </div>

        {/* Badge Quota & Liens */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <SparklesIcon className="size-4 text-amber-400" />
            <div className="text-xs">
              <span className="font-semibold text-foreground">
                {usedToday} / {dailyLimit}
              </span>{" "}
              <span className="text-muted-foreground">
                générations/j ({plan})
              </span>
            </div>
          </div>

          {isQuotaExhausted && (
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
              href={MAI_UPGRADE_URL}
              target="_blank"
            >
              <SparklesIcon className="size-3.5" />
              <span>Débloquer plus</span>
            </Link>
          )}
        </div>
      </header>

      {/* Onglets Navigation (Créer / Galerie) */}
      <div className="border-b border-border/40 bg-muted/20 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              activeTab === "create"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            onClick={() => setActiveTab("create")}
            type="button"
          >
            <Wand2Icon className="size-3.5" />
            <span>Studio de Création</span>
          </button>

          <button
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            onClick={() => setActiveTab("history")}
            type="button"
          >
            <LayersIcon className="size-3.5" />
            <span>Galerie & Historique ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="flex-1 p-4 sm:p-6">
        {activeTab === "create" ? (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Colonne gauche : Panneau de contrôle */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              {/* Carte Sélection du Modèle */}
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <SparklesIcon className="size-3.5 text-indigo-400" />
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
                    <select
                      className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      value={selectedModelId}
                    >
                      {models.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name || mod.id}
                        </option>
                      ))}
                    </select>

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
                      <Wand2Icon className="size-3.5 text-purple-400" />
                      <span>Description de l'image (Prompt)</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {prompt.length}/2000
                    </span>
                  </div>

                  <textarea
                    className="w-full rounded-xl border border-border/80 bg-background/90 p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    onChange={(e) => setPrompt(e.target.value)}
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
                        onClick={() => setPrompt(sug)}
                        type="button"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Import d'image source (Édition Image to Image) */}
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <UploadCloudIcon className="size-4 text-indigo-400" />
                      <span>Image de référence / Édition</span>
                    </span>
                    {supportsImageToImage && (
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Édition supportée
                      </span>
                    )}
                  </div>

                  {sourceImage ? (
                    <div className="relative flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-2">
                      <div className="relative size-16 overflow-hidden rounded-md border border-border">
                        <img
                          alt="Source"
                          className="size-full object-cover"
                          src={formatImageSrc(sourceImage)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {sourceImageFile?.name || "Image importée"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Utilisée comme base pour la modification
                        </p>
                      </div>
                      <button
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition"
                        onClick={handleRemoveSourceImage}
                        title="Retirer l'image"
                        type="button"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        type="file"
                      />
                      <label
                        className="flex flex-col items-center justify-center gap-1 py-3 cursor-pointer rounded-lg hover:bg-muted/30 transition text-center"
                        htmlFor="image-upload"
                      >
                        <UploadCloudIcon className="size-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          Importer une image source
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Optionnel : transformez ou modifiez une image
                          existante
                        </span>
                      </label>
                    </div>
                  )}
                </div>

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
                        onClick={() => setAspectRatio(r.id)}
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
                    onClick={() => setShowAdvanced(!showAdvanced)}
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
                        onChange={(e) => setNegativePrompt(e.target.value)}
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
                    disabled={
                      isGenerating || !prompt.trim() || isQuotaExhausted
                    }
                    onClick={handleGenerate}
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
                    <p className="mt-2 text-center text-xs text-amber-500">
                      Quota journalier atteint. Réinitialisation automatique à
                      minuit UTC ou{" "}
                      <Link
                        className="underline font-semibold"
                        href={MAI_UPGRADE_URL}
                        target="_blank"
                      >
                        passez à un forfait supérieur
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite : Résultat & Prévisualisation */}
            <div className="flex flex-col gap-5 lg:col-span-7">
              <div className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md min-h-[420px] sm:min-h-[560px] sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="size-4 text-primary" />
                    <span>Résultat de la génération</span>
                  </h3>

                  {currentResult && (
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/60 hover:bg-muted/40 transition"
                        onClick={() =>
                          setPreviewImage(
                            formatImageSrc(currentResult.image_url)
                          )
                        }
                        title="Plein écran"
                        type="button"
                      >
                        <Maximize2Icon className="size-4" />
                      </button>
                      <button
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/60 hover:bg-muted/40 transition"
                        onClick={() =>
                          downloadImage(
                            formatImageSrc(currentResult.image_url),
                            `mai-image-${Date.now()}.png`
                          )
                        }
                        title="Télécharger l'image"
                        type="button"
                      >
                        <DownloadIcon className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Zone d'affichage image */}
                <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/10 p-4 relative overflow-hidden">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="relative size-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Loader2Icon className="size-8 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Génération par l'IA en cours
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          Le modèle{" "}
                          <span className="font-semibold text-primary">
                            {selectedModel?.name}
                          </span>{" "}
                          calcule les pixels de votre chef-d'œuvre...
                        </p>
                      </div>
                    </div>
                  ) : currentResult ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/80 shadow-lg transition hover:shadow-2xl max-h-[460px]"
                        onClick={() =>
                          setPreviewImage(
                            formatImageSrc(currentResult.image_url)
                          )
                        }
                      >
                        <img
                          alt={currentResult.prompt}
                          className="max-h-[460px] w-auto object-contain rounded-xl transition duration-300 group-hover:scale-[1.01]"
                          src={formatImageSrc(currentResult.image_url)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                            <EyeIcon className="size-4" /> Agrandir
                          </span>
                        </div>
                      </div>

                      {/* Détails et actions rapides */}
                      <div className="w-full flex flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground font-medium line-clamp-2">
                            "{currentResult.prompt}"
                          </p>
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                currentResult.prompt
                              );
                              toast.success(
                                "Prompt copié dans le presse-papier !"
                              );
                            }}
                            title="Copier le prompt"
                            type="button"
                          >
                            <CopyIcon className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>
                            Modèle :{" "}
                            <strong className="text-foreground">
                              {currentResult.model}
                            </strong>{" "}
                            • {currentResult.width}x{currentResult.height}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-primary hover:underline font-semibold flex items-center gap-1"
                              onClick={() =>
                                handleEditAsSource(
                                  formatImageSrc(currentResult.image_url),
                                  currentResult.prompt
                                )
                              }
                              type="button"
                            >
                              <Wand2Icon className="size-3" /> Éditer cette
                              image
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground py-16">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground/60 border border-border/60">
                        <ImageIcon className="size-7" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Aucune image générée
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          Rédigez un prompt à gauche et cliquez sur Générer pour
                          créer votre première illustration.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Onglet Galerie & Historique */
          <div className="mx-auto max-w-7xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Historique de vos créations
                </h2>
                <p className="text-xs text-muted-foreground">
                  Retrouvez toutes les images générées avec votre compte mAI
                </p>
              </div>

              <button
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition"
                onClick={() => mutateHistory()}
                type="button"
              >
                <RefreshCwIcon className="size-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2Icon className="size-8 animate-spin text-primary" />
                <span className="text-xs">Chargement de votre galerie...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-border/60 rounded-2xl bg-card/40">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Votre galerie est vide
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Générez des images depuis la page Images pour les
                    retrouver sauvegardées ici.
                  </p>
                </div>
                <button
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  onClick={() => setActiveTab("create")}
                  type="button"
                >
                  <PlusIcon className="size-4" /> Créer une image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {history.map((item) => (
                  <div
                    className="group flex flex-col rounded-2xl border border-border/60 bg-card/60 overflow-hidden shadow-sm hover:shadow-md transition backdrop-blur-md"
                    key={item.id}
                  >
                    <div
                      className="relative aspect-square cursor-pointer overflow-hidden bg-black/10"
                      onClick={() =>
                        setPreviewImage(formatImageSrc(item.image_url))
                      }
                    >
                      <img
                        alt={item.prompt}
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                        src={formatImageSrc(item.image_url)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <EyeIcon className="size-6 text-white" />
                      </div>
                    </div>

                    <div className="p-3.5 flex flex-col gap-2 flex-1 justify-between text-xs">
                      <p
                        className="text-foreground font-medium line-clamp-2"
                        title={item.prompt}
                      >
                        {item.prompt}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[110px]">
                          {item.model}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 text-muted-foreground hover:text-primary transition"
                            onClick={() =>
                              handleEditAsSource(
                                formatImageSrc(item.image_url),
                                item.prompt
                              )
                            }
                            title="Utiliser comme source"
                            type="button"
                          >
                            <Wand2Icon className="size-3.5" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-foreground transition"
                            onClick={() =>
                              downloadImage(
                                formatImageSrc(item.image_url),
                                `mai-image-${item.id}.png`
                              )
                            }
                            title="Télécharger"
                            type="button"
                          >
                            <DownloadIcon className="size-3.5" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive transition"
                            onClick={() => handleDeleteFromHistory(item.id)}
                            title="Supprimer"
                            type="button"
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modale Plein Écran pour prévisualiser l'image */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full transition"
              onClick={() => setPreviewImage(null)}
              type="button"
            >
              <XIcon className="size-6" />
            </button>

            <img
              alt="Prévisualisation plein écran"
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10"
              src={formatImageSrc(previewImage)}
            />

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold backdrop-blur-md transition"
                onClick={() =>
                  downloadImage(
                    formatImageSrc(previewImage),
                    `mai-image-${Date.now()}.png`
                  )
                }
                type="button"
              >
                <DownloadIcon className="size-4" /> Télécharger l'original
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-xs font-semibold transition"
                onClick={() => {
                  handleEditAsSource(formatImageSrc(previewImage));
                  setPreviewImage(null);
                }}
                type="button"
              >
                <Wand2Icon className="size-4" /> Éditer dans Images
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
