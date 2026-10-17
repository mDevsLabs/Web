"use client";

// Le contenu vient du Web ; seuls les composants natifs exigent un nouvel installateur.
import { useEffect } from "react";
import { apiUrl } from "@/lib/client/api-endpoints";
import { canApplyAppUpdate } from "@/lib/client/app-update";
import { detectPlatform } from "@/lib/platform";

export function useNativeAppUpdate() {
  useEffect(() => {
    if (detectPlatform() === "web") return;
    const buildId = process.env.NEXT_PUBLIC_MAI_WEB_BUILD_ID;
    if (!buildId) return;
    let pending = false;
    let checking = false;
    let disposed = false;
    let controller: AbortController | null = null;
    const apply = () => {
      if (!disposed && pending && canApplyAppUpdate(document)) {
        window.location.reload();
      }
    };
    const check = async () => {
      if (checking || document.visibilityState !== "visible") return;
      if (pending) {
        apply();
        return;
      }
      checking = true;
      const request = new AbortController();
      controller = request;
      const timeout = window.setTimeout(() => request.abort(), 15_000);
      try {
        const response = await fetch(apiUrl("/api/app-version"), {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (
          payload &&
          typeof payload === "object" &&
          "buildId" in payload &&
          typeof payload.buildId === "string" &&
          payload.buildId
        ) {
          pending = payload.buildId !== buildId;
          apply();
        }
      } catch {
        // Hors ligne : conserver l'écran et réessayer au prochain retour réseau.
      } finally {
        window.clearTimeout(timeout);
        controller = null;
        checking = false;
      }
    };
    const resume = () => void check();
    const timer = window.setInterval(resume, 60_000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    void check();
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("focus", resume);
    };
  }, []);
}
