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
    setPending(true); setError(false);
    try {
      const response = await fetch(`/api/agent/runs/${runId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error("feedback");
      setAnswers((current) => ({ ...current, [field]: value }));
    } catch { setError(true); } finally { setPending(false); }
  }
  return <div className="rounded-xl border p-3 text-xs" aria-label="Avis sur ce run Agent">
    <p className="mb-2 font-medium">Votre avis sur ce résultat</p>
    <div className="flex flex-wrap gap-4">
      {(["useful", "goalReached"] as const).map((field) => <div className="flex items-center gap-1" key={field}>
        <span className="mr-1">{field === "useful" ? "Utile ?" : "Objectif atteint ?"}</span>
        {[true, false].map((value) => <button aria-pressed={answers[field] === value} className={`rounded border px-2 py-1 ${answers[field] === value ? "border-primary bg-primary/10" : ""}`} disabled={pending} key={String(value)} onClick={() => answer(field, value)} type="button">{value ? "Oui" : "Non"}</button>)}
      </div>)}
    </div>
    {error ? <p className="mt-2 text-destructive">Avis non enregistré. Réessayez.</p> : null}
  </div>;
}
