"use client";

import { PillSwitcher } from "@/components/ui/pill-switcher";
import { TOOLS_TAB_LABELS, TOOLS_TABS, type ToolsTab } from "@/lib/tools/tabs";

// Sélecteur Plugins | MCP | Skills de la page Applications : rendu délégué à la
// primitive partagée PillSwitcher (mêmes proportions compactes, animation et
// interactions clavier que le sélecteur Chat | Agent). Les onglets sont tous
// ouverts à tous les forfaits (y compris Free).
export function ToolsSwitcher({
  activeTab,
  isPaid: _isPaid,
  onChange,
}: {
  activeTab: ToolsTab;
  isPaid?: boolean;
  onChange: (tab: ToolsTab) => void;
}) {
  return (
    <PillSwitcher
      activeId={activeTab}
      ariaLabel="Sections d'outils"
      className="self-center"
      items={TOOLS_TABS.map((tab) => ({
        id: tab,
        label: TOOLS_TAB_LABELS[tab],
        locked: false,
      }))}
      layoutId="tools-pill"
      onBlockedSelect={(tab) => onChange(tab)}
      onSelect={onChange}
      size="sm"
    />
  );
}
