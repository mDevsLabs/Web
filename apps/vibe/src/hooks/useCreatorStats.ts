/**
 * ============================================================================
 * VIBE — HOOK STATS CRÉATEUR (src/hooks/useCreatorStats.ts)
 * Charge creator-stats + visites profil pour une période donnée.
 * Requête parallèle, état loading/error, refetch manuel.
 * ============================================================================
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiService, type CreatorStats, type StatsPeriod } from '../services/api';

interface ProfileViewsData {
  period: string;
  total: number;
  series: Array<{ day: string; views: number }>;
}

interface UseCreatorStatsResult {
  stats: CreatorStats | null;
  profileViews: ProfileViewsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCreatorStats(period: StatsPeriod): UseCreatorStatsResult {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([ApiService.getCreatorStats(period), ApiService.getProfileViews(period)])
      .then(([s, pv]) => {
        if (cancelled) return;
        setStats(s);
        setProfileViews(pv);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Impossible de charger les statistiques.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, nonce]);

  return { stats, profileViews, loading, error, refetch };
}
