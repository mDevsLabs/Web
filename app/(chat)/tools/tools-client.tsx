"use client";

import { CpuIcon, PuzzleIcon, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import McpClient from "@/app/(chat)/mcp/mcp-client";
import SkillsClient from "@/app/(chat)/skills/skills-client";
import { PageBackButton } from "@/components/chat/page-back-button";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { ToolsSwitcher } from "@/components/tools/tools-switcher";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import type { ToolsTab } from "@/lib/tools/tabs";
import PluginsPanel from "./plugins-panel";

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
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === "plugins" ? (
          isPaid ? (
            <PluginsPanel />
          ) : (
            <LockedTabPanel label="Plugins" tab="plugins" />
          )
        ) : null}

        {activeTab === "mcp" ? (
          isPaid ? (
            <McpClient embedded />
          ) : (
            <LockedTabPanel label="MCP" tab="mcp" />
          )
        ) : null}

        {activeTab === "skills" ? <SkillsClient embedded /> : null}
      </main>
    </div>
  );
}
