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
};

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{
    projects: ProjectLite[];
  }>("/api/projects", fetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  });
  return {
    error,
    isLoading,
    mutate,
    projects: data?.projects ?? [],
  };
}
