"use client";

import { useState } from "react";
import useSWR from "swr";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import type { ShopItem } from "@/lib/quizzly/shop";
import { fetcher } from "@/lib/utils";

type Boutique = {
  gems: number;
  hearts: number;
  items: ShopItem[];
  ownedFrames: string[];
  streakFreezes: number;
};

export function BoutiqueQuizzly() {
  const resume = useResumeQuizzly();
  const { data, error, isLoading, mutate } = useSWR<Boutique>(
    "/api/quizzly/boutique",
    fetcher
  );
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  async function acheter(itemId: string) {
    setEnCours(itemId);
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/boutique", {
        body: JSON.stringify({ itemId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Achat refusé.");
      }
      setMessage("Achat enregistré.");
      await mutate();
      await resume.mutate();
    } catch (raison) {
      setMessage(raison instanceof Error ? raison.message : "Achat refusé.");
    } finally {
      setEnCours(null);
    }
  }

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Chargement de la boutique…
      </p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-destructive">
        La boutique n'a pas pu être chargée.
      </p>
    );
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Boutique</h1>
      <p className="text-sm text-muted-foreground">
        {data.gems} gemmes · {data.streakFreezes} gel
        {data.streakFreezes > 1 ? "s" : ""} de série
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
      <ul className="flex flex-col gap-3">
        {data.items.map((article) => {
          const possede =
            article.kind === "frame" && data.ownedFrames.includes(article.id);
          return (
            <li className="surface-card flex flex-col gap-2" key={article.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">{article.label}</h2>
                <span className="text-xs text-info">
                  {article.price} gemmes
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {article.description}
              </p>
              <button
                className="chip w-fit"
                data-active={possede ? "true" : "false"}
                disabled={
                  possede || enCours === article.id || data.gems < article.price
                }
                onClick={() => acheter(article.id)}
                type="button"
              >
                {possede ? "Possédé" : "Acheter"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
