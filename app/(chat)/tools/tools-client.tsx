"use client";

import { PuzzleIcon, SearchIcon } from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageBackButton } from "@/components/chat/page-back-button";
import { ToolsSwitcher } from "@/components/tools/tools-switcher";
import { Input } from "@/components/ui/input";
import { TOOLS_ACTIONS_ID, type ToolsTab } from "@/lib/tools/tabs";
import McpPanel from "./mcp-panel";
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
      <header className="z-20 flex flex-col gap-4 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-md shadow-[inset_0_-1px_0_var(--md-highlight)] sm:px-6">
        <div className="flex items-center gap-3">
          <PageBackButton fallbackHref="/" label="Retour au chat" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PuzzleIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Applications
              </h1>
              <p className="text-xs text-muted-foreground">
                Plugins, MCP et Skills réunis au même endroit
              </p>
            </div>
          </div>
        </div>
        <ToolsSwitcher
          activeTab={activeTab}
          isPaid={isPaid}
          onChange={handleTabChange}
        />
        {/* Rangée unique pleine largeur : recherche globale + boutons d'action
            de l'onglet actif (portés par le panneau actif). */}
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-full border-border/60 bg-muted/30 pr-3 pl-9 text-sm"
              data-testid="tools-global-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher dans les outils…"
              value={searchQuery}
            />
          </div>
          <div
            className="flex flex-1 flex-wrap items-center justify-end gap-2"
            id={TOOLS_ACTIONS_ID}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-full flex-1 px-4 pt-4 pb-6 sm:px-6">
        {activeTab === "plugins" ? (
          <PluginsPanel searchQuery={searchQuery} />
        ) : null}

        {activeTab === "mcp" ? <McpPanel searchQuery={searchQuery} /> : null}

        {activeTab === "skills" ? (
          <SkillsPanel searchQuery={searchQuery} />
        ) : null}
      </main>
    </div>
  );
}
