"use client";

import {
  CheckIcon,
  FlameIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  XIcon,
  ZapIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { IconeClasse, IconeLigue, nomLigue } from "@/components/quizzly/icones";
import { BarreNiveau } from "@/components/quizzly/niveau";
import {
  ECHELLE_LIGUES,
  estLigue,
  type LeagueId,
  type SeuilsLigue,
} from "@/lib/quizzly/leagues";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";
import { classeCadre } from "@/lib/quizzly/shop";
import { playClickSound, playFanfareSound } from "@/lib/quizzly/sound-effects";
import { cn, fetcher } from "@/lib/utils";

type Ligne = {
  avatarUrl: string | null;
  displayName: string;
  me: boolean;
  rank: number;
  userId: string;
  username: string;
  weeklyXp: number;
};

type Classement = {
  clotureAt: string;
  league: LeagueId;
  lignes: Ligne[];
  liguePrecedente: LeagueId;
  ligueSuivante: LeagueId;
  moi: SeuilsLigue;
  shieldActif: boolean;
  weekKey: string;
};

/** Objectif affiché dans la carte de position (« monter » ou « se maintenir »). */
type ObjectifLigue = "maintenir" | "monter";

function lireObjectifLigue(): ObjectifLigue {
  try {
    return localStorage.getItem("quizzly_league_objectif") === "maintenir"
      ? "maintenir"
      : "monter";
  } catch {
    return "monter";
  }
}

function lireZonesAffichees(): boolean {
  try {
    return localStorage.getItem("quizzly_league_zones") !== "false";
  } catch {
    return true;
  }
}

function formaterCloture(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      timeZone: "Europe/Paris",
      weekday: "long",
    }).format(new Date(iso));
  } catch {
    return "lundi 00:00";
  }
}

type ProfilPublic = {
  avatarUrl: string | null;
  displayName: string;
  equippedFrame: string | null;
  isMe: boolean;
  league: LeagueId;
  niveau: number;
  quizzesPassedCount: number;
  schoolYear: string;
  streakBest: number;
  streakCount: number;
  userId: string;
  username: string;
  weeklyXp: number;
  xp: number;
  xpDansPalier: number;
  xpPalier: number;
};

function ModalActiviteJoueur({
  onClose,
  userId,
}: {
  onClose: () => void;
  userId: string;
}) {
  const { data: profil, isLoading } = useSWR<ProfilPublic>(
    `/api/quizzly/profil/${userId}`,
    fetcher
  );
  const [encourage, setEncourage] = useState(false);

  function envoyerEncouragement() {
    playFanfareSound();
    setEncourage(true);
    toast.success(
      `Encouragement envoyé à ${profil?.displayName || "l'élève"} ! 🎉`,
      {
        description: "Votre message de soutien a été transmis avec succès.",
      }
    );
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="surface-quizzly-card relative flex w-full max-w-md flex-col gap-5 rounded-3xl border border-q-border/40 bg-card p-6 shadow-2xl"
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <button
          aria-label="Fermer"
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-q-level/10 hover:text-foreground transition-colors"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          type="button"
        >
          <XIcon className="size-5" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <SparklesIcon className="size-8 text-q-level animate-spin" />
            <p className="text-sm text-muted-foreground">
              Chargement de l'activité…
            </p>
          </div>
        ) : profil ? (
          <>
            {/* En-tête profil */}
            <div className="flex items-center gap-4">
              {profil.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className={cn(
                    "size-16 rounded-full object-cover shrink-0 ring-2 ring-q-border/40",
                    classeCadre(profil.equippedFrame)
                  )}
                  src={profil.avatarUrl}
                />
              ) : (
                <div
                  className={cn(
                    "flex size-16 items-center justify-center rounded-full bg-q-level/15 text-xl font-bold text-q-level shrink-0 ring-2 ring-q-border/40",
                    classeCadre(profil.equippedFrame)
                  )}
                >
                  {profil.displayName.slice(0, 1).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-bold text-foreground">
                    {profil.displayName}
                  </h3>
                  {profil.isMe && (
                    <span className="rounded-full bg-q-level/20 px-2 py-0.5 text-[10px] font-bold text-q-level">
                      Vous
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {profil.username ? `@${profil.username}` : "Élève Quizzly"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-q-level">
                  <IconeLigue className="size-3.5" league={profil.league} />
                  <span>Ligue {nomLigue(profil.league)}</span>
                </div>
              </div>
            </div>

            {/* Progression niveau */}
            <div className="rounded-2xl border border-q-border/30 bg-q-level/5 p-3.5">
              <BarreNiveau
                niveau={profil.niveau}
                xpDansPalier={profil.xpDansPalier}
                xpPalier={profil.xpPalier}
              />
            </div>

            {/* Grille statistiques d'activité */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-q-border/30 bg-card p-3 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <ZapIcon className="size-3.5 text-q-level" /> XP Semaine
                </span>
                <span className="text-base font-bold text-foreground">
                  {profil.weeklyXp.toLocaleString("fr-FR")} XP
                </span>
              </div>

              <div className="rounded-2xl border border-q-border/30 bg-card p-3 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <TrophyIcon className="size-3.5 text-amber-500" /> XP Totale
                </span>
                <span className="text-base font-bold text-foreground">
                  {profil.xp.toLocaleString("fr-FR")} XP
                </span>
              </div>

              <div className="rounded-2xl border border-q-border/30 bg-card p-3 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <FlameIcon className="size-3.5 text-orange-500" /> Série en
                  cours
                </span>
                <span className="text-base font-bold text-foreground">
                  {profil.streakCount} jour{profil.streakCount > 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Record : {profil.streakBest} j
                </span>
              </div>

              <div className="rounded-2xl border border-q-border/30 bg-card p-3 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <CheckIcon className="size-3.5 text-emerald-500" /> Quiz
                  validés
                </span>
                <span className="text-base font-bold text-foreground">
                  {profil.quizzesPassedCount}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                  <IconeClasse year={profil.schoolYear as SchoolYear} />
                  <span className="truncate">
                    {libelleAnnee(profil.schoolYear as SchoolYear)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action d'encouragement */}
            {!profil.isMe && (
              <button
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-sm font-bold shadow-md transition-all active:scale-[0.98]",
                  encourage
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-q-level text-q-on hover:opacity-90"
                )}
                disabled={encourage}
                onClick={envoyerEncouragement}
                type="button"
              >
                {encourage ? (
                  <>
                    <CheckIcon className="size-4" />
                    Encouragement transmis !
                  </>
                ) : (
                  <>
                    <HeartIcon className="size-4 fill-current" />
                    Envoyer un encouragement 👏
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-sm text-destructive">
            Impossible de charger le profil de cet élève.
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CartePosition({ classement }: { classement: Classement }) {
  const [objectif] = useState<ObjectifLigue>(lireObjectifLigue);
  const [zones] = useState(lireZonesAffichees);
  const moi = classement.moi;
  if (moi.rang === null || moi.taille === 0) {
    return null;
  }
  const estChampion = classement.league === "champion";
  const estBronze = classement.league === "bronze";
  const peutMonter = !estChampion && moi.seuilMontee !== null;
  const peutDescendre = !estBronze && moi.seuilRellegation !== null;
  const sansMouvement =
    moi.seuilMontee === null && moi.seuilRellegation === null;
  const viseur = objectif === "maintenir" ? "Maintien" : "Montée";
  const ligneEcart =
    objectif === "maintenir"
      ? peutDescendre
        ? moi.dansZoneRelagation
          ? classement.shieldActif
            ? "Relégation annulée par votre bouclier"
            : "Vous êtes dans la zone de relégation"
          : `Encore ${moi.margeRellegation.toLocaleString("fr-FR")} XP d'avance avant la relégation`
        : "Aucune relégation en Bronze"
      : peutMonter
        ? moi.dansZoneMontee
          ? "Vous êtes dans la zone de montée"
          : `Encore ${moi.ecartMontee.toLocaleString("fr-FR")} XP pour monter en Ligue ${nomLigue(classement.ligueSuivante)}`
        : "Vous êtes en Champion : maintenez votre place";
  const progression =
    peutMonter && !estChampion
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((moi.xpMoi / Math.max(1, moi.seuilMontee ?? 1)) * 100)
          )
        )
      : null;
  return (
    <div className="surface-quizzly-card rounded-3xl border border-q-border/40 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            {moi.rang}ᵉ sur {moi.taille}
          </p>
          <p className="text-xs text-muted-foreground">
            {moi.xpMoi.toLocaleString("fr-FR")} XP cette semaine
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {classement.shieldActif && (
            <span className="rounded-full bg-info/15 px-2.5 py-0.5 text-[11px] font-bold text-info">
              🛡 Bouclier actif
            </span>
          )}
          <span className="rounded-full bg-q-level/15 px-2.5 py-0.5 text-[11px] font-bold text-q-level">
            Objectif : {viseur}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-foreground">{ligneEcart}</p>
      {progression !== null && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-q-level transition-all"
              style={{ width: `${progression}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {progression} % du seuil de montée atteint
          </p>
        </div>
      )}
      {sansMouvement && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Cohorte de moins de 10 élèves : personne ne monte ni ne descend cette
          semaine.
        </p>
      )}
      {zones &&
        peutDescendre &&
        moi.dansZoneRelagation &&
        !classement.shieldActif && (
          <p className="mt-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] font-semibold text-destructive">
            Dernier sprint conseillé : une victoire de quiz suffit souvent à
            remonter.
          </p>
        )}
    </div>
  );
}

export function LiguesQuizzly() {
  const { data, error, isLoading } = useSWR<Classement>(
    "/api/quizzly/ligues",
    fetcher
  );
  const [joueurSelectionne, setJoueurSelectionne] = useState<string | null>(
    null
  );
  const [zonesAffichees] = useState(lireZonesAffichees);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
        <SparklesIcon className="size-8 text-q-level animate-spin" />
        <p className="text-sm">Chargement de la ligue…</p>
      </div>
    );
  }

  if (error || !data || !estLigue(data.league)) {
    return (
      <p className="p-8 text-sm text-destructive text-center">
        La ligue n'a pas pu être chargée.
      </p>
    );
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-5 p-4 sm:p-6">
      {/* En-tête de ligue */}
      <div className="surface-quizzly-card flex items-center gap-4 rounded-3xl border border-q-border/40 bg-card p-5 shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-q-level/10 ring-2 ring-q-border/30 shrink-0">
          <IconeLigue className="size-9" league={data.league} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              Ligue {nomLigue(data.league)}
            </h1>
            <span className="rounded-full bg-q-level/15 px-2.5 py-0.5 text-xs font-semibold text-q-level">
              Semaine {data.weekKey}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Les 5 premiers montent dans la division supérieure, les 5 derniers
            descendent. Clôture {formaterCloture(data.clotureAt)} (Paris).
          </p>
        </div>
      </div>

      {/* Carte de position : où en est le lecteur, et quoi viser ? */}
      <CartePosition classement={data} />

      {/* Échelle des divisions : la ligne d'arrivée et celle de départ */}
      <ol
        aria-label="Échelle des ligues"
        className="flex items-end justify-between gap-1 px-1"
      >
        {ECHELLE_LIGUES.map((etape, _index) => {
          const active = etape.id === data.league;
          const suivante =
            etape.id === data.ligueSuivante && data.league !== "champion";
          const precedente =
            etape.id === data.liguePrecedente && data.league !== "bronze";
          return (
            <li
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl border px-1 py-2 text-center",
                active
                  ? "border-q-level bg-q-level/10 shadow-sm"
                  : precedente || suivante
                    ? "border-q-border/50 bg-card"
                    : "border-q-border/30 bg-card/60 opacity-60"
              )}
              key={etape.id}
            >
              <IconeLigue className="size-5" league={etape.id} />
              <span
                className={cn(
                  "text-[10px] font-bold leading-tight",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {etape.libelle}
              </span>
              {active && (
                <span className="rounded-full bg-q-level px-1.5 py-0.2 text-[8px] font-bold text-q-on">
                  Vous
                </span>
              )}
              {suivante && !active && (
                <span className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Prochaine ↑
                </span>
              )}
              {precedente && !active && (
                <span className="text-[8px] font-semibold text-destructive">
                  Risque ↓
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Guide interactif */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground font-medium">
        <span>Classement hebdomadaire</span>
        <span>Touchez un élève pour voir son activité</span>
      </div>

      {/* Liste du classement */}
      <ol className="flex flex-col gap-2.5">
        {data.lignes.map((ligne) => {
          const estTop3 = ligne.rank <= 3;
          const estPromotion = zonesAffichees && ligne.rank <= 5;
          const estRelegation =
            zonesAffichees &&
            data.lignes.length > 10 &&
            ligne.rank > data.lignes.length - 5;

          return (
            <motion.li
              className={cn(
                "group surface-quizzly-card relative flex items-center gap-3.5 rounded-2xl border p-3.5 sm:px-4 cursor-pointer transition-all hover:border-q-level/60 hover:shadow-md active:scale-[0.99]",
                ligne.me
                  ? "border-q-level/60 bg-q-level/10 shadow-sm ring-1 ring-q-level/30"
                  : "border-q-border/30 bg-card hover:bg-q-level/5",
                estPromotion && !ligne.me && "border-emerald-500/30",
                estRelegation && !ligne.me && "border-destructive/20 opacity-90"
              )}
              key={ligne.rank}
              onClick={() => {
                playClickSound();
                setJoueurSelectionne(ligne.userId);
              }}
              whileHover={{ x: 2 }}
            >
              {/* Rang */}
              <div className="flex w-7 items-center justify-center shrink-0">
                {estTop3 ? (
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                      ligne.rank === 1 && "bg-amber-500 ring-2 ring-amber-300",
                      ligne.rank === 2 && "bg-slate-400 ring-2 ring-slate-300",
                      ligne.rank === 3 && "bg-amber-700 ring-2 ring-amber-500"
                    )}
                  >
                    {ligne.rank}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {ligne.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="shrink-0">
                {ligne.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-10 rounded-full object-cover ring-1 ring-q-border/40"
                    src={ligne.avatarUrl}
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-q-level/15 text-sm font-bold text-q-level ring-1 ring-q-border/40">
                    {ligne.displayName.slice(0, 1).toUpperCase() || "?"}
                  </div>
                )}
              </div>

              {/* Nom & Pseudo */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-foreground">
                    {ligne.displayName}
                  </p>
                  {ligne.me && (
                    <span className="rounded-full bg-q-level px-1.5 py-0.2 text-[9px] font-bold text-q-on">
                      Vous
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {ligne.username ? `@${ligne.username}` : "Élève"}
                </p>
              </div>

              {/* XP & Badge statut */}
              <div className="flex items-center gap-2 text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-q-level">
                    {ligne.weeklyXp.toLocaleString("fr-FR")} XP
                  </span>
                  {estPromotion && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Zone de montée ↑
                    </span>
                  )}
                  {estRelegation && (
                    <span className="text-[10px] font-semibold text-destructive">
                      Relégation ↓
                    </span>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* Modale d'activité du joueur */}
      <AnimatePresence>
        {joueurSelectionne && (
          <ModalActiviteJoueur
            onClose={() => setJoueurSelectionne(null)}
            userId={joueurSelectionne}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
