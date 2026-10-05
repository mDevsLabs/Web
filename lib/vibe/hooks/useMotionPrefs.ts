import { useCallback, useEffect, useState } from "react";
import {
  getAnimationsEnabled,
  isReducedMotion,
} from "@/lib/vibe/services/animationPrefs";
import { type HapticType, haptics } from "@/lib/vibe/services/haptics";

/**
 * useMotionPrefs — hook central pour animations + haptics.
 * - `animationsEnabled` : false si toggle OFF ou prefers-reduced-motion
 * - `play(haptic)` : déclenche le haptic uniquement si le retour haptique est activé
 * - Écoute `vibe:animations_changed`, `vibe:haptics_changed` + changement OS.
 */
export function useMotionPrefs() {
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() =>
    typeof window === "undefined"
      ? true
      : getAnimationsEnabled() && !isReducedMotion()
  );
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() =>
    typeof window === "undefined" ? true : haptics.isEnabled()
  );

  useEffect(() => {
    const sync = () => {
      setAnimationsEnabled(getAnimationsEnabled() && !isReducedMotion());
      setHapticsEnabled(haptics.isEnabled());
    };
    const onAnim = () => sync();
    const onHaptic = () => sync();
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMq = () => sync();
    window.addEventListener("vibe:animations_changed", onAnim);
    window.addEventListener("vibe:haptics_changed", onHaptic);
    mq?.addEventListener?.("change", onMq);
    sync();
    return () => {
      window.removeEventListener("vibe:animations_changed", onAnim);
      window.removeEventListener("vibe:haptics_changed", onHaptic);
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  const play = useCallback(
    (type: HapticType = "light") => {
      // Les haptics sont indépendants du toggle animations : seul le réglage dédié compte.
      if (!hapticsEnabled) return;
      haptics.trigger(type);
    },
    [hapticsEnabled]
  );

  return {
    animationsEnabled,
    hapticsEnabled,
    play,
    reducedMotion: !animationsEnabled,
  };
}
