"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  MonitorIcon,
  PlayIcon,
} from "@mdevs/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CoderDesktopRequired } from "@/components/coder/coder-desktop-required";
import { Button } from "@/components/ui/button";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";

// Squelette du temps de détection du pont Electron (un rendu, pas un écran
// de chargement apparent) : évite le flash « erreur bloquante » puis
// « expérience bureau » sur un poste où le preload s'injecte après le
// premier paint.
function CoderGateSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-xl h-72 animate-pulse" />
    </div>
  );
}

const GITHUB_RELEASES_URL = "https://github.com/mDevsLabs/Web/releases";

export function CoderExperienceView() {
  const { isDesktop, isChecking, openCoder } = useIsDesktopApp();
  const [detectedOs, setDetectedOs] = useState<
    "win" | "mac" | "linux" | "mobile"
  >("win");
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/android|iphone|ipad|ipod/i.test(ua)) {
        setDetectedOs("mobile");
      } else if (ua.includes("mac") || ua.includes("os x")) {
        setDetectedOs("mac");
      } else if (ua.includes("linux")) {
        setDetectedOs("linux");
      } else {
        setDetectedOs("win");
      }
    }
  }, []);

  // Tous les hooks sont appelés avant la garde, y compris pendant la détection.
  if (isChecking) {
    return <CoderGateSkeleton />;
  }
  if (!isDesktop) {
    return <CoderDesktopRequired />;
  }

  const handleLaunchCoder = async () => {
    setIsLaunching(true);
    try {
      const result = await openCoder();
      if (result.success) {
        toast.success("mAI Coder est ouvert dans sa fenêtre dédiée !", {
          description:
            "Basculez sur la fenêtre de Coder pour travailler sur votre projet.",
        });
      } else {
        toast.error("Impossible de lancer mAI Coder", {
          description:
            result.error ??
            "Vérifiez que les dépendances de bureau sont bien installées.",
        });
      }
    } catch {
      toast.error("Erreur lors du lancement de mAI Coder");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-6xl mx-auto space-y-12">
      {/* En-tête Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md p-6 sm:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="size-24 sm:size-28 shrink-0 rounded-2xl p-2 bg-background border border-border/80 shadow-md flex items-center justify-center">
            <Image
              alt="mAI Coder Logo"
              className="size-full rounded-xl object-contain"
              height={112}
              priority
              src="/coder/logo.png"
              width={112}
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              mAI Coder
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Un atelier de développement sur votre ordinateur combinant un
              agent IA autonome, l’éditeur Monaco, des terminaux natifs et une
              gestion Git intégrée pour construire et tester vos projets.
            </p>
          </div>
        </div>

        {/* Action contextuelle selon la plateforme */}
        <div className="mt-8 pt-6 border-t border-border/40">
          {isChecking ? (
            <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
          ) : isDesktop ? (
            /* Mode Desktop Natif */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2Icon className="size-6 text-primary shrink-0" />
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    Environnement de bureau détecté
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Coder est inclus avec mAI Desktop et s’ouvre dans son
                    application dédiée, avec ses propres réglages.
                  </div>
                </div>
              </div>
              <Button
                className="w-full sm:w-auto gap-2 font-semibold shadow-md"
                disabled={isLaunching}
                onClick={handleLaunchCoder}
                size="lg"
              >
                {isLaunching ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Lancement en cours...
                  </>
                ) : (
                  <>
                    <PlayIcon className="size-4 fill-current" />
                    Ouvrir mAI Coder
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Mode Web & Mobile : Invitation au téléchargement */
            <div className="space-y-6">
              {detectedOs === "mobile" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground">
                  <AlertCircleIcon className="size-5 shrink-0 text-warning mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold">
                      mAI Coder requiert un ordinateur de bureau.
                    </span>{" "}
                    En raison des besoins en accès terminal natif et compilation
                    de code, l'application est disponible exclusivement sur
                    Windows, macOS et Linux. Ouvrez ce lien sur votre ordinateur
                    pour la télécharger !
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3 text-left">
                  <MonitorIcon className="size-6 text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      Application Desktop Native requise
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Téléchargez l'application pour bénéficier des terminaux
                      PTY locaux, de l'accès Git et de vos fichiers.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {detectedOs === "win" && (
                    <Button
                      asChild
                      className="gap-2 font-semibold shadow-md"
                      size="default"
                    >
                      <Link
                        href={`${GITHUB_RELEASES_URL}/latest`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon className="size-4" />
                        Télécharger pour Windows (.exe)
                      </Link>
                    </Button>
                  )}

                  {detectedOs === "mac" && (
                    <Button
                      asChild
                      className="gap-2 font-semibold shadow-md"
                      size="default"
                    >
                      <Link
                        href={`${GITHUB_RELEASES_URL}/latest`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon className="size-4" />
                        Télécharger pour macOS (.dmg)
                      </Link>
                    </Button>
                  )}

                  {detectedOs === "linux" && (
                    <Button
                      asChild
                      className="gap-2 font-semibold shadow-md"
                      size="default"
                    >
                      <Link
                        href={`${GITHUB_RELEASES_URL}/latest`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon className="size-4" />
                        Télécharger pour Linux (.AppImage)
                      </Link>
                    </Button>
                  )}

                  <Button asChild size="default" variant="outline">
                    <Link
                      href={GITHUB_RELEASES_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>Toutes les plateformes</span>
                      <ExternalLinkIcon className="size-3.5 ml-1.5 opacity-70" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
