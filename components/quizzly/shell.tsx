"use client";

import { FlameIcon, GemIcon, GraduationCapIcon, HeartIcon } from "@mdevs/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import {
  delaiProchainCoeur,
  HEART_REGEN_MS,
  HEARTS_MAX,
} from "@/lib/quizzly/rules";
import { useEconomy } from "@/lib/resources/economy";
import { cn, fetcher } from "@/lib/utils";

export type ResumeClient = {
  avatarUrl: string | null;
  displayName: string;
  equippedFrame: string | null;
  gems: number;
  hearts: number;
  heartsUpdatedAt: string;
  modelId: string | null;
  ownedFrames: string[];
  schoolYear: string;
  streakCount: number;
  streakFreezes: number;
  username: string;
  xp: number;
  yearChosen: boolean;
};

const RESUME = "/api/quizzly/resume";

export function useResumeQuizzly() {
  return useSWR<ResumeClient>(RESUME, fetcher, {
    dedupingInterval: 5000,
    revalidateOnFocus: true,
  });
}

function coeursAffiches(resume: ResumeClient, maintenant: number): number {
  if (resume.hearts >= HEARTS_MAX) {
    return HEARTS_MAX;
  }
  const ecoule = maintenant - Date.parse(resume.heartsUpdatedAt);
  if (ecoule < HEART_REGEN_MS) {
    return resume.hearts;
  }
  return Math.min(
    HEARTS_MAX,
    resume.hearts + Math.floor(ecoule / HEART_REGEN_MS)
  );
}

const LIENS = [
  { href: "/quizzly", label: "Parcours" },
  { href: "/quizzly/coach", label: "Coach" },
  { href: "/quizzly/quetes", label: "Quêtes" },
  { href: "/quizzly/boutique", label: "Boutique" },
  { href: "/settings?tab=applications#quizzly", label: "Profil" },
] as const;

export function QuizzlyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, mutate } = useResumeQuizzly();
  const { isTabHidden } = useEconomy();
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!isTabHidden) {
      setMaintenant(Date.now());
    }
  }, [isTabHidden]);

  useEffect(() => {
    if (!data || isTabHidden) {
      return;
    }
    const delai = delaiProchainCoeur(
      data.hearts,
      Date.parse(data.heartsUpdatedAt),
      Date.now()
    );
    if (delai === null) {
      return;
    }
    const minuteur = window.setTimeout(() => setMaintenant(Date.now()), delai);
    return () => window.clearTimeout(minuteur);
  }, [data, isTabHidden]);

  useEffect(() => {
    if (!data || data.hearts >= HEARTS_MAX) {
      return;
    }
    if (coeursAffiches(data, maintenant) > data.hearts) {
      mutate();
    }
  }, [data, maintenant, mutate]);

  const coeurs = data ? coeursAffiches(data, maintenant) : 0;

  return (
    <div className="quizzly-root flex h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <AppSwitcherMenu currentAppOverride="quizzly">
          <button
            className="flex items-center gap-2 rounded-full px-1 py-1 text-sm font-semibold"
            type="button"
          >
            <GraduationCapIcon className="size-4" />
            Quizzly
          </button>
        </AppSwitcherMenu>
        <nav className="flex flex-wrap gap-1.5">
          {LIENS.map((lien) => {
            const actif =
              lien.href === "/quizzly"
                ? pathname === "/quizzly" ||
                  pathname.startsWith("/quizzly/quiz")
                : pathname.startsWith(lien.href);
            return (
              <Link
                className="chip"
                data-active={actif ? "true" : "false"}
                href={lien.href}
                key={lien.href}
              >
                {lien.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1">
            <FlameIcon
              className={cn(
                "size-4",
                data && data.streakCount > 0
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            />
            {data?.streakCount ?? "–"}
          </span>
          <span className="inline-flex items-center gap-1">
            <GemIcon className="size-4 text-info" />
            {data?.gems ?? "–"}
          </span>
          <span className="inline-flex items-center gap-1">
            <HeartIcon
              className={cn(
                "size-4",
                coeurs > 0 ? "text-destructive" : "text-muted-foreground"
              )}
            />
            {data ? coeurs : "–"}
            <span className="text-muted-foreground">/ {HEARTS_MAX}</span>
          </span>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
