/**
 * ============================================================================
 * VIBE — NOTIFICATIONS & RETOUR HAPTIQUE (components/vibe/settings/NotificationsHapticsSection.tsx)
 * Section Paramètres: retour haptique et animations.
 *
 * LES NOTIFICATIONS ONT QUITTÉ CETTE PAGE
 *
 * Les préférences de notification Vibe (e-mail, push, j'aime, partages,
 * réponses, messages privés) sont désormais réglées dans l'onglet
 * « Notifications» des paramètres mAI, qui regroupe les trois
 * applications. Les laisser ici créerait DEUX endroits pour la même
 * décision, et le dernier enregistré gagnerait — donc laPreference
 * affichée ne serait pas celle qui compte.
 *
 * Ce qui RESTE ici est ce qui relève de l'APPAREIL et non du compte:
 * le retour haptique et les animations. Un réglage d'appareil ne se
 * synchronise pas entre deux machines.
 * ============================================================================
 */

import { SmartphoneIcon as Smartphone } from "@mdevs/icons";
import type React from "react";
import { useState } from "react";
import { InstallAppHint } from "@/components/vibe/common/InstallAppHint";
import {
  getAnimationsEnabled,
  setAnimationsEnabled,
} from "@/lib/vibe/services/animationPrefs";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";

/** Encart indiquant l'état réel de la permission notifications de l'appareil */
export const DevicePermissionHint: React.FC = () => {
  const [state, setState] = useState<
    ReturnType<typeof NotificationService.getPermissionState>
  >(() => NotificationService.getPermissionState());

  if (state === "granted" || state === "unsupported") return null;

  return (
    <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
      <p className="text-[11px] text-zinc-400">
        {state === "denied"
          ? "Les notifications sont bloquées pour ce site. Modifiez les réglages de votre navigateur pour les réactiver."
          : "Les notifications ne sont pas encore autorisées sur cet appareil."}
      </p>
      {state === "default" && (
        <button
          className="shrink-0 py-1.5 px-3 rounded-full bg-white text-black text-[11px] font-bold hover:bg-zinc-200"
          onClick={async () => {
            const res = await NotificationService.requestPermission();
            setState(res);
          }}
          type="button"
        >
          Autoriser
        </button>
      )}
    </div>
  );
};

export interface NotificationsHapticsSectionProps {
  animationsEnabled: boolean;
  hapticsEnabled: boolean;
  hapticsSupported: boolean;
  setAnimationsEnabledState: (val: boolean) => void;
  setHapticsEnabled: (val: boolean) => void;
}

export const NotificationsHapticsSection: React.FC<
  NotificationsHapticsSectionProps
> = ({
  animationsEnabled,
  setAnimationsEnabledState,
  hapticsEnabled,
  setHapticsEnabled,
  hapticsSupported,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Smartphone className="w-4 h-4 text-white" />
        <span>Retour haptique & animations</span>
      </div>

      <div className="space-y-3 text-xs">
        <p className="text-zinc-500 text-[11px]">
          Les notifications Vibe se règlent dans{" "}
          <span className="text-white font-semibold">
            Paramètres mAI → Notifications
          </span>
          , avec celles de mAI et de Wakies. Le retour haptique et les
          animations restent ici: ce sont des réglages de cet appareil.
        </p>

        <DevicePermissionHint />

        <InstallAppHint />

        {/* Section Retour Haptique & Vibrations Tactiles */}
        <div className="pt-3 border-t border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Animations &amp; effets visuels</span>
              </div>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                Burst de likes, particules, spring navigation, transitions.
                Coupé auto si « Réduire les animations» OS.
              </p>
            </div>
            <input
              checked={animationsEnabled}
              className="w-4 h-4 accent-white cursor-pointer"
              onChange={(e) => {
                const val = e.target.checked;
                setAnimationsEnabledState(val);
                setAnimationsEnabled(val);
              }}
              type="checkbox"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Vibrations &amp; retour haptique mobile</span>
              </div>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                {hapticsSupported
                  ? "Sensations tactiles lors des likes (battement de cœur), publications, signets et navigation"
                  : "Retour haptique non disponible sur cet appareil."}
              </p>
            </div>
            <input
              checked={hapticsEnabled}
              className="w-4 h-4 accent-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!hapticsSupported}
              onChange={(e) => {
                const val = e.target.checked;
                setHapticsEnabled(val);
                haptics.setEnabled(val);
                if (val) haptics.like();
              }}
              type="checkbox"
            />
          </div>

          {hapticsEnabled && hapticsSupported && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-rose-500 vibe-dark:text-rose-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                onClick={() => haptics.like()}
                type="button"
              >
                Tester le Like (Heartbeat)
              </button>
              <button
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-500 vibe-dark:text-sky-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                onClick={() => haptics.selection()}
                type="button"
              >
                Tester la Sélection
              </button>
              <button
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-600 vibe-dark:text-emerald-400 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
                onClick={() => haptics.success()}
                type="button"
              >
                Tester le Succès
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
