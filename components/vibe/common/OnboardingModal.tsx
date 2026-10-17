/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — ONBOARDING MODAL (src/components/common/OnboardingModal.tsx)
 * Parcours première visite en 3 étapes : (1) thèmes d'intérêt, (2) suivre des
 * comptes suggérés, (3) publier son premier post.
 *
 * Deux règles gouvernent ce fichier, toutes deux payées en bugs une fois :
 * 1. L'échec d'une étape NE FERME PAS la modale. `completeOnboarding` rate la
 *    base ? le drapeau serveur reste faux et la modale se rouvrirait à chaque
 *    visite — la « boucle de bienvenue ». On affiche l'erreur et on réessaie.
 * 2. Tout est peint pour les DEUX thèmes : fond clair par défaut, `vibe-dark:`
 *    pour le sombre (règle d'or n° 2 — Vibe vit sous `.vibe-root`, `dark:`
 *    suivrait le thème de l'hôte).
 * ============================================================================
 */

import {
  AlertCircleIcon as AlertCircle,
  CheckIcon as Check,
  Loader2Icon as Loader2,
  RefreshCwIcon as RefreshCw,
  UserCheckIcon as UserCheck,
  UserPlusIcon as UserPlus,
  XIcon as X,
} from "@mdevs/icons";
import type React from "react";
import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { PostComposer } from "@/components/vibe/feed/PostComposer";
import { INTEREST_SUGGESTIONS, MAX_INTERESTS } from "@/lib/vibe/data/interests";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";

interface OnboardingModalProps {
  /**
   * Fermeture du parcours. `completed: true` quand le drapeau serveur est
   * posé — la coquille s'en sert pour déclencher la visite guidée.
   */
  onDone: (opts?: { completed: boolean }) => void;
}

interface SuggestedUser {
  avatar_url?: string;
  bio?: string;
  display_name?: string;
  followers_count?: number;
  id: number;
  is_verified?: boolean;
  username: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);
    ApiService.getOnboardingSuggestions()
      .then((res) => {
        if (!cancelled) setSuggestions(res?.users || []);
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestionsError("Suggestions indisponibles.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuggestions(false);
      });
    return () => {
      cancelled = true;
    };
    // loadKey : seul moyen de rejouer volontairement (bouton Réessayer) ;
    // `suggestions.length` en dépendance re-déclencherait après le tri du jeu.
  }, [step, loadKey]);

  const toggleInterest = (tag: string) => {
    haptics.light();
    setInterests((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, tag];
    });
  };

  const handleStep1Next = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await ApiService.updateProfile({ interests } as any);
      haptics.success();
      setStep(1);
    } catch (err: any) {
      setError(err?.message || "Sauvegarde impossible, réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async (username: string) => {
    try {
      haptics.light();
      await ApiService.toggleFollow(username);
      setFollowed((prev) => new Set(prev).add(username));
    } catch (err: any) {
      haptics.error();
      setError(err?.message || `Suivi de @${username} impossible.`);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await ApiService.completeOnboarding();
    } catch (err: any) {
      // Ne jamais fermer sur un échec : le drapeau serveur resterait faux et
      // la modale se rejouerait à chaque connexion.
      setError(
        err?.message || "Finalisation impossible — réessayez ou fermez."
      );
      haptics.error();
      setIsSaving(false);
      return;
    }
    haptics.success();
    setIsSaving(false);
    onDone({ completed: true });
  };

  const progressClass = step === 0 ? "w-1/3" : step === 1 ? "w-2/3" : "w-full";

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white vibe-dark:bg-zinc-950 border border-zinc-200 vibe-dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-scaleUp max-h-[92dvh] flex flex-col">
        <div className="p-4 pb-0">
          <div className="h-1.5 rounded-full bg-zinc-200 vibe-dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-black vibe-dark:bg-white transition-all duration-300 ${progressClass}`}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-bold text-black vibe-dark:text-white uppercase font-mono tracking-wider">
              {step === 0
                ? "Étape 1/3 — Vos centres d’intérêt"
                : step === 1
                  ? "Étape 2/3 — Comptes à suivre"
                  : "Étape 3/3 — Premier post"}
            </p>
            <button
              className="p-1 rounded-full text-zinc-500 hover:text-black vibe-dark:hover:text-white transition-colors"
              onClick={handleComplete}
              title="Passer l'onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <p className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 vibe-dark:bg-red-950/40 vibe-dark:border-red-900 vibe-dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          {step === 0 && (
            <>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm text-zinc-600 vibe-dark:text-zinc-300">
                  Choisissez ce qui vous passionne — votre fil « Pour Vous »
                  s'affinera.
                </p>
                <span
                  aria-live="polite"
                  className={`text-[11px] font-mono shrink-0 ${
                    interests.length >= MAX_INTERESTS
                      ? "text-amber-600 vibe-dark:text-amber-400"
                      : "text-zinc-500"
                  }`}
                >
                  {interests.length}/{MAX_INTERESTS}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_SUGGESTIONS.map((tag) => {
                  const active = interests.includes(tag);
                  const canToggle = active || interests.length < MAX_INTERESTS;
                  return (
                    <button
                      aria-pressed={active}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                        active
                          ? "border-transparent text-black"
                          : canToggle
                            ? "border-zinc-300 text-zinc-700 hover:border-zinc-500 vibe-dark:border-zinc-700 vibe-dark:text-zinc-300"
                            : "border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60 vibe-dark:border-zinc-800 vibe-dark:text-zinc-600"
                      }`}
                      disabled={!canToggle}
                      key={tag}
                      onClick={() => toggleInterest(tag)}
                      style={
                        active
                          ? { backgroundColor: "var(--vibe-accent, #ffffff)" }
                          : undefined
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {interests.length >= MAX_INTERESTS && (
                <p className="mt-2 text-[11px] text-amber-600 vibe-dark:text-amber-400">
                  Maximum {MAX_INTERESTS} centres d’intérêt — décochez-en un
                  pour en choisir un autre.
                </p>
              )}
              <button
                className="mt-5 w-full py-2.5 rounded-full bg-black text-white vibe-dark:bg-white vibe-dark:text-black font-bold text-sm hover:opacity-90 vibe-dark:hover:brightness-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                disabled={isSaving}
                onClick={handleStep1Next}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Continuer
                {interests.length > 0 ? ` (${interests.length})` : ""}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-zinc-600 vibe-dark:text-zinc-300 mb-3">
                Suivez des comptes pour remplir votre fil — ou passez.
              </p>
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center gap-2 py-10 text-zinc-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Chargement des suggestions…</span>
                </div>
              ) : suggestionsError ? (
                <div className="py-8 flex flex-col items-center gap-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {suggestionsError}
                  </span>
                  <button
                    className="px-3 py-1.5 rounded-full border border-zinc-300 vibe-dark:border-zinc-700 text-xs font-bold text-black vibe-dark:text-white flex items-center gap-1.5 hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
                    onClick={() => setLoadKey((k) => k + 1)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Réessayer
                  </button>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-3 text-sm text-zinc-500">
                  <p>Aucune suggestion pour le moment.</p>
                  <button
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-black text-white vibe-dark:bg-white vibe-dark:text-black hover:opacity-90 transition-opacity"
                    onClick={() => setStep(2)}
                  >
                    Passer cette étape
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {suggestions.map((u) => {
                    const isFollowed = followed.has(u.username);
                    return (
                      <div
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
                        key={u.id}
                      >
                        <ProfileAvatar
                          alt={u.username}
                          className="border border-zinc-200 vibe-dark:border-zinc-800"
                          fallbackName={u.username}
                          size="sm"
                          src={u.avatar_url}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-black vibe-dark:text-white truncate">
                            {u.display_name || u.username}{" "}
                            <span className="text-zinc-500 font-normal">
                              @{u.username}
                            </span>
                          </p>
                          {u.bio && (
                            <p className="text-[11px] text-zinc-500 truncate">
                              {u.bio}
                            </p>
                          )}
                        </div>
                        <button
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isFollowed
                              ? "text-zinc-500"
                              : "bg-black text-white vibe-dark:bg-white vibe-dark:text-black hover:opacity-90 vibe-dark:hover:brightness-90"
                          }`}
                          disabled={isFollowed}
                          onClick={() => handleFollow(u.username)}
                        >
                          {isFollowed ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          {isFollowed ? "Suivi" : "Suivre"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-full border border-zinc-300 text-zinc-600 font-bold text-sm hover:text-black vibe-dark:border-zinc-700 vibe-dark:text-zinc-300 vibe-dark:hover:text-white transition-all"
                  onClick={() => setStep(2)}
                >
                  Passer
                </button>
                <button
                  className="flex-1 py-2.5 rounded-full bg-black text-white vibe-dark:bg-white vibe-dark:text-black font-bold text-sm hover:opacity-90 vibe-dark:hover:brightness-90 transition-all flex items-center justify-center gap-1.5"
                  onClick={() => setStep(2)}
                >
                  <Check className="w-4 h-4" />
                  Continuer{followed.size > 0 ? ` (${followed.size})` : ""}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <PostComposer
                onPostCreated={() => {}}
                placeholder="Dites bonjour à la communauté !"
              />
              <button
                className="mt-3 w-full py-2.5 rounded-full text-black font-bold text-sm hover:brightness-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                disabled={isSaving}
                onClick={handleComplete}
                style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Terminer et découvrir Vibe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
