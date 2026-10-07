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
import {
  clearSession,
  getSession,
  type MaiSession,
  setSession,
} from "@/lib/site/auth-storage";
import {
  login as apiLogin,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  uploadAvatar as apiUploadAvatar,
  verifyCode as apiVerifyCode,
  getCloudStorage,
  getUsage,
  type MaiCloudStorageUsage,
  type MaiUsage,
} from "@/lib/site/mai-api";

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
  token: string | null;
  usage: MaiUsage | null;
  cloudStorage: MaiCloudStorageUsage | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (emailOrId: string, password: string) => Promise<any>;
  verifyLogin: (email: string, code: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<any>;
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

function sessionToUser(
  session: MaiSession,
  usage?: MaiUsage | null
): AuthUser | null {
  const email = usage?.email || session.email;
  const username = usage?.username || session.username;
  const phone = usage?.phone;
  const tier = usage?.tier || session.tier || "Free";
  const avatarUrl = usage?.avatarUrl;
  if (!email || !username) return null;
  return { avatarUrl, email, phone, tier, username };
}

export function AuthProvider({
  children,
  initialToken = null,
  initialUser = null,
}: {
  children: ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [usage, setUsage] = useState<MaiUsage | null>(null);
  const [cloudStorage, setCloudStorage] = useState<MaiCloudStorageUsage | null>(
    null
  );
  const [loading, setLoading] = useState(!initialToken);

  const applyUsage = useCallback((tok: string, data: MaiUsage) => {
    setUsage(data);
    setUser({
      avatarUrl: data.avatarUrl,
      email: data.email,
      phone: data.phone,
      tier: data.tier,
      username: data.username,
    });
    setSession({
      email: data.email,
      tier: data.tier,
      token: tok,
      username: data.username,
    });
  }, []);

  const refreshCloudStorage =
    useCallback(async (): Promise<MaiCloudStorageUsage | null> => {
      const session = getSession();
      const tok = session?.token || token;
      if (!tok) {
        setCloudStorage(null);
        return null;
      }
      try {
        const storageData = await getCloudStorage(tok);
        setCloudStorage(storageData);
        return storageData;
      } catch {
        return null;
      }
    }, [token]);

  const refreshUsage = useCallback(async (): Promise<MaiUsage | null> => {
    const session = getSession();
    const tok = session?.token || token;
    if (!tok) {
      setUsage(null);
      setCloudStorage(null);
      return null;
    }
    try {
      const [data, storageData] = await Promise.all([
        getUsage(tok),
        getCloudStorage(tok).catch(() => null),
      ]);
      applyUsage(tok, data);
      if (storageData) setCloudStorage(storageData);
      return data;
    } catch {
      clearSession();
      setToken(null);
      setUser(null);
      setUsage(null);
      setCloudStorage(null);
      return null;
    }
  }, [applyUsage, token]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const session = getSession();
      const effectiveToken = session?.token || initialToken;
      if (!effectiveToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      setToken(effectiveToken);
      const partial = session ? sessionToUser(session) : initialUser;
      if (partial) setUser(partial);

      try {
        const [data, storageData] = await Promise.all([
          getUsage(effectiveToken),
          getCloudStorage(effectiveToken).catch(() => null),
        ]);
        if (cancelled) return;
        applyUsage(effectiveToken, data);
        if (storageData) setCloudStorage(storageData);
      } catch {
        if (cancelled) return;
        clearSession();
        setToken(null);
        setUser(null);
        setUsage(null);
        setCloudStorage(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyUsage, initialUser, initialToken]);

  const login = useCallback(
    async (emailOrId: string, password: string) =>
      await apiLogin({ email: emailOrId, identifier: emailOrId, password }),
    []
  );

  const verifyLogin = useCallback(
    async (email: string, code: string) => {
      const res = await import("@/lib/site/mai-api").then((m) =>
        m.verifyLogin({ code, email })
      );
      if (!res.token) throw new Error("Token manquant dans la réponse.");
      setToken(res.token);
      setSession({ tier: res.tier, token: res.token });
      const [data, storageData] = await Promise.all([
        getUsage(res.token),
        getCloudStorage(res.token).catch(() => null),
      ]);
      applyUsage(res.token, data);
      if (storageData) setCloudStorage(storageData);
    },
    [applyUsage]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) =>
      await apiRegister({ email, password, username }),
    []
  );

  const verifyRegister = useCallback(
    async (email: string, username: string, password: string, code: string) => {
      const res = await import("@/lib/site/mai-api").then((m) =>
        m.verifyRegister({ code, email, password, username })
      );
      if (!res.token) throw new Error("Token manquant dans la réponse.");
      setToken(res.token);
      setSession({
        email,
        tier: res.tier,
        token: res.token,
        username,
      });
      const [data, storageData] = await Promise.all([
        getUsage(res.token),
        getCloudStorage(res.token).catch(() => null),
      ]);
      applyUsage(res.token, data);
      if (storageData) setCloudStorage(storageData);
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
    [applyUsage]
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setUsage(null);
    setCloudStorage(null);
  }, []);

  const verifyUpgradeCode = useCallback(
    async (code: string) => {
      if (!token) throw new Error("Non authentifié.");
      const res = await apiVerifyCode(token, code);
      if (!res.token) throw new Error("Token manquant dans la réponse.");
      setToken(res.token);
      const [data, storageData] = await Promise.all([
        getUsage(res.token),
        getCloudStorage(res.token).catch(() => null),
      ]);
      applyUsage(res.token, data);
      if (storageData) setCloudStorage(storageData);
      return res.tier || "Free";
    },
    [applyUsage, token]
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
      if (!token) throw new Error("Non authentifié.");
      const res = await apiUpdateProfile(token, params);
      if (res.error) throw new Error(res.error);
      const data = await getUsage(token);
      applyUsage(token, data);
    },
    [applyUsage, token]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!token) throw new Error("Non authentifié.");
      const res = await apiUploadAvatar(token, file);
      if (res.error) throw new Error(res.error);
      const data = await getUsage(token);
      applyUsage(token, data);
    },
    [applyUsage, token]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      cloudStorage,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
      refreshCloudStorage,
      refreshUsage,
      register,
      token,
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
      token,
      usage,
      cloudStorage,
      loading,
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
