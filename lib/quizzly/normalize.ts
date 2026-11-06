/**
 * Ramène un chapitre rédigé vers le schéma Quizzly.
 *
 * Les fichiers de cours n'utilisent pas tous les mêmes noms de champs
 * (`prompt`, `stem`, options en objets, réponses en lettres). La lecture
 * les aligne avant validation : le parcours ne dépend pas du brouillon
 * d'origine.
 */

type Brut = Record<string, unknown>;

function estObjet(valeur: unknown): valeur is Brut {
  return (
    Boolean(valeur) && typeof valeur === "object" && !Array.isArray(valeur)
  );
}

function texte(valeur: unknown, max: number): string {
  if (typeof valeur !== "string") {
    return "";
  }
  return valeur.trim().slice(0, max);
}

function texteOption(option: unknown): { id: string; texte: string } {
  if (typeof option === "string") {
    return { id: "", texte: option.trim().slice(0, 160) };
  }
  if (!estObjet(option)) {
    return { id: "", texte: "" };
  }
  const brut = option.text ?? option.label ?? option.value;
  const id =
    typeof option.id === "string" ? option.id.trim().toLowerCase() : "";
  return {
    id,
    texte: typeof brut === "string" ? brut.trim().slice(0, 160) : "",
  };
}

function indexReponse(
  valeur: unknown,
  options: { id: string }[]
): number | null {
  if (typeof valeur === "number" && Number.isInteger(valeur)) {
    return valeur;
  }
  if (typeof valeur !== "string") {
    return null;
  }
  const lettre = valeur.trim().toLowerCase();
  if (/^[a-d]$/.test(lettre)) {
    const parId = options.findIndex((option) => option.id === lettre);
    if (parId >= 0) {
      return parId;
    }
    return lettre.charCodeAt(0) - 97;
  }
  const nombre = Number(lettre);
  return Number.isInteger(nombre) ? nombre : null;
}

function reponsesBrutes(question: Brut): unknown[] {
  if (Array.isArray(question.correctAnswers)) {
    return question.correctAnswers;
  }
  if (Array.isArray(question.correctIndices)) {
    return question.correctIndices;
  }
  if (question.correctIndex !== undefined) {
    return [question.correctIndex];
  }
  if (question.correctAnswer !== undefined) {
    return [question.correctAnswer];
  }
  return [];
}

function questionDepuis(brut: unknown, rang: number): Brut | null {
  if (!estObjet(brut) || !Array.isArray(brut.options)) {
    return null;
  }
  const options = brut.options
    .map(texteOption)
    .filter((option) => option.texte);
  const uniques: { id: string; texte: string }[] = [];
  for (const option of options) {
    const deja = uniques.some(
      (connue) => connue.texte.toLowerCase() === option.texte.toLowerCase()
    );
    if (!deja) {
      uniques.push(option);
    }
  }
  if (uniques.length < 4) {
    return null;
  }
  const retenues = uniques.slice(0, 4);
  const indexes = [
    ...new Set(
      reponsesBrutes(brut)
        .map((valeur) => indexReponse(valeur, retenues))
        .filter(
          (index): index is number => index !== null && index >= 0 && index < 4
        )
    ),
  ];
  if (indexes.length === 0) {
    return null;
  }
  const enonce = texte(brut.question ?? brut.prompt ?? brut.stem, 300);
  if (!enonce) {
    return null;
  }
  const explication =
    texte(brut.explanation, 400) || "La correction indique la bonne réponse.";
  return {
    correctAnswers: indexes,
    explanation: explication,
    id: `q${rang}`,
    options: retenues.map((option) => option.texte),
    question: enonce,
    type: indexes.length >= 2 ? "multiple_choice" : "single_choice",
  };
}

function ajusterTypes(questions: Brut[]): Brut[] {
  let multiples = 0;
  return questions.map((question, index) => {
    const reponses = question.correctAnswers;
    const liste = Array.isArray(reponses) ? reponses : [];
    const plusieurs = liste.length >= 2;
    if (plusieurs && multiples < 2 && (index === 0 || multiples === 0)) {
      multiples += 1;
      return {
        ...question,
        correctAnswers: liste.slice(0, 3),
        id: `q${index + 1}`,
        type: "multiple_choice",
      };
    }
    return {
      ...question,
      correctAnswers: liste.slice(0, 1),
      id: `q${index + 1}`,
      type: "single_choice",
    };
  });
}

function decouperQuiz(quiz: Brut): Brut[] {
  if (!Array.isArray(quiz.questions)) {
    return [];
  }
  const questions = quiz.questions
    .map((entree, index) => questionDepuis(entree, index + 1))
    .filter((question): question is Brut => question !== null);
  const morceaux: Brut[] = [];
  for (let curseur = 0; curseur + 10 <= questions.length; curseur += 10) {
    const titre =
      typeof quiz.title === "string" && quiz.title.trim()
        ? quiz.title.trim()
        : "Quiz";
    morceaux.push({
      questions: ajusterTypes(questions.slice(curseur, curseur + 10)),
      title: curseur === 0 ? titre : `${titre} (${curseur / 10 + 1})`,
    });
  }
  return morceaux;
}

function quizzesDepuis(brut: unknown): Brut[] {
  if (!Array.isArray(brut)) {
    return [];
  }
  const quizzes = brut.flatMap((entree) =>
    estObjet(entree) ? decouperQuiz(entree) : []
  );
  return quizzes.slice(0, 10).map((quiz, index) => ({
    ...quiz,
    id: `q${String(index + 1).padStart(2, "0")}`,
  }));
}

export function assouplirChapitre(entree: unknown): unknown {
  if (!estObjet(entree) || !Array.isArray(entree.units)) {
    return entree;
  }
  const quizzesRacine = Array.isArray(entree.quizzes) ? entree.quizzes : null;
  const unites = entree.units
    .filter(estObjet)
    .slice(0, 2)
    .map((unite, index) => {
      let quizzes = unite.quizzes;
      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        if (Array.isArray(unite.items)) {
          quizzes = unite.items;
        } else if (quizzesRacine) {
          const idUnite = typeof unite.id === "string" ? unite.id : "";
          quizzes = quizzesRacine.filter(
            (quiz) =>
              estObjet(quiz) &&
              (quiz.unitId === idUnite || quiz.unit === idUnite)
          );
        }
      }
      return {
        id: index === 0 ? "u1" : "u2",
        order: index === 0 ? 1 : 2,
        quizzes: quizzesDepuis(quizzes),
        title: texte(unite.title, 160) || (index === 0 ? "Unité 1" : "Unité 2"),
      };
    });
  if (unites.length < 2) {
    return entree;
  }
  return {
    ...entree,
    units: unites,
  };
}
