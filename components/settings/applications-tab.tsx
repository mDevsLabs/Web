"use client";

import {
  BotIcon,
  CrosshairIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BlacklineSettingsSection } from "@/components/blackline/blackline-settings-section";
import { PagesSettingsSection } from "@/components/settings/applications/pages-section";
import { SearchSettingsSection } from "@/components/settings/applications/search-section";
import { VibeSettingsSection } from "@/components/settings/applications/vibe-section";
import { WakiesSettingsSection } from "@/components/settings/applications/wakies-section";
import { useTier } from "@/hooks/use-tier";
import { getTierSearchResultsMax } from "@/lib/plans/tier-limits";
import { fetcher } from "@/lib/utils";

export function ApplicationsTab() {
  const { data: userPrefData, mutate: mutateUserPref } = useSWR(
    "/api/user/preferences",
    fetcher,
    { dedupingInterval: 15_000 }
  );

  const { data: audioModelsData } = useSWR("/api/models/speech", fetcher, {
    dedupingInterval: 60_000,
  });

  const [unifiedModel, setUnifiedModel] = useState<string>("mai-2-mini");
  const [unifiedVoice, setUnifiedVoice] = useState<string>("");

  const { normalized: searchTier } = useTier();
  const searchResultsMax = getTierSearchResultsMax(searchTier);

  useEffect(() => {
    if (userPrefData?.defaultChatModel) {
      setUnifiedModel(userPrefData.defaultChatModel);
    }
    if (userPrefData?.defaultAudioVoice) {
      setUnifiedVoice(userPrefData.defaultAudioVoice);
    }
  }, [userPrefData]);

  const availableVoices = useMemo(() => {
    const list = audioModelsData?.models || audioModelsData?.data || [];
    const firstWithVoices = list.find(
      (m: { voices?: Array<{ id: string; name: string }> }) =>
        Array.isArray(m.voices) && m.voices.length > 0
    );
    return (
      firstWithVoices?.voices || [
        { id: "flux-alexis-fr", name: "Alexis (Français naturel)" },
        { id: "flux-celeste-fr", name: "Céleste (Français chaleureux)" },
        { id: "flux-alexis-en", name: "Alexis (Anglais)" },
        { id: "flux-elena-en", name: "Elena (Anglais doux)" },
      ]
    );
  }, [audioModelsData]);

  return (
    <div className="py-6 flex flex-col gap-10 max-w-4xl">
      {/* En-tête des applications */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <LayersIcon className="size-4" />
          Applications intégrées
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Paramètres de Vibe, Recherche, Wakies, Blackline et Pages
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Centralisez la configuration de vos applications satellites mAI. Les
          modèles et la voix sont fusionnés avec votre compte principal pour une
          expérience fluide.
        </p>

        {/* Barre de navigation rapide */}
        <div className="flex items-center gap-2 pt-2">
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#vibe"
          >
            <SparklesIcon className="size-3.5 text-primary" />
            Vibe
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#search"
          >
            <SearchIcon className="size-3.5 text-primary" />
            Recherche
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#wakies"
          >
            <BotIcon className="size-3.5 text-primary" />
            Wakies
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#blackline"
          >
            <CrosshairIcon className="size-3.5 text-primary" />
            Blackline
          </a>
          <a
            className="chip flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="#pages"
          >
            <FileTextIcon className="size-3.5 text-primary" />
            Pages
          </a>
        </div>
      </div>

      {/* SECTION VIBE */}
      <VibeSettingsSection
        availableVoices={availableVoices}
        mutateUserPref={mutateUserPref}
        setUnifiedModel={setUnifiedModel}
        setUnifiedVoice={setUnifiedVoice}
        unifiedModel={unifiedModel}
        unifiedVoice={unifiedVoice}
        userPrefData={userPrefData}
      />

      {/* SECTION RECHERCHE */}
      <SearchSettingsSection
        mutateUserPref={mutateUserPref}
        searchResultsMax={searchResultsMax}
        userPrefData={userPrefData}
      />

      {/* SECTION WAKIES */}
      <WakiesSettingsSection />

      {/* SECTION BLACKLINE */}
      <section
        className="flex flex-col gap-6 scroll-mt-24 border-t border-border/50 pt-4"
        id="blackline"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CrosshairIcon className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                Blackline
              </h3>
              <p className="text-xs text-muted-foreground">
                FPS tactique 3D en solo contre des bots
              </p>
            </div>
          </div>
          <span className="chip text-[11px] font-semibold uppercase">
            PEGI 16
          </span>
        </div>

        <BlacklineSettingsSection />
      </section>

      {/* SECTION PAGES */}
      <PagesSettingsSection />
    </div>
  );
}
