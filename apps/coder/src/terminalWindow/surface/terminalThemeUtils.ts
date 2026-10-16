import type { TFunction } from "../../i18n";
import {
  buildTerminalProfileTarget,
  getTerminalColorSchemeById,
  type TerminalAppSettings,
  type TerminalInputBackspaceMode,
  type TerminalProfile,
} from "../terminalSettings";
import type { ShellBridge, XTermThemeColors } from "./types";

export function readCssVar(name: string, fallback: string): string {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

export function readXtermThemeColors(): XTermThemeColors {
  const background = readCssVar("--void-bg-0", "#11171c");
  const foreground = readCssVar("--void-fg-0", "#f3f7f8");
  const cursor = readCssVar("--void-ring", "#37d6d4");
  return {
    background,
    black: background,
    brightBlack: "#3f4b57",
    cursor,
    foreground,
    selectionBackground: "#37d6d455",
  };
}

export function getProfileThemeColors(
  profile: TerminalProfile | null,
  fallback: XTermThemeColors
): XTermThemeColors {
  const scheme = getTerminalColorSchemeById(profile?.terminalColorSchemeId);
  if (!scheme) {
    return fallback;
  }
  return {
    background: scheme.background,
    black: scheme.colors[0] ?? scheme.background,
    brightBlack: scheme.colors[8] ?? scheme.colors[0] ?? fallback.brightBlack,
    cursor: scheme.cursor,
    foreground: scheme.foreground,
    selectionBackground: `${scheme.selection ?? scheme.cursor}55`,
  };
}

export function applyInputBackspaceMode(
  data: string,
  mode: TerminalInputBackspaceMode | undefined
): string {
  if (data !== "\x7f") {
    return data;
  }
  switch (mode) {
    case "ctrl-h":
      return "\x08";
    case "ctrl-?":
      return "\x7f";
    case "delete":
      return "\x1b[3~";
    case "backspace":
    default:
      return "\x7f";
  }
}

export async function maybeRunLoginScripts(
  shell: ShellBridge,
  sessionId: string,
  chunk: string,
  scripts: Array<{
    expect: string;
    send: string;
    isRegex?: boolean;
    optional?: boolean;
  }>
): Promise<void> {
  if (!scripts.length) {
    return;
  }
  for (let index = 0; index < scripts.length; index += 1) {
    const script = scripts[index];
    if (!script) {
      continue;
    }
    const expect = script.expect || "";
    let matched = false;
    if (!expect) {
      matched = true;
    } else if (script.isRegex) {
      try {
        matched = new RegExp(expect, "g").test(chunk);
      } catch {
        matched = false;
      }
    } else {
      matched = chunk.includes(expect);
    }
    if (matched) {
      scripts.splice(index, 1);
      await shell.invoke("term:sessionWrite", sessionId, `${script.send}\r`);
      return;
    }
    if (script.optional) {
      scripts.splice(index, 1);
      index -= 1;
      continue;
    }
    return;
  }
}

export function formatTerminalToolbarTarget(
  profile: TerminalProfile | null
): string {
  if (!profile || profile.kind !== "ssh") {
    return "";
  }
  const user = profile.sshUser.trim();
  const host = profile.sshHost.trim();
  const port = profile.sshPort > 0 ? profile.sshPort : 22;
  return `${user}@${host}:${port}`;
}

export function describeTerminalProfileTarget(
  profile: Pick<
    TerminalAppSettings["profiles"][number],
    "kind" | "shell" | "sshUser" | "sshHost" | "sshPort"
  >,
  t: TFunction
): string {
  return (
    buildTerminalProfileTarget(
      profile as TerminalAppSettings["profiles"][number]
    ) || t("app.universalTerminalSettings.systemDefaultShell")
  );
}

export function withTerminalWindowProfileLabel(
  profile: TerminalAppSettings["profiles"][number],
  t: TFunction
) {
  if (!profile.builtinKey) {
    return profile;
  }
  return {
    ...profile,
    name: t(`app.universalTerminalSettings.builtin.${profile.builtinKey}`),
  };
}
