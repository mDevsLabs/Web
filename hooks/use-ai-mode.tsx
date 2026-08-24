"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AI_MODES,
  type AIModeId,
  DEFAULT_AI_MODE,
  isValidAIModeId,
} from "@/lib/ai/modes";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export function useAIMode() {
  const [mode, setModeState] = useState<AIModeId>(() => {
    const c = getCookie("ai-mode");
    if (c && isValidAIModeId(c)) {
      return c;
    }
    return DEFAULT_AI_MODE;
  });

  useEffect(() => {
    const c = getCookie("ai-mode");
    if (c && isValidAIModeId(c) && c !== mode) {
      setModeState(c);
    }
  }, [mode]);

  const setMode = useCallback((id: AIModeId) => {
    if (!isValidAIModeId(id)) {
      return;
    }
    setModeState(id);
    setCookie("ai-mode", id);
  }, []);

  const current = AI_MODES[mode] ?? AI_MODES[DEFAULT_AI_MODE];

  return { mode, modeData: current, setMode };
}
