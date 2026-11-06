/**
 * Catalogues de quêtes Quizzly.
 *
 * Les questions du parcours vivent dans `curriculum`. Les quêtes, elles,
 * vivent ici : 100 quotidiennes et 100 hebdomadaires. Le serveur en tire
 * une par mesure, la même pour tout le monde, et fige le résultat pour
 * la période. Le client ne choisit ni la quête ni la récompense.
 */

import { z } from "zod";
import hebdomadaires from "@/lib/quizzly/quetes/hebdomadaires.json";
import quotidiennes from "@/lib/quizzly/quetes/quotidiennes.json";
import {
  GEMMES_QUETE_HEBDOMADAIRE,
  MESURES_HEBDOMADAIRES,
  MESURES_QUOTIDIENNES,
  type MesureQuete,
  type MonnaieQuete,
  type PorteeQuete,
  type QueteDefinition,
  XP_QUETE_QUOTIDIENNE,
} from "@/lib/quizzly/rules";

const mesureSchema = z.enum(MESURES_HEBDOMADAIRES);

const queteSchema = z
  .object({
    description: z.string().min(8).max(180),
    id: z.string().regex(/^(?:qd|qh)-\d{3}$/),
    mesure: mesureSchema,
    monnaie: z.enum(["xp", "gemmes"]),
    objectif: z.number().int().positive(),
    recompense: z.number().int().positive(),
    titre: z.string().min(3).max(80),
  })
  .strict();

export type QuetePubliee = QueteDefinition & { portee: PorteeQuete };

function publier(
  brut: unknown,
  portee: PorteeQuete,
  prefixe: "qd" | "qh",
  mesures: readonly MesureQuete[],
  monnaie: MonnaieQuete
): QuetePubliee[] {
  const parsed = z.array(queteSchema).length(100).safeParse(brut);
  if (!parsed.success) {
    throw new Error(
      `Catalogue Quizzly ${portee} illisible : ${parsed.error.issues[0]?.message ?? "forme refusée"}.`
    );
  }
  const vus = new Set<string>();
  const titres = new Set<string>();
  return parsed.data.map((quete) => {
    if (!quete.id.startsWith(`${prefixe}-`)) {
      throw new Error(`Identifiant de quête inattendu : ${quete.id}.`);
    }
    if (vus.has(quete.id) || titres.has(quete.titre)) {
      throw new Error(`Quête dupliquée : ${quete.id}.`);
    }
    if (!mesures.includes(quete.mesure)) {
      throw new Error(`${quete.id} utilise une mesure hors période.`);
    }
    if (quete.monnaie !== monnaie) {
      throw new Error(`${quete.id} n'a pas la monnaie de sa période.`);
    }
    controlerObjectif(quete);
    vus.add(quete.id);
    titres.add(quete.titre);
    return { ...quete, portee };
  });
}

function controlerObjectif(quete: z.infer<typeof queteSchema>): void {
  const { id, mesure, objectif, recompense, monnaie } = quete;
  if (id.startsWith("qd-")) {
    if (recompense !== XP_QUETE_QUOTIDIENNE || monnaie !== "xp") {
      throw new Error(`${id} doit rapporter ${XP_QUETE_QUOTIDIENNE} XP.`);
    }
    const plafond =
      mesure === "quiz_valide"
        ? objectif >= 1 && objectif <= 3
        : mesure === "sans_faute"
          ? objectif >= 1 && objectif <= 2
          : mesure === "bonnes_reponses" && objectif >= 8 && objectif <= 30;
    if (!plafond) {
      throw new Error(`${id} a un objectif quotidien impossible.`);
    }
    return;
  }
  if (
    !GEMMES_QUETE_HEBDOMADAIRE.includes(
      recompense as (typeof GEMMES_QUETE_HEBDOMADAIRE)[number]
    )
  ) {
    throw new Error(`${id} a une récompense de gemmes inattendue.`);
  }
  const plafond =
    mesure === "quiz_valide"
      ? objectif >= 4 && objectif <= 12
      : mesure === "sans_faute"
        ? objectif >= 2 && objectif <= 4
        : mesure === "bonnes_reponses"
          ? objectif >= 40 && objectif <= 100
          : mesure === "serie"
            ? objectif === 3 || objectif === 5 || objectif === 7
            : mesure === "jours_actifs" && objectif >= 2 && objectif <= 5;
  if (!plafond) {
    throw new Error(`${id} a un objectif hebdomadaire impossible.`);
  }
}

export const QUETES_QUOTIDIENNES = publier(
  quotidiennes,
  "daily",
  "qd",
  MESURES_QUOTIDIENNES,
  "xp"
);

export const QUETES_HEBDOMADAIRES = publier(
  hebdomadaires,
  "weekly",
  "qh",
  MESURES_HEBDOMADAIRES,
  "gemmes"
);

const PAR_ID = new Map<string, QuetePubliee>(
  [...QUETES_QUOTIDIENNES, ...QUETES_HEBDOMADAIRES].map((quete) => [
    quete.id,
    quete,
  ])
);

export function quetePubliee(id: string): QuetePubliee | undefined {
  return PAR_ID.get(id);
}

export function catalogueDe(portee: PorteeQuete): readonly QuetePubliee[] {
  return portee === "daily" ? QUETES_QUOTIDIENNES : QUETES_HEBDOMADAIRES;
}
