"use client";

import {
  FlagIcon,
  FlameIcon,
  GemIcon,
  GraduationCapIcon,
  HeartIcon,
  HomeIcon,
  MapIcon,
  MenuIcon,
  SearchIcon,
  SparklesIcon,
  StoreIcon,
  TrophyIcon,
  UserIcon,
  XIcon,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import useSWR, { preload } from "swr";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import { BarreNiveau } from "@/components/quizzly/niveau";
import {
  COACH_CONVERSATIONS_URL,
  COACH_DONNEES_URL,
} from "@/lib/quizzly/coach-paths";
import {
  delaiProchainCoeur,
  HEART_REGEN_MS,
  HEARTS_MAX,
} from "@/lib/quizzly/rules";
import { useEconomy } from "@/lib/resources/economy";
import { cn, fetcher } from "@/lib/utils";

export type ResumeClient = {
  avatarUrl: string | null;
  dailyGiftClaimed: boolean;
  displayName: string;
  equippedFrame: string | null;
  gems: number;
  giftsReceived?: any[];
  hearts: number;
  heartsUpdatedAt: string;
  league: string;
  leagueShieldWeek: string | null;
  modelId: string | null;
  niveau: number;
  ownedFrames: string[];
  pendingFriends: number;
  schoolYear: string;
  streakBest: number;
  streakCount: number;
  streakFreezes: number;
  streakLastDay: string | null;
  subjects: string[];
  username: string;
  weekKey: string;
  weeklyXp: number;
  xp: number;
  xpBoostUntil: string | null;
  xpDansPalier: number;
  xpPalier: number;
  yearChosen: boolean;
};

const RESUME = "/api/quizzly/resume";

let pluginWidgetQuizzly: {
  updateScore?: (score: Record<string, number>) => Promise<void>;
} | null = null;

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

const LIENS: {
  href: string;
  icone: ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { href: "/quizzly", icone: HomeIcon, label: "Accueil" },
  { href: "/quizzly/apprentissage", icone: MapIcon, label: "Apprentissage" },
  { href: "/quizzly/synthese", icone: GraduationCapIcon, label: "Synthèse" },
  { href: "/quizzly/ligues", icone: TrophyIcon, label: "Ligues" },
  { href: "/quizzly/coach", icone: SparklesIcon, label: "Coach" },
  { href: "/quizzly/quetes", icone: FlagIcon, label: "Quêtes" },
  { href: "/quizzly/boutique", icone: StoreIcon, label: "Boutique" },
  { href: "/quizzly/profil", icone: UserIcon, label: "Profil" },
];

function lienActif(href: string, pathname: string): boolean {
  if (href === "/quizzly") {
    return pathname === "/quizzly";
  }
  if (href === "/quizzly/apprentissage") {
    return (
      pathname === "/quizzly/apprentissage" ||
      pathname.startsWith("/quizzly/parcours") ||
      pathname.startsWith("/quizzly/quiz")
    );
  }
  if (href.startsWith("/settings")) {
    return false;
  }
  return pathname.startsWith(href);
}

function MenuSections({
  etiquettes,
  onNaviguer,
}: {
  etiquettes: boolean;
  onNaviguer?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="flex flex-col gap-1">
      {LIENS.map((lien) => {
        const actif = lienActif(lien.href, pathname);
        const Icone = lien.icone;
        return (
          <Link
            aria-current={actif ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors touch-manipulation",
              actif
                ? "bg-q-level/15 text-q-level"
                : "hover:bg-q-shop/10 hover:text-foreground"
            )}
            href={lien.href}
            key={lien.href}
            onClick={onNaviguer}
            title={lien.label}
          >
            <span className="relative">
              <Icone className="size-5 shrink-0" />
            </span>
            {etiquettes ? (
              <span className="flex flex-1 items-center justify-between gap-2">
                {lien.label}
              </span>
            ) : (
              <span className="sr-only">{lien.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function QuizzlyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, mutate } = useResumeQuizzly();
  const { isTabHidden } = useEconomy();
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [niveauMonte, setNiveauMonte] = useState(false);
  const niveauVu = useRef<number | null>(null);

  useEffect(() => {
    preload(COACH_DONNEES_URL, fetcher);
    preload(COACH_CONVERSATIONS_URL, fetcher);
    router.prefetch("/quizzly/coach");
  }, [router]);

  useEffect(() => {
    if (pathname.length > 0) {
      setMenuOuvert(false);
    }
  }, [pathname]);

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
    if (
      !data ||
      window.Capacitor?.getPlatform?.() !== "android" ||
      !window.Capacitor.registerPlugin
    ) {
      return;
    }
    pluginWidgetQuizzly ??= window.Capacitor.registerPlugin(
      "QuizzlyWidget"
    ) as typeof pluginWidgetQuizzly;
    if (!pluginWidgetQuizzly?.updateScore) return;
    void pluginWidgetQuizzly
      .updateScore({
        niveau: data.niveau,
        streakCount: data.streakCount,
        weeklyXp: data.weeklyXp,
        xp: data.xp,
      })
      .catch(() => undefined);
  }, [data]);

  useEffect(() => {
    if (!data || data.hearts >= HEARTS_MAX) {
      return;
    }
    if (coeursAffiches(data, maintenant) > data.hearts) {
      mutate();
    }
  }, [data, maintenant, mutate]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const precedent = niveauVu.current;
    niveauVu.current = data.niveau;
    if (precedent !== null && data.niveau > precedent) {
      setNiveauMonte(true);
      const minuteur = window.setTimeout(() => setNiveauMonte(false), 1800);
      return () => window.clearTimeout(minuteur);
    }
  }, [data]);

  const coeurs = data ? coeursAffiches(data, maintenant) : 0;
  const aQuizzyVisible =
    pathname === "/quizzly" ||
    pathname.startsWith("/quizzly/quiz") ||
    pathname.startsWith("/quizzly/coach") ||
    pathname.startsWith("/quizzly/parcours");

  return (
    <div
      className={cn(
        "quizzly-root flex h-dvh overflow-hidden text-foreground",
        aQuizzyVisible && "bg-white dark:bg-[#0b1120] [background-image:none]"
      )}
    >
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-q-level/20 bg-q-level/8 px-3 py-4 md:flex">
        <AppSwitcherMenu currentAppOverride="quizzly">
          <button
            className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold"
            type="button"
          >
            <GraduationCapIcon className="size-4 text-q-level" />
            Quizzly
          </button>
        </AppSwitcherMenu>
        <MenuSections etiquettes />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-q-level/20 px-3 py-2.5 sm:gap-3 sm:px-4">
          <button
            aria-label="Ouvrir le menu Quizzly"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-q-level transition-colors hover:bg-q-level/10 active:scale-95 md:hidden"
            onClick={() => setMenuOuvert(true)}
            type="button"
          >
            <MenuIcon className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            {data ? (
              <BarreNiveau
                compact
                niveau={data.niveau}
                xpDansPalier={data.xpDansPalier}
                xpPalier={data.xpPalier}
              />
            ) : (
              <span className="text-xs text-muted-foreground">Niveau</span>
            )}
          </div>
          {niveauMonte && data ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full bg-q-level px-3 py-1 text-xs font-semibold text-q-on"
              initial={{ opacity: 0, y: 6 }}
            >
              Niveau {data.niveau}
            </motion.p>
          ) : null}
          <div className="ml-auto flex items-center gap-3 text-xs font-semibold">
            <button
              className="flex items-center gap-1.5 rounded-full border border-q-level/30 bg-q-level/10 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-q-level/20 cursor-pointer"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-suite-command-bar"))
              }
              title="Barre de commande & Recherche (⌘K)"
              type="button"
            >
              <SearchIcon className="size-3.5 text-q-level" />
              <span className="hidden sm:inline">Rechercher</span>
              <kbd className="rounded bg-q-level/20 px-1 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <span className="inline-flex items-center gap-1">
              <FlameIcon
                className={cn(
                  "size-4",
                  data && data.streakCount > 0
                    ? "q-float text-q-streak"
                    : "text-muted-foreground"
                )}
              />
              {data?.streakCount ?? "–"}
            </span>
            <span className="inline-flex items-center gap-1">
              <GemIcon className="size-4 text-q-gem" />
              {data?.gems ?? "–"}
            </span>
            <span className="inline-flex items-center gap-1">
              <HeartIcon
                className={cn(
                  "size-4",
                  coeurs > 0 ? "text-q-heart" : "text-muted-foreground",
                  coeurs === 1 && "q-float"
                )}
              />
              {data ? coeurs : "–"}
              <span className="text-muted-foreground">/ {HEARTS_MAX}</span>
            </span>
          </div>
        </header>
        <main
          className={cn(
            "min-h-0 flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
            aQuizzyVisible && "bg-white dark:bg-[#0b1120]"
          )}
        >
          {children}
        </main>
      </div>
      <nav
        aria-label="Navigation mobile Quizzly"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-q-level/20 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      >
        {[LIENS[0], LIENS[1], LIENS[3], LIENS[7]].map((lien) => {
          const Icone = lien.icone;
          const actif = lienActif(lien.href, pathname);
          return (
            <Link
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold touch-manipulation active:scale-95",
                actif ? "text-q-level" : "text-muted-foreground"
              )}
              href={lien.href}
              key={lien.href}
              title={lien.label}
            >
              <Icone className="size-5" />
              <span>{lien.label}</span>
            </Link>
          );
        })}
        <button
          aria-expanded={menuOuvert}
          aria-label="Autres sections Quizzly"
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold text-muted-foreground touch-manipulation active:scale-95"
          onClick={() => setMenuOuvert(true)}
          type="button"
        >
          <MenuIcon className="size-5" />
          <span>Plus</span>
        </button>
      </nav>
      {menuOuvert ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-foreground/25"
            onClick={() => setMenuOuvert(false)}
            type="button"
          />
          <aside className="relative z-10 flex h-full w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto border-r border-q-level/20 bg-background px-3 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl">
            <div className="flex items-center justify-between">
              <AppSwitcherMenu currentAppOverride="quizzly">
                <button
                  className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold"
                  type="button"
                >
                  <GraduationCapIcon className="size-4 text-q-level" />
                  Quizzly
                </button>
              </AppSwitcherMenu>
              <button
                aria-label="Fermer le menu"
                className="rounded-xl p-2"
                onClick={() => setMenuOuvert(false)}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <MenuSections etiquettes onNaviguer={() => setMenuOuvert(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
