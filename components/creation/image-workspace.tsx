"use client";

import type React from "react";
import Link from "next/link";
import {
  ImageIcon,
  LayersIcon,
  SparklesIcon,
  Wand2Icon,
} from "@mdevs/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { useImagesUsage } from "@/hooks/use-settings";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { APP_PRICING_URL } from "@/lib/constants";
import {
  cn,
  formatImageSrc,
} from "@/lib/utils";
import type { GeneratedImage, ImageModel, ImageWorkspaceProps } from "./types";
import { ASPECT_RATIOS } from "./types";
import { ImagePromptControls } from "./image-prompt-controls";
import { ImageSourceUploader } from "./image-source-uploader";
import { ImageResultViewer } from "./image-result-viewer";
import { ImageGalleryGrid } from "./image-gallery-grid";
import { ImagePreviewModal, ImageRenameModal } from "./image-modals";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Erreur de chargement");
    }
    return res.json();
  });

export type { ImageWorkspaceProps };

export function ImageWorkspace({ modeSwitcher }: ImageWorkspaceProps = {}) {
  // 1. Modèles d'images disponibles via /api/models/images
  const { data: modelsData, isLoading: isLoadingModels } = useSWR<{
    data: ImageModel[];
  }>("/api/models/images", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const models = useMemo(() => modelsData?.data || [], [modelsData]);

  // 2. Quota d'utilisation via le hook use-settings
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

  // Modales
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);

  // Préférences utilisateur
  const { data: userPrefData } = useSWR<{
    defaultImageModel?: string;
    defaultImageSize?: string;
  }>("/api/user/preferences", fetcher, { revalidateOnFocus: false });

  // Initialisation du modèle et taille par défaut
  useEffect(() => {
    if (userPrefData?.defaultImageModel && !selectedModelId) {
      setSelectedModelId(userPrefData.defaultImageModel);
    } else if (models.length > 0 && !selectedModelId) {
      const defaultMod =
        models.find((m) => m.id.includes("schnell")) ||
        models.find((m) => m.id.includes("flux")) ||
        models[0];
      setSelectedModelId(defaultMod.id);
    }

    if (userPrefData?.defaultImageSize) {
      const match = ASPECT_RATIOS.find(
        (r) =>
          `${r.width}x${r.height}` === userPrefData.defaultImageSize ||
          r.id === userPrefData.defaultImageSize
      );
      if (match) {
        setAspectRatio(match.id);
      }
    }
  }, [models, selectedModelId, userPrefData]);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  const supportsImageToImage = useMemo(() => {
    if (!selectedModel) return false;
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
    if (!file) return;

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
      const usageCheck = await fetch("/api/images/usage").then((r) => r.json());
      if (usageCheck.usedToday >= usageCheck.dailyLimit) {
        mutateUsage();
        throw new Error(
          `Quota journalier épuisé (${usageCheck.usedToday}/${usageCheck.dailyLimit}). Réinitialisation à minuit UTC.`
        );
      }

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
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          extractApiErrorMessage(data) || "Erreur lors de la génération";
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
      mutateUsage();
      mutateHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossible de générer l'image.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Basculer l'état épinglé
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/images/history?id=${id}`, {
        body: JSON.stringify({ pinned: !currentPinned }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Erreur de modification");
      toast.success(
        currentPinned ? "Image désépinglée" : "Image épinglée en haut"
      );
      mutateHistory();
    } catch {
      toast.error("Impossible de modifier l'épinglage");
    }
  };

  // Enregistrer le renommage
  const handleSaveRename = async () => {
    if (!editingImage) return;
    setIsSavingRename(true);
    try {
      const res = await fetch(`/api/images/history?id=${editingImage.id}`, {
        body: JSON.stringify({ title: editTitleInput.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Erreur de renommage");
      toast.success("Image renommée avec succès !");
      setEditingImage(null);
      mutateHistory();
    } catch {
      toast.error("Impossible de renommer l'image");
    } finally {
      setIsSavingRename(false);
    }
  };

  // Suppression d'une image
  const handleDeleteFromHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/images/history?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur de suppression");
      toast.success("Image supprimée de l'historique");
      mutateHistory();
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  // Utiliser une image existante comme source
  const handleEditAsSource = (imgUrl: string, imgPrompt?: string) => {
    setSourceImage(imgUrl);
    if (imgPrompt && !prompt) {
      setPrompt(imgPrompt);
    }
    setActiveTab("create");
    toast.info("Image chargée comme référence pour l'édition !");
  };

  return (
    <div
      className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full gap-6"
      data-app-update-blocked={isGenerating}
    >
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="flex items-start gap-3 min-w-0">
          <PageBackButton />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-info font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex size-2 rounded-full bg-info animate-pulse" />
              <ImageIcon className="size-4" />
              IA Générative
            </div>
            <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
              Images mAI
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Créez, éditez et explorez des images haute définition avec les
              modèles Flux & Diffusion
            </p>
          </div>
        </div>

        {modeSwitcher && (
          <div className="flex justify-center shrink-0 my-1 md:my-0">
            {modeSwitcher}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <SparklesIcon className="size-4 text-warning" />
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
              href={APP_PRICING_URL}
            >
              <SparklesIcon className="size-3.5" />
              <span>Débloquer plus</span>
            </Link>
          )}
        </div>
      </div>

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
            <ImagePromptControls
              aspectRatio={aspectRatio}
              isGenerating={isGenerating}
              isLoadingModels={isLoadingModels}
              isQuotaExhausted={isQuotaExhausted}
              models={models}
              negativePrompt={negativePrompt}
              onAspectRatioChange={setAspectRatio}
              onGenerate={handleGenerate}
              onModelChange={setSelectedModelId}
              onNegativePromptChange={setNegativePrompt}
              onPromptChange={setPrompt}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              prompt={prompt}
              quotaRemaining={quotaRemaining}
              selectedModel={selectedModel}
              selectedModelId={selectedModelId}
              showAdvanced={showAdvanced}
            >
              <ImageSourceUploader
                fileInputRef={fileInputRef}
                onFileSelect={handleFileSelect}
                onRemoveSource={handleRemoveSourceImage}
                sourceImage={sourceImage}
                sourceImageFile={sourceImageFile}
                supportsImageToImage={supportsImageToImage}
              />
            </ImagePromptControls>

            <ImageResultViewer
              currentResult={currentResult}
              isGenerating={isGenerating}
              onEditAsSource={handleEditAsSource}
              onPreviewImage={setPreviewImage}
              selectedModel={selectedModel}
            />
          </div>
        ) : (
          <ImageGalleryGrid
            history={history}
            isLoadingHistory={isLoadingHistory}
            onDelete={handleDeleteFromHistory}
            onEditAsSource={handleEditAsSource}
            onPreviewImage={setPreviewImage}
            onRefresh={() => mutateHistory()}
            onStartRename={(item) => {
              setEditingImage(item);
              setEditTitleInput(item.title);
            }}
            onSwitchToCreate={() => setActiveTab("create")}
            onTogglePin={handleTogglePin}
          />
        )}
      </main>

      <ImagePreviewModal
        onClose={() => setPreviewImage(null)}
        onEditAsSource={(src) => {
          handleEditAsSource(src);
          setPreviewImage(null);
        }}
        previewImage={previewImage}
      />

      <ImageRenameModal
        editTitleInput={editTitleInput}
        editingImage={editingImage}
        isSavingRename={isSavingRename}
        onClose={() => setEditingImage(null)}
        onSave={handleSaveRename}
        onTitleChange={setEditTitleInput}
      />
    </div>
  );
}
