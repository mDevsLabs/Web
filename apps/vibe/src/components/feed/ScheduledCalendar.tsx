/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SCHEDULED CALENDAR (src/components/feed/ScheduledCalendar.tsx)
 * Vue calendrier mensuelle des posts programmés (status='scheduled'),
 * glisser-déposer natif pour replanifier, navigation mois précédent/suivant.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, CalendarClock } from 'lucide-react';
import { ApiService } from '../../services/api';
import type { Post } from '../../types/vibe';
import { haptics } from '../../services/haptics';
import { makeExcerpt } from '../common/richTextUtils';

const toLocalInputValue = (iso: string): string => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export const ScheduledCalendar: React.FC = () => {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragPostId, setDragPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.getScheduledPosts();
      setPosts(res?.posts || []);
    } catch (err: any) {
      setError(err?.message || 'Chargement impossible.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 })),
  ];

  const postsByDay = new Map<number, Post[]>();
  for (const p of posts) {
    if (!p.scheduled_at) continue;
    const d = new Date(p.scheduled_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const list = postsByDay.get(d.getDate()) || [];
    list.push(p);
    postsByDay.set(d.getDate(), list);
  }

  const handleDrop = async (day: number) => {
    if (!dragPostId) return;
    const post = posts.find((p) => String(p.id) === String(dragPostId));
    setDragPostId(null);
    if (!post?.scheduled_at) return;
    const old = new Date(post.scheduled_at);
    const next = new Date(year, month, day, old.getHours(), old.getMinutes());
    if (next.getTime() <= Date.now()) {
      setError('La nouvelle date doit être dans le futur.');
      return;
    }
    try {
      haptics.medium();
      await ApiService.reschedulePost(String(post.id), next.toISOString());
      haptics.success();
      fetchScheduled();
      window.dispatchEvent(new CustomEvent('vibe:post_updated'));
    } catch (err: any) {
      haptics.error();
      setError(err?.message || 'Replanification impossible.');
    }
  };

  const monthLabel = monthCursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-white capitalize flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-zinc-400" />
          {monthLabel}
        </p>
        <button
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-900 text-xs text-red-300">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-zinc-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement du calendrier…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-zinc-600 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} className="min-h-16 rounded-xl" />;
              const dayPosts = postsByDay.get(cell.day) || [];
              return (
                <div
                  key={`${year}-${month}-${cell.day}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(cell.day)}
                  className="min-h-16 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors p-1"
                >
                  <p className="text-[10px] font-mono text-zinc-500 px-0.5">{cell.day}</p>
                  <div className="space-y-1 mt-0.5">
                    {dayPosts.map((p) => (
                      <button
                        key={p.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDragPostId(String(p.id));
                        }}
                        title={`${makeExcerpt(p.content, 120)} — ${p.scheduled_at ? toLocalInputValue(p.scheduled_at).slice(11) : ''} (glisser pour replanifier)`}
                        className="w-full text-left px-1 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <span className="block text-[10px] text-zinc-200 truncate">
                          {makeExcerpt(p.content, 30) || '(sans texte)'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {posts.length === 0 && (
            <p className="mt-4 text-center text-xs text-zinc-600">
              Aucun post programmé — planifiez une vibe depuis le composer (Plus · Pro · Max).
            </p>
          )}
        </>
      )}
    </div>
  );
};
