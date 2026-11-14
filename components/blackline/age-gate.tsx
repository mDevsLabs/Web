"use client";

/**
 * ============================================================================
 * ACCUEIL DE BLACKLINE — PRÉSENTATION, ÉNERGIE ET CONFIRMATION D'ÂGE
 * ============================================================================
 *
 * POURQUOI CET ÉCRAN
 *
 * L'entrée dans le jeu n'était qu'une modale de confirmation d'âge posée sur
 * un fond vide : rien ne disait ce qu'on allait lancer, ni ce que cela allait
 * coûter à la machine. L'accueil réunit donc trois choses, dans cet ordre de
 * lecture :
 *
 *   1. CE QUE C'EST — le jeu, ses chiffres, ses trois promesses (solo, local,
 *      réglages partagés par le compte) ;
 *   2. CE QUE ÇA CONSOMME — le profil énergétique de l'appareil et la
 *      dérogation de session éventuelle, dite en clair ;
 *   3. CE QUE ÇA DEMANDE — la confirmation d'âge, qui reste la dernière
 *      action avant le montage du moteur.
 *
 * LA RÈGLE DE L'ÂGE NE CHANGE PAS
 *
 * La confirmation est demandée à CHAQUE entrée dans le jeu, et rien n'est
 * écrit : ni en base, ni dans le `localStorage`, ni dans un cookie. Elle vit
 * dans l'état du composant. La refonte ne touche pas à ce contrat — elle range
 * simplement la question dans un écran qui l'explique.
 *
 * L'ÉCRAN EST UN DIALOGUE
 *
 * Il porte `role="dialog"` et `aria-modal`, le focus entre sur la
 * confirmation, et `Échap` ne le ferme pas : c'est une condition d'accès, pas
 * une fenêtre à refermer. Le refus n'est pas une impasse — il laisse place à
 * un message et un retour vers mAI.
 */

import {
  CpuIcon,
  CrosshairIcon,
  HardDriveIcon,
  MoonStarIcon,
  ShieldAlertIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
} from "@mdevs/icons";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type DevicePowerProfile,
  formatPowerLabel,
  type SessionDerogation,
} from "@/lib/blackline/power";

export type AgeGateResult = "accepted" | "refused";

type BlacklineAgeGateProps = {
  onDecide: (result: AgeGateResult) => void;
  /** Profil énergétique lu par l'hôte, s'il a pu être obtenu. */
  power?: DevicePowerProfile | null;
  /** Dérogation de session décidée par l'hôte (jamais écrite en base). */
  derogation?: SessionDerogation | null;
};

/** Les trois promesses du jeu, affichées telles quelles. */
const PROMESSES = [
  {
    icon: UsersIcon,
    text: "Quatre alliés et quatre ennemis au plus, quatre modes, quatre secteurs.",
    title: "Solo contre bots",
  },
  {
    icon: TrophyIcon,
    text: "XP, armes et carrière restent sur cet appareil, avec export et import.",
    title: "Progression locale",
  },
  {
    icon: HardDriveIcon,
    text: "Vos réglages suivent votre compte mAI ; la progression, elle, reste ici.",
    title: "Réglages partagés",
  },
] as const;

/** Chiffres de la fiche technique. */
const CHIFFRES = [
  { label: "Arènes", value: "4" },
  { label: "Modes", value: "4" },
  { label: "Armes", value: "8" },
  { label: "Tokens IA", value: "0" },
] as const;

export function BlacklineAgeGate({
  onDecide,
  power = null,
  derogation = null,
}: BlacklineAgeGateProps) {
  const [refuse, setRefuse] = useState(false);
  const confirmerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Le focus entre dans l'écran : la confirmation est la seule action qui
    // mène au jeu, et le clavier ne doit pas rester sur le document hôte.
    confirmerRef.current?.focus();
  }, []);

  return (
    <div
      aria-labelledby="blackline-age-titre"
      aria-modal="true"
      className="absolute inset-0 z-50 overflow-y-auto bg-[#0f1714]/95 p-0"
      onKeyDown={(event) => {
        // `Échap` ne ferme pas : la question doit recevoir une réponse.
        if (event.key === "Escape") {
          event.preventDefault();
        }
      }}
      role="dialog"
    >
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 p-4 sm:p-8">
        {/* En-tête : le mot-symbole et la classification. */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#c6dd94]/70">
              mAI · Opération Horizon
            </p>
            <h1 className="mt-1 font-black text-3xl tracking-tight text-[#eef4e4] sm:text-4xl">
              BLACKLINE
            </h1>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#e89473]/40 bg-[#e89473]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#e89473]">
            <ShieldAlertIcon className="size-3.5" />
            PEGI 16
          </span>
        </header>

        {/* Héros : la promesse du jeu en une phrase. */}
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card flex flex-col gap-3 border-white/10 bg-white/[0.03] p-5">
            <p className="text-2xl font-black leading-tight text-[#eef4e4] sm:text-3xl">
              CHAQUE ANGLE <span className="text-[#c6dd94]">COMPTE.</span>
            </p>
            <p className="max-w-prose text-sm leading-relaxed text-[#c6dd94]/75">
              FPS tactique en solo : prenez les toits, tenez la ligne, survivez
              aux vagues. Aucune dépense de token, aucune synchronisation en
              ligne — le moteur tourne dans cet onglet.
            </p>
            <dl className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHIFFRES.map((chiffre) => (
                <div
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  key={chiffre.label}
                >
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[#c6dd94]/60">
                    {chiffre.label}
                  </dt>
                  <dd className="font-black text-xl text-[#eef4e4]">
                    {chiffre.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Énergie : ce que le jeu va demander à la machine. */}
          <div className="surface-card flex flex-col gap-2 border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#c6dd94]">
              <ZapIcon className="size-3.5" />
              Énergie & ressources
            </div>
            <p className="flex items-center gap-2 text-sm text-[#eef4e4]">
              <CpuIcon className="size-3.5 text-[#c6dd94]/70" />
              {power ? formatPowerLabel(power) : "Alimentation inconnue"}
            </p>
            <p className="text-xs leading-relaxed text-[#c6dd94]/70">
              {derogation?.reason ??
                "Aucune dérogation : les réglages de votre compte s'appliquent tels quels."}
            </p>
            <div className="mt-1 flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
              <MoonStarIcon className="mt-0.5 size-3.5 shrink-0 text-[#c6dd94]" />
              <p className="text-[11px] leading-relaxed text-[#c6dd94]/75">
                Pendant la partie, <strong>mAI se met en veille</strong> :
                animations coupées, notifications et rafraîchissements
                suspendus, temps réel arrêté. C'est ce qui laisse le GPU au jeu.
              </p>
            </div>
          </div>
        </section>

        {/* Les trois promesses, en clair. */}
        <section className="grid gap-2 sm:grid-cols-3">
          {PROMESSES.map((promesse) => (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              key={promesse.title}
            >
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#eef4e4]">
                <promesse.icon className="size-3.5 text-[#c6dd94]" />
                {promesse.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#c6dd94]/70">
                {promesse.text}
              </p>
            </div>
          ))}
        </section>

        {/* Confirmation d'âge — la dernière question avant le moteur. */}
        <section className="surface-card flex flex-col gap-3 border-white/10 bg-white/[0.03] p-5">
          <h2
            className="flex items-center gap-2 text-base font-bold text-[#eef4e4]"
            id="blackline-age-titre"
          >
            <ShieldAlertIcon className="size-4 text-[#e89473]" />
            Un jeu de combat, classé 16+
          </h2>
          <p className="text-sm text-[#c6dd94]/75">
            Le jeu représente des armes à feu, des affrontements et des
            éliminations. Il s&apos;adresse aux personnes de{" "}
            <strong>16 ans ou plus</strong>. Votre âge est demandé à chaque
            lancement et n&apos;est ni enregistré ni mémorisé.
          </p>

          {refuse ? (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm text-[#eef4e4]">
                Blackline n&apos;est pas accessible aux moins de 16 ans. Vous
                pouvez continuer à utiliser mAI normalement.
              </p>
              <Button asChild className="w-fit" variant="outline">
                <a href="/">Retour à mAI</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="flex items-center gap-2 bg-[#c6dd94] text-[#0f1714] hover:bg-[#d6e9ac]"
                onClick={() => onDecide("accepted")}
                ref={confirmerRef}
              >
                <CrosshairIcon className="size-4" />
                J&apos;ai 16 ans ou plus — lancer le jeu
              </Button>
              <Button
                className="sm:ml-auto"
                onClick={() => setRefuse(true)}
                variant="outline"
              >
                J&apos;ai moins de 16 ans
              </Button>
            </div>
          )}
        </section>

        <p className="text-center text-[10px] uppercase tracking-wider text-[#c6dd94]/40">
          Le jeu ne consomme aucun token IA · Progression stockée sur cet
          appareil
        </p>
      </div>
    </div>
  );
}
