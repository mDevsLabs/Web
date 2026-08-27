"use client";

import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  HeadphonesIcon,
  LayersIcon,
  Loader2Icon,
  MusicIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
  Volume2Icon,
  Wand2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { useAudioUsage } from "@/hooks/use-settings";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { cn, formatAudioModelName } from "@/lib/utils";

interface SpeechModel {
  created?: number;
  description: string;
  id: string;
  name: string;
  provider?: string;
}

interface SpeechVoice {
  category?: string;
  description?: string;
  gender?: string;
  id: string;
  name: string;
}

interface GeneratedAudio {
  audio_url: string;
  character_count?: number;
  created_at: string;
  id: string | number;
  input_text: string;
  model: string;
  pinned?: boolean;
  status?: string;
  title?: string | null;
  tokens_count?: number;
  user_id?: string;
  voice?: string;
}

const VOICES_PRESETS: SpeechVoice[] = [
  {
    category: "Naturel & Équilibré",
    description: "Voix féminine claire, chaleureuse et polyvalente.",
    gender: "Féminin",
    id: "flux-alexis-en",
    name: "Alexis",
  },
  {
    category: "Professionnel & Posé",
    description: "Voix masculine profonde, idéale pour narration et tutoriels.",
    gender: "Masculin",
    id: "flux-michael-en",
    name: "Michael",
  },
  {
    category: "Dynamique & Enthousiaste",
    description: "Voix féminine énergique, parfaite pour podcasts et spots.",
    gender: "Féminin",
    id: "flux-stacy-en",
    name: "Stacy",
  },
  {
    category: "Calme & Convivial",
    description: "Voix masculine moderne, fluide et décontractée.",
    gender: "Masculin",
    id: "flux-sam-en",
    name: "Sam",
  },
  {
    category: "Élégant & Narratif",
    description: "Voix féminine expressive, idéale pour le storytelling.",
    gender: "Féminin",
    id: "flux-asteria-en",
    name: "Asteria",
  },
  {
    category: "Puissant & Engageant",
    description: "Voix masculine captivante pour annonces et présentations.",
    gender: "Masculin",
    id: "flux-orion-en",
    name: "Orion",
  },
];

const TEXT_SUGGESTIONS = [
  "Bienvenue sur mAI Web ! Votre assistant d'intelligence artificielle nouvelle génération pour transformer vos idées en réalité.",
  "La créativité n'a pas de limites lorsque la technologie s'associe à l'imagination humaine pour repousser les frontières du possible.",
  "Voici le flash d'information du jour : les modèles d'intelligence artificielle connaissent une accélération majeure dans le domaine de la synthèse vocale.",
  "Prenez une profonde inspiration, détendez vos épaules et appréciez ce moment de calme avant de reprendre votre journée.",
  "Alerte système : toutes les fonctionnalités audio et visuelles sont maintenant opérationnelles avec une fidélité maximale.",
];

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Erreur de chargement");
    }
    return res.json();
  });

function formatTokens(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDate(dateStr?: string) {
  if (!dateStr) {
    return "Récemment";
  }
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function AudioPage() {
  // 1. Modèles Speech / Audio via /api/models/speech
  const { data: modelsData, isLoading: isLoadingModels } = useSWR<{
    data: SpeechModel[];
  }>("/api/models/speech", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const models = useMemo(() => modelsData?.data || [], [modelsData]);

  // 2. Voix disponibles via /api/audio/voices
  const { data: voicesData } = useSWR<{
    data: SpeechVoice[];
  }>("/api/audio/voices", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const voices = useMemo(
    () => voicesData?.data || VOICES_PRESETS,
    [voicesData]
  );

  // 3. Quota Speech hebdomadaire via hook useAudioUsage
  const {
    mutate: mutateUsage,
    usage: { limit, plan, tokensUsed },
  } = useAudioUsage();

  // 4. Historique des générations audio via /api/audio/history
  const {
    data: historyData,
    mutate: mutateHistory,
    isLoading: isLoadingHistory,
  } = useSWR<{
    audios?: GeneratedAudio[];
    data?: GeneratedAudio[];
    success: boolean;
    total: number;
  }>("/api/audio/history", fetcher, { revalidateOnFocus: false });
  const history = useMemo(
    () => historyData?.data || historyData?.audios || [],
    [historyData]
  );

  // Formulaire & Options
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [speed, setSpeed] = useState<number>(1.0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // États de génération & lecture
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GeneratedAudio | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Lecteur audio local
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Préférences utilisateur pour initialiser le modèle, voix et vitesse par défaut
  const { data: userPrefData } = useSWR<{
    defaultAudioModel?: string;
    defaultAudioVoice?: string;
    defaultAudioSpeed?: number;
  }>("/api/user/preferences", fetcher, { revalidateOnFocus: false });

  // Renommage audio
  const [editingAudio, setEditingAudio] = useState<{
    id: string | number;
    title: string;
  } | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);

  // Modèle et voix par défaut au chargement
  useEffect(() => {
    if (userPrefData?.defaultAudioModel && !selectedModelId) {
      setSelectedModelId(userPrefData.defaultAudioModel);
    } else if (models.length > 0 && !selectedModelId) {
      const defaultMod =
        models.find((m) => m.id.includes("speech") || m.id.includes("tts")) ||
        models[0];
      setSelectedModelId(defaultMod.id);
    }

    if (userPrefData?.defaultAudioVoice && !selectedVoice) {
      setSelectedVoice(userPrefData.defaultAudioVoice);
    } else if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0].id);
    }

    if (userPrefData?.defaultAudioSpeed) {
      setSpeed(userPrefData.defaultAudioSpeed);
    }
  }, [models, selectedModelId, voices, selectedVoice, userPrefData]);

  // Basculer l'état épinglé
  const handleTogglePin = async (
    id: string | number,
    currentPinned: boolean
  ) => {
    try {
      const res = await fetch(`/api/audio/history?id=${id}`, {
        body: JSON.stringify({ pinned: !currentPinned }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur de modification");
      }
      toast.success(
        currentPinned ? "Audio désépinglé" : "Audio épinglé en haut"
      );
      mutateHistory();
    } catch {
      toast.error("Impossible de modifier l'épinglage");
    }
  };

  // Enregistrer le renommage
  const handleSaveRename = async () => {
    if (!editingAudio) {
      return;
    }
    setIsSavingRename(true);
    try {
      const res = await fetch(`/api/audio/history?id=${editingAudio.id}`, {
        body: JSON.stringify({ title: editTitleInput.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur de renommage");
      }
      toast.success("Audio renommé avec succès !");
      setEditingAudio(null);
      mutateHistory();
    } catch {
      toast.error("Impossible de renommer l'enregistrement");
    } finally {
      setIsSavingRename(false);
    }
  };

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  const isQuotaExhausted = limit > 0 && tokensUsed >= limit;

  // Lancement de la synthèse vocale
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error(
        "Veuillez saisir le texte que vous souhaitez transformer en voix."
      );
      return;
    }

    if (isQuotaExhausted) {
      toast.error(
        `Votre quota hebdomadaire Speech est atteint (${formatTokens(tokensUsed)}/${formatTokens(limit)} tokens). Mettez à niveau votre compte pour continuer !`
      );
      return;
    }

    setIsGenerating(true);
    setCurrentResult(null);

    try {
      // 1. Demande et validation du quota préalable
      try {
        const usageCheck = await fetch("/api/audio/usage").then((r) =>
          r.json()
        );
        const checkLimit = Number(usageCheck.weeklyLimit ?? 0);
        const checkUsed = Number(usageCheck.tokensUsed ?? 0);
        if (checkLimit > 0 && checkUsed >= checkLimit) {
          toast.error(
            `Quota hebdomadaire Speech épuisé (${formatTokens(checkUsed)}/${formatTokens(checkLimit)} tokens).`
          );
          setIsGenerating(false);
          return;
        }
      } catch {}

      const payload = {
        input: inputText.trim(),
        model: selectedModelId || "openai/tts-1",
        speed,
        voice: selectedVoice || "flux-alexis-en",
      };

      const res = await fetch("/api/audio/generations", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg =
          data?.error?.message ||
          data?.error ||
          "Erreur lors de la synthèse vocale";
        throw new Error(errMsg);
      }

      const audioUrl = data.audio_url || data.url;
      if (!audioUrl) {
        throw new Error("Aucun flux audio retourné par le serveur.");
      }

      const generated: GeneratedAudio = {
        audio_url: audioUrl,
        character_count: inputText.trim().length,
        created_at: new Date().toISOString(),
        id: data.id || `audio_${Date.now()}`,
        input_text: inputText.trim(),
        model: selectedModel?.name || selectedModelId,
        tokens_count:
          data.tokens_count || Math.ceil(inputText.trim().length * 1.3),
        voice: selectedVoice,
      };

      setCurrentResult(generated);
      toast.success("Synthèse vocale générée avec succès !");

      // Actualiser les quotas et l'historique
      mutateUsage();
      mutateHistory();
    } catch (err: any) {
      console.error("Audio generation error:", err);
      toast.error(err.message || "Impossible de générer l'audio.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Suppression d'un audio de l'historique
  const handleDeleteFromHistory = async (id: string | number) => {
    try {
      const res = await fetch(`/api/audio/history?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur de suppression");
      }
      toast.success("Audio supprimé de l'historique");
      mutateHistory();
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full gap-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="flex items-start gap-3 min-w-0">
          <PageBackButton />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Volume2Icon className="size-4" />
              Synthèse Vocale & Sons
            </div>
            <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
              Audio & Voix mAI
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Transformez vos textes en voix naturelles et expressives avec l'IA
              haute fidélité
            </p>
          </div>
        </div>

        {/* Badge Quota & Liens */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <SparklesIcon className="size-4 text-emerald-400" />
            <div className="text-xs">
              <span className="font-semibold text-foreground">
                {formatTokens(tokensUsed)} / {formatTokens(limit)}
              </span>{" "}
              <span className="text-muted-foreground">
                tokens Speech ({plan})
              </span>
            </div>
          </div>

          {isQuotaExhausted && (
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
              href={MAI_UPGRADE_URL}
              target="_blank"
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
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "create"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            onClick={() => setActiveTab("create")}
            type="button"
          >
            <Wand2Icon className="size-3.5" />
            <span>Studio de Synthèse Vocale</span>
          </button>

          <button
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            onClick={() => setActiveTab("history")}
            type="button"
          >
            <LayersIcon className="size-3.5" />
            <span>Galerie & Audios récents ({history.length})</span>
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
                    <HeadphonesIcon className="size-3.5 text-emerald-400" />
                    <span>Modèle Audio & Speech</span>
                  </label>
                  {selectedModel && (
                    <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
                      {selectedModel.id}
                    </span>
                  )}
                </div>

                {isLoadingModels ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin text-emerald-500" />
                    <span>Chargement des modèles speech...</span>
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

              {/* Carte Texte à transformer & Paramètres */}
              <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wand2Icon className="size-3.5 text-teal-400" />
                      <span>Texte à vocaliser</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {inputText.length}/4000 caractères
                    </span>
                  </div>

                  <textarea
                    className="w-full rounded-xl border border-border/80 bg-background/90 p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    maxLength={4000}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Écrivez ou collez le texte que l'IA va lire à haute voix..."
                    rows={4}
                    value={inputText}
                  />

                  {/* Suggestions rapides */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground py-0.5">
                      Exemples :
                    </span>
                    {TEXT_SUGGESTIONS.slice(0, 3).map((sug, i) => (
                      <button
                        className="rounded-lg border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-foreground truncate max-w-[200px] cursor-pointer"
                        key={i}
                        onClick={() => setInputText(sug)}
                        type="button"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paramètres avancés (Vitesse) */}
                <div>
                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    type="button"
                  >
                    <SlidersHorizontalIcon className="size-3.5" />
                    <span>
                      {showAdvanced
                        ? "Masquer les réglages audio"
                        : "Réglages de vitesse & débit"}
                    </span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/60 bg-background/50 p-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Vitesse de diction ({speed}x)
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {speed < 1
                            ? "Plus lent"
                            : speed === 1
                              ? "Normal"
                              : "Plus rapide"}
                        </span>
                      </div>
                      <input
                        className="w-full accent-emerald-500"
                        max={2.0}
                        min={0.5}
                        onChange={(e) =>
                          setSpeed(Number.parseFloat(e.target.value))
                        }
                        step={0.1}
                        type="range"
                        value={speed}
                      />
                    </div>
                  )}
                </div>

                {/* Bouton de génération & Quota */}
                <div className="pt-2">
                  <button
                    className={cn(
                      "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer",
                      isQuotaExhausted
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:opacity-95 hover:shadow-emerald-500/25"
                    )}
                    disabled={
                      isGenerating || !inputText.trim() || isQuotaExhausted
                    }
                    onClick={handleGenerate}
                    type="button"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        <span>Synthèse de la voix en cours...</span>
                      </>
                    ) : isQuotaExhausted ? (
                      <>
                        <AlertCircleIcon className="size-4" />
                        <span>Quota hebdomadaire épuisé</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="size-4" />
                        <span>Générer l'audio</span>
                      </>
                    )}
                  </button>

                  {isQuotaExhausted && (
                    <p className="mt-2 text-center text-xs text-amber-500">
                      Quota de tokens Speech atteint.{" "}
                      <Link
                        className="underline font-semibold"
                        href={MAI_UPGRADE_URL}
                        target="_blank"
                      >
                        Passez à un forfait supérieur
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite : Résultat & Lecteur Audio */}
            <div className="flex flex-col gap-5 lg:col-span-7">
              <div className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md min-h-[420px] sm:min-h-[560px] sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MusicIcon className="size-4 text-emerald-400" />
                    <span>Lecteur audio & Rendu vocal</span>
                  </h3>

                  {currentResult && (
                    <div className="flex items-center gap-1.5">
                      <a
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/60 hover:bg-muted/40 transition flex items-center gap-1 text-xs"
                        download={`mai-speech-${Date.now()}.mp3`}
                        href={currentResult.audio_url}
                        rel="noreferrer"
                        target="_blank"
                        title="Télécharger l'audio"
                      >
                        <DownloadIcon className="size-3.5" />
                        <span className="hidden sm:inline">MP3</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Zone de prévisualisation audio */}
                <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/10 p-6 relative overflow-hidden">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative size-16 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                        <Loader2Icon className="size-8 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Génération vocale en cours
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          Le modèle{" "}
                          <span className="font-semibold text-emerald-400">
                            {selectedModel?.name}
                          </span>{" "}
                          synthétise les harmoniques et l'intonation avec la
                          voix{" "}
                          <span className="font-semibold text-foreground">
                            {selectedVoice
                              .replace("flux-", "")
                              .replace("-en", "")}
                          </span>
                          ...
                        </p>
                      </div>
                    </div>
                  ) : currentResult ? (
                    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
                      {/* Visualiseur / Icône d'onde */}
                      <div className="size-24 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg animate-pulse">
                        <Volume2Icon className="size-10 text-emerald-400" />
                      </div>

                      {/* Lecteur Audio natif stylisé */}
                      <div className="w-full bg-card p-4 rounded-2xl border border-border/80 shadow-md">
                        <audio
                          autoPlay
                          className="w-full h-11 rounded-lg outline-none"
                          controls
                          ref={audioPlayerRef}
                          src={currentResult.audio_url}
                        >
                          Votre navigateur ne supporte pas l'élément audio.
                        </audio>
                      </div>

                      {/* Boîte texte & métadonnées */}
                      <div className="w-full flex flex-col gap-2.5 rounded-xl border border-border/60 bg-background/60 p-4 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                          <span className="font-semibold text-foreground">
                            Texte énoncé :
                          </span>
                          <button
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                currentResult.input_text
                              );
                              toast.success(
                                "Texte copié dans le presse-papier !"
                              );
                            }}
                            type="button"
                          >
                            <CopyIcon className="size-3" />
                            Copier
                          </button>
                        </div>
                        <p className="text-muted-foreground italic leading-relaxed">
                          "{currentResult.input_text}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-border/30">
                          <span>Modèle : {currentResult.model}</span>
                          <span>
                            Voix :{" "}
                            {currentResult.voice
                              ?.replace("flux-", "")
                              .replace("-en", "")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground py-10">
                      <div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground/60">
                        <Volume2Icon className="size-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Aucun audio généré pour l'instant
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          Sélectionnez une voix, saisissez votre texte à gauche
                          et cliquez sur{" "}
                          <span className="font-semibold text-foreground">
                            Générer l'audio
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ────────────── ONGLET HISTORIQUE & GALERIE AUDIO ────────────── */
          <div className="mx-auto max-w-7xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Vos générations audio
                </h2>
                <p className="text-xs text-muted-foreground">
                  Retrouvez et réécoutez tous les audios et voix créés
                  précédemment
                </p>
              </div>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 text-xs font-semibold hover:bg-muted/40 transition cursor-pointer"
                onClick={() => mutateHistory()}
                type="button"
              >
                <RefreshCwIcon className="size-3.5" />
                Actualiser
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2Icon className="size-6 animate-spin text-emerald-500" />
                <span className="text-sm">
                  Chargement de votre historique audio...
                </span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-24 rounded-2xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center text-center gap-3">
                <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                  <MusicIcon className="size-7" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Aucun enregistrement dans votre historique
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Toutes vos synthèses vocales générées apparaîtront ici avec
                  possibilité d'écoute et de téléchargement.
                </p>
                <button
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-sm transition hover:opacity-90 cursor-pointer"
                  onClick={() => setActiveTab("create")}
                  type="button"
                >
                  <Wand2Icon className="size-3.5" />
                  Créer mon premier audio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                  <div
                    className={cn(
                      "relative flex flex-col justify-between p-4 rounded-2xl border bg-card/60 backdrop-blur-md shadow-xs gap-3 transition",
                      item.pinned
                        ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 shadow-amber-500/5"
                        : "border-border/60 hover:border-emerald-500/30"
                    )}
                    key={item.id}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.voice
                              ? item.voice
                                  .replace("flux-", "")
                                  .replace("-en", "")
                              : "Voix"}
                          </span>
                          {item.pinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <PinIcon className="size-2.5 fill-current" />
                              Épinglé
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.title && (
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {item.title}
                        </p>
                      )}

                      <p
                        className={cn(
                          "line-clamp-3 italic leading-relaxed",
                          item.title
                            ? "text-[11px] text-muted-foreground"
                            : "text-xs text-foreground font-medium"
                        )}
                      >
                        "{item.input_text}"
                      </p>
                    </div>

                    {/* Lecteur Audio */}
                    <div className="pt-2 border-t border-border/30 flex flex-col gap-2">
                      <audio
                        className="w-full h-9 rounded-lg outline-none"
                        controls
                        src={item.audio_url}
                      >
                        Votre navigateur ne supporte pas l'élément audio.
                      </audio>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]"
                          title={formatAudioModelName(item.model)}
                        >
                          {formatAudioModelName(item.model)}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Bouton Épingler */}
                          <button
                            className={cn(
                              "p-1.5 rounded-lg border transition cursor-pointer",
                              item.pinned
                                ? "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() =>
                              handleTogglePin(item.id, Boolean(item.pinned))
                            }
                            title={
                              item.pinned
                                ? "Désépingler de l'historique"
                                : "Épingler en haut"
                            }
                            type="button"
                          >
                            {item.pinned ? (
                              <PinOffIcon className="size-3.5" />
                            ) : (
                              <PinIcon className="size-3.5" />
                            )}
                          </button>

                          {/* Bouton Renommer */}
                          <button
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/40 hover:bg-muted/50 transition cursor-pointer"
                            onClick={() => {
                              setEditingAudio({
                                id: item.id,
                                title: item.title || item.input_text,
                              });
                              setEditTitleInput(item.title || item.input_text);
                            }}
                            title="Renommer l'audio"
                            type="button"
                          >
                            <PencilIcon className="size-3.5" />
                          </button>

                          <a
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/40 hover:bg-muted/50 transition"
                            download={`mai-speech-${item.id}.mp3`}
                            href={item.audio_url}
                            rel="noreferrer"
                            target="_blank"
                            title="Télécharger"
                          >
                            <DownloadIcon className="size-3.5" />
                          </a>

                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg border border-border/40 hover:bg-destructive/10 transition cursor-pointer"
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

      {/* Modale Renommer un audio */}
      {editingAudio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setEditingAudio(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <PencilIcon className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Renommer l'enregistrement
                </h3>
              </div>
              <button
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setEditingAudio(null)}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Titre ou étiquette personnalisée
              </label>
              <input
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none"
                onChange={(e) => setEditTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveRename();
                  } else if (e.key === "Escape") {
                    setEditingAudio(null);
                  }
                }}
                placeholder="Ex: Narration Chapitre 1..."
                value={editTitleInput}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition"
                onClick={() => setEditingAudio(null)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                disabled={isSavingRename}
                onClick={handleSaveRename}
                type="button"
              >
                {isSavingRename ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
