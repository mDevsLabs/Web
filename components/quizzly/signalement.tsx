"use client";

import { type FormEvent, useState } from "react";

export const MENTION_IA =
  "L'intelligence artificielle a été utilisée pour concevoir les exercices. N'hésitez pas à signaler un contenu incorrect.";

export function MentionIa() {
  return <p className="text-xs text-muted-foreground">{MENTION_IA}</p>;
}

export function FormulaireSignalement({
  questionId,
  questionNumber,
  quizId,
  subjectLabel,
}: {
  questionId: string;
  questionNumber: number;
  quizId: string;
  subjectLabel: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(event: FormEvent) {
    event.preventDefault();
    const texte = message.trim();
    if (!texte || envoi) {
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/quizzly/signalement", {
        body: JSON.stringify({ message: texte, questionId, quizId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Le signalement n'a pas abouti.");
      }
      setEnvoye(true);
      setOuvert(false);
      setMessage("");
    } catch (raison) {
      setErreur(
        raison instanceof Error
          ? raison.message
          : "Le signalement n'a pas abouti."
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <MentionIa />
      {envoye ? (
        <p className="text-xs text-success">Signalement envoyé. Merci.</p>
      ) : (
        <>
          <button
            className="chip w-fit"
            onClick={() => setOuvert((valeur) => !valeur)}
            type="button"
          >
            Signaler
          </button>
          {ouvert ? (
            <form className="flex flex-col gap-2" onSubmit={envoyer}>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Question {questionNumber} · {subjectLabel}
                <textarea
                  className="field-input min-h-20 w-full px-3 py-2 text-sm text-foreground"
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Décrivez ce qui est incorrect."
                  required
                  value={message}
                />
              </label>
              <button
                className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
                disabled={envoi || message.trim().length === 0}
                type="submit"
              >
                {envoi ? "Envoi…" : "Envoyer le signalement"}
              </button>
            </form>
          ) : null}
        </>
      )}
      {erreur ? <p className="text-xs text-destructive">{erreur}</p> : null}
    </div>
  );
}
