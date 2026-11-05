"use client";

import { type FormEvent, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangleIcon } from "@mdevs/icons";

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
      {envoye ? (
        <p className="text-xs text-success">Signalement envoyé. Merci.</p>
      ) : (
        <Dialog open={ouvert} onOpenChange={setOuvert}>
          <DialogTrigger asChild>
            <button className="chip w-fit" type="button">
              Signaler
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Signaler cette question</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p className="text-xs text-warning">{MENTION_IA}</p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                void envoyer(event);
              }}
            >
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
              {erreur ? (
                <p className="text-xs text-destructive">{erreur}</p>
              ) : null}
              <DialogFooter>
                <button
                  className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
                  disabled={envoi || message.trim().length === 0}
                  type="submit"
                >
                  {envoi ? "Envoi…" : "Envoyer le signalement"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
