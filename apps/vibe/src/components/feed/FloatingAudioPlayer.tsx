/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — FLOATING AUDIO PLAYER (src/components/feed/FloatingAudioPlayer.tsx)
 * Mini-lecteur audio flottant mAI : play/pause, progression, file de segments
 * (posts & fils de discussion), vitesse de lecture. Monté dans App.tsx.
 * ============================================================================
 */
import React from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Loader2, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { haptics } from '../../services/haptics';

const formatTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const FloatingAudioPlayer: React.FC = () => {
  const {
    isPlaying,
    isLoading,
    current,
    upcoming,
    currentTime,
    duration,
    speed,
    toggle,
    next,
    prev,
    seek,
    cycleSpeed,
    close,
  } = useAudioPlayer();

  if (!current) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const remaining = upcoming.length;

  return (
    <div
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,420px)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-md p-3 animate-fadeIn">
        {/* Titre + file */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">
              {isLoading ? 'mAI prépare la voix…' : current.title}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
              {remaining > 0 ? ` · +${remaining} segment${remaining > 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button
            onClick={() => {
              haptics.light();
              close();
            }}
            className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors shrink-0"
            title="Fermer le lecteur"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Barre de progression */}
        <div
          className="mt-2 h-1.5 rounded-full bg-zinc-800 cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-150"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>

        {/* Contrôles */}
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            onClick={() => {
              haptics.light();
              prev();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Revenir en arrière"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              haptics.light();
              toggle();
            }}
            disabled={isLoading}
            style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
            className="p-2.5 rounded-full bg-white text-black hover:brightness-90 transition-all disabled:opacity-40"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => {
              haptics.light();
              next();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Segment suivant"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              haptics.light();
              cycleSpeed();
            }}
            className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors font-mono"
            title="Vitesse de lecture"
          >
            ×{speed}
          </button>
        </div>
      </div>
    </div>
  );
};
