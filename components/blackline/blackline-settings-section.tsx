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
 * ELLE REMPLACE LES RÉGLAGES DU JEU
 *
 * L'écran de réglages du jeu a été retiré : tout ce qu'il exposait vit
 * ici, y compris les touches PC et les réglages tactiles. Un réglage
 * accessible à deux endroits est un réglage qui diverge — celui du jeu
 * écrasait celui du compte à chaque lancement.
 *
 * LA PROGRESSION N'EST PAS ICI
 *
 * XP, armes et collection restent sur l'appareil (Blackline a volontairement
 * retiré la synchronisation en ligne). Seuls les RÉGLAGES sont partagés.
 */

import {
  CrosshairIcon,
  GamepadIcon,
  KeyboardIcon,
  Loader2Icon,
  MonitorIcon,
  ShieldAlertIcon,
  SmartphoneIcon,
  Volume2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useAutosaveSection } from "@/hooks/use-autosave-section";
import { isValidKeyCode } from "@/lib/blackline/settings";
import { cn, fetcher } from "@/lib/utils";

/** Réglages partagés par le compte, tels que le serveur les renvoie. */
type BlacklineSettings = Record<string, unknown>;

/**
 * Valeurs par défaut du jeu (`apps/blackline/src/types.ts`).
 *
 * Elles servent d'affichage pour un réglage absent : le jeu les applique de
 * toute façon, l'interface doit montrer ce qui sera réellement utilisé.
 */
const DEFAUTS = {
  adsSensitivity: 1,
  adsZoom: 1,
  autoClimb: true,
  autoReload: true,
  autoSprint: true,
  batterySaver: false,
  callsign: "",
  cameraDistance: 3.5,
  cameraMode: "first" as const,
  cameraShake: true,
  cameraShoulder: "right" as const,
  crosshair: "#d0e693",
  fov: 84,
  grenadePower: 1,
  hitFeedback: "both" as const,
  hitmarkerEnabled: true,
  hitmarkerSound: true,
  invertY: false,
  joystickDeadzone: 0.09,
  leftHanded: false,
  mobileAimAssist: true,
  mobileAutoFire: true,
  motionLevel: "full" as const,
  quality: "ultra" as const,
  reduceMotion: false,
  renderResolution: "auto" as const,
  reticleScale: 1,
  reticleStyle: "dot" as const,
  screenEffects: true,
  sensitivity: 1,
  showFPS: true,
  toggleAim: false,
  touchOpacity: 0.8,
  touchScale: 1,
  touchSensitivity: 1,
  volume: 0.6,
} as const;

/** Actions du jeu qui ont une touche, et leur libellé. */
const ACTIONS_TOUCHES: Array<{ cle: string; libelle: string }> = [
  { cle: "forward", libelle: "Avancer" },
  { cle: "back", libelle: "Reculer" },
  { cle: "left", libelle: "Gauche" },
  { cle: "right", libelle: "Droite" },
  { cle: "sprint", libelle: "Sprint" },
  { cle: "jump", libelle: "Saut" },
  { cle: "crouch", libelle: "Accroupir / glisser" },
  { cle: "reload", libelle: "Recharger" },
  { cle: "grenade", libelle: "Grenade" },
  { cle: "melee", libelle: "Mêlée" },
  { cle: "interact", libelle: "Échelle" },
  { cle: "score", libelle: "Scores" },
  { cle: "pause", libelle: "Pause" },
  { cle: "fullscreen", libelle: "Plein écran" },
  { cle: "view", libelle: "Changer de caméra" },
  { cle: "heal", libelle: "Paquet de soins" },
  { cle: "weapon1", libelle: "Emplacement 1" },
  { cle: "weapon2", libelle: "Emplacement 2" },
  { cle: "weapon3", libelle: "Emplacement 3" },
  { cle: "weapon4", libelle: "Emplacement 4" },
  { cle: "weapon5", libelle: "Emplacement 5" },
];

/** Libellé lisible d'un code de touche. */
function libelleTouche(code: string): string {
  return code
    .replace(/^Key|^Digit/, "")
    .replace("Space", "Espace")
    .replace("ShiftLeft", "Maj gauche")
    .replace("ShiftRight", "Maj droite")
    .replace("ControlLeft", "Ctrl gauche")
    .replace("ControlRight", "Ctrl droite")
    .replace("ArrowUp", "Haut")
    .replace("ArrowDown", "Bas")
    .replace("ArrowLeft", "Gauche")
    .replace("ArrowRight", "Droite")
    .toUpperCase();
}

export function BlacklineSettingsSection() {
  const [reglages, setReglages] = useState<BlacklineSettings>({});
  const [chargement, setChargement] = useState(true);
  const [actionEnAttente, setActionEnAttente] = useState<string | null>(null);

  const { data, error, mutate } = useSWR<{
    displayName?: string | null;
    settings: BlacklineSettings;
  }>("/api/blackline/settings", fetcher, { dedupingInterval: 15_000 });

  useEffect(() => {
    if (!data) {
      return;
    }
    setReglages(data.settings ?? {});
    setChargement(false);
  }, [data]);

  useEffect(() => {
    if (error) {
      setChargement(false);
    }
  }, [error]);

  /**
   * Enregistrement immédiat.
   *
   * L'objet complet est renvoyé : le serveur le normalise, et il est borné
   * (32 Ko). Les modifications rapprochées sont regroupées : un curseur
   * déplacé produit une seule écriture.
   */
  useAutosaveSection({
    apply: setReglages,
    enabled: !chargement,
    errorMessage: "Impossible d'enregistrer les paramètres Blackline.",
    successMessage: "Paramètres Blackline enregistrés",
    values: reglages,
    write: async (valeurs) => {
      const reponse = await fetch("/api/blackline/settings", {
        body: JSON.stringify({ settings: valeurs }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!reponse.ok) {
        throw new Error("Le serveur a refusé l'enregistrement.");
      }
      await mutate();
    },
  });

  /** Change un réglage. */
  const maj = useCallback((cle: string, valeur: unknown) => {
    setReglages((precedent) => ({ ...precedent, [cle]: valeur }));
  }, []);

  const s = reglages;
  const lire = useCallback(
    <T,>(cle: string, defaut: T): T => (s[cle] as T | undefined) ?? defaut,
    [s]
  );

  /** Les touches actuellement attribuées dans le jeu. */
  const touches = useMemo(() => {
    const table = s.bindings as Record<string, string[]> | undefined;
    return table && typeof table === "object" ? table : {};
  }, [s.bindings]);

  /**
   * Enregistre une touche.
   *
   * L'écoute est CAPTURANTE : la touche pressée ne doit pas déclencher un
   * raccourci de l'hôte pendant qu'on la saisit.
   */
  useEffect(() => {
    if (!actionEnAttente) {
      return;
    }
    const surTouche = (evenement: KeyboardEvent) => {
      evenement.preventDefault();
      evenement.stopPropagation();
      if (!isValidKeyCode(evenement.code)) {
        return;
      }
      const action = actionEnAttente;
      setActionEnAttente(null);
      setReglages((precedent) => ({
        ...precedent,
        bindings: {
          ...((precedent.bindings as Record<string, string[]>) ?? {}),
          [action]: [evenement.code],
        },
      }));
    };
    window.addEventListener("keydown", surTouche, { capture: true });
    return () => {
      window.removeEventListener("keydown", surTouche, { capture: true });
    };
  }, [actionEnAttente]);

  if (chargement) {
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
          <Selecteur
            id="blackline-quality"
            label="Détails graphiques"
            onChange={(valeur) => maj("quality", valeur)}
            options={[
              { label: "Performance", valeur: "performance" },
              { label: "Équilibré", valeur: "balanced" },
              { label: "Ultra", valeur: "ultra" },
            ]}
            valeur={lire("quality", DEFAUTS.quality)}
          />

          <Selecteur
            id="blackline-resolution"
            label="Résolution de rendu 3D"
            note="8K exige beaucoup de mémoire vidéo : la cadence réelle dépend du GPU."
            onChange={(valeur) => maj("renderResolution", valeur)}
            options={[
              { label: "Auto · budget de l'appareil", valeur: "auto" },
              { label: "Écran · pixels natifs", valeur: "native" },
              { label: "Full HD · 1920 × 1080", valeur: "1080p" },
              { label: "QHD · 2560 × 1440", valeur: "1440p" },
              { label: "4K UHD · 3840 × 2160", valeur: "4k" },
              { label: "8K UHD · 7680 × 4320", valeur: "8k" },
            ]}
            valeur={lire("renderResolution", DEFAUTS.renderResolution)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Bascule
            description="Ajuste la résolution pour tenir la cadence visée."
            libelle="Résolution adaptative"
            onChange={(valeur) => maj("adaptive", valeur)}
            valeur={lire("adaptive", false)}
          />
          <Bascule
            description="Réduit l'effet des mouvements de caméra."
            libelle="Secousses de caméra"
            onChange={(valeur) => maj("cameraShake", valeur)}
            valeur={lire("cameraShake", DEFAUTS.cameraShake)}
          />
          <Bascule
            description="Éteint le compteur de cadence."
            libelle="Compteur de performances"
            onChange={(valeur) => maj("showFPS", valeur)}
            valeur={lire("showFPS", DEFAUTS.showFPS)}
          />
          <Bascule
            description="Allège le rendu sur les appareils modestes."
            libelle="Économie d'énergie"
            onChange={(valeur) => maj("batterySaver", valeur)}
            valeur={lire("batterySaver", DEFAUTS.batterySaver)}
          />
        </div>

        <Selecteur
          id="blackline-motion"
          label="Mouvements de caméra"
          onChange={(valeur) => maj("motionLevel", valeur)}
          options={[
            { label: "Complet", valeur: "full" },
            { label: "Réduit", valeur: "reduced" },
            { label: "Aucun", valeur: "off" },
          ]}
          valeur={lire("motionLevel", DEFAUTS.motionLevel)}
        />
      </div>

      {/* 2. Son & profil */}
      <div className="surface-card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Volume2Icon className="size-4 text-primary" />
          <span>Son & Profil</span>
        </div>

        <Curseur
          label="Volume général"
          max={1}
          min={0}
          onChange={(valeur) => maj("volume", valeur)}
          pas={0.01}
          valeur={lire("volume", DEFAUTS.volume)}
        />

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            htmlFor="blackline-callsign"
          >
            Indicatif
          </label>
          <input
            className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
            id="blackline-callsign"
            readOnly
            type="text"
            value={
              data?.displayName?.trim() || lire("callsign", DEFAUTS.callsign)
            }
          />
          <span className="text-[10px] text-muted-foreground">
            Nom du profil Quizzly et de Vibe. Blackline en affiche les 18
            premiers caractères au-dessus du personnage.
          </span>
          <Link
            className="text-[11px] font-semibold underline"
            href="/settings?tab=applications#quizzly"
          >
            Modifier dans Quizzly
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Bascule
            description="Marque les touches qui touchent."
            libelle="Indicateur de touche"
            onChange={(valeur) => maj("hitmarkerEnabled", valeur)}
            valeur={lire("hitmarkerEnabled", DEFAUTS.hitmarkerEnabled)}
          />
          <Bascule
            description="Accompagne l'indicateur d'un son."
            libelle="Son de touche"
            onChange={(valeur) => maj("hitmarkerSound", valeur)}
            valeur={lire("hitmarkerSound", DEFAUTS.hitmarkerSound)}
          />
        </div>
      </div>

      {/* 3. Caméra & visée */}
      <div
        className="surface-card flex flex-col gap-4 p-5"
        id="blackline-gameplay"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <CrosshairIcon className="size-4 text-primary" />
          <span>Caméra & Visée</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Selecteur
            id="blackline-camera-mode"
            label="Vue"
            onChange={(valeur) => maj("cameraMode", valeur)}
            options={[
              { label: "Première personne", valeur: "first" },
              { label: "Troisième personne", valeur: "third" },
            ]}
            valeur={lire("cameraMode", DEFAUTS.cameraMode)}
          />

          <Selecteur
            id="blackline-camera-shoulder"
            label="Épaule"
            onChange={(valeur) => maj("cameraShoulder", valeur)}
            options={[
              { label: "Droite", valeur: "right" },
              { label: "Gauche", valeur: "left" },
            ]}
            valeur={lire("cameraShoulder", DEFAUTS.cameraShoulder)}
          />
        </div>

        <Curseur
          label="Distance de caméra"
          max={5}
          min={2}
          onChange={(valeur) => maj("cameraDistance", valeur)}
          pas={0.1}
          valeur={lire("cameraDistance", DEFAUTS.cameraDistance)}
        />

        <Curseur
          label="Sensibilité"
          max={3}
          min={0.2}
          onChange={(valeur) => maj("sensitivity", valeur)}
          pas={0.05}
          valeur={lire("sensitivity", DEFAUTS.sensitivity)}
        />

        <Curseur
          label="Sensibilité en visée"
          max={1.5}
          min={0.3}
          onChange={(valeur) => maj("adsSensitivity", valeur)}
          pas={0.05}
          valeur={lire("adsSensitivity", DEFAUTS.adsSensitivity)}
        />

        <Curseur
          label="Zoom en visée"
          max={1.2}
          min={0.8}
          onChange={(valeur) => maj("adsZoom", valeur)}
          pas={0.05}
          valeur={lire("adsZoom", DEFAUTS.adsZoom)}
        />

        <Curseur
          label="Champ de vision"
          max={110}
          min={65}
          onChange={(valeur) => maj("fov", valeur)}
          pas={1}
          suffixe="°"
          valeur={lire("fov", DEFAUTS.fov)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Selecteur
            id="blackline-reticle-style"
            label="Réticule"
            onChange={(valeur) => maj("reticleStyle", valeur)}
            options={[
              { label: "Point", valeur: "dot" },
              { label: "Croix", valeur: "cross" },
              { label: "Cercle", valeur: "circle" },
            ]}
            valeur={lire("reticleStyle", DEFAUTS.reticleStyle)}
          />

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="blackline-crosshair"
            >
              Couleur du réticule
            </label>
            <input
              className="h-9 w-full cursor-pointer rounded-lg border border-border/70 bg-card px-2 py-1"
              id="blackline-crosshair"
              onChange={(evenement) => maj("crosshair", evenement.target.value)}
              type="color"
              value={lire("crosshair", DEFAUTS.crosshair)}
            />
          </div>
        </div>

        <Curseur
          label="Taille du réticule"
          max={1.6}
          min={0.65}
          onChange={(valeur) => maj("reticleScale", valeur)}
          pas={0.05}
          valeur={lire("reticleScale", DEFAUTS.reticleScale)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Bascule
            description="Réticule de visée maintenu sans cliquer."
            libelle="Visée basculée"
            onChange={(valeur) => maj("toggleAim", valeur)}
            valeur={lire("toggleAim", DEFAUTS.toggleAim)}
          />
          <Bascule
            description="S'applique à la souris et au tactile."
            libelle="Inverser l'axe vertical"
            onChange={(valeur) => maj("invertY", valeur)}
            valeur={lire("invertY", DEFAUTS.invertY)}
          />
        </div>
      </div>

      {/* 4. Jeu & assistance */}
      <div className="surface-card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <GamepadIcon className="size-4 text-primary" />
          <span>Jeu & Assistance</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Bascule
            description="Escalade automatiquement les obstacles."
            libelle="Escalade automatique"
            onChange={(valeur) => maj("autoClimb", valeur)}
            valeur={lire("autoClimb", DEFAUTS.autoClimb)}
          />
          <Bascule
            description="Recharge l'arme sans commande."
            libelle="Rechargement automatique"
            onChange={(valeur) => maj("autoReload", valeur)}
            valeur={lire("autoReload", DEFAUTS.autoReload)}
          />
          <Bascule
            description="Vignette et direction des tirs reçus."
            libelle="Indicateurs de dégâts"
            onChange={(valeur) => maj("screenEffects", valeur)}
            valeur={lire("screenEffects", DEFAUTS.screenEffects)}
          />
          <Bascule
            description="Réduit les animations de l'interface."
            libelle="Mouvements réduits"
            onChange={(valeur) => maj("reduceMotion", valeur)}
            valeur={lire("reduceMotion", DEFAUTS.reduceMotion)}
          />
        </div>

        <Selecteur
          id="blackline-hit-feedback"
          label="Confirmation de touche"
          onChange={(valeur) => maj("hitFeedback", valeur)}
          options={[
            { label: "Image & son", valeur: "both" },
            { label: "Image", valeur: "visual" },
            { label: "Son", valeur: "audio" },
            { label: "Désactivée", valeur: "none" },
          ]}
          valeur={lire("hitFeedback", DEFAUTS.hitFeedback)}
        />

        <Curseur
          label="Puissance des grenades"
          max={1.2}
          min={0.65}
          onChange={(valeur) => maj("grenadePower", valeur)}
          pas={0.05}
          valeur={lire("grenadePower", DEFAUTS.grenadePower)}
        />
      </div>

      {/* 5. Touches PC */}
      <div className="surface-card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <KeyboardIcon className="size-4 text-primary" />
          <span>Touches PC</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Cliquez sur une touche, puis pressez la touche de votre clavier. Les
          modifications sont enregistrées au fur et à mesure.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACTIONS_TOUCHES.map((action) => {
            const codes = touches[action.cle] ?? [];
            const enAttente = actionEnAttente === action.cle;
            return (
              <button
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                  enAttente
                    ? "border-info/50 bg-info/10 text-foreground"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                )}
                key={action.cle}
                onClick={() => setActionEnAttente(action.cle)}
                type="button"
              >
                <span>{action.libelle}</span>
                <span className="font-mono text-[11px]">
                  {enAttente
                    ? "Appuyez…"
                    : codes.length > 0
                      ? codes.map(libelleTouche).join(" / ")
                      : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Commandes tactiles */}
      <div className="surface-card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <SmartphoneIcon className="size-4 text-primary" />
          <span>Commandes tactiles</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Bascule
            description="Tire sans maintenir l'écran."
            libelle="Tir automatique"
            onChange={(valeur) => maj("mobileAutoFire", valeur)}
            valeur={lire("mobileAutoFire", DEFAUTS.mobileAutoFire)}
          />
          <Bascule
            description="Corrige légèrement la visée."
            libelle="Assistance de visée"
            onChange={(valeur) => maj("mobileAimAssist", valeur)}
            valeur={lire("mobileAimAssist", DEFAUTS.mobileAimAssist)}
          />
          <Bascule
            description="Course automatique quand le joystick est poussé."
            libelle="Sprint automatique"
            onChange={(valeur) => maj("autoSprint", valeur)}
            valeur={lire("autoSprint", DEFAUTS.autoSprint)}
          />
          <Bascule
            description="Interface à gauche, commandes à droite."
            libelle="Main gauche"
            onChange={(valeur) => maj("leftHanded", valeur)}
            valeur={lire("leftHanded", DEFAUTS.leftHanded)}
          />
        </div>

        <Curseur
          label="Sensibilité tactile"
          max={3}
          min={0.2}
          onChange={(valeur) => maj("touchSensitivity", valeur)}
          pas={0.05}
          valeur={lire("touchSensitivity", DEFAUTS.touchSensitivity)}
        />

        <Curseur
          label="Taille des commandes"
          max={1.25}
          min={0.85}
          onChange={(valeur) => maj("touchScale", valeur)}
          pas={0.05}
          valeur={lire("touchScale", DEFAUTS.touchScale)}
        />

        <Curseur
          label="Opacité des commandes"
          max={1}
          min={0.45}
          onChange={(valeur) => maj("touchOpacity", valeur)}
          pas={0.05}
          valeur={lire("touchOpacity", DEFAUTS.touchOpacity)}
        />

        <Curseur
          label="Zone morte du joystick"
          max={0.25}
          min={0.04}
          onChange={(valeur) => maj("joystickDeadzone", valeur)}
          pas={0.01}
          suffixe=" %"
          valeur={lire("joystickDeadzone", DEFAUTS.joystickDeadzone)}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Chaque réglage est enregistré dès que vous le modifiez. Ils sont
        appliqués au prochain lancement du jeu.
      </p>
    </div>
  );
}

/** Un menu déroulant de réglage. */
function Selecteur({
  id,
  label,
  note,
  onChange,
  options,
  valeur,
}: {
  id: string;
  label: string;
  note?: string;
  onChange: (valeur: string) => void;
  options: Array<{ label: string; valeur: string }>;
  valeur: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className="field-input w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
        id={id}
        onChange={(evenement) => onChange(evenement.target.value)}
        value={valeur}
      >
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.label}
          </option>
        ))}
      </select>
      {note ? (
        <span className="text-[10px] text-muted-foreground">{note}</span>
      ) : null}
    </div>
  );
}

/** Un curseur de réglage. */
function Curseur({
  label,
  max,
  min,
  onChange,
  pas,
  suffixe = " %",
  valeur,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (valeur: number) => void;
  pas: number;
  suffixe?: string;
  valeur: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {Number.isInteger(valeur) ? valeur : valeur.toFixed(2)}
          {suffixe}
        </span>
      </div>
      <input
        className="w-full"
        max={max}
        min={min}
        onChange={(evenement) => onChange(Number(evenement.target.value))}
        step={pas}
        type="range"
        value={valeur}
      />
    </div>
  );
}

/** Une case à cocher de réglage, avec son explication. */
function Bascule({
  description,
  libelle,
  onChange,
  valeur,
}: {
  description: string;
  libelle: string;
  onChange: (valeur: boolean) => void;
  valeur: boolean;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
      <div className="pr-3">
        <span className="text-xs font-semibold text-foreground">{libelle}</span>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <input
        checked={valeur}
        className="size-4 shrink-0 cursor-pointer accent-primary"
        onChange={(evenement) => onChange(evenement.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
