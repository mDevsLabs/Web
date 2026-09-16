"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/utils";

export type ProjectLite = {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultModel?: string | null;
  chatCount?: number;
  // Projets partagés : rôle de l'utilisateur courant ("owner" par défaut pour
  // les projets créés avant la migration, la ligne owner est implicite).
  role?: "member" | "owner";
  memberCount?: number;
};

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{
    projects: ProjectLite[];
  }>("/api/projects", fetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: true,
  });
  return {
    error,
    isLoading,
    mutate,
    projects: data?.projects ?? [],
  };
}
