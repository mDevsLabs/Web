"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppDialogRequest } from "@/lib/ui/app-dialog";

/** Modales partagées pour éviter les confirmations et saisies natives du navigateur. */
export function AppDialogHost() {
  const [queue, setQueue] = useState<AppDialogRequest[]>([]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const current = queue[0];

  const finish = useCallback(
    (result: boolean | string | null) => {
      if (!current) return;
      current.resolve(result);
      setQueue((items) => items.filter((item) => item.id !== current.id));
    },
    [current]
  );

  useEffect(() => {
    const onRequest = (event: Event) => {
      const request = (event as CustomEvent<AppDialogRequest>).detail;
      setQueue((items) => [...items, request]);
    };
    window.addEventListener("mai:app-dialog", onRequest);
    return () => window.removeEventListener("mai:app-dialog", onRequest);
  }, []);

  useEffect(() => {
    setValue(current?.initialValue ?? "");
    if (current?.kind === "prompt") inputRef.current?.focus();
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(null);
      if (event.key === "Enter" && current.kind === "prompt") {
        event.preventDefault();
        finish(value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, finish, value]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) finish(null);
      }}
    >
      <section
        aria-labelledby="app-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
        role="dialog"
      >
        <h2 className="text-base font-semibold" id="app-dialog-title">
          {current.kind === "prompt" ? "Saisie" : "Confirmation"}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {current.message}
        </p>
        {current.kind === "prompt" && (
          <input
            aria-label="Saisie"
            className="field-input mt-4 w-full"
            onChange={(event) => setValue(event.target.value)}
            ref={inputRef}
            value={value}
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            onClick={() => finish(null)}
            type="button"
          >
            Annuler
          </button>
          <button
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            onClick={() => finish(current.kind === "prompt" ? value : true)}
            type="button"
          >
            {current.kind === "prompt" ? "Valider" : "Confirmer"}
          </button>
        </div>
      </section>
    </div>
  );
}
