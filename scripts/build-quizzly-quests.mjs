/**
 * Construit les catalogues de quêtes Quizzly.
 * Le JSON versionné est la source : ce script ne sert qu'à le régénérer.
 */
import { writeFileSync } from "node:fs";

const quotidien = [];
const hebdo = [];

function ajouter(
  liste,
  prefixe,
  mesure,
  titre,
  description,
  objectif,
  recompense,
  monnaie
) {
  const index = liste.length + 1;
  liste.push({
    description,
    id: `${prefixe}-${String(index).padStart(3, "0")}`,
    mesure,
    monnaie,
    objectif,
    recompense,
    titre,
  });
}

const quizJour = [
  [1, "La mise en route", "Valide un quiz avant la fin de la journée."],
  [2, "Double départ", "Enchaîne deux quiz validés aujourd'hui."],
  [3, "Trio du matin", "Trois quiz validés, et la journée est lancée."],
  [1, "Le quiz du goûter", "Un seul quiz suffit : valide-le aujourd'hui."],
  [2, "Aller-retour", "Valide un quiz, puis un second dans la foulée."],
  [3, "La petite série", "Trois validations aujourd'hui, sans te presser."],
  [1, "Premier feu vert", "Décroche une validation avant minuit."],
  [
    2,
    "Deux portes ouvertes",
    "Deux quiz validés ouvrent la suite du parcours.",
  ],
  [3, "Cap sur trois", "Vise trois quiz validés d'ici ce soir."],
  [1, "Une victoire nette", "Un quiz réussi aujourd'hui compte pour la quête."],
  [
    2,
    "Le second souffle",
    "Après un quiz validé, recommence et valide le suivant.",
  ],
  [3, "Trois coches", "Trois quiz au compteur des validations du jour."],
  [
    1,
    "Le pas du jour",
    "Aujourd'hui, une validation suffit à remplir la quête.",
  ],
  [2, "Binôme de quiz", "Valide deux quiz distincts avant la nuit."],
  [3, "Triplet gagnant", "Trois quiz validés ferment cette quête."],
  [
    1,
    "Validation éclair",
    "Un quiz réussi, et cette quête quotidienne est bouclée.",
  ],
  [2, "Deux manches", "Gagne deux validations dans la même journée."],
  [3, "La règle de trois", "Trois quiz validés, pas un de moins."],
  [1, "Le seuil du jour", "Passe le seuil : un quiz validé aujourd'hui."],
  [2, "Retour gagnant", "Valide un quiz, reviens, et valide-en un autre."],
  [3, "Trois étapes", "Chaque quiz validé avance d'un cran, jusqu'à trois."],
  [1, "Ouverture de session", "Commence par valider un quiz."],
  [2, "Deuxième carte", "Deux quiz validés tamponnent la journée."],
  [3, "Tour complet", "Trois validations bouclent le tour du jour."],
  [1, "Le quiz témoin", "Un quiz validé prouve que tu as révisé aujourd'hui."],
  [2, "Paire validée", "Deux quiz au vert avant minuit."],
  [3, "Trois feux verts", "Trois quiz validés, trois feux au vert."],
  [1, "Juste un succès", "Un succès aujourd'hui, et la quête est tenue."],
  [2, "Deux succès", "Accumule deux quiz validés dans la journée."],
  [3, "Succès en cascade", "Valide trois quiz, l'un après l'autre."],
  [
    1,
    "La coche unique",
    "Une validation, une coche, et tu passes à autre chose.",
  ],
  [2, "Double coche", "Deux coches de validation avant la fin du jour."],
  [3, "Triple coche", "Trois coches : la quête quotidienne est pleine."],
  [
    1,
    "Dernier créneau",
    "S'il ne reste qu'un quiz à valider aujourd'hui, fais-le.",
  ],
];

const fautesJour = [
  [1, "Sans une faute", "Réussis un quiz avec les dix réponses justes."],
  [2, "Deux copies blanches", "Deux sans-faute aujourd'hui, sur deux quiz."],
  [1, "La copie parfaite", "Un dix sur dix suffit pour cette quête."],
  [
    2,
    "Parfait, deux fois",
    "Renouvelle un sans-faute une seconde fois aujourd'hui.",
  ],
  [1, "Zéro erreur", "Termine un quiz sans laisser passer une erreur."],
  [2, "Deux parcours nets", "Deux quiz parfaits dans la même journée."],
  [1, "Dix sur dix", "Vise le sans-faute sur un quiz du jour."],
  [2, "La paire parfaite", "Deux dix sur dix avant minuit."],
  [1, "Aucune hésitation", "Un quiz entier, toutes les réponses justes."],
  [2, "Double perfection", "Deux quiz sans la moindre faute aujourd'hui."],
  [
    1,
    "Le sans-faute du jour",
    "Aujourd'hui, un quiz parfait remplit la quête.",
  ],
  [2, "Second sans-faute", "Après un premier parfait, signe-en un second."],
  [1, "Pleine feuille", "Les dix questions justes sur un même quiz."],
  [2, "Deux feuilles pleines", "Deux quiz à dix sur dix dans la journée."],
  [1, "Précision du jour", "Une précision totale : un quiz sans erreur."],
  [2, "Précision redoublée", "Répète l'exploit : deux sans-faute aujourd'hui."],
  [1, "Carton plein", "Un carton plein sur un quiz vaut la quête."],
  [2, "Deux cartons", "Deux cartons pleins avant la fin du jour."],
  [
    1,
    "Rien à corriger",
    "Valide un quiz que le correcteur n'a pas à reprendre.",
  ],
  [
    2,
    "Rien à reprendre, deux fois",
    "Deux quiz que tu n'as pas à recommencer pour une faute.",
  ],
  [1, "L'excellence brève", "Un seul sans-faute, et cette quête est close."],
  [2, "Excellence suivie", "Deux sans-faute d'affilée dans la journée."],
  [1, "Le quiz immaculé", "Aucune case fausse sur les dix questions."],
  [2, "Deux quiz immaculés", "Deux quiz sans case fausse aujourd'hui."],
  [1, "Justesse totale", "Toutes les réponses justes, sur un quiz."],
  [2, "Justesse confirmée", "Confirme par un second sans-faute."],
  [1, "Le plein du jour", "Fais le plein : dix bonnes réponses sur dix."],
  [2, "Deux pleins", "Deux quiz au maximum de bonnes réponses."],
  [1, "Sans rature", "Un quiz sans rature, dix réponses tenues."],
  [2, "Deux copies nettes", "Deux copies nettes, deux sans-faute."],
  [1, "L'unique parfait", "Un parfait aujourd'hui, et c'est assez."],
  [2, "Les deux parfaits", "Deux parfaits, et la quête quotidienne est faite."],
  [
    1,
    "Dernière ligne droite",
    "Finis un quiz sur une dernière ligne sans faute.",
  ],
];

const reponsesJour = [
  [
    8,
    "Huit justes",
    "Cumule huit bonnes réponses sur tes premières validations.",
  ],
  [
    12,
    "Douzaine juste",
    "Douze bonnes réponses, comptées à la première validation.",
  ],
  [
    15,
    "Quinze solides",
    "Quinze bonnes réponses aujourd'hui, sur des quiz validés.",
  ],
  [20, "Vingt au compteur", "Vingt bonnes réponses avant minuit."],
  [25, "Vingt-cinq justes", "Pousse le compteur à vingt-cinq bonnes réponses."],
  [30, "Trente réponses", "Trente bonnes réponses ferment la quête du jour."],
  [8, "Le paquet de huit", "Huit réponses justes suffisent pour aujourd'hui."],
  [
    12,
    "Trois quiz, douze justes",
    "À raison de quelques justes par quiz, atteins douze.",
  ],
  [
    15,
    "Au-delà du seuil",
    "Dépasse le simple huit sur dix : quinze justes au total.",
  ],
  [
    20,
    "Deux quiz bien remplis",
    "Deux quiz solides peuvent faire ces vingt justes.",
  ],
  [25, "La barre des vingt-cinq", "Vingt-cinq bonnes réponses sur la journée."],
  [
    30,
    "Trois quiz presque pleins",
    "Trente justes, comme trois quiz bien maîtrisés.",
  ],
  [8, "Juste assez", "Huit bonnes réponses, le minimum d'un quiz réussi."],
  [
    12,
    "Un cran de plus",
    "Douze bonnes réponses, un cran au-dessus d'un seul quiz.",
  ],
  [15, "Milieu de journée", "Quinze justes avant que la journée ne se ferme."],
  [
    20,
    "Score de journée",
    "Vingt bonnes réponses constituent le score du jour.",
  ],
  [25, "Révision appuyée", "Vingt-cinq justes demandent plus d'un quiz."],
  [
    30,
    "Grosse séance",
    "Trente bonnes réponses : une vraie séance de révision.",
  ],
  [8, "Huit coches", "Huit coches de bonnes réponses aujourd'hui."],
  [12, "Douze coches", "Douze coches, et cette quête est remplie."],
  [15, "Quinze coches", "Quinze bonnes réponses cochées sur le jour."],
  [20, "Vingt coches", "Vingt coches de réponses justes."],
  [25, "Vingt-cinq coches", "Le compteur s'arrête à vingt-cinq justes."],
  [30, "Trente coches", "Trente coches : le plafond du jour pour cette quête."],
  [8, "Première moisson", "Récolte huit bonnes réponses."],
  [12, "Moisson élargie", "Récolte douze bonnes réponses."],
  [15, "Moisson sérieuse", "Quinze bonnes réponses récoltées aujourd'hui."],
  [20, "Belle moisson", "Vingt bonnes réponses dans la journée."],
  [25, "Moisson pleine", "Vingt-cinq justes, la moisson est pleine."],
  [30, "Moisson record", "Trente bonnes réponses, le record du jour visé ici."],
  [8, "Huit étoiles", "Huit réponses qui méritent une étoile."],
  [12, "Douze étoiles", "Douze étoiles de bonnes réponses."],
  [20, "Vingt étoiles", "Vingt étoiles avant la fin du jour."],
];

const quizSemaine = [
  [4, "Quatre validations", "Valide quatre quiz pendant la semaine.", 20],
  [5, "La main de cinq", "Cinq quiz validés d'ici dimanche.", 20],
  [6, "Six au tableau", "Six validations dans la semaine.", 40],
  [
    8,
    "Huit quiz, une semaine",
    "Huit quiz validés avant la fin de la semaine.",
    40,
  ],
  [10, "Dix validations", "Dix quiz au vert sur sept jours.", 70],
  [
    12,
    "Douze marches",
    "Douze quiz validés : la marche haute de la semaine.",
    70,
  ],
  [
    4,
    "Rythme léger",
    "Quatre quiz suffisent si tu les valides cette semaine.",
    20,
  ],
  [
    5,
    "Un quiz, presque chaque jour",
    "Cinq validations réparties sur la semaine.",
    20,
  ],
  [6, "Semaine en six temps", "Six quiz validés, à ton rythme.", 40],
  [8, "Deux par créneau", "Huit validations, par exemple deux par séance.", 40],
  [10, "La dizaine", "Une dizaine de quiz validés cette semaine.", 70],
  [
    12,
    "Semaine chargée",
    "Douze quiz validés demandent de revenir souvent.",
    70,
  ],
  [4, "Le quota court", "Quatre quiz validés ferment ce quota.", 20],
  [
    5,
    "Quota de cinq",
    "Cinq validations, et la quête hebdomadaire est faite.",
    20,
  ],
  [6, "Quota de six", "Six quiz validés dans la semaine ISO.", 40],
  [8, "Quota de huit", "Huit validations avant le lundi suivant.", 40],
  [10, "Quota de dix", "Dix quiz validés, le quota ambitieux.", 70],
  [12, "Quota de douze", "Douze validations : le quota le plus long.", 70],
  [5, "Cinq portes", "Ouvre cinq quiz en les validant cette semaine.", 20],
  [8, "Huit portes", "Huit quiz validés, huit portes franchies.", 40],
];

const fautesSemaine = [
  [2, "Deux parfaits", "Deux sans-faute au cours de la semaine.", 20],
  [3, "Trois parfaits", "Trois quiz à dix sur dix cette semaine.", 40],
  [4, "Quatre parfaits", "Quatre sans-faute avant dimanche.", 70],
  [2, "Paire sans faute", "Une paire de quiz parfaits dans la semaine.", 20],
  [3, "Trio sans faute", "Trois quiz sans aucune erreur.", 40],
  [4, "Quatuor parfait", "Quatre quiz immaculés sur la semaine.", 70],
  [2, "Double dix", "Deux fois dix sur dix, pas forcément le même jour.", 20],
  [3, "Triple dix", "Trois dix sur dix dans la semaine.", 40],
  [4, "Quadruple dix", "Quatre dix sur dix : la quête difficile.", 70],
  [2, "Deux copies d'excellence", "Deux copies sans rature cette semaine.", 20],
  [
    3,
    "Trois copies d'excellence",
    "Trois quiz que tu n'as pas à reprendre.",
    40,
  ],
  [
    4,
    "Quatre copies d'excellence",
    "Quatre sans-faute, et les gemmes sont là.",
    70,
  ],
  [2, "Précision de semaine", "Deux quiz d'une précision totale.", 20],
  [3, "Précision tenue", "Tiens trois sans-faute sur sept jours.", 40],
  [4, "Précision rare", "Quatre sans-faute dans la même semaine.", 70],
  [
    2,
    "Deux cartons de semaine",
    "Deux cartons pleins avant la fin de semaine.",
    20,
  ],
  [3, "Trois cartons de semaine", "Trois cartons pleins sur la période.", 40],
  [
    4,
    "Quatre cartons de semaine",
    "Quatre cartons pleins, l'objectif haut.",
    70,
  ],
  [3, "Sans-faute répété", "Répète le sans-faute jusqu'à trois fois.", 40],
  [
    4,
    "Sans-faute installé",
    "Quatre sans-faute installent vraiment la maîtrise.",
    70,
  ],
];

const reponsesSemaine = [
  [40, "Quarante justes", "Quarante bonnes réponses sur la semaine.", 20],
  [50, "Cinquante justes", "Cinquante bonnes réponses avant dimanche.", 20],
  [60, "Soixante justes", "Soixante bonnes réponses dans la semaine.", 40],
  [
    80,
    "Quatre-vingts justes",
    "Quatre-vingts bonnes réponses, une vraie semaine de travail.",
    40,
  ],
  [100, "Cent justes", "Cent bonnes réponses : l'objectif le plus long.", 70],
  [
    40,
    "Quatre quiz solides",
    "Quarante justes, l'équivalent de quatre quiz bien tenus.",
    20,
  ],
  [
    50,
    "Cinq quiz honorables",
    "Cinquante bonnes réponses sur des premières validations.",
    20,
  ],
  [60, "Six quiz en bonne voie", "Soixante justes au fil de la semaine.", 40],
  [80, "Huit quiz nourris", "Quatre-vingts bonnes réponses cumulées.", 40],
  [100, "La centaine", "Atteins cent bonnes réponses cette semaine.", 70],
  [40, "Moisson de quarante", "Récolte quarante réponses justes.", 20],
  [50, "Moisson de cinquante", "Récolte cinquante réponses justes.", 20],
  [60, "Moisson de soixante", "Soixante justes récoltés avant lundi.", 40],
  [
    80,
    "Moisson de quatre-vingts",
    "Quatre-vingts justes, la moisson large.",
    40,
  ],
  [100, "Moisson de cent", "Cent justes : la moisson complète.", 70],
  [40, "Quarante étoiles", "Quarante étoiles de bonnes réponses.", 20],
  [60, "Soixante étoiles", "Soixante étoiles sur la semaine.", 40],
  [
    80,
    "Quatre-vingts étoiles",
    "Quatre-vingts étoiles, presque un ciel plein.",
    40,
  ],
  [100, "Cent étoiles", "Cent étoiles de réponses justes.", 70],
  [
    50,
    "Le milieu des cinquante",
    "Cinquante bonnes réponses marquent le milieu de quête.",
    20,
  ],
];

const series = [
  [3, "Trois jours de suite", "Tiens une série de trois jours.", 20],
  [5, "Cinq jours de flamme", "Une série de cinq jours cette semaine.", 40],
  [7, "La semaine entière", "Une série de sept jours, sans trou.", 70],
  [
    3,
    "La flamme courte",
    "Trois jours d'affilée avec au moins un quiz réussi.",
    20,
  ],
  [
    5,
    "La flamme longue",
    "Cinq jours d'affilée, la flamme ne s'éteint pas.",
    40,
  ],
  [7, "Flamme sans pause", "Sept jours de série : aucune journée sautée.", 70],
  [3, "Début de série", "Construis une série de trois.", 20],
  [5, "Série installée", "Installe une série de cinq jours.", 40],
  [7, "Série complète", "Sept jours de suite, la série complète.", 70],
  [3, "Trois matins", "Reviens trois jours de suite.", 20],
  [
    5,
    "Cinq retours",
    "Cinq jours de retour, sans en manquer un au milieu.",
    40,
  ],
  [
    7,
    "Sept retours",
    "Sept jours de présence, du lundi au dimanche si tu pars lundi.",
    70,
  ],
  [3, "Série de trois", "La série atteint trois.", 20],
  [5, "Série de cinq", "La série atteint cinq.", 40],
  [7, "Série de sept", "La série atteint sept.", 70],
  [3, "Ne casse pas trois", "Garde la série vivante pendant trois jours.", 20],
  [5, "Ne casse pas cinq", "Cinq jours sans laisser la série retomber.", 40],
  [7, "Ne casse pas sept", "Sept jours sans casser la série.", 70],
  [
    5,
    "Presque toute la semaine",
    "Cinq jours de série couvrent presque la semaine.",
    40,
  ],
  [7, "Aucun jour manqué", "Aucun jour manqué : la série vaut sept.", 70],
];

const joursActifs = [
  [2, "Deux jours ouverts", "Réussis un quiz sur deux jours distincts.", 20],
  [3, "Trois jours ouverts", "Trois jours avec au moins un quiz réussi.", 40],
  [4, "Quatre jours ouverts", "Quatre jours actifs dans la semaine.", 40],
  [5, "Cinq jours ouverts", "Cinq jours où tu valides au moins un quiz.", 70],
  [
    2,
    "Le binôme de jours",
    "Deux journées de travail, pas forcément consécutives.",
    20,
  ],
  [
    3,
    "Trois présences",
    "Sois présent trois jours, avec un quiz réussi à chaque fois.",
    40,
  ],
  [
    4,
    "Quatre présences",
    "Quatre jours actifs, la régularité compte plus que la série.",
    40,
  ],
  [5, "Cinq présences", "Cinq jours actifs sur la semaine.", 70],
  [2, "Deux séances", "Deux jours de séance suffisent pour cette quête.", 20],
  [3, "Trois séances", "Trois jours de séance dans la semaine.", 40],
  [4, "Quatre séances", "Quatre jours où le parcours avance.", 40],
  [5, "Cinq séances", "Cinq jours d'avance sur le parcours.", 70],
  [
    2,
    "Retour le lendemain ou plus tard",
    "Un deuxième jour actif, même après une pause.",
    20,
  ],
  [3, "Trois allumages", "Allume Quizzly trois jours différents.", 40],
  [4, "Quatre allumages", "Quatre jours différents avec un quiz réussi.", 40],
  [
    5,
    "Cinq allumages",
    "Cinq jours différents, cinq quiz réussis au minimum.",
    70,
  ],
  [
    3,
    "Présence en milieu de semaine",
    "Trois jours actifs, où tu veux dans la semaine.",
    40,
  ],
  [4, "Présence élargie", "Élargis à quatre jours avec un quiz réussi.", 40],
  [5, "Présence large", "Cinq jours actifs : la quête la plus régulière.", 70],
  [2, "Deux empreintes", "Laisse deux jours marqués par un quiz réussi.", 20],
];

for (const [objectif, titre, description] of quizJour) {
  ajouter(
    quotidien,
    "qd",
    "quiz_valide",
    titre,
    description,
    objectif,
    10,
    "xp"
  );
}
for (const [objectif, titre, description] of fautesJour) {
  ajouter(
    quotidien,
    "qd",
    "sans_faute",
    titre,
    description,
    objectif,
    10,
    "xp"
  );
}
for (const [objectif, titre, description] of reponsesJour) {
  ajouter(
    quotidien,
    "qd",
    "bonnes_reponses",
    titre,
    description,
    objectif,
    10,
    "xp"
  );
}

for (const [objectif, titre, description, recompense] of quizSemaine) {
  ajouter(
    hebdo,
    "qh",
    "quiz_valide",
    titre,
    description,
    objectif,
    recompense,
    "gemmes"
  );
}
for (const [objectif, titre, description, recompense] of fautesSemaine) {
  ajouter(
    hebdo,
    "qh",
    "sans_faute",
    titre,
    description,
    objectif,
    recompense,
    "gemmes"
  );
}
for (const [objectif, titre, description, recompense] of reponsesSemaine) {
  ajouter(
    hebdo,
    "qh",
    "bonnes_reponses",
    titre,
    description,
    objectif,
    recompense,
    "gemmes"
  );
}
for (const [objectif, titre, description, recompense] of series) {
  ajouter(
    hebdo,
    "qh",
    "serie",
    titre,
    description,
    objectif,
    recompense,
    "gemmes"
  );
}
for (const [objectif, titre, description, recompense] of joursActifs) {
  ajouter(
    hebdo,
    "qh",
    "jours_actifs",
    titre,
    description,
    objectif,
    recompense,
    "gemmes"
  );
}

function verifier(liste, attendu, etiquette) {
  if (liste.length !== attendu) {
    throw new Error(
      `${etiquette} : ${liste.length} entrées, ${attendu} attendues.`
    );
  }
  const titres = new Set(liste.map((quete) => quete.titre));
  const descriptions = new Set(liste.map((quete) => quete.description));
  const ids = new Set(liste.map((quete) => quete.id));
  if (titres.size !== liste.length) {
    throw new Error(`${etiquette} : titres en double.`);
  }
  if (descriptions.size !== liste.length) {
    throw new Error(`${etiquette} : descriptions en double.`);
  }
  if (ids.size !== liste.length) {
    throw new Error(`${etiquette} : identifiants en double.`);
  }
}

verifier(quotidien, 100, "quotidien");
verifier(hebdo, 100, "hebdo");

const racine = new URL("../lib/quizzly/quetes/", import.meta.url);
writeFileSync(
  new URL("quotidiennes.json", racine),
  `${JSON.stringify(quotidien, null, 2)}\n`
);
writeFileSync(
  new URL("hebdomadaires.json", racine),
  `${JSON.stringify(hebdo, null, 2)}\n`
);
console.log(`quotidiennes ${quotidien.length}, hebdomadaires ${hebdo.length}`);
