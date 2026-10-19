/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — AUTH CONTEXT (src/context/AuthContext.tsx)
 * User session, JWT lifecycle & Quotas provider
 * ============================================================================
 */

import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ApiService } from "@/lib/vibe/services/api";
import { RealtimeService } from "@/lib/vibe/services/realtimeService";
import type {
  MAIQuotas,
  Profile,
  User,
  VibeSessionHydration,
} from "@/lib/vibe/types/vibe";

interface AuthContextType {
  dismissOnboarding: () => void;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  profile: Profile | null;
  quotas: MAIQuotas | null;
  refreshProfile: () => Promise<void>;
  refreshQuotas: () => Promise<void>;
  restartOnboarding: () => void;
  showOnboarding: boolean;
  token: string | null;
  updateUser: (partial: Partial<User>) => void;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  /**
   * Session lue en base par le layout `/vibe` (voir lib/vibe/server). Quand
   * `me` est présent, le premier écran n'a plus besoin de `GET /v1/me` ni de
   * `GET /v1/settings` : les appels API ne restent que le chemin de repli et
   * de rafraîchissement.
   */
  initialSession?: VibeSessionHydration | null;
  initialToken?: string | null;
}> = ({ children, initialSession, initialToken }) => {
  const seedMe = initialSession?.me ?? null;
  const seedSettings = initialSession?.settings ?? null;
  const [token, setToken] = useState<string | null>(() => {
    if (initialToken !== undefined) {
      return initialToken;
    }
    return ApiService.getToken();
  });
  const [user, setUser] = useState<User | null>(() => seedMe?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(
    () => seedMe?.profile ?? null
  );
  const [quotas, setQuotas] = useState<MAIQuotas | null>(
    () => seedMe?.quotas ?? null
  );
  const [isLoadingSession, setIsLoadingSession] = useState(() => {
    if (seedMe) {
      return false;
    }
    if (initialToken !== undefined) {
      return Boolean(initialToken);
    }
    return Boolean(ApiService.getToken());
  });
  // Un nouvel utilisateur n'a aucune ligne `user_settings` : la comparaison
  // historique `=== false` lui cachait l'onboarding (undefined ≠ false). Le
  // seul état qui le ferme, c'est `true`.
  const [showOnboarding, setShowOnboarding] = useState(
    () => Boolean(seedMe) && seedSettings?.onboarding_completed !== true
  );
  const hydratedRef = useRef(Boolean(seedMe));
  const settingsKnownRef = useRef(Boolean(seedSettings));

  /** Après session établie : ouvre l'onboarding si jamais terminé (getSettings séparé). */
  const checkOnboarding = async (expectedToken: string) => {
    try {
      const res = await ApiService.getSettings();
      if (ApiService.getToken() !== expectedToken) return;
      settingsKnownRef.current = true;
      if (res?.settings && res.settings.onboarding_completed !== true) {
        setShowOnboarding(true);
      }
    } catch {}
  };

  const dismissOnboarding = () => setShowOnboarding(false);

  /** Rejoue l'intro 3 étapes sans toucher au flag serveur (refermable à tout moment). */
  const restartOnboarding = () => setShowOnboarding(true);

  /**
   * Frontière de session : ferme SSE avant de supprimer le JWT et purge les
   * données offline via ApiService.removeToken(). TEST: logout => aucun retry
   * realtime avec l'ancien token et aucun snapshot de feed lisible ensuite.
   */
  const clearLocalSession = () => {
    const token = ApiService.getToken();
    RealtimeService.reset();
    if (token) void ApiService.revokeSession(token);
    ApiService.removeToken();
    setToken(null);
    setUser(null);
    setProfile(null);
    setQuotas(null);
    setShowOnboarding(false);
    setIsLoadingSession(false);
    hydratedRef.current = false;
    settingsKnownRef.current = false;
  };

  const fetchSession = async (force = false) => {
    const currentToken = ApiService.getToken();
    if (!currentToken) {
      setIsLoadingSession(false);
      return;
    }

    if (!force && hydratedRef.current) {
      // Le premier écran vient du serveur : `GET /v1/me` serait exactement la
      // requête qu'on supprime. Il ne reste à vérifier que l'onboarding si le
      // seed de réglages manque.
      if (!settingsKnownRef.current) {
        void checkOnboarding(currentToken);
      }
      setIsLoadingSession(false);
      return;
    }

    try {
      const data = await ApiService.getCurrentUser();
      // Une réponse de l'ancienne session ne doit pas réécrire l'UI après un logout.
      if (ApiService.getToken() !== currentToken) return;
      setUser(data.user);
      setProfile(data.profile);
      setQuotas(data.quotas);
      hydratedRef.current = true;
      checkOnboarding(currentToken);
    } catch (err: any) {
      // On ne déconnecte que sur une vraie invalidation (401) de la session courante.
      // Une erreur réseau ou un 500 ponctuel ne doit pas détruire la session.
      if (err?.status === 401 && ApiService.getToken() === currentToken) {
        console.warn(
          "[AuthContext] Session expirée ou non autorisée:",
          err.message
        );
        clearLocalSession();
      } else {
        console.warn(
          "[AuthContext] Erreur transitoire de session (session conservée):",
          err?.message
        );
      }
      throw err;
    } finally {
      setIsLoadingSession(false);
    }
  };

  const refreshQuotas = async () => {
    try {
      const q = await ApiService.getMAIQuotas();
      setQuotas(q);
    } catch {}
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const refreshProfile = async () => {
    try {
      // Passer par /me (JWT) évite tout problème de username périmé après renommage
      const data = await ApiService.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
      setQuotas(data.quotas);
    } catch {}
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    try {
      await ApiService.updateAvatar(avatarUrl);
      setUser((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
      setProfile((prev) => (prev ? { ...prev, avatarUrl } : null));
    } catch (err: any) {
      throw new Error(
        err.message || "Erreur lors de la mise à jour de l’avatar."
      );
    }
  };

  const loginWithToken = async (newToken: string) => {
    ApiService.setToken(newToken);
    setToken(newToken);
    setIsLoadingSession(true);
    // Jeton neuf (connexion, reprise après expiration) : le seed du serveur
    // ne le concerne pas, on recharge la session depuis l'API.
    await fetchSession(true);
  };

  const logout = () => {
    clearLocalSession();
  };

  // Bootstrap de session : un seul chargement au montage. Les changements de
  // jeton passent par `loginWithToken`, qui rappelle `fetchSession` lui-même.
  // biome-ignore lint/correctness/useExhaustiveDependencies: chargement de session au montage, par contrat.
  useEffect(() => {
    if (initialToken && ApiService.getToken() !== initialToken) {
      ApiService.setToken(initialToken);
    }
    fetchSession().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        dismissOnboarding,
        isAuthenticated: !!user && !!token,
        isLoadingSession,
        loginWithToken,
        logout,
        profile,
        quotas,
        refreshProfile,
        refreshQuotas,
        restartOnboarding,
        showOnboarding,
        token,
        updateUser,
        updateUserAvatar,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
