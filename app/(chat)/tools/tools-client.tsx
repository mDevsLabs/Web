"use client";

import { CpuIcon, PuzzleIcon, SearchIcon, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PageBackButton } from "@/components/chat/page-back-button";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { ToolsSwitcher } from "@/components/tools/tools-switcher";
import { Input } from "@/components/ui/input";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { TOOLS_ACTIONS_ID, type ToolsTab } from "@/lib/tools/tabs";
import McpPanel from "./mcp-panel";
import PluginsPanel from "./plugins-panel";
import SkillsPanel from "./skills-panel";

function LockedTabPanel({
  label,
  tab,
}: {
  label: string;
  tab: "plugins" | "mcp";
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-2xl text-white shadow-md ${
          tab === "mcp"
            ? "bg-gradient-to-br from-violet-500 to-purple-600"
            : "bg-gradient-to-br from-emerald-400 to-teal-600"
        }`}
      >
        {tab === "mcp" ? (
          <Star className="size-8" />
        ) : (
          <PuzzleIcon className="size-8" />
        )}
      </div>
      <div className="max-w-xl">
        <h2 className="mb-2 text-2xl font-bold">
          {label} réservé aux forfaits payants
        </h2>
        <p className="text-sm text-muted-foreground">
          {tab === "mcp"
            ? "Connectez vos bases de données, APIs et outils locaux directement à l'IA avec un contrôle strict des autorisations."
            : "Installez des plugins qui étendent l'IA et mentionnez-les avec @ dans le chat."}{" "}
          Passez à un forfait Plus, Pro ou Max.
        </p>
      </div>
      <a
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        href={MAI_UPGRADE_URL}
        rel="noopener"
        target="_blank"
      >
        Mettre à niveau mon forfait
      </a>
      <UpgradeDialog feature={tab} onOpenChange={() => {}} open />
    </div>
  );
}

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
      {/* En-tête de la page Outils */}
      <header className="z-20 flex flex-col gap-4 border-b border-border/40 bg-background/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <PageBackButton fallbackHref="/" label="Retour au chat" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CpuIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Outils
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
          isPaid ? (
            <PluginsPanel searchQuery={searchQuery} />
          ) : (
            <LockedTabPanel label="Plugins" tab="plugins" />
          )
        ) : null}

        {activeTab === "mcp" ? (
          isPaid ? (
            <McpPanel searchQuery={searchQuery} />
          ) : (
            <LockedTabPanel label="MCP" tab="mcp" />
          )
        ) : null}

        {activeTab === "skills" ? (
          <SkillsPanel searchQuery={searchQuery} />
        ) : null}
      </main>
    </div>
  );
}
