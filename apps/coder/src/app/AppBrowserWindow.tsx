import { lazy, Suspense, useEffect } from "react";
import { normalizeAppearanceSettings } from "../appearanceSettings";
import {
  readPrefersDark,
  readStoredColorMode,
  resolveEffectiveScheme,
} from "../colorMode";
import { normalizeLocale } from "../i18n";
import {
  useAppShellChromeCore,
  useAppShellChromeTheme,
} from "./appShellContexts";

const AgentBrowserWindowSurface = lazy(() =>
  import("../AgentBrowserWindowSurface").then((m) => ({
    default: m.AgentBrowserWindowSurface,
  }))
);

export function AppBrowserWindow() {
  const { shell, setLocale } = useAppShellChromeCore();
  const { setColorMode, setAppearanceSettings } = useAppShellChromeTheme();

  useEffect(() => {
    if (!shell) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const settings = (await shell.invoke("settings:get")) as {
          language?: string;
          ui?: {
            colorMode?: string;
          } & Record<string, unknown>;
        };
        if (cancelled) {
          return;
        }
        setLocale(normalizeLocale(settings.language));
        const colorMode =
          settings.ui?.colorMode === "light" ||
          settings.ui?.colorMode === "dark" ||
          settings.ui?.colorMode === "system"
            ? settings.ui.colorMode
            : readStoredColorMode();
        setColorMode(colorMode);
        const scheme = resolveEffectiveScheme(colorMode, readPrefersDark());
        setAppearanceSettings(normalizeAppearanceSettings(settings.ui, scheme));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell, setAppearanceSettings, setColorMode, setLocale]);

  return (
    <Suspense
      fallback={<div aria-busy="true" className="ref-browser-window-root" />}
    >
      <AgentBrowserWindowSurface />
    </Suspense>
  );
}
