"use client";

import { ArrowLeftIcon, DownloadIcon, ExternalLinkIcon, MonitorIcon, TriangleAlertIcon } from "@mdevs/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { pagePath } from "@/lib/client/api-endpoints";

// Garde d'accès à mAI Code : l'application exige des terminaux PTY natifs,
// l'accès Git et le disque local — impossibles depuis un navigateur. Sur le
// Web et le mobile, l'accès n'est donc pas une vitrine de vente mais une
// ERREUR explicite : le bon message au mauvais endroit serait un cul-de-sac,
// celui-ci garde deux sorties (téléchargement, retour mAI).
//
// Les URL de téléchargement sont celles déjà utilisées par la vitrine bureau
// (components/coder/coder-experience-view.tsx) : une seule source de vérité
// pour les releases.

const GITHUB_RELEASES_URL = "https://github.com/mDevsLabs/Web/releases";

type DetectedOs = "win" | "mac" | "linux" | "mobile";

const OS_LABELS: Record<Exclude<DetectedOs, "mobile">, string> = {
  linux: "Linux (.AppImage)",
  mac: "macOS (.dmg)",
  win: "Windows (.exe)",
};

function detectOs(): DetectedOs {
  if (typeof window === "undefined") {
    return "win";
  }
  const ua = navigator.userAgent.toLowerCase();
  if (/android|iphone|ipad|ipod/i.test(ua)) {
    return "mobile";
  }
  if (ua.includes("mac") || ua.includes("os x")) {
    return "mac";
  }
  if (ua.includes("linux")) {
    return "linux";
  }
  return "win";
}

export function CoderDesktopRequired() {
  const [detectedOs, setDetectedOs] = useState<DetectedOs>("win");

  // Détection après montage : le rendu serveur est identique au premier rendu
  // client (pas de mismatch d'hydratation), l'OS n'affine que les boutons.
  useEffect(() => {
    setDetectedOs(detectOs());
  }, []);

  const desktopOs =
    detectedOs === "mobile"
      ? null
      : (detectedOs as Exclude<DetectedOs, "mobile">);

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10">
      <div className="surface-card w-full max-w-xl flex flex-col items-center gap-5 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-warning/10 ring-1 ring-warning/20">
          <TriangleAlertIcon className="size-7 text-warning" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            mAI Code nécessite l&apos;application de bureau
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            L&apos;outil de codage pour IA s&apos;exécute sur votre machine :
            terminaux natifs, accès Git et fichiers locaux. Cette version
            navigateur ne peut pas l&apos;ouvrir.
          </p>
        </div>

        <div className="surface-muted w-full text-left text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <MonitorIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              {detectedOs === "mobile"
                ? "Vous êtes sur mobile ou tablette : ouvrez cette page depuis un ordinateur (Windows, macOS ou Linux) pour télécharger l'application."
                : "Téléchargez l'application de bureau, connectez-vous avec votre compte mAI, puis ouvrez Code depuis le menu de l'application."}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-2.5 sm:flex-row">
          {desktopOs && (
            <Button asChild className="gap-2 font-semibold shadow-md">
              <Link
                href={`${GITHUB_RELEASES_URL}/latest`}
                rel="noreferrer"
                target="_blank"
              >
                <DownloadIcon className="size-4" />
                Télécharger pour {OS_LABELS[desktopOs]}
              </Link>
            </Button>
          )}
          <Button asChild size="default" variant="outline">
            <Link href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
              <span>Toutes les plateformes</span>
              <ExternalLinkIcon className="ml-1.5 size-3.5 opacity-70" />
            </Link>
          </Button>
        </div>

        <Button asChild size="sm" variant="ghost">
          <Link href={pagePath("/")} onClick={undefined}>
            <ArrowLeftIcon className="size-3.5" />
            Retour à mAI
          </Link>
        </Button>
      </div>
    </div>
  );
}
