"use client";

import {
  BellIcon,
  BotIcon,
  BrainIcon,
  ClipboardListIcon,
  DatabaseIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  WrenchIcon,
  ZapIcon,
} from "@mdevs/icons";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ComponentType,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PageBackButton } from "@/components/chat/page-back-button";
import { AgentTab } from "@/components/settings/agent-tab";
import { ConfigurationSection } from "@/components/settings/configuration-client";
import { DataTab } from "@/components/settings/data-tab";
import { FormsTab } from "@/components/settings/forms-tab";
import { MemoryCard } from "@/components/settings/memory-card";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { PreferencesTab } from "@/components/settings/preferences-tab";
import { ProfileTab } from "@/components/settings/profile-tab";
import {
  type AnchorItem,
  SettingsAnchorNav,
} from "@/components/settings/settings-anchor-nav";
import { UsageTab } from "@/components/settings/usage-tab";
import { cn } from "@/lib/utils";

type SettingsTab =
  | "agent"
  | "configuration"
  | "data"
  | "forms"
  | "memory"
  | "notifications"
  | "preferences"
  | "profile"
  | "usage";

const SETTINGS_TABS: {
  id: SettingsTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { icon: UserIcon, id: "profile", label: "Mon Profil" },
  { icon: SparklesIcon, id: "preferences", label: "Préférences IA" },
  { icon: BotIcon, id: "agent", label: "Agent" },
  { icon: BrainIcon, id: "memory", label: "Mémoire" },
  { icon: ZapIcon, id: "usage", label: "Consommation & Forfait" },
  { icon: ClipboardListIcon, id: "forms", label: "Formulaires" },
  { icon: BellIcon, id: "notifications", label: "Notifications" },
  { icon: DatabaseIcon, id: "data", label: "Données" },
  { icon: WrenchIcon, id: "configuration", label: "Outils" },
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Chargement…</div>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab && SETTINGS_TABS.some((t) => t.id === initialTab)
      ? initialTab
      : "profile"
  );

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? SETTINGS_TABS.length - 1
            : event.key === "ArrowDown"
              ? (index + 1) % SETTINGS_TABS.length
              : (index - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length;
      const nextTab = SETTINGS_TABS[nextIndex];
      handleTabChange(nextTab.id);
      window.setTimeout(() => {
        document.getElementById(`settings-tab-${nextTab.id}`)?.focus();
      }, 0);
    },
    [handleTabChange]
  );

  useEffect(() => {
    const t = searchParams.get("tab") as SettingsTab | null;
    setActiveTab(
      t && SETTINGS_TABS.some((tab) => tab.id === t) ? t : "profile"
    );
  }, [searchParams]);

  useEffect(() => {
    document.getElementById(`settings-tab-${activeTab}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTab]);

  // Scroll vers ancre usage si tab=usage
  useEffect(() => {
    if (activeTab === "usage") {
      const hash = typeof window === "undefined" ? "" : window.location.hash;
      const targetId = hash ? hash.replace("#", "") : "usage-mAI";
      const el =
        document.getElementById(targetId) ||
        document.getElementById("usage-mAI") ||
        document.getElementById("usage");
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          150
        );
      }
    }
  }, [activeTab]);

  // Ancres de la barre latérale pour l'onglet actif (défilement + surlignage)
  const anchorItems: AnchorItem[] = useMemo(() => {
    switch (activeTab) {
      case "profile":
        return [
          { id: "profile-avatar", label: "Photo de profil" },
          { id: "profile-form", label: "Informations personnelles" },
          { id: "profile-security", label: "Sécurité & mot de passe" },
        ];
      case "agent":
        return [
          { id: "agent-mode", label: "Mode par défaut" },
          { id: "agent-fallback", label: "Modèle de repli" },
          { id: "agent-reasoning", label: "Réflexion" },
          { id: "agent-tools", label: "Outils" },
          { id: "agent-permissions", label: "Autorisations des outils" },
          { id: "agent-project", label: "Projet par défaut" },
          { id: "agent-availability", label: "Disponibilité" },
          { id: "agent-activity", label: "Activité Agent" },
        ];
      case "preferences":
        return [
          { id: "prefs-defaults", label: "Modèle & visibilité" },
          { id: "prefs-favorite-app", label: "Menu favori" },
          { id: "prefs-instructions", label: "Instructions personnalisées" },
          { id: "prefs-audio", label: "Synthèse vocale" },
          { id: "prefs-languages", label: "Langues" },
          { id: "prefs-regenerate", label: "Mode régénération" },
        ];
      case "memory":
        return [
          { id: "memory-card", label: "Ma mémoire" },
          { id: "memory-info", label: "Comment ça marche" },
        ];
      case "usage":
        return [
          { id: "usage-plan", label: "Forfait actuel" },
          { id: "usage-stats", label: "Statistiques" },
          { id: "usage", label: "Utilisation de l'IA" },
          { id: "usage-images", label: "Générations d'images" },
          { id: "usage-speech", label: "Synthèse vocale" },
          { id: "usage-cloud", label: "Stockage cloud" },
        ];
      case "notifications":
        return [
          { id: "notif-main", label: "Préférences" },
          { id: "notif-rgpd", label: "RGPD & Données" },
        ];
      case "configuration":
        return [{ id: "config-commands", label: "Commandes personnalisées" }];
      case "data":
        return [
          { id: "data-history", label: "Historique" },
          { id: "data-memory", label: "Mémoire" },
          { id: "data-generations", label: "Images & audios" },
        ];
      case "forms":
        return [{ id: "forms-list", label: "Formulaires" }];
      default:
        return [];
    }
  }, [activeTab]);

  return (
    <div
      className="flex flex-1 flex-col h-full overflow-y-auto bg-background"
      data-scroll-root=""
    >
      {/*
        `md:pb-0` est indispensable et doit rester explicite : le raccourci
        `md:p-10` est compilé APRÈS les utilitaires de base par Tailwind, donc un
        simple `pb-0` en fin de liste se faisait écraser par lui et la grille
        ci-dessous repartait avec 2,5 rem de haut en trop. On étale donc le
        raccourci en `md:px-*`/`md:pt-*` pour que le zéro du bas tienne.
      */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:px-10 md:pt-10 md:pb-0">
        {/* En-tête de la page */}
        <div className="pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <PageBackButton />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <SettingsIcon className="size-4" />
                Compte & Préférences mAI
              </div>
              <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
                Paramètres du compte
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Gérez votre profil, vos informations personnelles et visualisez
                votre consommation IA.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-56">
          <div
            aria-label="Sections des paramètres"
            className="surface-card flex flex-col gap-1 p-2"
            role="tablist"
          >
            {SETTINGS_TABS.map((tab, index) => (
              <button
                aria-controls={`settings-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer text-left",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                id={`settings-tab-${tab.id}`}
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                type="button"
              >
                <tab.icon className="size-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <SettingsAnchorNav items={anchorItems} />
        </aside>

        <div
          aria-labelledby={`settings-tab-${activeTab}`}
          className="flex-1 min-w-0"
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
        >
          {activeTab === "profile" ? (
            <ProfileTab />
          ) : activeTab === "preferences" ? (
            <PreferencesTab />
          ) : activeTab === "agent" ? (
            <div className="py-6 max-w-4xl">
              <AgentTab />
            </div>
          ) : activeTab === "notifications" ? (
            <NotificationsTab />
          ) : activeTab === "memory" ? (
            <div className="py-6 flex flex-col gap-6 max-w-4xl">
              <div className="scroll-mt-6" id="memory-card">
                <MemoryCard allScopes />
              </div>
              <div
                className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3 scroll-mt-6"
                id="memory-info"
              >
                <BrainIcon className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">
                    Comment fonctionne la mémoire ?
                  </p>
                  <p>
                    Les informations enregistrées ici sont injectées
                    automatiquement dans le contexte de vos conversations.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "configuration" ? (
            <div className="py-6 max-w-4xl">
              <ConfigurationSection />
            </div>
          ) : activeTab === "data" ? (
            <div className="py-6 max-w-4xl">
              <DataTab />
            </div>
          ) : activeTab === "forms" ? (
            <div className="py-6 max-w-4xl scroll-mt-6" id="forms-list">
              <FormsTab />
            </div>
          ) : (
            <UsageTab />
          )}
        </div>
      </div>
    </div>
  );
}
