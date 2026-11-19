"use client";

import { BotIcon, BrainIcon, Loader2Icon } from "@mdevs/icons";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  WakiesCapacityPicker,
  WakiesToolPicker,
} from "@/components/settings/wakies-capability-picker";
import { api as wakiesApi } from "@/components/wakies/api";
import { ModelPicker as WakiesModelPicker } from "@/components/wakies/ModelPicker";
import { useCapabilities } from "@/components/wakies/use-capabilities";
import { fetcher } from "@/lib/utils";

// Catalogue d'outils proposés à un Wakie, tel qu'affiché par `WakiesToolPicker`.
type WakiesToolMeta = {
  description: string;
  id: string;
  name: string;
};

export type WakiesAccountSettings = {
  name: string;
  paused: boolean;
  researchAllowed: boolean;
  memoryAllowed: boolean;
};

export type WakieItem = {
  id: string;
  name: string;
  model?: string | null;
  toolIds?: string[];
  mcpServerIds?: string[];
  pluginIds?: string[];
  skillIds?: string[];
};

export type WakiesData = {
  tier: string;
  settings: WakiesAccountSettings;
  wakies: WakieItem[];
};

const WAKIES_SETTINGS_KEY = "/api/wakies/settings";

const WAKIE_TOOL_CATALOG: WakiesToolMeta[] = [
  {
    description: "Recherche d'informations récentes sur le Web.",
    id: "web_search",
    name: "Recherche Web",
  },
  {
    description: "Calculs mathématiques précis et conversions.",
    id: "calculator",
    name: "Calculatrice",
  },
  {
    description: "Connaissance de la date, heure et fuseaux.",
    id: "datetime",
    name: "Date & Heure",
  },
];

export function WakiesSettingsSection() {
  const [wakiesLoading, setWakiesLoading] = useState(true);
  const [wakiesSaving, setWakiesSaving] = useState(false);
  const [wakiesData, setWakiesData] = useState<WakiesData | null>(null);
  const [wakiesAccount, setWakiesAccount] =
    useState<WakiesAccountSettings | null>(null);
  const [activeWakieId, setActiveWakieId] = useState<string>("");
  const { capabilities: wakiesCapabilities } = useCapabilities(true);

  const wakiesConfirmedRef = useRef<WakiesAccountSettings | null>(null);
  const wakiesSaveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const wakiesPendingRef = useRef(0);

  const {
    data: wakiesLoaded,
    error: wakiesError,
    isLoading: wakiesQueryLoading,
  } = useSWR<WakiesData>(WAKIES_SETTINGS_KEY, fetcher, {
    dedupingInterval: 15_000,
  });

  useEffect(() => {
    if (wakiesQueryLoading) return;
    if (wakiesError || !wakiesLoaded) {
      setWakiesLoading(false);
      return;
    }
    setWakiesData(wakiesLoaded);
    setWakiesAccount(wakiesLoaded.settings);
    wakiesConfirmedRef.current = wakiesLoaded.settings;
    setActiveWakieId(
      (courant) => courant || wakiesLoaded.wakies?.[0]?.id || ""
    );
    setWakiesLoading(false);
  }, [wakiesError, wakiesLoaded, wakiesQueryLoading]);

  const relireWakies = async () => {
    try {
      const data = await wakiesApi<WakiesData>("/settings");
      if (data) {
        setWakiesData(data);
        setWakiesAccount(data.settings);
        wakiesConfirmedRef.current = data.settings;
        return true;
      }
    } catch {
      // Ignorer
    }
    return false;
  };

  const handleSaveWakiesAccount = async (
    patch: Partial<WakiesAccountSettings>
  ) => {
    wakiesPendingRef.current += 1;
    setWakiesSaving(true);
    const run = async () => {
      try {
        const updated = await wakiesApi<WakiesAccountSettings>(
          "/settings",
          "PATCH",
          patch
        );
        setWakiesAccount((prev) => (prev ? { ...prev, ...updated } : updated));
        wakiesConfirmedRef.current = {
          ...(wakiesConfirmedRef.current ?? updated),
          ...updated,
        };
        toast.success("Paramètres Wakies mis à jour");
      } catch (err: unknown) {
        if (wakiesConfirmedRef.current) {
          setWakiesAccount(wakiesConfirmedRef.current);
        }
        const relu = await relireWakies();
        const msg =
          err instanceof Error
            ? err.message
            : "Impossible de mettre à jour Wakies.";
        toast.error(
          relu
            ? "Impossible de mettre à jour Wakies : l'état précédent a été restauré."
            : `${msg} L'état du serveur n'a pas pu être relu ; rechargez la page.`
        );
      }
    };

    wakiesSaveQueueRef.current = wakiesSaveQueueRef.current
      .then(run, run)
      .finally(() => {
        wakiesPendingRef.current -= 1;
        if (wakiesPendingRef.current === 0) {
          setWakiesSaving(false);
        }
      });
    return wakiesSaveQueueRef.current;
  };

  const activeWakie = wakiesData?.wakies.find((w) => w.id === activeWakieId);

  const handleSaveWakieCapabilities = async (patch: Partial<WakieItem>) => {
    if (!activeWakieId) return;
    setWakiesSaving(true);
    try {
      await wakiesApi(`/wakies/${activeWakieId}`, "PATCH", patch);
      setWakiesData((prev) =>
        prev
          ? {
              ...prev,
              wakies: prev.wakies.map((w) =>
                w.id === activeWakieId ? { ...w, ...patch } : w
              ),
            }
          : prev
      );
      toast.success("Capacités du Wakie mises à jour");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de mise à jour";
      toast.error(msg);
    } finally {
      setWakiesSaving(false);
    }
  };

  const handleApplyWakieToAll = async () => {
    if (!activeWakie) return;
    setWakiesSaving(true);
    try {
      const { model, toolIds, mcpServerIds, pluginIds, skillIds } = activeWakie;
      await wakiesApi("/wakies/apply-all", "POST", {
        mcpServerIds,
        model,
        pluginIds,
        skillIds,
        toolIds,
      });
      setWakiesData((prev) =>
        prev
          ? {
              ...prev,
              wakies: prev.wakies.map((w) => ({
                ...w,
                mcpServerIds,
                model,
                pluginIds,
                skillIds,
                toolIds,
              })),
            }
          : prev
      );
      toast.success("Configuration appliquée à tous vos Wakies");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'application à tous les Wakies.";
      toast.error(msg);
    } finally {
      setWakiesSaving(false);
    }
  };

  return (
    <section
      className="flex flex-col gap-6 scroll-mt-24 pt-4 border-t border-border/50"
      id="wakies"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BotIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Wakies
            </h3>
            <p className="text-xs text-muted-foreground">
              Espaces de travail personnels & Assistants IA
            </p>
          </div>
        </div>
        {wakiesData && (
          <span className="chip text-[11px] font-semibold uppercase">
            Forfait {wakiesData.tier}
          </span>
        )}
      </div>

      {wakiesLoading ? (
        <div className="surface-card flex items-center justify-center p-8 text-xs text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin mr-2 text-primary" />
          Chargement des réglages Wakies…
        </div>
      ) : !wakiesData || !wakiesAccount ? (
        <div className="surface-card p-6 text-xs text-muted-foreground">
          L'atelier Wakies n'est pas encore initialisé ou inaccessible pour ce
          compte.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="wakies-general"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <BrainIcon className="size-4 text-primary" />
              <span>Atelier & Confidentialité</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nom de votre atelier Wakies
              </label>
              <input
                className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                disabled={wakiesSaving}
                maxLength={40}
                onBlur={() => {
                  if (wakiesAccount.name !== wakiesData.settings.name) {
                    void handleSaveWakiesAccount({
                      name: wakiesAccount.name,
                    });
                  }
                }}
                onChange={(e) =>
                  setWakiesAccount({ ...wakiesAccount, name: e.target.value })
                }
                type="text"
                value={wakiesAccount.name}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-foreground">
                    Mettre en pause l'atelier
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Désactive temporairement les réponses autonomes
                  </p>
                </div>
                <input
                  checked={wakiesAccount.paused}
                  className="size-4 accent-primary cursor-pointer shrink-0"
                  disabled={wakiesSaving}
                  onChange={(e) => {
                    const paused = e.target.checked;
                    setWakiesAccount({ ...wakiesAccount, paused });
                    void handleSaveWakiesAccount({ paused });
                  }}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-foreground">
                    Recherche web autonome
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Autoriser l'exploration des pages web publiques
                  </p>
                </div>
                <input
                  checked={wakiesAccount.researchAllowed}
                  className="size-4 accent-primary cursor-pointer shrink-0"
                  disabled={wakiesSaving}
                  onChange={(e) => {
                    const researchAllowed = e.target.checked;
                    setWakiesAccount({ ...wakiesAccount, researchAllowed });
                    void handleSaveWakiesAccount({ researchAllowed });
                  }}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer sm:col-span-2">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-foreground">
                    Mémoires enregistrées
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Permettre aux Wakies d'utiliser les souvenirs et faits
                    mémorisés
                  </p>
                </div>
                <input
                  checked={wakiesAccount.memoryAllowed}
                  className="size-4 accent-primary cursor-pointer shrink-0"
                  disabled={wakiesSaving}
                  onChange={(e) => {
                    const memoryAllowed = e.target.checked;
                    setWakiesAccount({ ...wakiesAccount, memoryAllowed });
                    void handleSaveWakiesAccount({ memoryAllowed });
                  }}
                  type="checkbox"
                />
              </label>
            </div>
          </div>

          <div
            className="surface-card flex flex-col gap-4 p-5 scroll-mt-24"
            id="wakies-config"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <BotIcon className="size-4 text-primary" />
                <span>Configuration des capacités</span>
              </div>
              {wakiesData.wakies.length > 1 && (
                <button
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  disabled={wakiesSaving}
                  onClick={handleApplyWakieToAll}
                  type="button"
                >
                  Appliquer à tous les Wakies
                </button>
              )}
            </div>

            {wakiesData.wakies.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun Wakie configuré. Créez votre premier assistant depuis
                l'atelier Wakies.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Sélectionner le Wakie à configurer
                  </label>
                  <select
                    className="field-input text-xs w-full py-1.5 px-2.5 rounded-lg border border-border/70 bg-card text-foreground"
                    disabled={wakiesSaving}
                    onChange={(e) => setActiveWakieId(e.target.value)}
                    value={activeWakieId}
                  >
                    {wakiesData.wakies.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}{" "}
                        {w.model ? `(${w.model})` : "(Modèle par défaut)"}
                      </option>
                    ))}
                  </select>
                </div>

                {activeWakie && (
                  <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Modèle IA dédié pour {activeWakie.name}
                      </label>
                      <WakiesModelPicker
                        bloc
                        onChoisir={(modele) =>
                          void handleSaveWakieCapabilities({ model: modele })
                        }
                        valeur={activeWakie.model ?? ""}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Outils actifs
                      </label>
                      <WakiesToolPicker
                        onChanger={(toolIds) =>
                          void handleSaveWakieCapabilities({ toolIds })
                        }
                        outils={WAKIE_TOOL_CATALOG.map((outil) => ({
                          description: outil.description,
                          id: outil.id,
                          label: outil.name,
                        }))}
                        valeur={activeWakie.toolIds ?? []}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Compétences & Plugins
                      </label>
                      <WakiesCapacityPicker
                        capabilities={wakiesCapabilities}
                        onChanger={(suiv) =>
                          void handleSaveWakieCapabilities(suiv)
                        }
                        valeur={{
                          mcpServerIds: activeWakie.mcpServerIds ?? [],
                          pluginIds: activeWakie.pluginIds ?? [],
                          skillIds: activeWakie.skillIds ?? [],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
