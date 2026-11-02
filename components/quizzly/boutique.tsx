"use client";

import { GemIcon, GiftIcon, XIcon } from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ConfettisBonneReponse } from "@/components/quizzly/confetti";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { VignetteArticle } from "@/components/quizzly/vignettes";
import type { QuizzlyGift, ShopItem } from "@/lib/quizzly/shop";
import { fetcher } from "@/lib/utils";

type Boutique = {
  dailyGiftClaimed: boolean;
  gems: number;
  giftsReceived?: QuizzlyGift[];
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

  // Seul le panneau « Offrir un cadeau » reste côté web : l'ajout d'articles
  // et le crédit de gemmes/XP vivent désormais dans scripts/admin.ts.
  const [panneauActif, setPanneauActif] = useState<"aucun" | "cadeaux">(
    "aucun"
  );

  // Formulaire d'envoi de cadeau
  const [destinatairePseudo, setDestinatairePseudo] = useState("");
  const [cadeauArticleId, setCadeauArticleId] = useState<string>("");
  const [cadeauGems, setCadeauGems] = useState<number>(50);
  const [cadeauMessage, setCadeauMessage] = useState("");
  const [envoiCadeauEnCours, setEnvoiCadeauEnCours] = useState(false);

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

  // Ouvrir un cadeau reçu
  async function reclamerCadeau(giftId: string) {
    setEnCours(`gift-${giftId}`);
    try {
      const reponse = await fetch("/api/quizzly/cadeaux", {
        body: JSON.stringify({ action: "claim", giftId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Impossible d'ouvrir ce cadeau.");
      }
      setConfettis(true);
      window.setTimeout(() => setConfettis(false), 3500);
      toast.success(corps?.message || "Cadeau ouvert avec succès !");
      await mutate();
      await resume.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setEnCours(null);
    }
  }

  // Envoyer un cadeau à un ami
  async function envoyerCadeau(e: React.FormEvent) {
    e.preventDefault();
    if (!destinatairePseudo.trim()) {
      toast.error("Veuillez saisir le pseudo du destinataire.");
      return;
    }
    setEnvoiCadeauEnCours(true);
    try {
      const payload: Record<string, unknown> = {
        action: "send",
        message: cadeauMessage.trim(),
        recipientUsername: destinatairePseudo.trim(),
      };
      if (cadeauArticleId) {
        payload.itemId = cadeauArticleId;
      } else {
        payload.gems = cadeauGems;
      }
      const reponse = await fetch("/api/quizzly/cadeaux", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Échec de l'envoi du cadeau.");
      }
      toast.success(corps?.message || "Cadeau envoyé !");
      setDestinatairePseudo("");
      setCadeauMessage("");
      setCadeauArticleId("");
      setPanneauActif("aucun");
      await mutate();
      await resume.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setEnvoiCadeauEnCours(false);
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

  const cadeauxRecus = data.giftsReceived || [];
  const cadeauxEnAttente = cadeauxRecus.filter((c) => !c.claimed);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <ConfettisBonneReponse actif={confettis} />

      {/* Entête avec compteurs */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Boutique & Récompenses
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.gems} gemmes · {data.streakFreezes} gel
            {data.streakFreezes > 1 ? "s" : ""} de série
          </p>
        </div>

        {/* Barre d'outils / gestion */}
        <div className="flex flex-wrap gap-2">
          <button
            className="chip text-xs"
            data-active={panneauActif === "cadeaux"}
            onClick={() =>
              setPanneauActif((actuel) =>
                actuel === "cadeaux" ? "aucun" : "cadeaux"
              )
            }
            type="button"
          >
            <GiftIcon aria-hidden className="size-4" />
            Offrir un cadeau
          </button>
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

      {/* SECTION 1 : Cadeaux reçus en attente */}
      {cadeauxEnAttente.length > 0 ? (
        <div className="surface-card rounded-2xl border border-q-gem/30 bg-q-gem/5 p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-q-gem">
              <GiftIcon aria-hidden className="size-4" />
              Vous avez reçu {cadeauxEnAttente.length} cadeau
              {cadeauxEnAttente.length > 1 ? "x" : ""} !
            </h2>
            <span className="text-xs text-muted-foreground">
              À ouvrir dès maintenant
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cadeauxEnAttente.map((cadeau) => (
              <div
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                key={cadeau.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-q-xp">
                      De : {cadeau.senderDisplayName} (@{cadeau.senderUsername})
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(cadeau.sentAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <h3 className="mt-1 flex items-center gap-1 text-sm font-bold text-foreground">
                    {cadeau.itemId ? (
                      `Article : ${cadeau.itemLabel || cadeau.itemId}`
                    ) : (
                      <>
                        <GemIcon aria-hidden className="size-3.5 text-q-gem" />
                        Cadeau de {cadeau.gems} gemmes
                      </>
                    )}
                  </h3>
                  {cadeau.message ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      « {cadeau.message} »
                    </p>
                  ) : null}
                </div>
                <button
                  className="chip mt-3 w-fit text-xs font-semibold"
                  data-active="true"
                  disabled={enCours === `gift-${cadeau.id}`}
                  onClick={() => reclamerCadeau(cadeau.id)}
                  type="button"
                >
                  {enCours === `gift-${cadeau.id}` ? (
                    "Ouverture…"
                  ) : (
                    <>
                      <GiftIcon aria-hidden className="size-3.5" />
                      Ouvrir mon cadeau
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* SECTION 2 : Panneau "Offrir un cadeau" */}
      {panneauActif === "cadeaux" ? (
        <form
          className="surface-card flex flex-col gap-4 border border-q-shop/40 p-4 sm:p-6"
          onSubmit={envoyerCadeau}
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <GiftIcon aria-hidden className="size-4" />
              Envoyer un cadeau à un ami
            </h2>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPanneauActif("aucun")}
              type="button"
            >
              <XIcon aria-hidden className="size-3.5" />
              Fermer
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Faites plaisir à un ami en lui offrant des gemmes ou un article de
            la boutique. Le montant sera déduit de votre solde.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="destinataire"
              >
                Pseudo du destinataire
              </label>
              <input
                className="field-input w-full text-sm"
                id="destinataire"
                onChange={(e) => setDestinatairePseudo(e.target.value)}
                placeholder="ex: mathias"
                required
                type="text"
                value={destinatairePseudo}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="type-cadeau"
              >
                Que voulez-vous offrir ?
              </label>
              <select
                className="field-input w-full text-sm"
                id="type-cadeau"
                onChange={(e) => setCadeauArticleId(e.target.value)}
                value={cadeauArticleId}
              >
                <option value="">Offrir un pack de gemmes</option>
                {data.items
                  .filter((a) => a.price > 0)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} ({a.price} gemmes)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {cadeauArticleId ? null : (
            <div>
              <span className="mb-1 block text-xs font-semibold">
                Montant de gemmes à offrir :
              </span>
              <div className="flex flex-wrap gap-2">
                {[20, 50, 100, 200, 500].map((montant) => (
                  <button
                    className="chip text-xs"
                    data-active={cadeauGems === montant}
                    key={montant}
                    onClick={() => setCadeauGems(montant)}
                    type="button"
                  >
                    {montant}
                    <GemIcon aria-hidden className="size-3.5 text-q-gem" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              htmlFor="message-cadeau"
            >
              Message d'accompagnement (facultatif)
            </label>
            <input
              className="field-input w-full text-sm"
              id="message-cadeau"
              maxLength={200}
              onChange={(e) => setCadeauMessage(e.target.value)}
              placeholder="Un petit mot d'encouragement..."
              type="text"
              value={cadeauMessage}
            />
          </div>

          <button
            className="chip w-fit text-xs font-bold"
            data-active="true"
            disabled={envoiCadeauEnCours}
            type="submit"
          >
            {envoiCadeauEnCours ? (
              "Envoi en cours…"
            ) : (
              <>
                <GiftIcon aria-hidden className="size-3.5" />
                Confirmer et envoyer le cadeau
              </>
            )}
          </button>
        </form>
      ) : null}

      {/* SECTION 5 : Grille des articles de la boutique */}
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
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                <button
                  className="chip w-fit"
                  data-active={
                    possede || cadeauPris || bouclierPose ? "true" : "false"
                  }
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
                {article.price > 0 ? (
                  <button
                    className="chip text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCadeauArticleId(article.id);
                      setPanneauActif("cadeaux");
                    }}
                    title="Offrir cet article à un ami"
                    type="button"
                  >
                    <GiftIcon aria-hidden className="size-3.5" />
                    Offrir
                  </button>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
