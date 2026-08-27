"use client";

import { useCallback, useEffect, useState } from "react";

const PENDING_KEY = "mai_onboarding_pending";
const COMPLETED_KEY = "mai_onboarding_completed";
const STEP_KEY = "mai_onboarding_step";

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

  return { active, step, setStep, next, finish, saveStep, markPending };
}
