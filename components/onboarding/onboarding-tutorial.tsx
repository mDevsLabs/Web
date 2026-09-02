"use client";

import { XIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

export function OnboardingTutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const { active, step, setStep, next, finish, saveStep } = useOnboarding();

  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const current = active ? ONBOARDING_STEPS[step] : null;
  const isLast = current ? step === ONBOARDING_STEPS.length - 1 : false;
  const StepIcon = current?.icon;

  const measure = useCallback(() => {
    if (!current) {
      return;
    }
    if (!current.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ height: r.height, left: r.left, top: r.top, width: r.width });
  }, [current]);

  // Navigue vers la page de l'étape si nécessaire, puis mesure la cible.
  useEffect(() => {
    if (!active || !current) {
      return;
    }
    if (current.route && pathname !== current.route) {
      router.push(current.route);
      return;
    }
    const timer = setTimeout(measure, 300);
    return () => clearTimeout(timer);
  }, [active, current, pathname, router, measure]);

  // Recalcule la position lors des défilements / redimensionnements.
  useEffect(() => {
    if (!active || !current?.selector) {
      return;
    }
    const handler = () => measure();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, current, measure]);

  useEffect(() => {
    if (active) {
      saveStep(step);
    }
  }, [active, step, saveStep]);

  // Positionne la bulle au mieux autour de la cible.
  useEffect(() => {
    if (!rect || !tooltipRef.current) {
      setTooltipPos(null);
      return;
    }
    const tt = tooltipRef.current.getBoundingClientRect();
    const margin = 12;
    const tooltipHeight = tt.height;
    const tooltipWidth = tt.width;

    let top = rect.top + rect.height + margin;
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = rect.top - tooltipHeight - margin;
    }
    top = Math.max(margin, top);

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.min(
      Math.max(margin, left),
      window.innerWidth - tooltipWidth - margin
    );

    setTooltipPos({ left, top });
  }, [rect]);

  if (!active || !current) {
    return null;
  }

  const handlePrimary = () => {
    if (isLast) {
      finish();
    } else {
      next();
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            height: rect.height + 8,
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-black/55" />
      )}

      <div
        className={cn(
          "fixed z-[70] w-[330px] max-w-[calc(100vw-24px)] rounded-2xl border border-border/60 bg-card p-4 text-card-foreground shadow-[var(--shadow-float)]",
          !rect && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        ref={tooltipRef}
        style={
          tooltipPos
            ? { left: tooltipPos.left, top: tooltipPos.top }
            : undefined
        }
      >
        <button
          aria-label="Terminer le tutoriel"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={finish}
          type="button"
        >
          <XIcon className="size-4" />
        </button>

        <div className="flex items-center gap-2 pr-6">
          {StepIcon ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <StepIcon className="size-4" />
            </span>
          ) : null}
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {current.title}
          </h3>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {current.content}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
              key={i}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={finish}
            type="button"
          >
            Terminer
          </button>

          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                className="rounded-lg border border-border/60 px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setStep(step - 1)}
                type="button"
              >
                Précédent
              </button>
            ) : null}

            <button
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => (isLast ? finish() : next())}
              type="button"
            >
              Passer
            </button>

            <button
              className="rounded-lg bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              onClick={handlePrimary}
              type="button"
            >
              {isLast ? "C'est parti" : step === 0 ? "Commencer" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
