"use client";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";

/** Goals d'OpenMuse, adapté aux pages PostgreSQL et à leurs révisions optimistes. */
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/components/wakies/api";
import type { Page } from "@/lib/wakies/pages";
import {
  GOAL_MARKER,
  goalContent,
  goalSteps,
  toggleGoalStep,
} from "@/lib/wakies/shared/goals";
import type { Space } from "@/lib/wakies/shared/types";
export function GoalsScreen({
  spaces,
  defaultSpaceId,
  onOpen,
}: {
  spaces: Space[];
  defaultSpaceId: string;
  onOpen: (spaceId: string, pageId: string) => void;
}) {
  const {
    data: pages = [],
    error,
    mutate,
  } = useSWR(
    ["wakies-goals", ...spaces.map((space) => space.id)],
    async () =>
      (
        await Promise.all(
          spaces.map((space) => api<Page[]>(`/spaces/${space.id}/pages`))
        )
      ).flat(),
    { revalidateOnFocus: true }
  );
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const goals = pages.filter((page) => page.content.startsWith(GOAL_MARKER));
  const change = async (page: Page, line: number) => {
    setBusy(true);
    setFailure("");
    try {
      await api(`/pages/${page.id}`, "PATCH", {
        content: toggleGoalStep(page.content, line),
        expectedRevision: page.revision,
      });
      await mutate();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Enregistrement impossible.");
      await mutate();
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="main-content muse-screen">
      <header className="page-heading">
        <div>
          <h1>Vos objectifs</h1>
          <p>
            Une intention, quelques étapes. Chaque objectif est enregistré comme
            une page de votre espace.
          </p>
        </div>
      </header>
      {(failure || error) && (
        <p className="chat-error" role="alert">
          {failure ||
            (error instanceof Error
              ? error.message
              : "Objectifs indisponibles.")}
        </p>
      )}
      <form
        className="muse-card muse-goal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setFailure("");
          try {
            await api(`/spaces/${defaultSpaceId}/pages`, "POST", {
              content: goalContent(
                "",
                steps.split("\n").filter((step) => step.trim())
              ),
              title,
            });
            setTitle("");
            setSteps("");
            await mutate();
          } catch (e) {
            setFailure(e instanceof Error ? e.message : "Création impossible.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Votre objectif
          <Input
            maxLength={160}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Préparer mon prochain projet"
            required
            value={title}
          />
        </label>
        <label>
          Étapes, une par ligne
          <Textarea
            maxLength={8000}
            onChange={(event) => setSteps(event.target.value)}
            required
            rows={3}
            value={steps}
          />
        </label>
        <Button
          className="primary"
          disabled={busy || !defaultSpaceId}
          type="submit"
          variant="solid"
        >
          Enregistrer l’objectif
        </Button>
      </form>
      <div className="muse-cards">
        {goals.map((page) => {
          const items = goalSteps(page.content);
          const done = items.filter((step) => step.done).length;
          return (
            <article className="muse-card" key={page.id}>
              <h2>{page.title}</h2>
              <p>
                {done} / {items.length} étapes terminées
              </p>
              {items.map((step) => (
                <label className="muse-check" key={step.line}>
                  <input
                    checked={step.done}
                    disabled={busy}
                    onChange={() => void change(page, step.line)}
                    type="checkbox"
                  />
                  <span>{step.title}</span>
                </label>
              ))}
              <Button
                className="text-button"
                onClick={() => onOpen(page.spaceId, page.id)}
                type="button"
                variant="outline"
              >
                Modifier la page de cet objectif
              </Button>
            </article>
          );
        })}
      </div>
      {!goals.length && (
        <p>
          Les objectifs que vous enregistrez ici seront disponibles sur vos
          autres appareils.
        </p>
      )}
    </main>
  );
}
