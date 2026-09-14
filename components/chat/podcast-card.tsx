"use client";

import {
  AudioLinesIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PodcastSegment = {
  audio_url?: string;
  error?: string;
  speaker: "host" | "expert";
  text: string;
  voice?: string;
};

type PodcastOutput = {
  completedSegments?: number;
  error?: string;
  expertVoice?: string;
  hostVoice?: string;
  id?: string;
  segments?: PodcastSegment[];
  title?: string;
  totalSegments?: number;
};

const SPEAKER_LABEL: Record<PodcastSegment["speaker"], string> = {
  expert: "Experte",
  host: "Animateur",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PodcastCard({
  output,
  state,
}: {
  output?: PodcastOutput;
  state?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoStart, setAutoStart] = useState(false);

  const playable = (output?.segments ?? []).filter(
    (s) => s.audio_url && !s.error
  );
  const current = playable[segmentIndex];
  const isGenerating = state !== "output-available";
  const total = output?.totalSegments ?? playable.length;
  const completed = output?.completedSegments ?? playable.length;

  const playSegment = useCallback((index: number, autoplay = true) => {
    setSegmentIndex(index);
    setCurrentTime(0);
    setAutoStart(autoplay);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) {
      return;
    }
    audio.src = current.audio_url as string;
    audio.load();
    if (autoStart) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: recharger uniquement au changement de segment ; autoStart pilote seulement la lecture
  }, [segmentIndex, current?.audio_url]);

  const handleEnded = useCallback(() => {
    if (segmentIndex < playable.length - 1) {
      playSegment(segmentIndex + 1, true);
    } else {
      setIsPlaying(false);
    }
  }, [segmentIndex, playable.length, playSegment]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) {
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  if (isGenerating) {
    return (
      <div className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Loader2Icon className="size-3.5 animate-spin" />
        Enregistrement du podcast…
        {total > 0 && ` (${completed}/${total} segments)`}
      </div>
    );
  }

  if (output?.error) {
    return (
      <div className="w-[min(100%,450px)] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
        {output.error}
      </div>
    );
  }

  if (playable.length === 0) {
    return null;
  }

  const progress =
    playable.length > 0 ? ((segmentIndex + 1) / playable.length) * 100 : 0;

  return (
    <div className="w-[min(100%,480px)] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card to-muted/60 shadow-md">
      <audio
        onEnded={handleEnded}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
      />

      {/* En-tête rétro */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-gradient-to-r from-amber-500/10 via-transparent to-rose-500/10 px-4 py-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full bg-foreground text-background",
            isPlaying && "animate-pulse"
          )}
        >
          <AudioLinesIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold tracking-tight">
            {output?.title ?? "Podcast mAI"}
          </p>
          <p className="text-[10.5px] text-muted-foreground">
            Débat mAI · 2 voix ·{" "}
            {playable.length === output?.segments?.length
              ? `${playable.length} segments`
              : `${playable.length}/${output?.segments?.length} segments valides`}
          </p>
        </div>
      </div>

      {/* Onde + progression */}
      <div className="space-y-3 px-4 py-3">
        <div aria-hidden className="flex items-end justify-between gap-0.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                isPlaying
                  ? "animate-pulse bg-gradient-to-t from-amber-500 to-rose-500"
                  : "bg-muted-foreground/30"
              )}
              key={i}
              style={{
                animationDelay: `${(i % 7) * 120}ms`,
                height: isPlaying
                  ? `${8 + ((i * 7 + Math.round(currentTime * 10)) % 18)}px`
                  : "6px",
              }}
            />
          ))}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Sous-titre synchronisé */}
        {current ? (
          <div className="rounded-xl border border-border/40 bg-background/70 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                  current.speaker === "host"
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    : "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400"
                )}
              >
                {SPEAKER_LABEL[current.speaker]}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {formatTime(currentTime)}
                {duration > 0 ? ` / ${formatTime(duration)}` : ""}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/90">
              {current.text}
            </p>
          </div>
        ) : null}

        {/* Contrôles */}
        <div className="flex items-center justify-center gap-3">
          <button
            aria-label="Segment précédent"
            className="rounded-full border border-border/50 p-2 hover:bg-muted disabled:opacity-40"
            disabled={segmentIndex === 0}
            onClick={() =>
              playSegment(Math.max(0, segmentIndex - 1), isPlaying || autoStart)
            }
            type="button"
          >
            <SkipBackIcon className="size-3.5" />
          </button>
          <button
            aria-label={isPlaying ? "Pause" : "Lecture"}
            className="flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={togglePlay}
            type="button"
          >
            {isPlaying ? (
              <PauseIcon className="size-5" />
            ) : (
              <PlayIcon className="size-5 translate-x-0.5" />
            )}
          </button>
          <button
            aria-label="Segment suivant"
            className="rounded-full border border-border/50 p-2 hover:bg-muted disabled:opacity-40"
            disabled={segmentIndex >= playable.length - 1}
            onClick={() =>
              playSegment(Math.min(playable.length - 1, segmentIndex + 1), true)
            }
            type="button"
          >
            <SkipForwardIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Transcription repliable */}
      <details className="border-t border-border/40 px-4 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
          Transcription complète
        </summary>
        <div className="mt-2 space-y-2">
          {playable.map((seg, i) => (
            <button
              className={cn(
                "block w-full rounded-lg px-2 py-1.5 text-left text-[11.5px] leading-relaxed hover:bg-muted/60",
                i === segmentIndex && "bg-muted/80"
              )}
              key={i}
              onClick={() => playSegment(i, true)}
              type="button"
            >
              <span
                className={cn(
                  "mr-1.5 font-bold",
                  seg.speaker === "host"
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-fuchsia-600 dark:text-fuchsia-400"
                )}
              >
                {SPEAKER_LABEL[seg.speaker]} :
              </span>
              {seg.text}
            </button>
          ))}
          {(output?.segments ?? [])
            .filter((s) => s.error)
            .map((seg, i) => (
              <p
                className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-600"
                key={`err-${i}`}
              >
                Segment non synthétisé : {seg.error}
              </p>
            ))}
        </div>
      </details>
    </div>
  );
}
