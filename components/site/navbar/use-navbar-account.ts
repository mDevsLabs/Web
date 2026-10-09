"use client";

import type { AuthUser } from "@/components/site/auth-provider";
import { useAuth } from "@/components/site/auth-provider";
import { CLOUD_STORAGE_LIMITS } from "@/lib/site/mai-api";

export interface NavbarAccount {
  accountHref: string;
  accountInitials: string | null;
  accountLabel: string;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  storageLimit: number;
  storagePercent: number;
  storageUsed: number;
  user: AuthUser | null;
}

export function useNavbarAccount(): NavbarAccount {
  const { user, isAuthenticated, loading, logout, cloudStorage } = useAuth();
  const storageLimit =
    CLOUD_STORAGE_LIMITS[user?.tier || "Free"] || CLOUD_STORAGE_LIMITS["Free"];
  const storageUsed = cloudStorage?.bytes_used ?? 0;
  const storagePercent =
    cloudStorage?.percent_used ??
    (storageLimit > 0
      ? Math.min(100, Math.round((storageUsed / storageLimit) * 100))
      : 0);

  return {
    accountHref: isAuthenticated ? "/account" : "/account/login",
    accountInitials: isAuthenticated
      ? (user?.username || user?.email || "U").slice(0, 2).toUpperCase()
      : null,
    accountLabel: isAuthenticated ? user?.username || "Compte" : "Compte",
    isAuthenticated,
    loading,
    logout,
    storageLimit,
    storagePercent,
    storageUsed,
    user,
  };
}
