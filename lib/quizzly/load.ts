/**
 * Lecture des chapitres JSON.
 *
 * Le parcours ne charge que les fichiers présents : une année encore en
 * cours de rédaction s'affiche sans les chapitres manquants. Les bonnes
 * réponses restent dans l'index serveur ; `versQuizPublic` les retire.
 */

import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assouplirChapitre } from "@/lib/quizzly/normalize";
import {
  estAnneeScolaire,
  PROGRAM,
  SCHOOL_YEARS,
  type SchoolYear,
  type SubjectSpec,
} from "@/lib/quizzly/program";
import {
  type ChapterFile,
  chapterSchema,
  type QuizQuestion,
  versQuizPublic,
} from "@/lib/quizzly/schema";

const RACINE = path.join(process.cwd(), "lib", "quizzly", "curriculum");

export type LoadedQuiz = {
  chapterTitle: string;
  id: string;
  questions: QuizQuestion[];
  subjectId: string;
  subjectLabel: string;
  title: string;
  unitTitle: string;
  year: SchoolYear;
};

export type NoeudQuiz = {
  id: string;
  title: string;
};

export type NoeudUnite = {
  id: string;
  quizzes: NoeudQuiz[];
  title: string;
};

export type NoeudChapitre = {
  id: string;
  order: number;
  title: string;
  units: NoeudUnite[];
};

export type NoeudMatiere = {
  chapters: NoeudChapitre[];
  id: string;
  label: string;
};

export type CurriculumIndex = {
  ordreParMatiere: Map<string, string[]>;
  parAnnee: Map<SchoolYear, NoeudMatiere[]>;
  quizzes: Map<string, LoadedQuiz>;
};

let cacheProduction: CurriculumIndex | null = null;

function cleMatiere(annee: SchoolYear, matiereId: string): string {
  return `${annee}/${matiereId}`;
}

export function identifiantQuiz(
  annee: string,
  matiereId: string,
  fichier: string,
  unite: string,
  quiz: string
): string {
  return `${annee}/${matiereId}/${fichier}/${unite}/${quiz}`;
}

const QUIZ_ID =
  /^(6e|5e|4e|3e|2nde|1ere|terminale)\/([a-z0-9-]+)\/(01|02|03)\/(u1|u2)\/(q(?:0[1-9]|10))$/;

export function analyserIdentifiantQuiz(id: string): {
  fichier: "01" | "02" | "03";
  matiereId: string;
  quiz: string;
  unite: "u1" | "u2";
  year: SchoolYear;
} | null {
  const trouve = QUIZ_ID.exec(id);
  if (!trouve) {
    return null;
  }
  const year = trouve[1];
  if (!year || !estAnneeScolaire(year)) {
    return null;
  }
  const matiereId = trouve[2];
  const fichier = trouve[3];
  const unite = trouve[4];
  const quiz = trouve[5];
  if (!matiereId || !fichier || !unite || !quiz) {
    return null;
  }
  if (fichier !== "01" && fichier !== "02" && fichier !== "03") {
    return null;
  }
  if (unite !== "u1" && unite !== "u2") {
    return null;
  }
  return { fichier, matiereId, quiz, unite, year };
}

function integrerChapitre(
  index: CurriculumIndex,
  annee: SchoolYear,
  matiere: SubjectSpec,
  fichier: "01" | "02" | "03",
  chapitre: ChapterFile
): void {
  if (
    chapitre.year !== annee ||
    chapitre.subject !== matiere.id ||
    chapitre.order !== Number(fichier)
  ) {
    console.error(
      `Quizzly : ${annee}/${matiere.id}/${fichier}.json ne correspond pas à son chemin.`
    );
    return;
  }
  const matieres = index.parAnnee.get(annee) ?? [];
  let noeud = matieres.find((entree) => entree.id === matiere.id);
  if (!noeud) {
    noeud = { chapters: [], id: matiere.id, label: matiere.label };
    matieres.push(noeud);
    index.parAnnee.set(annee, matieres);
  }
  const uniteNoeuds: NoeudUnite[] = [];
  for (const unite of chapitre.units) {
    const quizzes: NoeudQuiz[] = [];
    for (const quiz of unite.quizzes) {
      const id = identifiantQuiz(annee, matiere.id, fichier, unite.id, quiz.id);
      index.quizzes.set(id, {
        chapterTitle: chapitre.title,
        id,
        questions: quiz.questions,
        subjectId: matiere.id,
        subjectLabel: matiere.label,
        title: quiz.title,
        unitTitle: unite.title,
        year: annee,
      });
      quizzes.push({ id, title: quiz.title });
    }
    uniteNoeuds.push({ id: unite.id, quizzes, title: unite.title });
  }
  noeud.chapters.push({
    id: chapitre.id,
    order: chapitre.order,
    title: chapitre.title,
    units: uniteNoeuds,
  });
  noeud.chapters.sort((a, b) => a.order - b.order);
}

async function lireChapitre(
  annee: SchoolYear,
  matiereId: string,
  fichier: "01" | "02" | "03"
): Promise<ChapterFile | null> {
  const complet = path.join(RACINE, annee, matiereId, `${fichier}.json`);
  const relatif = path.relative(RACINE, complet);
  if (relatif.startsWith("..") || path.isAbsolute(relatif)) {
    return null;
  }
  let brut: string;
  try {
    brut = await readFile(complet, "utf8");
  } catch {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(brut);
  } catch (erreur) {
    console.error(`Quizzly : JSON illisible ${relatif}`, erreur);
    return null;
  }
  const parsed = chapterSchema.safeParse(assouplirChapitre(json));
  if (!parsed.success) {
    console.error(
      `Quizzly : chapitre refusé ${relatif}`,
      parsed.error.issues[0]
    );
    return null;
  }
  return parsed.data;
}

async function construireIndex(): Promise<CurriculumIndex> {
  const index: CurriculumIndex = {
    ordreParMatiere: new Map(),
    parAnnee: new Map(),
    quizzes: new Map(),
  };
  let anneesPresentes = new Set<string>();
  try {
    const entrees = await readdir(RACINE, { withFileTypes: true });
    anneesPresentes = new Set(
      entrees
        .filter((entree) => entree.isDirectory())
        .map((entree) => entree.name)
    );
  } catch {
    anneesPresentes = new Set();
  }
  for (const annee of SCHOOL_YEARS) {
    if (!anneesPresentes.has(annee)) {
      continue;
    }
    for (const matiere of PROGRAM[annee]) {
      for (const fichier of ["01", "02", "03"] as const) {
        const chapitre = await lireChapitre(annee, matiere.id, fichier);
        if (chapitre) {
          integrerChapitre(index, annee, matiere, fichier, chapitre);
        }
      }
      const ordre: string[] = [];
      const noeud = index.parAnnee
        .get(annee)
        ?.find((entree) => entree.id === matiere.id);
      if (noeud) {
        for (const chapitre of noeud.chapters) {
          for (const unite of chapitre.units) {
            for (const quiz of unite.quizzes) {
              ordre.push(quiz.id);
            }
          }
        }
      }
      if (ordre.length > 0) {
        index.ordreParMatiere.set(cleMatiere(annee, matiere.id), ordre);
      }
    }
  }
  return index;
}

export async function obtenirIndex(): Promise<CurriculumIndex> {
  if (process.env.NODE_ENV === "production" && cacheProduction) {
    return cacheProduction;
  }
  const index = await construireIndex();
  if (process.env.NODE_ENV === "production") {
    cacheProduction = index;
  }
  return index;
}

export async function obtenirQuiz(id: string): Promise<LoadedQuiz | null> {
  const analyse = analyserIdentifiantQuiz(id);
  if (!analyse) {
    return null;
  }
  const index = await obtenirIndex();
  return index.quizzes.get(id) ?? null;
}

export function quizPublic(quiz: LoadedQuiz) {
  return versQuizPublic(quiz);
}

export function precedentQuiz(
  index: CurriculumIndex,
  id: string
): string | null {
  const analyse = analyserIdentifiantQuiz(id);
  if (!analyse) {
    return null;
  }
  const ordre = index.ordreParMatiere.get(
    cleMatiere(analyse.year, analyse.matiereId)
  );
  if (!ordre) {
    return null;
  }
  const position = ordre.indexOf(id);
  if (position <= 0) {
    return null;
  }
  return ordre[position - 1] ?? null;
}

export function suivantQuiz(index: CurriculumIndex, id: string): string | null {
  const analyse = analyserIdentifiantQuiz(id);
  if (!analyse) {
    return null;
  }
  const ordre = index.ordreParMatiere.get(
    cleMatiere(analyse.year, analyse.matiereId)
  );
  if (!ordre) {
    return null;
  }
  const position = ordre.indexOf(id);
  if (position < 0) {
    return null;
  }
  return ordre[position + 1] ?? null;
}
