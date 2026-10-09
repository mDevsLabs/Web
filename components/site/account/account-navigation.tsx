"use client";

import { CloudIcon as Cloud, GaugeIcon as Gauge, ImageIcon, KeyRoundIcon as KeyRound, MonitorIcon as Monitor, RefreshCwIcon as RefreshCw, SparklesIcon as Sparkles, UserIcon as User, Volume2Icon as Volume2 } from "@mdevs/icons";
import type { IconProps } from "@mdevs/icons";

export const ACCOUNT_SECTION_IDS = [
  "profil",
  "usage-api",
  "usage-images",
  "usage-audio",
  "usage-mai",
  "usage-cloud",
  "appareils",
  "resets",
  "upgrade-code",
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTION_IDS)[number];

const ITEMS: Array<{ id: AccountSectionId; label: string; icon: React.ComponentType<any> }> =
  [
    { icon: User, id: "profil", label: "Profil & Paramètres" },
    { icon: KeyRound, id: "usage-api", label: "Usage API" },
    { icon: ImageIcon, id: "usage-images", label: "Usage Images" },
    { icon: Volume2, id: "usage-audio", label: "Usage Audio" },
    { icon: Gauge, id: "usage-mai", label: "Usage mAI" },
    { icon: Cloud, id: "usage-cloud", label: "Stockage Cloud" },
    { icon: Monitor, id: "appareils", label: "Appareils Connectés" },
    { icon: RefreshCw, id: "resets", label: "Réinitialisations" },
    { icon: Sparkles, id: "upgrade-code", label: "Activer un Code" },
  ];

export function AccountNavigation({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (id: AccountSectionId) => void;
}) {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <nav className="sticky top-24 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                active
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white/40 text-slate-600 hover:bg-white border border-slate-200/50"
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
