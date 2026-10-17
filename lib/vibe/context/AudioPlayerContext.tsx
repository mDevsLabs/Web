/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — AUDIO PLAYER CONTEXT (src/context/AudioPlayerContext.tsx)
 * Lecteur audio flottant mAI : écoute de n'importe quel post ou long fil de
 * discussion avec la voix de mAI (backend POST /v1/speech → deepgram Flux TTS).
 *
 * Principe : une file de segments {id, title, text} est générée vocalement de
 * façon séquentielle (quota speech progressif, fils longs supportés) et jouée
 * en continu ; le lecteur survit à la navigation car il est monté dans App.tsx.
 * ============================================================================
 */
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiService } from "@/lib/vibe/services/api";
import { NotificationService } from "@/lib/vibe/services/notificationService";

export interface AudioSegmentRequest {
  id: string;
  text: string;
  title: string;
}

export interface AudioSegment extends AudioSegmentRequest {
  url: string;
}

interface AudioPlayerContextValue {
  close: () => void;
  current: AudioSegment | null;
  currentTime: number;
  cycleSpeed: () => void;
  duration: number;
  enqueue: (segments: AudioSegmentRequest[]) => void;
  isLoading: boolean;
  isPlaying: boolean;
  next: () => void;
  playQueue: (segments: AudioSegmentRequest[]) => void;
  prev: () => void;
  seek: (fraction: number) => void;
  speed: number;
  toggle: () => void;
  upcoming: AudioSegmentRequest[];
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

// Voix mAI de l'utilisateur (réglage mai_tts_voice) — résolue une seule fois
let cachedVoice: string | null | undefined;
async function resolveVoice(): Promise<string | undefined> {
  if (cachedVoice !== undefined) return cachedVoice || undefined;
  try {
    const res: any = await ApiService.getSettings();
    cachedVoice = res?.settings?.mai_tts_voice || null;
  } catch {
    cachedVoice = null;
  }
  return cachedVoice || undefined;
}

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<AudioSegmentRequest[]>([]);
  const [current, setCurrent] = useState<AudioSegment | null>(null);
  const [upcoming, setUpcoming] = useState<AudioSegmentRequest[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const playTokenRef = useRef(0); // invalide les générations lancées avant un skip/close

  const pushUpcoming = useCallback((list: AudioSegmentRequest[]) => {
    setUpcoming([...list]);
  }, []);

  /** Génère la voix mAI du prochain segment de la file et le joue. */
  const playNext = useCallback(
    async function advanceQueue() {
      const token = ++playTokenRef.current;
      const nextSegment = queueRef.current.shift();
      pushUpcoming(queueRef.current);

      if (!nextSegment) {
        setCurrent(null);
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      const text = nextSegment.text.trim();
      if (!text) {
        // Segment vide : passe au suivant sans bloquer la file
        void advanceQueue();
        return;
      }

      setIsLoading(true);
      setCurrent({ ...nextSegment, url: "" });
      try {
        const voice = await resolveVoice();
        const { url } = await ApiService.textToSpeech(
          text.slice(0, 4000),
          voice
        );
        if (token !== playTokenRef.current) return; // skip/close entre-temps
        setIsLoading(false);
        setCurrent({ ...nextSegment, url });
        setCurrentTime(0);
        setDuration(0);
        requestAnimationFrame(() => {
          const audio = audioRef.current;
          if (!audio) return;
          // Le <audio> n'a pas de src déclaratif : l'URL TTS vient du serveur
          audio.src = url;
          audio.load();
          audio.play().catch(() => setIsPlaying(false));
        });
      } catch (err: any) {
        if (token !== playTokenRef.current) return;

        // Fallback Web Speech API (speechSynthesis) transparent si le serveur n'est pas joignable
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.slice(0, 2000));
            utterance.lang = "fr-FR";
            if (speed) utterance.rate = speed;
            setIsLoading(false);
            setCurrent({ ...nextSegment, url: "web-speech" });
            setIsPlaying(true);
            utterance.onend = () => {
              setIsPlaying(false);
              void advanceQueue();
            };
            utterance.onerror = () => {
              setIsPlaying(false);
              void advanceQueue();
            };
            window.speechSynthesis.speak(utterance);
            return;
          } catch {
            // Erreur Web Speech, on continue vers le toast
          }
        }

        setIsLoading(false);
        NotificationService.showInAppToast(
          "Lecture mAI indisponible",
          err?.message || "La synthèse vocale a échoué (quota ou réseau).",
          "error"
        );
        // Passe au segment suivant en cas d'échec de génération
        void advanceQueue();
      }
    },
    [pushUpcoming, speed]
  );

  const playQueue = useCallback(
    (segments: AudioSegmentRequest[]) => {
      queueRef.current = segments.filter((s) => s?.text?.trim());
      void playNext();
    },
    [playNext]
  );

  const enqueue = useCallback(
    (segments: AudioSegmentRequest[]) => {
      queueRef.current = [
        ...queueRef.current,
        ...segments.filter((s) => s?.text?.trim()),
      ];
      pushUpcoming(queueRef.current);
      if (!current && !isLoading) void playNext();
    },
    [current, isLoading, playNext, pushUpcoming]
  );

  const toggle = useCallback(() => {
    if (
      current?.url === "web-speech" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [current, isPlaying]);

  const next = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    playTokenRef.current += 1;
    void playNext();
  }, [playNext]);

  const prev = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const audio = audioRef.current;
    // Redémarre le segment courant s'il est avancé, sinon segment précédent
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    playTokenRef.current += 1;
    void playNext();
  }, [playNext]);

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(1, fraction)) * audio.duration;
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length] ?? 1;
    setSpeedState(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  }, [speed]);

  const close = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    playTokenRef.current += 1;
    queueRef.current = [];
    pushUpcoming([]);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setCurrent(null);
    setIsPlaying(false);
    setIsLoading(false);
  }, [pushUpcoming]);

  // Applique la vitesse courante à chaque nouveau segment
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [current, speed]);

  const value: AudioPlayerContextValue = {
    close,
    current,
    currentTime,
    cycleSpeed,
    duration,
    enqueue,
    isLoading,
    isPlaying,
    next,
    playQueue,
    prev,
    seek,
    speed,
    toggle,
    upcoming,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {/* Élément audio persistant (survit à la navigation) */}
      <audio
        className="hidden"
        onEnded={() => void playNext()}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        ref={audioRef}
      />
    </AudioPlayerContext.Provider>
  );
};

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx)
    throw new Error(
      "useAudioPlayer doit être utilisé dans AudioPlayerProvider"
    );
  return ctx;
}
