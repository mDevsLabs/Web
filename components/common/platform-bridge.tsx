"use client";

import "@/lib/editor/patch-prosemirror";
import { Suspense, useEffect } from "react";
import { useAppAutoRedirect } from "@/hooks/use-app-auto-redirect";
import { detectPlatform } from "@/lib/platform";

// Pose data-platform sur <html> (CSS conditionnel/tests) pour distinguer
// web, Electron et WebView Capacitor dès le premier rendu client,
// et gère la redirection automatique vers l'espace Coder ou Vibe.
function PlatformBridgeInner() {
  useAppAutoRedirect();

  useEffect(() => {
    document.documentElement.setAttribute("data-platform", detectPlatform());
  }, []);

  return null;
}

export function PlatformBridge() {
  return (
    <Suspense fallback={null}>
      <PlatformBridgeInner />
    </Suspense>
  );
}
