"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface MaintenancePanelProps {
  initialMaintenance: {
    description: string;
    endAt: string;
    id: string;
    name: string;
    startAt: string;
  } | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  isExpired: boolean;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(endIso: string): TimeRemaining {
  const target = new Date(endIso).getTime();
  const diff = target - Date.now();

  if (diff <= 0 || Number.isNaN(diff)) {
    return { days: 0, hours: 0, isExpired: true, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, isExpired: false, minutes, seconds };
}

function formatDateFr(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function MaintenancePanel({
  initialMaintenance,
}: MaintenancePanelProps) {
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    initialMaintenance?.endAt
      ? calculateTimeRemaining(initialMaintenance.endAt)
      : { days: 0, hours: 0, isExpired: true, minutes: 0, seconds: 0 }
  );
  const [isRefreshing, startTransition] = useTransition();
  const [accessCode, setAccessCode] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  // Mise à jour continue du compte à rebours chaque seconde
  useEffect(() => {
    if (!maintenance?.endAt) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(maintenance.endAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenance?.endAt]);

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/maintenance/status", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.isUnderMaintenance) {
            // La maintenance est terminée, redirection vers l'accueil
            window.location.href = "/";
            return;
          }
          if (data.currentMaintenance) {
            setMaintenance(data.currentMaintenance);
            setTimeLeft(calculateTimeRemaining(data.currentMaintenance.endAt));
          }
        } else {
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    });
  };

  const handleBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = accessCode.trim();
    if (!clean) {
      setCodeError("Veuillez saisir un code d'accès.");
      return;
    }

    setIsSubmittingCode(true);
    setCodeError(null);
    setCodeSuccess(null);

    try {
      const res = await fetch("/api/maintenance/bypass", {
        body: JSON.stringify({ code: clean }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setCodeSuccess(data.message || "Accès déverrouillé avec succès !");
        setTimeout(() => {
          window.location.href = data.redirectUrl || "/";
        }, 600);
      } else {
        setCodeError(
          data.error || "Code d'accès invalide pour cette maintenance."
        );
      }
    } catch {
      setCodeError("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const padZero = (n: number) => n.toString().padStart(2, "0");

  const title = maintenance?.name || "Maintenance et mise à niveau du système";
  const description =
    maintenance?.description ||
    "Nos serveurs font actuellement l'objet d'une opération de maintenance planifiée afin d'améliorer la fiabilité, la sécurité et les performances de vos services mAI.";
  const endFormatted = maintenance?.endAt
    ? formatDateFr(maintenance.endAt)
    : "Prochainement";
  const startFormatted = maintenance?.startAt
    ? formatDateFr(maintenance.startAt)
    : null;

  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center p-4 sm:p-6 md:p-10 bg-background text-foreground overflow-hidden selection:bg-warning/20">
      {/* Halo d'ambiance d'arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-warning/10 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
        {/* Logo mAI et badge de statut */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative flex size-20 items-center justify-center rounded-3xl bg-card border border-border/70 shadow-xl shadow-black/5 dark:shadow-black/20 p-3">
            <Image
              alt="Logo mAI"
              className="size-full object-contain"
              height={80}
              priority
              src="/logo.png"
              width={80}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-semibold tracking-wide uppercase">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-warning" />
            </span>
            Maintenance du système en cours
          </div>
        </div>

        {/* Panneau de détails principal */}
        <div className="w-full rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-black/40 text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-center">
            {title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground text-center leading-relaxed max-w-xl mx-auto">
            {description}
          </p>

          {/* Section Période & Heure de retour */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startFormatted && (
              <div className="flex flex-col rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Début de l'intervention
                </span>
                <span className="mt-1 text-sm font-semibold text-foreground">
                  {startFormatted}
                </span>
              </div>
            )}
            <div
              className={`flex flex-col rounded-2xl border border-warning/30 bg-warning/5 p-3.5 ${startFormatted ? "" : "sm:col-span-2 text-center"}`}
            >
              <span className="text-xs font-medium text-warning uppercase tracking-wider">
                Date estimée de retour à la normale
              </span>
              <span className="mt-1 text-sm font-bold text-foreground">
                {endFormatted}
              </span>
            </div>
          </div>

          {/* Section Compte à rebours */}
          <div className="mt-6 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Temps estimé avant réouverture
              </span>
              {timeLeft.isExpired && (
                <span className="text-xs font-semibold text-warning animate-pulse">
                  Intervention en phase finale
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="flex flex-col rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4 shadow-sm">
                <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground">
                  {padZero(timeLeft.days)}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 uppercase">
                  Jours
                </span>
              </div>

              <div className="flex flex-col rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4 shadow-sm">
                <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground">
                  {padZero(timeLeft.hours)}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 uppercase">
                  Heures
                </span>
              </div>

              <div className="flex flex-col rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4 shadow-sm">
                <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground">
                  {padZero(timeLeft.minutes)}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 uppercase">
                  Minutes
                </span>
              </div>

              <div className="flex flex-col rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4 shadow-sm">
                <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground">
                  {padZero(timeLeft.seconds)}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 uppercase">
                  Secondes
                </span>
              </div>
            </div>

            {timeLeft.isExpired && (
              <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs sm:text-sm text-foreground text-center">
                ✨ L'horaire estimé est atteint ! La mise en service est
                imminente. Cliquez sur <strong>Actualiser</strong> pour vérifier
                l'accès.
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Button
              className="w-full sm:flex-1 h-12 rounded-2xl font-semibold gap-2 shadow-sm text-sm"
              disabled={isRefreshing}
              onClick={handleRefresh}
              variant="default"
            >
              <svg
                aria-hidden="true"
                className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {isRefreshing ? "Vérification en cours..." : "Actualiser la page"}
            </Button>

            <Button
              asChild
              className="w-full sm:flex-1 h-12 rounded-2xl font-semibold gap-2 border-border/80 text-sm"
              variant="outline"
            >
              <a
                href="https://mai.instatus.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>Statut des services (Instatus)</span>
                <svg
                  aria-hidden="true"
                  className="size-3.5 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </a>
            </Button>
          </div>

          {/* Section Déverrouillage par code de maintenance */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 mb-2">
              <svg
                aria-hidden="true"
                className="size-4 text-warning shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 2l-2 2m-1.5 1.5L16 7m-1.5 1.5L13 10m-3-3l6 6m-9.5 2.5a5.5 5.5 0 1 1 7.78-7.78L22 15v5h-5l-2.5-2.5" />
              </svg>
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Déverrouiller l'accès au site
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Vous disposez d'un code d'accès d'intervention ? Saisissez-le
              ci-dessous pour entrer dans le site malgré la maintenance.
            </p>

            <form
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              onSubmit={handleBypassSubmit}
            >
              <input
                autoCapitalize="characters"
                autoComplete="off"
                className="field-input flex-1 h-11 px-3.5 rounded-2xl border border-border/70 bg-background/80 text-sm font-mono uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning/40"
                disabled={isSubmittingCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                placeholder="Code d'accès (ex: MAI-MAINT-...)"
                spellCheck="false"
                type="text"
                value={accessCode}
              />
              <Button
                className="h-11 px-5 rounded-2xl font-semibold text-sm shrink-0"
                disabled={isSubmittingCode || !accessCode.trim()}
                type="submit"
                variant="secondary"
              >
                {isSubmittingCode ? (
                  <span className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="size-3.5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    Vérification...
                  </span>
                ) : (
                  "Déverrouiller l'accès"
                )}
              </Button>
            </form>

            {codeError && (
              <p className="mt-2 text-xs font-medium text-destructive flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                {codeError}
              </p>
            )}

            {codeSuccess && (
              <p className="mt-2 text-xs font-medium text-success flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {codeSuccess}
              </p>
            )}
          </div>
        </div>

        {/* Message de sécurité et réassurance en bas */}
        <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5 text-center">
          <svg
            aria-hidden="true"
            className="size-3.5 text-success shrink-0"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Vos données, comptes et clés API sont protégés en toute sécurité sous
          politique Zero Data Retention (ZDR).
        </p>
      </div>
    </main>
  );
}
