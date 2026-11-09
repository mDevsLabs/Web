"use client";

import { GiftIcon } from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ConfettisBonneReponse } from "@/components/quizzly/confetti";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { VignetteArticle } from "@/components/quizzly/vignettes";
import type { ShopItem } from "@/lib/quizzly/shop";
import { cn, fetcher } from "@/lib/utils";

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
  const [confettis, setConfettis] = useState(false);

  async function acheter(article: ShopItem) {
    if (article.price > 0 && data && data.gems < article.price) {
      setSecousse(article.id);
      window.setTimeout(() => setSecousse(null), 500);
      toast.error("Tu n'as pas assez de gemmes pour cet article !");
      return;
    }
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
      if (article.kind === "daily") {
        setConfettis(true);
        setTimeout(() => setConfettis(false), 2000);
      }
      setMessage(`${article.label} est à toi.`);
      toast.success(`${article.label} obtenu avec succès !`);
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
      toast.error(raison instanceof Error ? raison.message : "Achat refusé.");
    } finally {
      setEnCours(null);
    }
  }

  function offrir(article: ShopItem) {
    toast.info(
      `Fonctionnalité d'envoi de cadeau : ${article.label} bientôt disponible pour vos amis !`
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Chargement de la boutique…</span>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-center text-sm text-destructive">
        La boutique n'a pas pu être chargée.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <ConfettisBonneReponse actif={confettis} />

      {/* En-tête avec compteurs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-100 pb-5 dark:border-blue-900/30">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Boutique & Récompenses
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {data.gems} gemmes
            </span>{" "}
            · {data.streakFreezes} gel{data.streakFreezes > 1 ? "s" : ""} de
            série
          </p>
        </div>

        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
          onClick={() =>
            toast.info(
              "Choisissez un ami dans votre liste d'amis pour lui offrir un cadeau !"
            )
          }
          type="button"
        >
          <GiftIcon className="size-4" />
          <span>Offrir un cadeau</span>
        </button>
      </div>

      <AnimatePresence>
        {message ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 6 }}
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Grille des articles de la boutique (2x3 sur desktop) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            <motion.div
              animate={
                secousse === article.id
                  ? { x: [0, -8, 8, -4, 0] }
                  : fete === article.id
                    ? { rotate: [0, -1.5, 1.5, 0], scale: [1, 1.04, 1] }
                    : { scale: 1, x: 0 }
              }
              className="surface-quizzly-card group flex flex-col justify-between p-6 transition-all hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-800"
              key={article.id}
              transition={{ duration: secousse === article.id ? 0.35 : 0.45 }}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <VignetteArticle id={article.id} />
                  <AnimatePresence>
                    {fete === article.id && (
                      <motion.span
                        animate={{ opacity: 1, y: -8 }}
                        className="absolute -top-2 right-0 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white shadow-md shadow-blue-500/30"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0, y: 8 }}
                      >
                        {article.kind === "daily" ? "+5" : `−${article.price}`}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <h2 className="text-base font-bold text-slate-900 truncate dark:text-white">
                    {article.label}
                  </h2>
                  <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                    {article.price === 0
                      ? "Gratuit"
                      : `${article.price} gemmes`}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {article.description}
                  </p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  className={cn(
                    "flex-1 cursor-pointer rounded-full py-2.5 px-4 text-xs font-bold transition-all text-center",
                    possede || cadeauPris || bouclierPose
                      ? "cursor-default bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      : "bg-blue-600 text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
                  )}
                  disabled={
                    possede ||
                    cadeauPris ||
                    bouclierPose ||
                    enCours === article.id
                  }
                  onClick={() => acheter(article)}
                  type="button"
                >
                  {enCours === article.id ? "Achat…" : libelle}
                </button>

                {article.kind !== "daily" && (
                  <button
                    className="cursor-pointer rounded-full border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 active:scale-95 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                    onClick={() => offrir(article)}
                    type="button"
                  >
                    Offrir
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
