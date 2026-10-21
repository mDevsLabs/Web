"use client";

import {
  ArrowRightIcon,
  BookIcon,
  BotIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ImageIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  Share2Icon,
  SparklesIcon,
  TagIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { isSearchableQuery, looksLikeUrl } from "@/lib/search/query";
import {
  readSummaryStream,
  type SummarySource,
} from "@/lib/search/summary-stream";
import type {
  SearchImageHit,
  SearchNewsHit,
  SearchVideoHit,
  SearchWebHit,
} from "@/lib/search/you-client";
import { cn } from "@/lib/utils";

type SearchTab = "web" | "news" | "images" | "videos";

type SummaryTarget = {
  url: string;
  title: string;
  snippet?: string;
  source?: string;
  type: "web" | "news" | "image" | "video";
};

type DrawerMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SummarySource[];
};

function SummarySources({ sources }: { sources: SummarySource[] }) {
  if (sources.length === 0) {
    return null;
  }
  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Sources consultées ({sources.length})
      </p>
      <ol className="space-y-1.5">
        {sources.map((source, index) => (
          <li className="flex gap-2 text-[11px] leading-snug" key={source.url}>
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <a
              className="min-w-0 text-foreground/85 hover:text-primary hover:underline"
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
              title={source.url}
            >
              <span className="line-clamp-1 font-medium">{source.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {source.domain}
                {/*
                  L'origine est rappelée ici : la synthèse annonce
                  « d'après Wikipédia » quand l'affirmation vient de
                  l'encyclopédie. C'est la même information que le badge des
                  résultats, mais là où l'utilisateur la lit.
                */}
                {source.origin === "wikipedia" ? (
                  <span className="text-info"> · Wikipédia</span>
                ) : null}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

type TargetConversationState = {
  isOpen: boolean;
  isLoading: boolean;
  target: SummaryTarget | null;
  messages: DrawerMessage[];
  modelId: string;
};

/**
 * Composant image résistant aux blocages anti-hotlink :
 * Si l'URL distante échoue (403, CORS, Referer interdit), bascule automatiquement vers notre proxy interne.
 */
function SearchSafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || "");
  const [triedProxy, setTriedProxy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || "");
    setTriedProxy(false);
    setHasFailed(false);
  }, [src]);

  if (hasFailed || !currentSrc) {
    return fallback ? (fallback as React.ReactElement) : null;
  }

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!triedProxy && src && !src.startsWith("/api/")) {
          setTriedProxy(true);
          setCurrentSrc(
            `/api/mai-search/image-proxy?url=${encodeURIComponent(src)}`
          );
        } else {
          setHasFailed(true);
        }
      }}
      referrerPolicy="no-referrer"
      src={currentSrc}
    />
  );
}

/**
 * Détection et génération de l'embed pour la modale vidéo intégrée
 */
function getVideoEmbed(video: SearchVideoHit): {
  type: "iframe" | "video" | "external";
  embedUrl: string | null;
  directUrl: string;
} {
  const url = video.page_url || "";

  // 1. YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      type: "iframe",
    };
  }

  // 2. Dailymotion
  const dmMatch = url.match(
    /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`,
      type: "iframe",
    };
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      type: "iframe",
    };
  }

  // 4. Fichier direct (MP4, WebM)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return {
      directUrl: url,
      embedUrl: url,
      type: "video",
    };
  }

  return {
    directUrl: url,
    embedUrl: null,
    type: "external",
  };
}

export function SearchClient() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("web");

  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [results, setResults] = useState<SearchWebHit[]>([]);
  const [images, setImages] = useState<SearchImageHit[]>([]);
  const [news, setNews] = useState<SearchNewsHit[]>([]);
  const [videos, setVideos] = useState<SearchVideoHit[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  // Moteurs qui ont répondu : sert à dire d'où viennent les résultats
  // quand la source principale a échoué.
  const [provider, setProvider] = useState<string | null>(null);
  /**
   * Durée de la dernière recherche, en millisecondes.
   *
   * Elle n'est affichée que si elle est nettement trop longue : une
   * recherche à 400 ms n'intéresse personne, une recherche à huit secondes
   * explique pourquoi l'écran paraissait figé. C'est un DIAGNOSTIC, pas un
   * compteur permanent.
   */
  const [durationMs, setDurationMs] = useState<number | null>(null);
  /**
   * Message d'erreur de la recherche courante.
   *
   * L'échec existait avant sous forme d'exception avalée : le `toast` partait,
   * l'écran restait vide, et rien n'indiquait à l'utilisateur que la panne
   * n'était pas « aucun résultat ». Un état dédié permet d'afficher la
   * panne ET de proposer de réessayer.
   */
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modèle d'IA choisi pour le tiroir de discussion (via ModelSelector)
  const [selectedModelId, setSelectedModelId] = useState<string>("mai-2-mini");

  // Synthèse globale
  const [summary, setSummary] = useState("");
  const [summarySources, setSummarySources] = useState<SummarySource[]>([]);
  const [summaryModel, setSummaryModel] = useState<string | null>(null);
  const [summaryLength, setSummaryLength] = useState<
    "normal" | "short" | "long"
  >("normal");
  const [vote, setVote] = useState<"good" | "bad" | null>(null);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Visionneuse Lightbox pour les images
  const [selectedImage, setSelectedImage] = useState<SearchImageHit | null>(
    null
  );

  // Visionneuse Lightbox pour les vidéos avec lecteur interactif
  const [selectedVideo, setSelectedVideo] = useState<SearchVideoHit | null>(
    null
  );

  // Tiroir latéral de discussion et résumé avec l'IA
  const [targetConversation, setTargetConversation] =
    useState<TargetConversationState>({
      isLoading: false,
      isOpen: false,
      messages: [],
      modelId: "mai-2-mini",
      target: null,
    });
  const [followupInput, setFollowupInput] = useState("");
  const [hasCopiedDrawer, setHasCopiedDrawer] = useState(false);

  // Filtre par domaine optionnel
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  /**
   * Filtre par ORIGINE : tous les résultats, ou les seuls articles
   * d'encyclopédie.
   *
   * L'encyclopédie est une source à part entière, mais ses articles étaient
   * noyés parmi les pages web : rien ne disait à l'utilisateur que « Ada
   * Lovelace » avait été trouvé dans Wikipédia. Ce filtre rend la source
   * visible — et permet de ne lire QUE la référence.
   */
  const [sourceFilter, setSourceFilter] = useState<"all" | "wikipedia">("all");
  /**
   * Le moteur a-t-il remonté l'encyclopédie en tête de liste ?
   *
   * Le serveur le calcule (`wikiFirst`) : l'interface ne le redétermine pas,
   * elle se contente de l'expliquer. Sans cette information, l'utilisateur
   * voyait les articles d'encyclopédie en tête sans comprendre pourquoi.
   */
  const [wikiFirst, setWikiFirst] = useState(false);
  /**
   * Volume demandé (par source) et volume effectivement obtenu.
   *
   * Le serveur les envoie : l'interface ne les devine pas. Quand le moteur
   * tronque, l'utilisateur doit le voir — une recherche qui rend 40 liens
   * sur 200 demandés ne doit pas se faire passer pour exhaustive.
   */
  const [requestedCount, setRequestedCount] = useState<number | null>(null);
  const [truncated, setTruncated] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const drawerMessagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const drawerAbortControllerRef = useRef<AbortController | null>(null);
  /** Annule la recherche en vol (et elle seule). */
  const searchAbortRef = useRef<AbortController | null>(null);

  /**
   * Historique des recherches récentes.
   *
   * Il est lu depuis le serveur, qui filtre par compte : l'interface ne
   * reçoit jamais la requête d'un autre compte.
   */
  const {
    clear: clearRecent,
    forget: forgetRecent,
    recent,
    refresh: refreshRecent,
  } = useRecentSearches();

  // Focus initial sur la barre de recherche
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Défilement automatique vers le bas à l'arrivée d'un nouveau message ou streaming
  const drawerMessagesCount = targetConversation.messages.length;
  const isDrawerLoading = targetConversation.isLoading;
  useEffect(() => {
    if (
      targetConversation.isOpen &&
      (drawerMessagesCount > 0 || isDrawerLoading)
    ) {
      drawerMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [targetConversation.isOpen, drawerMessagesCount, isDrawerLoading]);

  // Déclenchement du streaming de résumé global
  const fetchSummary = useCallback(
    async (
      searchQuery: string,
      currentSearchId: string | null,
      currentResults: SearchWebHit[],
      length: "normal" | "short" | "long" = "normal"
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSummaryLoading(true);
      setSummary("");
      setSummarySources([]);
      setVote(null);

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            length,
            modelId: selectedModelId,
            query: searchQuery,
            searchId: currentSearchId,
            searchResults: currentResults,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de générer le résumé.");
        }

        const modelHeader = response.headers.get("X-Model-Id");
        if (modelHeader) setSummaryModel(modelHeader);

        let textAccumulator = "";
        let streamError: string | null = null;
        await readSummaryStream(response, (event) => {
          if (event.type === "sources") {
            setSummarySources(event.sources);
          } else if (event.type === "text-delta") {
            textAccumulator += event.delta;
            setSummary(textAccumulator);
          } else if (event.type === "error") {
            streamError = event.message;
          }
        });
        if (streamError) {
          throw new Error(streamError);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[SearchClient] Erreur résumé global:", err);
          setSummary(
            "Le résumé IA n'a pas pu être finalisé. Vous pouvez réessayer ci-dessous."
          );
        }
      } finally {
        setIsSummaryLoading(false);
      }
    },
    [selectedModelId]
  );

  // Déclenchement du résumé spécifique par lien (ouvert dans le tiroir conversationnel)
  const handleRequestTargetSummary = useCallback(
    async (target: SummaryTarget) => {
      if (drawerAbortControllerRef.current) {
        drawerAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      drawerAbortControllerRef.current = controller;

      const initialAssistantMsg: DrawerMessage = {
        content: "",
        id: "summary-0",
        role: "assistant",
        sources: [],
      };

      setTargetConversation({
        isLoading: true,
        isOpen: true,
        messages: [initialAssistantMsg],
        modelId: selectedModelId,
        target,
      });
      setFollowupInput("");

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            modelId: selectedModelId,
            query: submittedQuery || target.title,
            target,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de résumer cette ressource.");
        }

        let textAccumulator = "";
        await readSummaryStream(response, (event) => {
          if (event.type === "text-delta") {
            textAccumulator += event.delta;
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              if (msgs.length > 0 && msgs[0].role === "assistant") {
                msgs[0] = { ...msgs[0], content: textAccumulator };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "sources") {
            setTargetConversation((prev) => {
              const msgs = [...prev.messages];
              if (msgs.length > 0 && msgs[0].role === "assistant") {
                msgs[0] = { ...msgs[0], sources: event.sources };
              }
              return { ...prev, messages: msgs };
            });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[SearchClient] Erreur résumé ciblé:", err);
          setTargetConversation((prev) => ({
            ...prev,
            messages: [
              {
                content:
                  "Le résumé de cette ressource n'a pas pu être finalisé.",
                id: "summary-err",
                role: "assistant",
              },
            ],
          }));
        }
      } finally {
        setTargetConversation((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [submittedQuery, selectedModelId]
  );

  // Envoi d'une question de suivi dans le tiroir latéral
  const handleSendFollowupMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = followupInput.trim();
    if (!text || targetConversation.isLoading || !targetConversation.target)
      return;

    const userMsg: DrawerMessage = {
      content: text,
      id: `user-${Date.now()}`,
      role: "user",
    };

    const newHistory = [...targetConversation.messages, userMsg];
    setFollowupInput("");

    // Message assistant en attente
    const assistantMsg: DrawerMessage = {
      content: "",
      id: `assistant-${Date.now()}`,
      role: "assistant",
      sources: [],
    };

    setTargetConversation((prev) => ({
      ...prev,
      isLoading: true,
      messages: [...newHistory, assistantMsg],
    }));

    if (drawerAbortControllerRef.current) {
      drawerAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    drawerAbortControllerRef.current = controller;

    try {
      const response = await fetch("/api/mai-search/summary", {
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            content: m.content,
            role: m.role,
          })),
          modelId: selectedModelId,
          query: submittedQuery,
          target: targetConversation.target,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la réponse de l'assistant.");
      }

      let accumulated = "";
      await readSummaryStream(response, (event) => {
        if (event.type === "text-delta") {
          accumulated += event.delta;
          setTargetConversation((prev) => {
            const msgs = [...prev.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              msgs[lastIdx] = { ...msgs[lastIdx], content: accumulated };
            }
            return { ...prev, messages: msgs };
          });
        } else if (event.type === "sources") {
          setTargetConversation((prev) => {
            const msgs = [...prev.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              msgs[lastIdx] = { ...msgs[lastIdx], sources: event.sources };
            }
            return { ...prev, messages: msgs };
          });
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[SearchClient] Erreur conversation tiroir:", err);
        toast.error("Impossible d'obtenir la réponse de l'assistant.");
      }
    } finally {
      setTargetConversation((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCloseTargetConversation = () => {
    if (drawerAbortControllerRef.current) {
      drawerAbortControllerRef.current.abort();
    }
    setTargetConversation((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCopyDrawerContent = async () => {
    const lastAssistant = targetConversation.messages
      .slice()
      .reverse()
      .find((m) => m.role === "assistant" && m.content);
    const textToCopy =
      lastAssistant?.content ||
      targetConversation.messages
        .map((m) => `${m.role === "user" ? "Moi" : "mAI"}: ${m.content}`)
        .join("\n\n");
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopiedDrawer(true);
      toast.success("Copié dans le presse-papiers !");
      setTimeout(() => setHasCopiedDrawer(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  const handleSendDrawerToChat = () => {
    if (!targetConversation.target) return;
    const conversationSummary = targetConversation.messages
      .map(
        (m) =>
          `**${m.role === "user" ? "Utilisateur" : "mAI"}** :\n${m.content}`
      )
      .join("\n\n");

    const prefilled = `Je consultais cette ressource sur mAI Search :\n**${targetConversation.target.title}** (${targetConversation.target.url})\n\nHistorique de notre échange :\n${conversationSummary}\n\nPeux-tu approfondir ce sujet avec moi ?`;

    try {
      sessionStorage.setItem("mai_pending_chat_prompt", prefilled);
    } catch {}

    router.push(`/?prompt=${encodeURIComponent(prefilled)}`);
  };

  /**
   * Exécution de la recherche principale.
   *
   * Trois choses ont été corrigées ici :
   *
   * 1. La requête est ANNULABLE. Une recherche lancée puis abandonnée
   *    (nouvelle frappe, onglet fermé) continuait de courir et pouvait
   *    réécrire les résultats par-dessus ceux de la recherche suivante.
   *    Le `AbortController` estAnnulé, et la réponse d'une recherche
   *    abandonnée est ignorée.
   *
   * 2. L'ERREUR EST AFFICHÉE, pas seulement signalée par un `toast`. Une
   *    panne laissait un écran vide, indiscernable d'une recherche sans
   *    résultat. L'écran dit maintenant ce qui s'est passé et propose de
   *    réessayer.
   *
   * 3. L'URL porte la requête. Une recherche est partageable, et le bouton
   *    « Partager » existait déjà mais reconstruisait l'URL à la main —
   *    il pouvait donc partager autre chose que ce qui est affiché.
   */
  const runSearch = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q) return;

      // Une recherche précédente encore en vol est abandonnée : ses
      // résultats ne doivent pas écraser ceux de la nouvelle.
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSubmittedQuery(q);
      setIsLoading(true);
      setResults([]);
      setImages([]);
      setNews([]);
      setVideos([]);
      setSummary("");
      setSummaryModel(null);
      setVote(null);
      setDomainFilter(null);
      setSourceFilter("all");
      setWikiFirst(false);
      setSearchError(null);
      setDurationMs(null);
      setRequestedCount(null);
      setTruncated(false);

      // L'URL est mise à jour AVANT la requête : le partage et le
      // rechargement fonctionnent même si la recherche échoue, et l'URL
      // reflète la recherche en cours, pas la précédente.
      const url = new URL(window.location.href);
      url.searchParams.set("q", q);
      window.history.replaceState(null, "", url.toString());

      try {
        // Aucune source, ni langue, ni volume n'est envoyé : le serveur
        // applique les préférences du compte (langue, sources activées,
        // volume, filtre) et son plafond de forfait. Le client propose, le
        // serveur tranche — envoyer `type: "all"` contournerait le réglage
        // « sources activées », et envoyer `count` contournerait le
        // plafond du forfait.
        const res = await fetch("/api/mai-search", {
          body: JSON.stringify({ query: q }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(
            res.status === 429
              ? "Trop de recherches consécutives. Patientez quelques secondes."
              : "Le moteur de recherche n'a pas répondu."
          );
        }

        const data = await res.json();
        // Une réponse arrivée après l'abandon ne doit rien écrire.
        if (controller.signal.aborted) {
          return;
        }
        const searchResults: SearchWebHit[] = data.results || [];
        const searchImages: SearchImageHit[] = data.images || [];
        const searchNews: SearchNewsHit[] = data.news || [];
        const searchVideos: SearchVideoHit[] = data.videos || [];

        setResults(searchResults);
        setImages(searchImages);
        setNews(searchNews);
        setVideos(searchVideos);
        setSearchId(data.searchId || null);
        setProvider(data.provider || null);
        // Volume demandé et volume obtenu : quand ils diffèrent, le moteur a
        // tronqué, et l'interface doit le dire.
        setRequestedCount(
          typeof data.requestedCount === "number" ? data.requestedCount : null
        );
        setTruncated(data.truncated === true);
        // Le serveur décide de l'ordre : l'interface l'explique, elle ne le
        // recalcule pas.
        setWikiFirst(data.wikiFirst === true);
        setDurationMs(
          typeof data.durationMs === "number" ? data.durationMs : null
        );

        // L'historique est rechargé APRÈS la recherche : la ligne vient
        // d'être écrite, et l'afficher immédiatement montrerait une entrée
        // que le serveur n'a pas encore confirmée.
        void refreshRecent();

        // Lancer immédiatement la synthèse IA en parallèle
        void fetchSummary(q, data.searchId || null, searchResults, "normal");
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        const message = err?.message || "Impossible d'effectuer la recherche.";
        setSearchError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [fetchSummary, query, refreshRecent]
  );

  /**
   * REPRISE D'UNE RECHERCHE DEPUIS L'URL.
   *
   * `/search?q=…` doit afficher la recherche, pas une page d'accueil. La
   * requête est lue UNE SEULE FOIS au montage : ensuite, chaque recherche
   * écrit l'URL elle-même, et la relire à chaque rendu créerait une boucle
   * (l'URL change → l'effet rejoue → la recherche repart).
   *
   * Le drapeau `initialQueryRef` est donc la preuve que l'amorçage a eu
   * lieu : sans lui, un changement de `searchParams` à la volée
   * reserait la recherche, ce qui n'est pas le comportement attendu d'un
   * simple lien.
   *
   * La fonction de recherche est lue dans une RÉF : elle change à chaque
   * frappe, et l'amorçage ne doit se produire qu'une fois. Déclarer la
   * dépendance ferait rejouer l'effet à chaque frappe — donc relancer la
   * recherche en boucle. La ref est donc mise à jour à chaque rendu, et
   * l'effet n'en dépend pas.
   */
  const initialQueryRef = useRef<string | null>(null);
  const searchRef = useRef(runSearch);
  searchRef.current = runSearch;
  useEffect(() => {
    if (initialQueryRef.current !== null) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const depuisUrl = params.get("q")?.trim() ?? "";
    if (!depuisUrl) {
      return;
    }
    initialQueryRef.current = depuisUrl;
    setQuery(depuisUrl);
    void searchRef.current(depuisUrl);
  }, []);

  /**
   * Annulation au DÉMONTAGE.
   *
   * Sans cela, quitter la page pendant une recherche la laisse courir
   * jusqu'au bout et tenter d'écrire dans un composant disparu. Le même
   * sort est réservé à la synthèse.
   */
  useEffect(
    () => () => {
      searchAbortRef.current?.abort();
      abortControllerRef.current?.abort();
      drawerAbortControllerRef.current?.abort();
    },
    []
  );

  // Soumission via Entrée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch();
    }
  };

  // Vote
  const handleVote = async (newVote: "good" | "bad") => {
    if (vote === newVote) return;
    setVote(newVote);
    toast.success(
      newVote === "good"
        ? "Merci pour votre retour positif !"
        : "Merci, retour pris en compte pour améliorer les synthèses."
    );

    if (searchId) {
      try {
        await fetch("/api/mai-search/vote", {
          body: JSON.stringify({ searchId, vote: newVote }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        // Silencieux
      }
    }
  };

  // Copier le résumé global
  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setHasCopiedSummary(true);
      toast.success("Résumé copié dans le presse-papiers !");
      setTimeout(() => setHasCopiedSummary(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  // Copier un lien
  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("Lien copié !");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  // Partager la recherche
  const handleShareSearch = async () => {
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(submittedQuery)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          text: `Recherche sur mAI Search : ${submittedQuery}`,
          title: `mAI Search — ${submittedQuery}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback presse-papier
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien de la recherche copié dans le presse-papiers !");
    } catch {
      toast.error("Impossible de partager le lien.");
    }
  };

  // Actions d'affinage du résumé global
  const handleRefineSummary = (length: "short" | "long" | "normal") => {
    setSummaryLength(length);
    void fetchSummary(submittedQuery, searchId, results, length);
  };

  // Redirection vers le Chat mAI avec pré-remplissage
  const handleSendToChat = () => {
    if (!submittedQuery) return;
    const prefilled = `Je faisais une recherche sur "${submittedQuery}".\n\nVoici la synthèse trouvée :\n${summary || "Recherche effectuée sur mAI Search."}\n\nPeux-tu approfondir ce sujet et m'en dire plus ?`;

    try {
      sessionStorage.setItem("mai_pending_chat_prompt", prefilled);
    } catch {}

    router.push(`/?prompt=${encodeURIComponent(prefilled)}`);
  };

  // Filtrage par domaine
  const filteredResults = useMemo(() => {
    let list = results;
    if (sourceFilter === "wikipedia") {
      list = list.filter((r) => r.origin === "wikipedia");
    }
    if (!domainFilter) return list;
    return list.filter((r) => {
      try {
        return new URL(r.url).hostname.includes(domainFilter);
      } catch {
        return true;
      }
    });
  }, [domainFilter, results, sourceFilter]);

  /**
   * Nombre d'articles d'encyclopédie dans les résultats.
   *
   * Le filtre par origine n'est proposé que s'il mènerait quelque part : un
   * onglet « Wikipédia (0) » est un appel à échouer.
   */
  const wikipediaCount = useMemo(
    () => results.filter((r) => r.origin === "wikipedia").length,
    [results]
  );

  const hasSearched = Boolean(submittedQuery);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground relative">
      {/* ─── Mode Résultats (Barre en haut + Contenu) ─── */}
      {hasSearched ? (
        <div className="flex flex-col w-full">
          {/* En-tête / Barre de recherche supérieure élargie */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 sm:px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-3 w-full">
              <div
                className="flex items-center gap-2 mr-2 cursor-pointer select-none shrink-0"
                onClick={() => {
                  setSubmittedQuery("");
                  setQuery("");
                  setResults([]);
                  setImages([]);
                  setNews([]);
                  setVideos([]);
                  setSummary("");
                }}
              >
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                  <SearchIcon className="size-4" />
                </div>
                <span className="font-bold text-sm tracking-tight hidden sm:inline">
                  mAI <span className="text-primary">Search</span>
                </span>
              </div>

              <div className="relative flex-1 w-full flex items-center rounded-xl border border-border/70 bg-card/90 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
                <SearchIcon className="size-4 text-muted-foreground ml-3 shrink-0" />
                <input
                  aria-label="Recherche mAI"
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher..."
                  ref={inputRef}
                  type="text"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="Effacer"
                    className="p-1.5 text-muted-foreground hover:text-foreground mr-1 rounded-md transition-colors cursor-pointer"
                    onClick={() => setQuery("")}
                    type="button"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                ) : null}
                <button
                  className="mr-1.5 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-40"
                  disabled={!isSearchableQuery(query) || isLoading}
                  onClick={() => void runSearch()}
                  type="button"
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                </button>
              </div>

              {/* Bouton Partager la recherche */}
              <button
                className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                onClick={handleShareSearch}
                title="Partager cette recherche"
                type="button"
              >
                <Share2Icon className="size-3.5" />
                <span>Partager</span>
              </button>
            </div>

            {/* Onglets et Tags de filtrage. L'état actif se porte sur
                `data-active` (voir l'utilitaire `chip` de globals.css), jamais
                sur une classe conditionnelle : les onglets et la pastille
                « Wikipédia + Web » partagent alors exactement le même
                gabarit, à la lettre près. */}
            <div className="max-w-6xl mx-auto flex items-center gap-1.5 pt-3 overflow-x-auto w-full no-scrollbar">
              <button
                className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                data-active={activeTab === "web" ? "true" : undefined}
                onClick={() => setActiveTab("web")}
                type="button"
              >
                <GlobeIcon className="size-3.5" />
                <span>Tous ({results.length})</span>
              </button>

              <button
                className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                data-active={activeTab === "news" ? "true" : undefined}
                onClick={() => setActiveTab("news")}
                type="button"
              >
                <NewspaperIcon className="size-3.5" />
                <span>Actualités ({news.length})</span>
              </button>

              <button
                className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                data-active={activeTab === "images" ? "true" : undefined}
                onClick={() => setActiveTab("images")}
                type="button"
              >
                <ImageIcon className="size-3.5" />
                <span>Images ({images.length})</span>
              </button>

              <button
                className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                data-active={activeTab === "videos" ? "true" : undefined}
                onClick={() => setActiveTab("videos")}
                type="button"
              >
                <VideoIcon className="size-3.5" />
                <span>Vidéos ({videos.length})</span>
              </button>

              {/*
                Filtre par origine : l'encyclopédie est une source à part
                entière, ses articles doivent donc être atteignables SANS
                les relire un par un dans la liste. Le filtre n'est proposé
                que s'il mènerait quelque part.
              */}
              {wikipediaCount > 0 ? (
                <button
                  aria-pressed={sourceFilter === "wikipedia"}
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={
                    sourceFilter === "wikipedia" ? "true" : undefined
                  }
                  onClick={() =>
                    setSourceFilter((current) =>
                      current === "wikipedia" ? "all" : "wikipedia"
                    )
                  }
                  title={
                    sourceFilter === "wikipedia"
                      ? "Afficher tous les résultats"
                      : "N'afficher que les articles de Wikipédia"
                  }
                  type="button"
                >
                  <BookIcon className="size-3.5" />
                  <span>Wikipédia ({wikipediaCount})</span>{" "}
                </button>
              ) : null}

              {/*
                Source interrogée. C'est une INFORMATION, pas un filtre : elle
                dit QUELLE source a répondu, et ne filtre rien. Elle porte donc
                le même gabarit que les onglets voisins — même taille, même
                icône — mais reste une <span> neutre (`data-static`), sans
                curseur cliquable ni état actif.
              */}
              {provider && provider !== "you.com" ? (
                <span
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 shrink-0"
                  data-static="true"
                  title={
                    provider === "wikipedia"
                      ? "Les résultats proviennent de l'encyclopédie"
                      : provider === "mixed"
                        ? "Les résultats proviennent de l'encyclopédie et du Web"
                        : "Le moteur principal a échoué : résultats de repli"
                  }
                >
                  {provider === "wikipedia" ? (
                    <BookIcon className="size-3.5" />
                  ) : (
                    <GlobeIcon className="size-3.5" />
                  )}
                  <span>
                    {provider === "wikipedia"
                      ? "Wikipédia"
                      : provider === "mixed"
                        ? "Wikipédia + Web"
                        : "Mode dégradé"}
                  </span>
                </span>
              ) : null}

              {domainFilter ? (
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium shrink-0">
                  <TagIcon className="size-3" />
                  <span>Filtre : {domainFilter}</span>
                  <button
                    className="hover:opacity-70 p-0.5"
                    onClick={() => setDomainFilter(null)}
                    title="Effacer le filtre par site"
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {/* Corps des résultats */}
          <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
            {/* État de chargement initial */}
            {isLoading ? (
              <div className="flex flex-col gap-4 py-8">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
                <div className="h-28 w-full animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-20 w-3/4 animate-pulse rounded-xl bg-muted/30" />
                <div className="h-20 w-5/6 animate-pulse rounded-xl bg-muted/30" />
              </div>
            ) : null}

            {/* ─── Panne de la recherche ─── */}
            {searchError && !isLoading ? (
              <div
                className="surface-card flex flex-col items-center gap-3 border-destructive/30 bg-destructive/5 p-8 text-center"
                role="alert"
              >
                <p className="text-sm font-medium text-foreground">
                  {searchError}
                </p>
                <p className="text-xs text-muted-foreground">
                  La recherche n'a rien renvoyé. Ce n'est pas un résultat vide :
                  le moteur n'a pas répondu.
                </p>
                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                  onClick={() => void runSearch()}
                  type="button"
                >
                  <RotateCcwIcon className="size-3.5" />
                  <span>Réessayer</span>
                </button>
              </div>
            ) : null}

            {/* ─── Onglet Tous (Web + Synthèse mAI) ─── */}
            {activeTab === "web" && !isLoading ? (
              <div className="flex flex-col gap-6">
                {/* ─── Carte Résumé IA Global ─── */}
                <motion.section
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-card relative overflow-hidden border border-primary/25 bg-gradient-to-b from-primary/[0.04] to-card/60 p-5 sm:p-6 shadow-sm flex flex-col gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <SparklesIcon className="size-3.5 animate-pulse" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        Synthèse mAI
                      </span>
                      {summaryModel ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                          {summaryModel}
                        </span>
                      ) : null}
                      {isSummaryLoading ? (
                        <span className="text-[11px] text-muted-foreground animate-pulse">
                          Génération en cours…
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                          summaryLength === "short"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                        onClick={() => handleRefineSummary("short")}
                        title="Résumé très concis"
                        type="button"
                      >
                        Plus court
                      </button>
                      <button
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                          summaryLength === "long"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                        onClick={() => handleRefineSummary("long")}
                        title="Synthèse détaillée"
                        type="button"
                      >
                        Plus long
                      </button>
                      <button
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleRefineSummary("normal")}
                        title="Réessayer"
                        type="button"
                      >
                        <RotateCcwIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenu du résumé markdown */}
                  <div className="text-sm leading-relaxed text-foreground/90">
                    {summary ? (
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <Streamdown>{summary}</Streamdown>
                        <SummarySources sources={summarySources} />
                      </div>
                    ) : isSummaryLoading ? (
                      <div className="space-y-2 py-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-muted/50" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        En attente des données de recherche…
                      </p>
                    )}
                  </div>

                  {/* Actions sous le résumé */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/30 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Ce résumé vous a-t-il aidé ?
                      </span>
                      <button
                        aria-label="Bien"
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer",
                          vote === "good"
                            ? "bg-success/15 border-success/30 text-success"
                            : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => void handleVote("good")}
                        type="button"
                      >
                        <ThumbsUpIcon className="size-3" />
                        <span>Bien</span>
                      </button>
                      <button
                        aria-label="Pas bien"
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer",
                          vote === "bad"
                            ? "bg-destructive/15 border-destructive/30 text-destructive"
                            : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => void handleVote("bad")}
                        type="button"
                      >
                        <ThumbsDownIcon className="size-3" />
                        <span>Pas bien</span>
                      </button>

                      <button
                        aria-label="Copier le résumé"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1 cursor-pointer"
                        onClick={handleCopySummary}
                        type="button"
                      >
                        {hasCopiedSummary ? (
                          <CheckIcon className="size-3 text-success" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                        <span>
                          {hasCopiedSummary ? "Copié" : "Copier la synthèse"}
                        </span>
                      </button>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer ml-auto"
                      onClick={handleSendToChat}
                      type="button"
                    >
                      <MessageCircleIcon className="size-3.5" />
                      <span>Continuer dans le Chat mAI</span>
                      <ArrowRightIcon className="size-3" />
                    </button>
                  </div>
                </motion.section>

                {/* ─── Liste des résultats Web ─── */}
                <div className="flex flex-col gap-4">
                  {/*
                    Le moteur a remonté l'encyclopédie en tête : on l'explique.
                    Sans cette ligne, l'utilisateur voyait les articles de
                    Wikipédia avant les pages web sans comprendre que c'était
                    un CHOIX — la requête était factuelle.
                  */}
                  {wikiFirst && sourceFilter === "all" ? (
                    <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                      <BookIcon className="size-3.5 shrink-0" />
                      <span>
                        Les articles de Wikipédia sont en tête : la requête
                        ressemble à une recherche factuelle.
                      </span>
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground px-1">
                    <span>
                      {filteredResults.length} résultat
                      {filteredResults.length > 1 ? "s" : ""} trouvé
                      {filteredResults.length > 1 ? "s" : ""}
                      {/*
                        Le moteur a rendu moins de liens que demandé : le
                        dire vaut mieux que laisser croire à une recherche
                        exhaustive. Le volume demandé vient du serveur (il
                        applique la préférence ET le plafond du forfait).
                      */}
                      {truncated && requestedCount ? (
                        <span className="text-warning">
                          {" "}
                          · sur {requestedCount} demandés
                        </span>
                      ) : null}
                    </span>
                    {/*
                      La durée n'est affichée qu'au-delà de deux secondes :
                      en dessous, elle n'apprend rien et n'occupe que de la
                      place. Au-dessus, elle explique une attente — et c'est
                      le seul endroit où l'utilisateur comprend que le
                      moteur a été lent plutôt que muet.
                    */}
                    {durationMs !== null && durationMs > 2000 ? (
                      <span title="Durée de la recherche">
                        {(durationMs / 1000).toFixed(1)} s
                      </span>
                    ) : null}
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                      Aucun résultat web trouvé pour « {submittedQuery} ».
                    </div>
                  ) : (
                    filteredResults.map((item, index) => {
                      let hostname = "";
                      try {
                        hostname = new URL(item.url).hostname;
                      } catch {
                        hostname = item.url;
                      }

                      return (
                        <motion.article
                          animate={{ opacity: 1, y: 0 }}
                          className="surface-card flex flex-col gap-2.5 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
                          initial={{ opacity: 0, y: 12 }}
                          key={`${item.url}-${index}`}
                          transition={{ delay: index * 0.03, duration: 0.25 }}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                              <SearchSafeImage
                                alt=""
                                className="size-4 rounded-sm object-contain shrink-0"
                                fallback={
                                  <GlobeIcon className="size-4 shrink-0" />
                                }
                                src={item.favicon_url}
                              />
                              <button
                                className="truncate font-mono text-[11px] hover:text-foreground text-left"
                                onClick={() => setDomainFilter(hostname)}
                                title={`Filtrer par ${hostname}`}
                                type="button"
                              >
                                {hostname}
                              </button>
                              {/*
                                L'origine distingue l'article d'encyclopédie
                                de la page qui en parle. L'accent
                                d'information (`--info`) porte cette
                                distinction : c'est une information sur la
                                nature de la source, pas une validation.
                              */}
                              {item.origin === "wikipedia" ? (
                                <span className="chip text-[10px] py-0.5 px-2 bg-info/10 text-info font-medium shrink-0">
                                  Wikipédia
                                </span>
                              ) : (
                                <span className="chip text-[10px] py-0.5 px-2 bg-muted/60 text-muted-foreground shrink-0">
                                  Web
                                </span>
                              )}
                              {/*
                                Une page de désambiguïsation est un index
                                d'homonymes, pas un article : le signaler
                                évite de croire à un contenu de référence.
                              */}
                              {item.isDisambiguation ? (
                                <span
                                  className="chip text-[10px] py-0.5 px-2 bg-warning/10 text-warning font-medium shrink-0"
                                  title="Cette page liste plusieurs sujets possibles. Choisissez le bon article dans Wikipédia."
                                >
                                  Désambiguïsation
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Bouton Résumé spécifique au site */}
                              <button
                                aria-label="Résumer ce site avec mAI"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer ring-1 ring-primary/20"
                                onClick={() =>
                                  void handleRequestTargetSummary({
                                    snippet: item.snippet,
                                    source: hostname,
                                    title: item.title,
                                    type: "web",
                                    url: item.url,
                                  })
                                }
                                title="Demander à mAI de résumer ce site et discuter"
                                type="button"
                              >
                                <SparklesIcon className="size-3" />
                                <span>Résumer</span>
                              </button>

                              <button
                                aria-label="Copier le lien"
                                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                onClick={() => handleCopyLink(item.url)}
                                title="Copier l'adresse"
                                type="button"
                              >
                                {copiedUrl === item.url ? (
                                  <CheckIcon className="size-3.5 text-success" />
                                ) : (
                                  <CopyIcon className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <a
                            className="text-base font-semibold text-foreground group-hover:text-primary group-hover:underline flex items-center gap-1.5 transition-colors"
                            href={item.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <span>{item.title}</span>
                            <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>

                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {item.snippet}
                          </p>
                        </motion.article>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            {/* ─── Onglet Actualités (News) ─── */}
            {activeTab === "news" && !isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {news.length} article{news.length > 1 ? "s" : ""}{" "}
                    d'actualité trouvé{news.length > 1 ? "s" : ""}
                  </span>
                </div>

                {news.length === 0 ? (
                  <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                    Aucune actualité trouvée pour « {submittedQuery} ».
                  </div>
                ) : (
                  news.map((item, index) => {
                    let domain = item.source || "";
                    if (!domain) {
                      try {
                        domain = new URL(item.url).hostname;
                      } catch {
                        domain = item.url;
                      }
                    }

                    return (
                      <motion.article
                        animate={{ opacity: 1, y: 0 }}
                        className="surface-card flex flex-col gap-2.5 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
                        initial={{ opacity: 0, y: 12 }}
                        key={`${item.url}-${index}`}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 min-w-0">
                            <SearchSafeImage
                              alt=""
                              className="size-4 rounded-sm object-contain shrink-0"
                              fallback={
                                <NewspaperIcon className="size-4 shrink-0 text-primary" />
                              }
                              src={item.favicon_url}
                            />
                            <span className="font-semibold text-[11px] text-foreground/80 truncate">
                              {domain}
                            </span>
                            <span className="chip text-[10px] py-0.5 px-2 bg-info/10 text-info font-medium shrink-0">
                              Actualité
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Bouton Résumé spécifique à l'actualité */}
                            <button
                              aria-label="Résumer cet article avec mAI"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer ring-1 ring-primary/20"
                              onClick={() =>
                                void handleRequestTargetSummary({
                                  snippet: item.snippet,
                                  source: domain,
                                  title: item.title,
                                  type: "news",
                                  url: item.url,
                                })
                              }
                              title="Demander à mAI de résumer cet article et discuter"
                              type="button"
                            >
                              <SparklesIcon className="size-3" />
                              <span>Résumer</span>
                            </button>

                            <button
                              aria-label="Copier le lien"
                              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              onClick={() => handleCopyLink(item.url)}
                              title="Copier le lien de l'article"
                              type="button"
                            >
                              {copiedUrl === item.url ? (
                                <CheckIcon className="size-3.5 text-success" />
                              ) : (
                                <CopyIcon className="size-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <a
                          className="text-base font-semibold text-foreground group-hover:text-primary group-hover:underline flex items-center gap-1.5 transition-colors"
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span>{item.title}</span>
                          <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>

                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {item.snippet}
                        </p>
                      </motion.article>
                    );
                  })
                )}
              </div>
            ) : null}

            {/* ─── Onglet Images avec Lightbox, Résumé et Résistance Anti-Hotlink ─── */}
            {activeTab === "images" && !isLoading ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {images.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
                    Aucune image trouvée pour « {submittedQuery} ».
                  </p>
                ) : (
                  images.map((img, i) => {
                    let domain = "";
                    try {
                      domain = new URL(img.page_url || img.image_url).hostname;
                    } catch {}

                    return (
                      <div
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md cursor-pointer"
                        key={`${img.image_url}-${i}`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-muted/30 flex items-center justify-center">
                          <SearchSafeImage
                            alt={img.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            fallback={
                              <div className="flex size-full items-center justify-center p-3 text-center flex-col gap-1.5 bg-muted/40">
                                <ImageIcon className="size-6 text-muted-foreground/60" />
                                <span className="text-[10px] text-muted-foreground line-clamp-2">
                                  {img.title}
                                </span>
                              </div>
                            }
                            src={img.thumbnail || img.image_url}
                          />

                          {/* Badge tag Image */}
                          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                            Image
                          </span>

                          {/* Bouton rapide Résumé d'image au survol */}
                          <button
                            aria-label="Résumer le sujet de l'image"
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-background/90 text-primary shadow hover:bg-background cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRequestTargetSummary({
                                snippet: img.title,
                                source: domain,
                                title: img.title,
                                type: "image",
                                url: img.page_url || img.image_url,
                              });
                            }}
                            title="Résumer le sujet avec mAI"
                            type="button"
                          >
                            <SparklesIcon className="size-3" />
                            <span>Résumer</span>
                          </button>
                        </div>
                        <div className="p-2.5 flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {img.title}
                          </span>
                          {domain ? (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {domain}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : null}

            {/* ─── Onglet Vidéos avec Lecteur Interactif Intégré ─── */}
            {activeTab === "videos" && !isLoading ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {videos.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
                    Aucune vidéo trouvée pour « {submittedQuery} ».
                  </p>
                ) : (
                  videos.map((vid, i) => (
                    <div
                      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md cursor-pointer"
                      key={`${vid.page_url}-${i}`}
                      onClick={() => setSelectedVideo(vid)}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                        <SearchSafeImage
                          alt={vid.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallback={
                            <div className="flex size-full items-center justify-center bg-muted/40">
                              <VideoIcon className="size-8 text-muted-foreground/60" />
                            </div>
                          }
                          src={vid.thumbnail}
                        />

                        {/* Bouton lecture central */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="size-11 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <PlayIcon className="size-5 text-primary ml-0.5 fill-primary" />
                          </div>
                        </div>

                        {/* Tags Plateforme & Vidéo */}
                        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                          Vidéo
                        </span>

                        {vid.platform ? (
                          <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                            {vid.platform}
                          </span>
                        ) : null}
                      </div>

                      <div className="p-3 flex flex-col gap-2">
                        <span className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {vid.title}
                        </span>

                        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 text-primary font-medium">
                            <PlayIcon className="size-3 fill-primary" />
                            <span>Lire la vidéo</span>
                          </span>

                          <button
                            aria-label="Résumer la vidéo"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRequestTargetSummary({
                                snippet: vid.title,
                                source: vid.platform || "Vidéo",
                                title: vid.title,
                                type: "video",
                                url: vid.page_url,
                              });
                            }}
                            title="Résumer la vidéo avec mAI"
                            type="button"
                          >
                            <SparklesIcon className="size-3" />
                            <span>Résumer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : null}
          </main>
        </div>
      ) : (
        /* ─── Mode Initial (Centré, barre plus large, sans suggestions) ─── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center mb-8"
            initial={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
                <SearchIcon className="size-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                mAI <span className="text-primary">Search</span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Moteur de recherche web, actualités, vidéos et images instantané,
              synthétisé par votre intelligence artificielle mAI.
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative max-w-3xl"
            initial={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative flex items-center w-full rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-md transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 hover:border-foreground/30 p-1">
              <SearchIcon className="size-5 text-muted-foreground ml-4 shrink-0" />
              <input
                aria-label="Recherche mAI"
                className="w-full bg-transparent px-3.5 py-4 text-base sm:text-lg outline-none placeholder:text-muted-foreground/60"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher sur le web avec mAI..."
                ref={inputRef}
                type="text"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Effacer"
                  className="p-2 text-muted-foreground hover:text-foreground mr-1 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
              <button
                className="mr-2 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-40"
                disabled={!isSearchableQuery(query) || isLoading}
                onClick={() => void runSearch()}
                type="button"
              >
                Rechercher
              </button>
            </div>
          </motion.div>

          {/* ─── Raccourci d'adresse ─── */}
          {looksLikeUrl(query) ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl mt-4"
              initial={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="surface-muted flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
                <span className="text-muted-foreground">
                  Cette saisie est une adresse. L'ouvrir directement évite une
                  recherche qui ne renverrait que des pages « à propos » de
                  cette adresse.
                </span>
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                  href={
                    query.trim().startsWith("http")
                      ? query.trim()
                      : `https://${query.trim()}`
                  }
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Ouvrir l'adresse</span>
                  <ExternalLinkIcon className="size-3" />
                </a>
              </div>
            </motion.div>
          ) : null}

          {/* ─── Recherches récentes ─── */}
          {recent.length > 0 ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl mt-8"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.18, duration: 0.25 }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recherches récentes
                </span>
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => void clearRecent()}
                  type="button"
                >
                  Tout effacer
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {recent.map((entree) => (
                  <li className="group flex items-center gap-2" key={entree.id}>
                    <button
                      className="flex flex-1 items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-left text-sm text-foreground/85 transition-colors hover:border-foreground/25 hover:bg-muted/40 cursor-pointer"
                      onClick={() => {
                        setQuery(entree.query);
                        void runSearch(entree.query);
                      }}
                      type="button"
                    >
                      <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entree.query}</span>
                    </button>
                    <button
                      aria-label={`Retirer « ${entree.query} » de l'historique`}
                      className="p-1.5 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground hover:bg-muted/60 focus-visible:opacity-100 cursor-pointer"
                      onClick={() => void forgetRecent(entree.id)}
                      type="button"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </div>
      )}

      {/* ─── Modale Lightbox d'Image (Agrandissement + Résumé + Visite) ─── */}
      <AnimatePresence>
        {selectedImage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête Lightbox */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="chip text-[10px] py-0.5 px-2 bg-primary/10 text-primary font-medium shrink-0">
                    Image
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate">
                    {selectedImage.title}
                  </span>
                </div>
                <button
                  aria-label="Fermer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={() => setSelectedImage(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Image en grand */}
              <div className="relative flex-1 bg-black/10 dark:bg-black/30 flex items-center justify-center p-4 min-h-[300px] max-h-[60vh] overflow-hidden">
                <SearchSafeImage
                  alt={selectedImage.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  fallback={
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-12" />
                      <span className="text-xs">Image non disponible</span>
                    </div>
                  }
                  src={selectedImage.image_url || selectedImage.thumbnail}
                />
              </div>

              {/* Pied de Lightbox : Résumé + Actions */}
              <div className="p-4 border-t border-border/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate w-full sm:w-auto">
                  <GlobeIcon className="size-4 shrink-0" />
                  <span className="truncate max-w-[280px]">
                    {selectedImage.page_url
                      ? new URL(selectedImage.page_url).hostname
                      : "Source web"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    aria-label="Résumer avec mAI"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => {
                      const img = selectedImage;
                      setSelectedImage(null);
                      void handleRequestTargetSummary({
                        snippet: img.title,
                        source: img.page_url
                          ? new URL(img.page_url).hostname
                          : "Image",
                        title: img.title,
                        type: "image",
                        url: img.page_url || img.image_url,
                      });
                    }}
                    type="button"
                  >
                    <SparklesIcon className="size-3.5" />
                    <span>Résumer le sujet</span>
                  </button>

                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() =>
                      handleCopyLink(
                        selectedImage.page_url || selectedImage.image_url
                      )
                    }
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                    <span>Copier le lien</span>
                  </button>

                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    href={selectedImage.page_url || selectedImage.image_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Visiter le site</span>
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* ─── Modale Lightbox Vidéo avec Lecteur Interactif Intégré ─── */}
      <AnimatePresence>
        {selectedVideo ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-4xl w-full max-h-[92vh] rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête Lightbox Vidéo */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="chip text-[10px] py-0.5 px-2 bg-primary/10 text-primary font-medium shrink-0">
                    {selectedVideo.platform || "Vidéo"}
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate">
                    {selectedVideo.title}
                  </span>
                </div>
                <button
                  aria-label="Fermer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={() => setSelectedVideo(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Lecteur vidéo interactif */}
              <div className="relative flex-1 bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
                {(() => {
                  const embed = getVideoEmbed(selectedVideo);

                  if (embed.type === "iframe" && embed.embedUrl) {
                    return (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                        src={embed.embedUrl}
                        title={selectedVideo.title}
                      />
                    );
                  }

                  if (embed.type === "video" && embed.embedUrl) {
                    return (
                      <video
                        autoPlay
                        className="w-full h-full object-contain"
                        controls
                        src={embed.embedUrl}
                      >
                        Votre navigateur ne supporte pas la lecture de cette
                        vidéo.
                      </video>
                    );
                  }

                  // Fallback si la plateforme ne supporte pas l'embed direct (ex: site restreint)
                  return (
                    <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                      <VideoIcon className="size-12 text-muted-foreground/60" />
                      <p className="text-sm text-foreground max-w-md">
                        Cette vidéo ne permet pas l'intégration directe, mais
                        vous pouvez la regarder directement sur le site source.
                      </p>
                      <a
                        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
                        href={selectedVideo.page_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span>
                          Regarder sur{" "}
                          {selectedVideo.platform || "le site source"}
                        </span>
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Pied de Lightbox Vidéo */}
              <div className="p-4 border-t border-border/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate w-full sm:w-auto">
                  <PlayIcon className="size-4 shrink-0 text-primary" />
                  <span className="truncate max-w-[280px]">
                    {selectedVideo.platform
                      ? `Plateforme : ${selectedVideo.platform}`
                      : selectedVideo.page_url}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Bouton Résumer la vidéo avec mAI */}
                  <button
                    aria-label="Résumer cette vidéo avec mAI"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => {
                      const vid = selectedVideo;
                      setSelectedVideo(null);
                      void handleRequestTargetSummary({
                        snippet: vid.title,
                        source: vid.platform || "Vidéo",
                        title: vid.title,
                        type: "video",
                        url: vid.page_url,
                      });
                    }}
                    type="button"
                  >
                    <SparklesIcon className="size-3.5" />
                    <span>Résumer la vidéo</span>
                  </button>

                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() => handleCopyLink(selectedVideo.page_url)}
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                    <span>Copier le lien</span>
                  </button>

                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    href={selectedVideo.page_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Ouvrir la page</span>
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* ─── Tiroir Latéral Rétractable de Discussion IA avec ModelSelector & Outil WebSearch ─── */}
      <AnimatePresence>
        {targetConversation.isOpen && targetConversation.target ? (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={handleCloseTargetConversation}
            />

            {/* Volet Tiroir */}
            <motion.aside
              animate={{ x: 0 }}
              className="relative z-10 w-full sm:w-[500px] h-full bg-card border-l border-border/80 shadow-2xl flex flex-col overflow-hidden"
              exit={{ x: "100%" }}
              initial={{ x: "100%" }}
              transition={{ damping: 25, stiffness: 300, type: "spring" }}
            >
              {/* En-tête principal du tiroir */}
              <div className="flex items-center justify-between p-3.5 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shrink-0">
                    <SparklesIcon className="size-4 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground">
                        mAI Search Assistant
                      </span>
                      <span className="chip text-[10px] py-0 px-1.5 bg-primary/10 text-primary font-medium">
                        {targetConversation.target.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {targetConversation.target.title}
                    </span>
                  </div>
                </div>

                <button
                  aria-label="Fermer le tiroir"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                  onClick={handleCloseTargetConversation}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Sous-en-tête : Sélecteur de modèle d'IA & Indicateur outil unique de recherche web */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/10 border-b border-border/40 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden sm:inline">
                    Modèle :
                  </span>
                  <ModelSelectorCompact
                    modal={true}
                    onModelChange={(newModel) => setSelectedModelId(newModel)}
                    selectedModelId={selectedModelId}
                    side="bottom"
                  />
                </div>

                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium shrink-0 ring-1 ring-primary/20"
                  title="Ce modèle dispose de l'outil Recherche web pour vérifier et compléter les informations en direct."
                >
                  <GlobeIcon className="size-3" />
                  <span>Recherche web active</span>
                </div>
              </div>

              {/* Corps déroulant : Carte source & Fil de discussion multi-tours */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-sm leading-relaxed text-foreground/90 space-y-4">
                {/* Carte récapitulative de la source */}
                <div className="surface-muted p-3 text-xs flex flex-col gap-1.5 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground line-clamp-1">
                      {targetConversation.target.title}
                    </span>
                    <a
                      className="chip text-[10px] inline-flex items-center gap-1 py-0.5 px-2 cursor-pointer shrink-0"
                      href={targetConversation.target.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      title="Consulter la ressource originale"
                    >
                      <span>Ouvrir</span>
                      <ExternalLinkIcon className="size-2.5" />
                    </a>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate font-mono">
                    {targetConversation.target.url}
                  </span>
                </div>

                {/* Messages de la conversation */}
                {targetConversation.messages.map((msg, index) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2.5 w-full",
                        isAssistant ? "items-start" : "items-end justify-end"
                      )}
                      initial={{ opacity: 0, y: 8 }}
                      key={msg.id || index}
                      transition={{ duration: 0.2 }}
                    >
                      {isAssistant ? (
                        <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shrink-0 mt-0.5">
                          <BotIcon className="size-4" />
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          "rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed max-w-[85%]",
                          isAssistant
                            ? "surface-card border border-border/60 bg-card/80 text-foreground shadow-xs w-full"
                            : "bg-primary text-primary-foreground font-medium rounded-br-xs"
                        )}
                      >
                        {isAssistant ? (
                          msg.content ? (
                            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                              <Streamdown>{msg.content}</Streamdown>
                              <SummarySources sources={msg.sources ?? []} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground animate-pulse">
                              <SparklesIcon className="size-3.5 text-primary" />
                              <span>Génération et recherche en cours…</span>
                            </div>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>

                      {isAssistant ? null : (
                        <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mb-0.5">
                          <UserIcon className="size-3.5" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                <div ref={drawerMessagesEndRef} />
              </div>

              {/* Zone de saisie et formulaire de question de suivi */}
              <form
                className="p-3.5 border-t border-border/50 bg-card flex flex-col gap-2.5 shrink-0"
                onSubmit={handleSendFollowupMessage}
              >
                <div className="relative flex items-center w-full rounded-xl border border-border/70 bg-muted/20 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-1">
                  <input
                    aria-label="Poser une question sur cette ressource"
                    className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm outline-none placeholder:text-muted-foreground/60"
                    disabled={targetConversation.isLoading}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    placeholder="Poser une question de suivi sur cette ressource..."
                    type="text"
                    value={followupInput}
                  />
                  <button
                    aria-label="Envoyer"
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                    disabled={
                      !followupInput.trim() || targetConversation.isLoading
                    }
                    title="Envoyer la question"
                    type="submit"
                  >
                    <SendIcon className="size-3.5" />
                  </button>
                </div>

                {/* Actions secondaires */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <button
                    className="chip text-[11px] inline-flex items-center gap-1.5 py-1 px-2.5 cursor-pointer"
                    disabled={targetConversation.messages.length === 0}
                    onClick={handleCopyDrawerContent}
                    type="button"
                  >
                    {hasCopiedDrawer ? (
                      <CheckIcon className="size-3 text-success" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                    <span>{hasCopiedDrawer ? "Copié" : "Copier"}</span>
                  </button>

                  <button
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    onClick={handleSendDrawerToChat}
                    type="button"
                  >
                    <MessageCircleIcon className="size-3.5" />
                    <span>Poursuivre dans le Chat mAI</span>
                    <ArrowRightIcon className="size-3" />
                  </button>
                </div>
              </form>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
