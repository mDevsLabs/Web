"use client";

import { useEffect } from "react";

import { detectPlatform } from "@/lib/platform";

// Pose data-platform sur <html> (CSS conditionnel/tests) pour distinguer
// web, Electron et WebView Capacitor dès le premier rendu client.
export function PlatformBridge() {
  useEffect(() => {
    document.documentElement.setAttribute("data-platform", detectPlatform());
  }, []);

  return null;
}
