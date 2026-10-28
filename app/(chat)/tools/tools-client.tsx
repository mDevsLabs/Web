"use client";

import { PuzzleIcon, SearchIcon } from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageBackButton } from "@/components/chat/page-back-button";
import { ToolsSwitcher } from "@/components/tools/tools-switcher";
import { Input } from "@/components/ui/input";
import { TOOLS_ACTIONS_ID, type ToolsTab } from "@/lib/tools/tabs";
import PluginsPanel from "./plugins-panel";
import SkillsPanel from "./skills-panel";

export default function ToolsClient({
  initialTab,
  isPaid,
}: {
  initialTab: ToolsTab;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ToolsTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  // Le portail des boutons d'action n'existe qu'après montage (côté client).
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
  }, []);

  const handleTabChange = (tab: ToolsTab) => {
    setActiveTab(tab);
    router.replace(`/tools?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      {/* En-tête de la page Applications */}
      <header className="z-20 flex flex-col gap-3 border-b border-border/60 bg-background/80 px-3 py-3 backdrop-blur-md shadow-[inset_0_-1px_0_var(--md-highlight)] sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <PageBackButton fallbackHref="/" label="Retour au chat" />
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PuzzleIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                Applications
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Plugins et Skills
              </p>
            </div>
          </div>
        </div>
        <ToolsSwitcher
          activeTab={activeTab}
          className="w-full max-w-md self-center [&>button]:min-h-11 [&>button]:flex-1 sm:w-auto sm:[&>button]:min-h-0 sm:[&>button]:flex-none"
          isPaid={isPaid}
          onChange={handleTabChange}
        />
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Rechercher dans les applications"
              className="h-11 rounded-full border-border/60 bg-muted/30 pr-3 pl-9 text-sm sm:h-9"
              data-testid="tools-global-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher dans les outils…"
              value={searchQuery}
            />
          </div>
          <div
            className="flex w-full flex-wrap items-center gap-2 sm:flex-1 sm:justify-end"
            id={TOOLS_ACTIONS_ID}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-full flex-1 px-3 pt-4 pb-10 sm:px-6">
        {activeTab === "plugins" ? (
          <PluginsPanel searchQuery={searchQuery} />
        ) : null}

        {activeTab === "skills" ? (
          <SkillsPanel searchQuery={searchQuery} />
        ) : null}
      </main>
    </div>
  );
}
