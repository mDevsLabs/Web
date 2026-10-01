"use client";

import { useState } from "react";

export function AgentRunFeedback({
  goalReached,
  runId,
  useful,
}: {
  goalReached: boolean | null;
  runId: string;
  useful: boolean | null;
}) {
  const [answers, setAnswers] = useState({ goalReached, useful });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function answer(field: "goalReached" | "useful", value: boolean) {
    setPending(true);
    setError(false);
    try {
      const response = await fetch(`/api/agent/runs/${runId}`, {
        body: JSON.stringify({ [field]: value }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("feedback");
      }
      setAnswers((current) => ({ ...current, [field]: value }));
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      aria-label="Avis sur ce run Agent"
      className="rounded-xl border border-border/50 bg-card/50 p-3 text-xs"
    >
      <p className="mb-2 font-medium">Votre avis sur ce résultat</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {(["useful", "goalReached"] as const).map((field) => (
          <div className="flex items-center gap-1" key={field}>
            <span className="mr-1">
              {field === "useful" ? "Utile ?" : "Objectif atteint ?"}
            </span>
            {[true, false].map((value) => (
              <button
                aria-label={`${field === "useful" ? "Utile" : "Objectif atteint"} : ${value ? "oui" : "non"}`}
                aria-pressed={answers[field] === value}
                className="min-h-11 min-w-11 rounded-lg border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending}
                key={String(value)}
                onClick={() => answer(field, value)}
                type="button"
              >
                {value ? "Oui" : "Non"}
              </button>
            ))}
          </div>
        ))}
      </div>
      {error ? (
        <p className="mt-2 text-destructive">Avis non enregistré. Réessayez.</p>
      ) : null}
    </div>
  );
}
