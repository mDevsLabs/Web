"use client";

import {
  AlertCircleIcon,
  BotIcon,
  CheckCircle2Icon,
  Code2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GlobeIcon,
  LaptopIcon,
  MonitorIcon,
  PlayIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CoderDesktopRequired } from "@/components/coder/coder-desktop-required";
import { Button } from "@/components/ui/button";
import { useIsDesktopApp } from "@/hooks/use-is-desktop-app";
import { cn } from "@/lib/utils";

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

interface FeatureCard {
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

const FEATURES: FeatureCard[] = [
  {
    badge: "IA Locale",
    description:
      "Boucle itérative Réfléchir → Planifier → Exécuter → Observer. Modes Agent complet, Planification préalable, Questions en lecture seule et Débogage approfondi.",
    icon: BotIcon,
    title: "Agent Autonome & Multi-Modes",
  },
  {
    badge: "Natif",
    description:
      "Accès natif à ConPTY et openpty. Exécutez vos commandes PowerShell, CMD, Bash et Zsh directement en local, partagés en temps réel avec l'agent.",
    icon: TerminalIcon,
    title: "Terminal PTY Haute Fréquence",
  },
  {
    badge: "Éditeur",
    description:
      "L'expérience d'édition puissante de Monaco, avec coloration syntaxique Shiki, navigation de symboles et analyse de diagnostic LSP TypeScript.",
    icon: Code2Icon,
    title: "Éditeur Monaco & Shiki",
  },
  {
    badge: "Git",
    description:
      "Statut visuel en direct, visualisation des hunks de diffs, staging sélectif, commits et pushs sans jamais quitter votre espace de travail.",
    icon: GitBranchIcon,
    title: "Intégration Git Complète",
  },
  {
    badge: "Extensible",
    description:
      "Branchez vos serveurs Model Context Protocol (MCP), bases de données, APIs et compétences sur disque pour décupler la portée de l'agent.",
    icon: PuzzleIcon,
    title: "Serveurs MCP & Outils Personnalisés",
  },
  {
    badge: "Web QA",
    description:
      "Intégration Playwright pour le pilotage web par l'agent, couplée à un proxy d'inspection réseau sécurisé pour analyser requêtes et flux d'APIs.",
    icon: GlobeIcon,
    title: "Automatisation Navigateur & Proxy",
  },
];

export function CoderExperienceView() {
  const { isDesktop, isChecking, openCoder } = useIsDesktopApp();
  const [detectedOs, setDetectedOs] = useState<
    "win" | "mac" | "linux" | "mobile"
  >("win");
  const [isLaunching, setIsLaunching] = useState(false);

  // Porte d'accès : hors application de bureau, /coder affiche une erreur
  // bloquante (l'utilisateur ne peut rien faire d'un IDE agentique dans un
  // onglet). La vitrine et le lancement natif restent la vue bureau.
  if (isChecking) {
    return <CoderGateSkeleton />;
  }
  if (!isDesktop) {
    return <CoderDesktopRequired />;
  }

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <SparklesIcon className="size-3.5" />
              Espace de Travail Desktop Agent-First
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              mAI Coder
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Un atelier de développement complet et local-first combinant un
              **Agent IA autonome**, l'**éditeur Monaco**, vos **terminaux PTY
              natifs** et une gestion **Git intégrée**. Conçu pour construire,
              tester et itérer sur vos projets à la vitesse de la pensée.
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
                    Votre session mAI est connectée. Vous pouvez ouvrir
                    l'atelier Coder dans une fenêtre dédiée.
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

      {/* Grille des 6 atouts de l'application */}
      <section className="space-y-6">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LaptopIcon className="size-5 text-primary" />
            Pourquoi mAI Coder est une application desktop native ?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            L'exécution locale garantit la sécurité de votre code source,
            l'absence de latence et le plein contrôle sur votre machine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                className="group relative rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 hover:bg-card/80 hover:shadow-md space-y-3"
                key={feature.title}
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
                    <Icon className="size-5" />
                  </div>
                  {feature.badge && (
                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sécurité et Souveraineté */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="size-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <ShieldCheckIcon className="size-6" />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h4 className="font-semibold text-sm sm:text-base text-foreground">
            Confidentialité & Respect Total de Vos Données
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Vos fichiers de code, clés API, historiques de conversation et
            dépôts Git restent exclusivement stockés sur votre disque local.
            Aucun code n'est téléversé vers des serveurs tiers sans votre
            autorisation explicite.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
            Consulter les versions
          </Link>
        </Button>
      </section>
    </div>
  );
}
