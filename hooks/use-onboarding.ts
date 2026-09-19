"use client";

import { useCallback, useEffect, useState } from "react";

const PENDING_KEY = "mai_onboarding_pending";
const COMPLETED_KEY = "mai_onboarding_completed";
const STEP_KEY = "mai_onboarding_step";

const RESTART_EVENT = "mai-onboarding-restart";

// Relance le tutoriel depuis n'importe où (le layout (chat) ne remonte pas
// entre les routes : on passe par un événement + localStorage).
export function requestOnboardingReplay() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(PENDING_KEY, "1");
  localStorage.setItem(COMPLETED_KEY, "0");
  localStorage.setItem(STEP_KEY, "0");
  window.dispatchEvent(new CustomEvent(RESTART_EVENT));
}

export function useOnboarding() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const pending = localStorage.getItem(PENDING_KEY);
    const completed = localStorage.getItem(COMPLETED_KEY);
    if (pending === "1" && completed !== "1") {
      const saved = Number(localStorage.getItem(STEP_KEY) ?? "0");
      setStep(Number.isFinite(saved) && saved > 0 ? saved : 0);
      setActive(true);
    }
  }, []);

  // Relance demandée depuis une autre page (bouton « Revoir le tutoriel »)
  // ou depuis un autre onglet (événement storage).
  useEffect(() => {
    const handleRestart = () => {
      setStep(0);
      setActive(true);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PENDING_KEY && event.newValue === "1") {
        const saved = Number(localStorage.getItem(STEP_KEY) ?? "0");
        setStep(Number.isFinite(saved) && saved > 0 ? saved : 0);
        setActive(true);
      }
    };
    window.addEventListener(RESTART_EVENT, handleRestart);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(RESTART_EVENT, handleRestart);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(COMPLETED_KEY, "1");
    localStorage.setItem(PENDING_KEY, "0");
    setActive(false);
  }, []);

  const next = useCallback(() => setStep((s) => s + 1), []);

  const saveStep = useCallback((index: number) => {
    localStorage.setItem(STEP_KEY, String(index));
  }, []);

  const markPending = useCallback(() => {
    localStorage.setItem(PENDING_KEY, "1");
  }, []);

  return {
    active,
    finish,
    markPending,
    next,
    saveStep,
    setStep,
    step,
  };
}
