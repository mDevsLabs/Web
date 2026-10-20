"use client";

/**
 * ============================================================================
 * PARAMÈTRES DE BLACKLINE — Onglet « Applications »
 * ============================================================================
 *
 * Les réglages du jeu BLACKLINE sont partagés par le compte : ils vivent dans
 * `BlacklineSettings` (migration 0064) et sont lus par le jeu à son montage.
 *
 * CE QUE CETTE PAGE FAIT, ET CE QU'ELLE NE FAIT PAS
 *
 * Elle ne RECALCULE aucun réglage : elle affiche ce que le serveur a renvoyé
 * et lui renvoie ce que l'utilisateur a choisi. Le serveur normalise, borne et
 * décide — c'est le contrat de l'hôte (« le serveur fait foi »).
 *
 * ELLE NE REMPLACE PAS LES RÉGLAGES DU JEU
 *
 * Les touches PC et les réglages tactiles (zone morte du joystick, taille des
 * commandes) restent dans le jeu : ils dépendent de l'appareil sur lequel on
 * joue, pas du compte. Les réglages listés ici sont ceux qui ONT DU SENS
 * sur tous les appareils.
 *
 * LA PROGRESSION N'EST PAS ICI
 *
 * XP, armes et collection restent sur l'appareil (Blackline a volontairement
 * retiré la synchronisation en ligne). Seuls les RÉGLAGES sont partagés.
 */

import {
  CheckIcon,
  CpuIcon,
  CrosshairIcon,
  Loader2Icon,
  MonitorIcon,
  ShieldAlertIcon,
  Volume2Icon,
} from "@mdevs/icons";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/utils";

/** Réglages partagés par le compte, tels que le serveur les renvoie. */
type BlacklineSettings = Record<string, unknown>;

type BlacklineState = {
  loading: boolean;
  saving: boolean;
  settings: BlacklineSettings;
};

/** Les valeurs par défaut du jeu, pour l'affichage d'un réglage absent. */
const DEFAUTS = {
  adsSensitivity: 1,
  adsZoom: 1,
  cameraDistance: 3.5,
  cameraMode: "first" as const,
  cameraShoulder: "right" as const,
  fov: 84,
  grenadePower: 1,
  hitFeedback: "both" as const,
  invertY: false,
  motionLevel: "full" as const,
  quality: "ultra" as const,
  renderResolution: "auto" as const,
  reticleStyle: "dot" as const,
  screenEffects: true,
  sensitivity: 1,
  showFPS: true,
  volume: 0.6,
} as const;

export function BlacklineSettingsSection() {
  const [etat, setEtat] = useState<BlacklineState>({
    loading: true,
    saving: false,
    settings: {},
  });

  const { data, error, mutate } = useSWR<{ settings: BlacklineSettings }>(
    "/api/blackline/settings",
    fetcher,
    { dedupingInterval: 15_000 }
  );

  useEffect(() => {
    if (!data) {
      return;
    }
    setEtat((precedent) => ({
      ...precedent,
      loading: false,
      settings: data.settings ?? {},
    }));
  }, [data]);

  useEffect(() => {
    if (error) {
      setEtat((precedent) => ({ ...precedent, loading: false }));
    }
  }, [error]);

  /** Applique une modification localement, sans écrire tout de suite. */
  const maj = useCallback((cle: string, valeur: unknown) => {
    setEtat((precedent) => ({
      ...precedent,
      settings: { ...precedent.settings, [cle]: valeur },
    }));
  }, []);

  const enregistrer = useCallback(async () => {
    setEtat((precedent) => ({ ...precedent, saving: true }));
    try {
      const reponse = await fetch("/api/blackline/settings", {
        body: JSON.stringify({ settings: etat.settings }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!reponse.ok) {
        throw new Error("Le serveur a refusé l'enregistrement.");
      }
      const payload = (await reponse.json()) as { settings: BlacklineSettings };
      setEtat((precedent) => ({
        ...precedent,
        saving: false,
        settings: payload.settings ?? {},
      }));
      await mutate();
      toast.success("Paramètres Blackline enregistrés ✨");
    } catch (err) {
      setEtat((precedent) => ({ ...precedent, saving: false }));
      toast.error(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les paramètres Blackline."
      );
    }
  }, [etat.settings, mutate]);

  const s = etat.settings;
  const lire = <T,>(cle: string, defaut: T): T =>
    (s[cle] as T | undefined) ?? defaut;

  if (etat.loading) {
    return (
      <div className="surface-card flex items-center justify-center p-8 text-xs text-muted-foreground">
        <Loader2Icon className="mr-2 size-4 animate-spin text-primary" />
        Chargement des réglages Blackline…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Classification — l'âge est demandé à chaque lancement du jeu. */}
      <div className="surface-muted flex items-start gap-3 p-4">
        <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">
            Blackline est classé PEGI 16
          </p>
          <p>
            Ce jeu contient des représentations de violence. Son accès est
            conditionné à une confirmation d&apos;âge, demandée à chaque
            lancement et jamais mémorisée.
          </p>
        </div>
      </div>

      {/* 1. Image & énergie */}
      <div
        className="surface-card flex flex-col gap-4 p-5"
        id="blackline-graphics"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <MonitorIcon className="size-4 text-primary" />
          <span>Image & Énergie</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="blackline-quality"
            >
              <CpuIcon className="size-3 text-primary" /> Détails graphiques
            </label>
            <select
              className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
              id="blackline-quality"
              onChange={(event) => maj("quality", event.target.value)}
              value={lire("quality", DEFAUTS.quality)}
            >
              <option value="performance">Performance</option>
              <option value="balanced">Équilibré</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="blackline-resolution"
            >
              Résolution de rendu 3D
            </label>
            <select
              className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
              id="blackline-resolution"
              onChange={(event) => maj("renderResolution", event.target.value)}
              value={lire("renderResolution", DEFAUTS.renderResolution)}
            >
              <option value="auto">Auto · budget de l&apos;appareil</option>
              <option value="native">Écran · pixels natifs</option>
              <option value="1080p">Full HD · 1920 × 1080</option>
              <option value="1440p">QHD · 2560 × 1440</option>
              <option value="4k">4K UHD · 3840 × 2160</option>
              <option value="8k">8K UHD · 7680 × 4320</option>
            </select>
            <span className="text-[10px] text-muted-foreground">
              8K exige beaucoup de mémoire vidéo : la cadence réelle dépend du
              GPU.
            </span>
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
          <div className="pr-3">
            <span className="text-xs font-semibold text-foreground">
              Compteur de performances
            </span>
            <p className="text-[11px] text-muted-foreground">
              Cadence et résolution réellement obtenues en partie
            </p>
          </div>
          <input
            checked={lire("showFPS", DEFAUTS.showFPS)}
            className="size-4 shrink-0 cursor-pointer accent-primary"
            onChange={(event) => maj("showFPS", event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>

      {/* 2. Caméra, visée & jeu */}
      <div
        className="surface-card flex flex-col gap-4 p-5"
        id="blackline-gameplay"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <CrosshairIcon className="size-4 text-primary" />
          <span>Caméra, Visée & Jeu</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="blackline-camera-mode"
            >
              Vue
            </label>
            <select
              className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
              id="blackline-camera-mode"
              onChange={(event) => maj("cameraMode", event.target.value)}
              value={lire("cameraMode", DEFAUTS.cameraMode)}
            >
              <option value="first">Première personne</option>
              <option value="third">Troisième personne</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="blackline-hit-feedback"
            >
              Confirmation de touche
            </label>
            <select
              className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
              id="blackline-hit-feedback"
              onChange={(event) => maj("hitFeedback", event.target.value)}
              value={lire("hitFeedback", DEFAUTS.hitFeedback)}
            >
              <option value="both">Image & son</option>
              <option value="visual">Image</option>
              <option value="audio">Son</option>
              <option value="none">Désactivée</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sensibilité
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {Math.round(lire("sensitivity", DEFAUTS.sensitivity) * 100)}%
            </span>
          </div>
          <input
            className="w-full"
            max={3}
            min={0.2}
            onChange={(event) => maj("sensitivity", Number(event.target.value))}
            step={0.05}
            type="range"
            value={lire("sensitivity", DEFAUTS.sensitivity)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Champ de vision
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {lire("fov", DEFAUTS.fov)}°
            </span>
          </div>
          <input
            className="w-full"
            max={110}
            min={65}
            onChange={(event) => maj("fov", Number(event.target.value))}
            step={1}
            type="range"
            value={lire("fov", DEFAUTS.fov)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Volume2Icon className="size-3 text-primary" /> Volume général
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {Math.round(lire("volume", DEFAUTS.volume) * 100)}%
            </span>
          </div>
          <input
            className="w-full"
            max={1}
            min={0}
            onChange={(event) => maj("volume", Number(event.target.value))}
            step={0.01}
            type="range"
            value={lire("volume", DEFAUTS.volume)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="pr-3">
              <span className="text-xs font-semibold text-foreground">
                Inverser l&apos;axe vertical
              </span>
              <p className="text-[11px] text-muted-foreground">
                S&apos;applique à la souris et au tactile
              </p>
            </div>
            <input
              checked={lire("invertY", DEFAUTS.invertY)}
              className="size-4 shrink-0 cursor-pointer accent-primary"
              onChange={(event) => maj("invertY", event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="pr-3">
              <span className="text-xs font-semibold text-foreground">
                Indicateurs de dégâts
              </span>
              <p className="text-[11px] text-muted-foreground">
                Vignette et direction des tirs reçus
              </p>
            </div>
            <input
              checked={lire("screenEffects", DEFAUTS.screenEffects)}
              className="size-4 shrink-0 cursor-pointer accent-primary"
              onChange={(event) => maj("screenEffects", event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      </div>

      {/* Enregistrement */}
      <div className="flex flex-col items-start gap-2">
        <Button
          className="flex items-center gap-1.5"
          disabled={etat.saving}
          onClick={() => void enregistrer()}
        >
          {etat.saving ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <CheckIcon className="size-3.5" />
          )}
          Enregistrer Blackline
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Ces réglages sont appliqués au prochain lancement du jeu. Les touches
          du clavier et les commandes tactiles restent configurables depuis
          Blackline lui-même.
        </p>
      </div>
    </div>
  );
}
