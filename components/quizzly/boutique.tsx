"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import useSWR from "swr";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { VignetteArticle } from "@/components/quizzly/vignettes";
import type { ShopItem } from "@/lib/quizzly/shop";
import { fetcher } from "@/lib/utils";

type Boutique = {
  dailyGiftClaimed: boolean;
  gems: number;
  hearts: number;
  items: ShopItem[];
  leagueShieldWeek: string | null;
  ownedFrames: string[];
  streakFreezes: number;
  weekKey: string;
  xpBoostUntil: string | null;
};

export function BoutiqueQuizzly() {
  const resume = useResumeQuizzly();
  const { data, error, isLoading, mutate } = useSWR<Boutique>(
    "/api/quizzly/boutique",
    fetcher
  );
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [fete, setFete] = useState<string | null>(null);
  const [secousse, setSecousse] = useState<string | null>(null);

  async function acheter(article: ShopItem) {
    setEnCours(article.id);
    setMessage(null);
    setSecousse(null);
    try {
      const reponse = await fetch("/api/quizzly/boutique", {
        body: JSON.stringify({ itemId: article.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Achat refusé.");
      }
      setFete(article.id);
      setMessage(`${article.label} est à toi.`);
      window.setTimeout(
        () => setFete((actuel) => (actuel === article.id ? null : actuel)),
        1600
      );
      await mutate();
      await resume.mutate();
    } catch (raison) {
      setSecousse(article.id);
      window.setTimeout(() => setSecousse(null), 500);
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
    <section className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Boutique</h1>
          <p className="text-sm text-muted-foreground">
            {data.gems} gemmes · {data.streakFreezes} gel
            {data.streakFreezes > 1 ? "s" : ""} de série
          </p>
        </div>
        <AnimatePresence>
          {message ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-q-shop"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0, y: 8 }}
            >
              {message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.items.map((article) => {
          const possede =
            article.kind === "frame" && data.ownedFrames.includes(article.id);
          const cadeauPris = article.kind === "daily" && data.dailyGiftClaimed;
          const bouclierPose =
            article.kind === "shield" && data.leagueShieldWeek === data.weekKey;
          const libelle = possede
            ? "Possédé"
            : cadeauPris
              ? "Récupéré"
              : bouclierPose
                ? "Actif"
                : article.kind === "daily"
                  ? "Récupérer"
                  : article.kind === "boost" || article.kind === "shield"
                    ? "Activer"
                    : enCours === article.id
                      ? "Achat…"
                      : "Acheter";
          return (
            <motion.li
              animate={
                secousse === article.id
                  ? { x: [0, -8, 8, -4, 0] }
                  : fete === article.id
                    ? { rotate: [0, -1.5, 1.5, 0], scale: [1, 1.04, 1] }
                    : { scale: 1, x: 0 }
              }
              className="surface-card flex flex-col items-start gap-3"
              key={article.id}
              transition={{ duration: secousse === article.id ? 0.35 : 0.45 }}
            >
              <div className="relative">
                <VignetteArticle id={article.id} />
                <AnimatePresence>
                  {fete === article.id ? (
                    <motion.span
                      animate={{ opacity: 1, y: -8 }}
                      className="absolute -top-2 right-0 rounded-full bg-q-gem px-2 py-1 text-xs font-semibold text-q-on"
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0, y: 8 }}
                    >
                      {article.kind === "daily" ? "+5" : `−${article.price}`}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="flex w-full items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">{article.label}</h2>
                <span className="text-xs font-semibold text-q-gem">
                  {article.price === 0 ? "Gratuit" : `${article.price} gemmes`}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {article.description}
              </p>
              <button
                className="chip mt-auto w-fit"
                data-active={
                  possede || cadeauPris || bouclierPose ? "true" : "false"
                }
                disabled={
                  possede ||
                  cadeauPris ||
                  bouclierPose ||
                  enCours === article.id ||
                  (article.price > 0 && data.gems < article.price)
                }
                onClick={() => acheter(article)}
                type="button"
              >
                {enCours === article.id ? "Achat…" : libelle}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
