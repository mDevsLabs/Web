import { useEffect, useMemo, useRef, useState } from "react";
import type { AppColorMode, ThemeTransitionOrigin } from "./colorMode";
import {
  APP_UI_STYLE,
  readPrefersDark,
  resolveEffectiveScheme,
} from "./colorMode";

const THEME_SWITCH_SETTLE_MS = 260;

function applyDomColorScheme(effective: "light" | "dark"): void {
  document.documentElement.setAttribute("data-ui-style", APP_UI_STYLE);
  document.documentElement.setAttribute("data-color-scheme", effective);
}

function setThemeSwitching(active: boolean): void {
  if (active) {
    document.documentElement.setAttribute("data-theme-switching", "true");
  } else {
    document.documentElement.removeAttribute("data-theme-switching");
  }
}

function applyThemeTransitionOrigin(
  origin?: ThemeTransitionOrigin | null
): void {
  const fallbackX =
    typeof window === "undefined" ? 1200 : window.innerWidth - 88;
  const fallbackY = 60;
  const x = Math.round(origin?.x ?? fallbackX);
  const y = Math.round(origin?.y ?? fallbackY);
  document.documentElement.style.setProperty("--theme-switch-x", `${x}px`);
  document.documentElement.style.setProperty("--theme-switch-y", `${y}px`);
}

/**
 * ?? View Transitions ???????????????
 * Monaco ??? `theme` prop ???????? effectiveScheme ????????
 */
function shouldAnimateThemeSwitch(
  origin?: ThemeTransitionOrigin | null
): boolean {
  if (!origin) {
    return false;
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  if (document.visibilityState !== "visible") {
    return false;
  }
  if (typeof document.hasFocus === "function" && !document.hasFocus()) {
    return false;
  }
  return true;
}

function applyColorSchemeWithTransition(
  effective: "light" | "dark",
  options?: { animated?: boolean }
): Promise<void> {
  const go = () => {
    applyDomColorScheme(effective);
  };
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (options?.animated && typeof doc.startViewTransition === "function") {
    const vt = doc.startViewTransition(go);
    return vt.finished.catch(() => {});
  }
  go();
  return Promise.resolve();
}

type Options = {
  colorMode: AppColorMode;
};

export function useAppColorScheme({ colorMode }: Options): {
  effectiveScheme: "light" | "dark";
  setTransitionOrigin: (origin?: ThemeTransitionOrigin) => void;
} {
  const [prefersDark, setPrefersDark] = useState(readPrefersDark);
  const firstDomApplyRef = useRef(true);
  const pendingTransitionOriginRef = useRef<ThemeTransitionOrigin | null>(null);
  const themeSwitchClearTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (themeSwitchClearTimerRef.current !== null) {
        window.clearTimeout(themeSwitchClearTimerRef.current);
      }
      setThemeSwitching(false);
    },
    []
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const effectiveScheme = useMemo(
    () => resolveEffectiveScheme(colorMode, prefersDark),
    [colorMode, prefersDark]
  );

  useEffect(() => {
    if (firstDomApplyRef.current) {
      firstDomApplyRef.current = false;
      applyThemeTransitionOrigin(pendingTransitionOriginRef.current);
      applyDomColorScheme(effectiveScheme);
      return;
    }
    const origin = pendingTransitionOriginRef.current;
    applyThemeTransitionOrigin(origin);
    pendingTransitionOriginRef.current = null;
    if (themeSwitchClearTimerRef.current !== null) {
      window.clearTimeout(themeSwitchClearTimerRef.current);
    }
    setThemeSwitching(true);
    const animated = shouldAnimateThemeSwitch(origin);
    void applyColorSchemeWithTransition(effectiveScheme, { animated }).finally(
      () => {
        themeSwitchClearTimerRef.current = window.setTimeout(() => {
          setThemeSwitching(false);
          themeSwitchClearTimerRef.current = null;
        }, THEME_SWITCH_SETTLE_MS);
      }
    );
  }, [effectiveScheme]);

  return {
    effectiveScheme,
    setTransitionOrigin(origin?: ThemeTransitionOrigin) {
      pendingTransitionOriginRef.current = origin ?? null;
    },
  };
}
