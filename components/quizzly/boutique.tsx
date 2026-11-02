"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ConfettisBonneReponse } from "@/components/quizzly/confetti";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { VignetteArticle } from "@/components/quizzly/vignettes";
import type { QuizzlyGift, ShopItem, ShopKind } from "@/lib/quizzly/shop";
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

  // Panneaux et onglets de gestion
  const [panneauActif, setPanneauActif] = useState<
    "aucun" | "cadeaux" | "ajout" | "credit"
  >("aucun");

  // Formulaire d'envoi de cadeau
  const [destinatairePseudo, setDestinatairePseudo] = useState("");
  const [cadeauArticleId, setCadeauArticleId] = useState<string>("");
  const [cadeauGems, setCadeauGems] = useState<number>(50);
  const [cadeauMessage, setCadeauMessage] = useState("");
  const [envoiCadeauEnCours, setEnvoiCadeauEnCours] = useState(false);

  // Formulaire d'ajout d'article
  const [nouvelArticleNom, setNouvelArticleNom] = useState("");
  const [nouvelArticleDesc, setNouvelArticleDesc] = useState("");
  const [nouvelArticleKind, setNouvelArticleKind] = useState<ShopKind>("frame");
  const [nouvelArticlePrix, setNouvelArticlePrix] = useState<number>(150);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  // Formulaire d'attribution Gems et XP
  const [creditCible, setCreditCible] = useState("");
  const [creditGems, setCreditGems] = useState<number>(100);
  const [creditXp, setCreditXp] = useState<number>(250);
  const [creditEnCours, setCreditEnCours] = useState(false);

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

  // Ajouter un nouvel article à la boutique
  async function creerArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelArticleNom.trim() || !nouvelArticleDesc.trim()) {
      toast.error("Veuillez renseigner le titre et la description.");
      return;
    }
    setAjoutEnCours(true);
    try {
      const reponse = await fetch("/api/quizzly/boutique", {
        body: JSON.stringify({
          action: "add-item",
          description: nouvelArticleDesc.trim(),
          kind: nouvelArticleKind,
          label: nouvelArticleNom.trim(),
          price: nouvelArticlePrix,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Impossible d'ajouter l'article.");
      }
      toast.success(corps?.message || "Article ajouté à la boutique !");
      setNouvelArticleNom("");
      setNouvelArticleDesc("");
      setPanneauActif("aucun");
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setAjoutEnCours(false);
    }
  }

  // Créditer des gems et de l'XP à un utilisateur
  async function attribuerRecompenses(e: React.FormEvent) {
    e.preventDefault();
    if (!creditCible.trim()) {
      toast.error("Veuillez saisir un pseudo ou identifiant utilisateur.");
      return;
    }
    if (creditGems <= 0 && creditXp <= 0) {
      toast.error("Indiquez un montant de gemmes ou d'XP supérieur à 0.");
      return;
    }
    setCreditEnCours(true);
    try {
      const reponse = await fetch("/api/quizzly/admin/credit", {
        body: JSON.stringify({
          gems: creditGems,
          target: creditCible.trim(),
          xp: creditXp,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Attribution impossible.");
      }
      toast.success(corps?.message || "Gems et XP attribués !");
      setCreditCible("");
      setPanneauActif("aucun");
      await mutate();
      await resume.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setCreditEnCours(false);
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
            🎁 Offrir un cadeau
          </button>
          <button
            className="chip text-xs"
            data-active={panneauActif === "ajout"}
            onClick={() =>
              setPanneauActif((actuel) =>
                actuel === "ajout" ? "aucun" : "ajout"
              )
            }
            type="button"
          >
            ➕ Ajouter un article
          </button>
          <button
            className="chip text-xs"
            data-active={panneauActif === "credit"}
            onClick={() =>
              setPanneauActif((actuel) =>
                actuel === "credit" ? "aucun" : "credit"
              )
            }
            type="button"
          >
            ⚡ Créditer Gems & XP
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
            <h2 className="text-base font-bold text-q-gem">
              🎁 Vous avez reçu {cadeauxEnAttente.length} cadeau
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
                  <h3 className="mt-1 text-sm font-bold text-foreground">
                    {cadeau.itemId
                      ? `Article : ${cadeau.itemLabel || cadeau.itemId}`
                      : `Cadeau de ${cadeau.gems} gemmes 💎`}
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
                  {enCours === `gift-${cadeau.id}`
                    ? "Ouverture…"
                    : "Ouvrir mon cadeau 🎁"}
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
            <h2 className="text-base font-bold">
              🎁 Envoyer un cadeau à un ami
            </h2>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPanneauActif("aucun")}
              type="button"
            >
              Fermer ✕
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
                    {montant} 💎
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
            {envoiCadeauEnCours
              ? "Envoi en cours…"
              : "Confirmer et envoyer le cadeau 🎁"}
          </button>
        </form>
      ) : null}

      {/* SECTION 3 : Panneau "Ajouter un article à la boutique" */}
      {panneauActif === "ajout" ? (
        <form
          className="surface-card flex flex-col gap-4 border border-q-xp/40 p-4 sm:p-6"
          onSubmit={creerArticle}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              ➕ Ajouter un nouvel article à la boutique
            </h2>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPanneauActif("aucun")}
              type="button"
            >
              Fermer ✕
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Configurez un nouvel article accessible à tous les apprenants dans
            la boutique Quizzly.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="nom-article"
              >
                Nom de l'article
              </label>
              <input
                className="field-input w-full text-sm"
                id="nom-article"
                onChange={(e) => setNouvelArticleNom(e.target.value)}
                placeholder="ex: Cadre Légendaire, Badge Expert"
                required
                type="text"
                value={nouvelArticleNom}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="kind-article"
              >
                Catégorie de l'article
              </label>
              <select
                className="field-input w-full text-sm"
                id="kind-article"
                onChange={(e) =>
                  setNouvelArticleKind(e.target.value as ShopKind)
                }
                value={nouvelArticleKind}
              >
                <option value="frame">Cadre cosmétique (avatar)</option>
                <option value="boost">Booster d'XP</option>
                <option value="hearts">Recharge de cœurs</option>
                <option value="freeze">Gel de série</option>
                <option value="shield">Bouclier de ligue</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="desc-article"
              >
                Description pédagogique ou ludique
              </label>
              <input
                className="field-input w-full text-sm"
                id="desc-article"
                onChange={(e) => setNouvelArticleDesc(e.target.value)}
                placeholder="ex: Un anneau exclusif pour récompenser vos séries."
                required
                type="text"
                value={nouvelArticleDesc}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="prix-article"
              >
                Prix en gemmes
              </label>
              <input
                className="field-input w-full text-sm"
                id="prix-article"
                min={0}
                onChange={(e) => setNouvelArticlePrix(Number(e.target.value))}
                required
                type="number"
                value={nouvelArticlePrix}
              />
            </div>
          </div>

          <button
            className="chip w-fit text-xs font-bold"
            data-active="true"
            disabled={ajoutEnCours}
            type="submit"
          >
            {ajoutEnCours
              ? "Ajout en cours…"
              : "Publier l'article dans la boutique ✨"}
          </button>
        </form>
      ) : null}

      {/* SECTION 4 : Panneau "Créditer Gems & XP aux utilisateurs" */}
      {panneauActif === "credit" ? (
        <form
          className="surface-card flex flex-col gap-4 border border-q-gem/40 p-4 sm:p-6"
          onSubmit={attribuerRecompenses}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-q-gem">
              ⚡ Gestion : Attribuer des Gems et de l'XP à un utilisateur
            </h2>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPanneauActif("aucun")}
              type="button"
            >
              Fermer ✕
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Permet de créditer instantanément des gemmes ou des points d'XP à un
            utilisateur spécifique pour récompenser ses progrès ou ajuster son
            solde.
          </p>

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              htmlFor="cible-credit"
            >
              Pseudo ou ID de l'utilisateur cible
            </label>
            <input
              className="field-input w-full text-sm"
              id="cible-credit"
              onChange={(e) => setCreditCible(e.target.value)}
              placeholder="ex: mathias"
              required
              type="text"
              value={creditCible}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="gems-credit"
              >
                Gemmes à créditer 💎
              </label>
              <div className="flex gap-2">
                <input
                  className="field-input w-full text-sm"
                  id="gems-credit"
                  min={0}
                  onChange={(e) => setCreditGems(Number(e.target.value))}
                  type="number"
                  value={creditGems}
                />
                <button
                  className="chip text-xs"
                  onClick={() => setCreditGems(100)}
                  type="button"
                >
                  +100
                </button>
                <button
                  className="chip text-xs"
                  onClick={() => setCreditGems(500)}
                  type="button"
                >
                  +500
                </button>
              </div>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                htmlFor="xp-credit"
              >
                Points d'XP à créditer ⚡
              </label>
              <div className="flex gap-2">
                <input
                  className="field-input w-full text-sm"
                  id="xp-credit"
                  min={0}
                  onChange={(e) => setCreditXp(Number(e.target.value))}
                  type="number"
                  value={creditXp}
                />
                <button
                  className="chip text-xs"
                  onClick={() => setCreditXp(250)}
                  type="button"
                >
                  +250
                </button>
                <button
                  className="chip text-xs"
                  onClick={() => setCreditXp(1000)}
                  type="button"
                >
                  +1000
                </button>
              </div>
            </div>
          </div>

          <button
            className="chip w-fit text-xs font-bold"
            data-active="true"
            disabled={creditEnCours}
            type="submit"
          >
            {creditEnCours
              ? "Attribution en cours…"
              : "Attribuer les récompenses ⚡"}
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
                    🎁 Offrir
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
