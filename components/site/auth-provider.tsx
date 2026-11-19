"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { purgeLegacyAuthStorage } from "@/lib/site/auth-storage";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  uploadAvatar as apiUploadAvatar,
  verifyCode as apiVerifyCode,
  verifyLogin as apiVerifyLogin,
  verifyRegister as apiVerifyRegister,
  getCloudStorage,
  getUsage,
  MaiApiError,
  type MaiAuthResponse,
  type MaiCloudStorageUsage,
  type MaiUsage,
} from "@/lib/site/mai-api";

// Issue #10 : le jeton de session ne quitte jamais le serveur. Il n'est ni
// dans `localStorage`, ni dans un cookie lisible, ni dans les props ou l'état
// React — les appels passent par le relais BFF, qui lit le cookie httpOnly.

export type AuthUser = {
  id?: string | number;
  email: string;
  username: string;
  phone?: string;
  tier: string;
  avatarUrl?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  usage: MaiUsage | null;
  cloudStorage: MaiCloudStorageUsage | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (emailOrId: string, password: string) => Promise<MaiAuthResponse>;
  verifyLogin: (email: string, code: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string
  ) => Promise<MaiAuthResponse>;
  verifyRegister: (
    email: string,
    username: string,
    password: string,
    code: string
  ) => Promise<void>;
  logout: () => void;
  refreshUsage: () => Promise<MaiUsage | null>;
  refreshCloudStorage: () => Promise<MaiCloudStorageUsage | null>;
  verifyUpgradeCode: (code: string) => Promise<string>;
  updateProfile: (params: {
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    currentPassword?: string;
    newsletter?: boolean;
    notify_limits?: boolean;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [usage, setUsage] = useState<MaiUsage | null>(null);
  const [cloudStorage, setCloudStorage] = useState<MaiCloudStorageUsage | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(Boolean(initialUser));

  const applyUsage = useCallback((data: MaiUsage) => {
    setUsage(data);
    setUser({
      avatarUrl: data.avatarUrl,
      email: data.email,
      phone: data.phone,
      tier: data.tier,
      username: data.username,
    });
    setAuthenticated(true);
  }, []);

  const dropSession = useCallback(() => {
    setAuthenticated(false);
    setUser(null);
    setUsage(null);
    setCloudStorage(null);
  }, []);

  const refreshCloudStorage =
    useCallback(async (): Promise<MaiCloudStorageUsage | null> => {
      try {
        const storageData = await getCloudStorage();
        setCloudStorage(storageData);
        return storageData;
      } catch {
        return null;
      }
    }, []);

  const refreshUsage = useCallback(async (): Promise<MaiUsage | null> => {
    try {
      const [data, storageData] = await Promise.all([
        getUsage(),
        getCloudStorage().catch(() => null),
      ]);
      applyUsage(data);
      if (storageData) setCloudStorage(storageData);
      return data;
    } catch (error) {
      // Une coupure réseau conserve la session ; seul un refus
      // d'authentification la retire (et efface le cookie côté serveur).
      if (error instanceof MaiApiError && [401, 403].includes(error.status)) {
        dropSession();
        void apiLogout().catch(() => undefined);
      }
      return null;
    }
  }, [applyUsage, dropSession]);

  useEffect(() => {
    // À chaque visite : les anciennes clés lisibles (localStorage + cookies)
    // sont effacées (issue #10).
    purgeLegacyAuthStorage();

    let cancelled = false;

    async function hydrate() {
      if (!initialUser) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const [data, storageData] = await Promise.all([
          getUsage(),
          getCloudStorage().catch(() => null),
        ]);
        if (cancelled) return;
        applyUsage(data);
        if (storageData) setCloudStorage(storageData);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof MaiApiError && [401, 403].includes(error.status)) {
          dropSession();
          void apiLogout().catch(() => undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyUsage, dropSession, initialUser]);

  const login = useCallback(
    async (emailOrId: string, password: string) =>
      await apiLogin({ email: emailOrId, identifier: emailOrId, password }),
    []
  );

  const verifyLogin = useCallback(
    async (email: string, code: string) => {
      // Le relais pose le cookie httpOnly : aucun jeton à stocker ici.
      const res = await apiVerifyLogin({ code, email });
      if (!res.success) {
        throw new Error("Connexion impossible : code invalide ou expiré.");
      }
      setAuthenticated(true);
      await refreshUsage();
    },
    [refreshUsage]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) =>
      await apiRegister({ email, password, username }),
    []
  );

  const verifyRegister = useCallback(
    async (email: string, username: string, password: string, code: string) => {
      const res = await apiVerifyRegister({
        code,
        email,
        password,
        username,
      });
      if (!res.success) {
        throw new Error("Inscription impossible : code invalide ou expiré.");
      }
      setAuthenticated(true);
      await refreshUsage();
      // ── Onboarding principal : forcer tuto après 1ère inscription (localStorage only) ──
      try {
        const { initMainIfMissing } = await import(
          "@/lib/site/onboarding-storage"
        );
        initMainIfMissing();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mai:onboarding:open", {
              detail: { flow: "main" },
            } as unknown as Event)
          );
        }
      } catch {}
    },
    [refreshUsage]
  );

  const logout = useCallback(() => {
    // Le relais efface le cookie httpOnly ; l'état local est purgé quoi qu'il
    // arrive (une panne réseau ne doit pas laisser une session fantôme).
    void apiLogout().catch(() => undefined);
    dropSession();
  }, [dropSession]);

  const verifyUpgradeCode = useCallback(
    async (code: string) => {
      const res = await apiVerifyCode(code);
      if (!res.success) {
        throw new Error("Code d'upgrade invalide.");
      }
      await refreshUsage();
      return res.tier || "Free";
    },
    [refreshUsage]
  );

  const updateProfile = useCallback(
    async (params: {
      username?: string;
      email?: string;
      phone?: string;
      password?: string;
      currentPassword?: string;
      newsletter?: boolean;
      notify_limits?: boolean;
    }) => {
      const res = await apiUpdateProfile(params);
      if (res.error) throw new Error(res.error);
      await refreshUsage();
    },
    [refreshUsage]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const res = await apiUploadAvatar(file);
      if (res.error) throw new Error(res.error);
      await refreshUsage();
    },
    [refreshUsage]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      cloudStorage,
      isAuthenticated: authenticated && !!user,
      loading,
      login,
      logout,
      refreshCloudStorage,
      refreshUsage,
      register,
      updateProfile,
      uploadAvatar,
      usage,
      user,
      verifyLogin,
      verifyRegister,
      verifyUpgradeCode,
    }),
    [
      user,
      usage,
      cloudStorage,
      loading,
      authenticated,
      login,
      verifyLogin,
      register,
      verifyRegister,
      logout,
      refreshUsage,
      refreshCloudStorage,
      verifyUpgradeCode,
      updateProfile,
      uploadAvatar,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
