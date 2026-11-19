/**
 * Carte scolaire de Quizzly.
 *
 * Le tronc commun, de la 6e à la terminale, tient dans cette table : elle
 * fixe les dossiers, les titres de chapitres et l'ordre du parcours. Chaque
 * matière a dix chapitres. Les arts s'arrêtent après la 3e, la
 * philosophie n'existe qu'en terminale, et l'EMC est un chapitre
 * d'histoire-géographie — pas une matière à part. Les langues autres
 * que l'anglais et les spécialités du lycée complètent le tronc commun.
 */

export const SCHOOL_YEARS = [
  "6e",
  "5e",
  "4e",
  "3e",
  "2nde",
  "1ere",
  "terminale",
] as const;

export type SchoolYear = (typeof SCHOOL_YEARS)[number];

export type UnitSpec = {
  id: "u1" | "u2";
  title: string;
};

export const CHAPTER_FILES = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
] as const;

export type ChapterFileName = (typeof CHAPTER_FILES)[number];

export type ChapterOrder = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ChapterSpec = {
  file: ChapterFileName;
  order: ChapterOrder;
  title: string;
  units: [UnitSpec, UnitSpec];
};

export type SubjectSpec = {
  chapters: readonly ChapterSpec[];
  id: string;
  label: string;
};

const u = (id: "u1" | "u2", title: string): UnitSpec => ({ id, title });

type Trio = readonly [string, string, string];

/**
 * Sept chapitres après les trois déjà nommés dans le programme.
 * Le titre est commun aux années ; les questions, elles, restent
 * propres au niveau demandé au rédacteur.
 */
const SUITES: Record<string, readonly Trio[]> = {
  arts: [
    ["La couleur et la lumière", "Mélanges et nuances", "Contrastes"],
    [
      "L'espace et le volume",
      "Relief et profondeur",
      "Installer dans l'espace",
    ],
    ["Le récit visuel", "Lire une image", "Raconter en images"],
    ["Écouter et reconnaître", "Timbre et rythme", "Styles et époques"],
    ["Créer une œuvre", "L'intention", "La réalisation"],
    ["Présenter et commenter", "Décrire une œuvre", "Construire un regard"],
    ["Arts et société", "L'œuvre et son public", "Synthèse artistique"],
  ],
  emc: [
    [
      "La laïcité et les valeurs républicaines",
      "La charte de la laïcité",
      "Les symboles républicains",
    ],
    [
      "Engagement et solidarité",
      "Agir au quotidien",
      "La solidarité citoyenne",
    ],
    [
      "La justice et les institutions",
      "Principes fondamentaux",
      "Missions de la justice",
    ],
    ["Médias et démocratie", "Information et liberté", "Esprit critique"],
    [
      "Défense et sécurité nationale",
      "Armées et citoyens",
      "Cohésion républicaine",
    ],
    [
      "Débats éthiques et sociétaux",
      "Sciences et bioéthique",
      "Responsabilité collective",
    ],
    ["Synthèse civique et citoyenne", "Droits et devoirs", "Agir en citoyen"],
  ],
  "enseignement-scientifique": [
    [
      "La matière et les rayonnements",
      "Atomes et noyaux",
      "Lumière et spectre",
    ],
    [
      "Le Soleil, la Terre et le climat",
      "Énergie reçue",
      "Le climat terrestre",
    ],
    ["Le son, musique et audition", "Onde et fréquence", "Perception"],
    ["La biodiversité", "Érosion du vivant", "Préserver"],
    ["Une histoire du vivant", "Parentés", "Mécanismes de l'évolution"],
    ["Science et société", "Controverse", "Décider avec des données"],
    ["Relier les sciences", "Croiser deux thèmes", "Argumenter"],
  ],
  francais: [
    [
      "La langue au service du sens",
      "Orthographe et accords",
      "Réécrire une phrase",
    ],
    ["Lire et comprendre", "Idée principale", "Inférer"],
    ["Prendre la parole", "Lire à voix haute", "Débattre"],
    ["Écrire un texte construit", "Organiser ses idées", "Relire et corriger"],
    ["Les genres littéraires", "Reconnaître un genre", "Comparer deux textes"],
    ["Texte et image", "Document composite", "Argumenter"],
    ["Bilan de français", "Synthèse", "Entraînement"],
  ],
  hggsp: [
    ["Faire la guerre, faire la paix", "Un conflit", "Une paix"],
    ["Histoire et mémoires", "Mémoires plurielles", "Usages du passé"],
    ["L'enjeu de la connaissance", "Produire un savoir", "Faire circuler"],
    ["Puissance et coopération", "États", "Organisations"],
    ["Frontières", "Tracer", "Contester"],
    ["Patrimoines et justice", "Mémoire", "Restitutions"],
    ["Synthèse géopolitique", "Étude de cas", "Argumenter"],
  ],
  "histoire-geographie": [
    ["Habiter et se déplacer", "Villes et campagnes", "Mobilités"],
    ["Ressources et milieux", "Eau et alimentation", "Risques"],
    ["Pouvoirs et sociétés", "Qui décide", "Inégalités"],
    ["Guerres et paix", "Un conflit", "Une reconstruction"],
    ["La France et l'Europe", "Territoires", "Institutions"],
    ["Le monde aujourd'hui", "Mondialisation", "Enjeux contemporains"],
    ["EMC et synthèse", "Droits et devoirs", "Révision"],
  ],
  hlp: [
    ["Les pouvoirs de la parole", "Art de la parole", "Autorité du discours"],
    ["Les représentations du monde", "Découvrir", "Imaginer"],
    ["L'humain et ses limites", "Frontières", "Fables et mythes"],
    ["La recherche de soi", "Éducation", "Sensibilité"],
    ["L'humanité en question", "Techniques", "Limites"],
    ["Savoirs et croyances", "Démontrer", "Interpréter"],
    ["Synthèse humanités", "Relier des œuvres", "Argumenter"],
  ],
  mathematiques: [
    ["Nombres et calculs", "Priorités et fractions", "Problèmes numériques"],
    ["Proportionnalité et grandeurs", "Tableaux et échelles", "Unités"],
    ["Géométrie et mesures", "Figures", "Périmètres, aires et volumes"],
    ["Organisation de données", "Lire un graphique", "Interpréter"],
    ["Algèbre", "Mettre en équation", "Résoudre"],
    ["Fonctions et variations", "Lire une courbe", "Modéliser"],
    ["Probabilités et synthèse", "Expériences aléatoires", "Révision"],
  ],
  nsi: [
    ["Traitement de données en tables", "Sélection", "Agrégation"],
    ["Interactions homme-machine", "Événements", "Interfaces"],
    ["Listes, arbres et récursivité", "Parcours", "Récursivité"],
    ["Graphes", "Représentation", "Plus court chemin"],
    ["Bases de données", "Modèle relationnel", "Requêtes"],
    ["Architectures et réseaux", "Processus", "Protocoles"],
    ["Projet informatique", "Conception", "Tests"],
  ],
  philosophie: [
    ["La liberté", "Déterminisme", "Responsabilité"],
    ["Le devoir", "Morale", "Bonheur"],
    ["La société", "Justice", "État"],
    ["La technique", "Progrès", "Risques"],
    ["L'art", "Création", "Jugement de goût"],
    ["La science", "Vérité", "Limites de la connaissance"],
    ["Dissertation", "Problématiser", "Argumenter"],
  ],
  "physique-chimie": [
    ["La matière", "Constituants", "Changements d'état"],
    ["Mélanges et solutions", "Dissolution", "Concentration"],
    ["Transformations chimiques", "Réaction", "Bilan"],
    ["L'électricité", "Circuit", "Intensité et tension"],
    ["Mouvement et forces", "Décrire un mouvement", "Interactions"],
    ["L'énergie", "Formes", "Conversions"],
    ["Ondes, signaux et synthèse", "Lumière et son", "Révision"],
  ],
  "sciences-de-lingenieur": [
    [
      "Traitement de l'information et capteurs",
      "Acquisition et signaux",
      "Algorithmes et microcontrôleurs",
    ],
    [
      "Éco-conception et cycle de vie",
      "Matériaux et durabilité",
      "Impacts environnementaux",
    ],
    [
      "Dynamique et asservissement",
      "Lois de la dynamique",
      "Stabilité et précision",
    ],
    [
      "Systèmes communicants et réseaux",
      "Bus de données",
      "Protocoles de communication",
    ],
    [
      "Conversion et stockage de puissance",
      "Actionneurs et accumulateurs",
      "Bilans énergétiques",
    ],
    [
      "Ingénierie système et modélisation",
      "Modélisation multiphysique",
      "Simulation numérique",
    ],
    [
      "Projet technologique et innovation",
      "Cahier des charges",
      "Validation de prototype",
    ],
  ],
  "sciences-et-technologie": [
    ["Le vivant et la santé", "Le corps humain", "Hygiène"],
    ["Matière et énergie", "Transformations", "Sources d'énergie"],
    ["La Terre et l'environnement", "Paysages", "Risques naturels"],
    ["Objets techniques", "Fonction", "Matériaux"],
    ["Information et signaux", "Capteurs", "Communication"],
    ["L'environnement au quotidien", "Impacts", "Gestes"],
    ["Démarche scientifique", "Observer", "Conclure"],
  ],
  ses: [
    ["Marché et prix", "Offre et demande", "Équilibre"],
    ["Monnaie et financement", "Rôles de la monnaie", "Crédit"],
    ["Travail et emploi", "Organisation du travail", "Chômage"],
    ["Inégalités et protection", "Revenus", "Protection sociale"],
    ["Entreprise et production", "Coûts", "Innovation"],
    ["État et politiques publiques", "Budget", "Régulation"],
    ["Mondialisation et environnement", "Échanges", "Externalités"],
  ],
  snt: [
    ["Internet", "Réseaux", "Le Web"],
    ["Les données structurées", "Structurer", "Traiter"],
    ["La photographie numérique", "Pixels", "Droits d'auteur"],
    ["Localisation et cartes", "Géolocalisation", "Vie privée"],
    ["Les objets connectés", "Capteurs", "Impacts"],
    ["L'informatique embarquée", "Systèmes", "Sécurité"],
    ["Usages numériques", "Esprit critique", "Synthèse"],
  ],
  svt: [
    ["La cellule et l'organisme", "Organisation", "Fonctions"],
    ["Reproduction et hérédité", "Transmission", "Diversité"],
    ["Nutrition et énergie", "Aliments", "Respiration"],
    ["Le corps et la santé", "Défenses", "Prévention"],
    ["Écosystèmes", "Relations", "Équilibres"],
    ["La planète", "Climat", "Risques"],
    ["Évolution et synthèse", "Parentés", "Révision"],
  ],
  technologie: [
    ["Besoin et cahier des charges", "Usage", "Contraintes"],
    ["Matériaux et procédés", "Choix d'un matériau", "Fabrication"],
    ["Énergie des objets", "Alimentation", "Rendement"],
    ["Information et réseaux", "Structurer l'information", "Communiquer"],
    ["Programmer un objet", "Algorithme", "Tester"],
    ["Design et impacts", "Cycle de vie", "Éco-conception"],
    ["Projet technique", "Prototype", "Bilan"],
  ],
};

function avecDe(nom: string): string {
  if (nom.startsWith("le ")) {
    return `du ${nom.slice(3)}`;
  }
  return `de ${nom}`;
}

function avecEn(nom: string): string {
  if (nom.startsWith("le ")) {
    return `en ${nom.slice(3)}`;
  }
  return `en ${nom}`;
}

function suiteLangue(nom: string): readonly Trio[] {
  return [
    [`La grammaire ${avecDe(nom)}`, "Accords et articles", "Phrases simples"],
    [`Le passé ${avecEn(nom)}`, "Raconter hier", "Marqueurs de temps"],
    [
      `L'avenir et les projets ${avecEn(nom)}`,
      "Dire ce qu'on va faire",
      "Invitations",
    ],
    [`Opinions et sentiments ${avecEn(nom)}`, "Donner son avis", "Nuancer"],
    [`Voyage et ville ${avecEn(nom)}`, "Se déplacer", "Demander son chemin"],
    [`Médias et actualité ${avecEn(nom)}`, "Lire un titre", "Commenter"],
    [`Vers l'examen ${avecEn(nom)}`, "Compréhension", "Expression"],
  ];
}

const NOMS_LANGUE: Record<string, string> = {
  allemand: "l'allemand",
  anglais: "l'anglais",
  arabe: "l'arabe",
  chinois: "le chinois",
  coreen: "le coréen",
  espagnol: "l'espagnol",
  grec: "le grec ancien",
  hebreu: "l'hébreu",
  italien: "l'italien",
  japonais: "le japonais",
  latin: "le latin",
  portugais: "le portugais",
  russe: "le russe",
  turc: "le turc",
};

function suiteDe(id: string, label: string): readonly Trio[] {
  const propre = SUITES[id];
  if (propre) {
    return propre;
  }
  return suiteLangue(NOMS_LANGUE[id] ?? label.toLocaleLowerCase("fr"));
}

function matiere(
  id: string,
  label: string,
  ...morceaux: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ]
): SubjectSpec {
  const debut: Trio[] = [
    [morceaux[0], morceaux[1], morceaux[2]],
    [morceaux[3], morceaux[4], morceaux[5]],
    [morceaux[6], morceaux[7], morceaux[8]],
  ];
  const tous = [...debut, ...suiteDe(id, label)];
  if (tous.length !== CHAPTER_FILES.length) {
    throw new Error(`Quizzly : ${id} n'a pas dix chapitres.`);
  }
  const chapters = tous.map(([title, premiere, seconde], index) => {
    const file = CHAPTER_FILES[index];
    if (!file || !title || !premiere || !seconde) {
      throw new Error(`Quizzly : chapitre incomplet pour ${id}.`);
    }
    return {
      file,
      order: (index + 1) as ChapterOrder,
      title,
      units: [u("u1", premiere), u("u2", seconde)] as [UnitSpec, UnitSpec],
    };
  });
  return { chapters, id, label };
}

function langue(id: string, label: string, nom: string): SubjectSpec {
  return matiere(
    id,
    label,
    `Découvrir ${nom}`,
    "Saluer et se présenter",
    "Les mots essentiels",
    "Le quotidien",
    "Famille, école et loisirs",
    "Décrire et raconter",
    "Culture et documents",
    "Lire un document court",
    "Un repère de civilisation"
  );
}

export const PROGRAM: Record<SchoolYear, readonly SubjectSpec[]> = {
  "1ere": [
    matiere(
      "francais",
      "Français",
      "La poésie du XIXe au XXIe siècle",
      "Formes et versification",
      "Registres et figures",
      "Le théâtre du XVIIe au XXIe siècle",
      "La tragédie classique",
      "Le théâtre moderne",
      "Le roman",
      "Personnage et société",
      "Narration et temps"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "L'Europe face aux révolutions",
      "La Révolution française",
      "L'Europe en 1848",
      "EMC — Fondements et fragilités du lien social",
      "Le lien social",
      "Les fragilités contemporaines",
      "La France dans une nouvelle ère",
      "La IIIe République",
      "Guerres et reconstructions"
    ),
    matiere(
      "enseignement-scientifique",
      "Enseignement scientifique",
      "Une longue histoire de la matière",
      "Les éléments chimiques",
      "Les cristaux et les cellules",
      "Le Soleil, notre source d'énergie",
      "Le rayonnement solaire",
      "Le bilan radiatif terrestre",
      "Le son et sa perception",
      "Ondes sonores",
      "Musique et audition"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Identités et échanges",
      "Se présenter et se définir",
      "Les échanges culturels",
      "Espace privé et espace public",
      "La maison et l'intime",
      "La vie publique",
      "Fictions et réalités",
      "Récits et imaginaires",
      "Regards critiques"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Suites numériques",
      "Modes de génération",
      "Sens de variation",
      "Fonctions dérivées",
      "Nombre dérivé",
      "Variations",
      "Géométrie dans l'espace",
      "Repérage",
      "Orthogonalité"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Constitution et transformations",
      "Quantité de matière",
      "Suivi d'une transformation",
      "Mouvement et interactions",
      "Lois de Newton",
      "Énergie mécanique",
      "Ondes et signaux",
      "Lunette et diffraction",
      "Sons et musique"
    ),
    matiere(
      "svt",
      "SVT",
      "La Terre, la vie et l'évolution",
      "Génétique",
      "Sélection naturelle",
      "Enjeux contemporains",
      "Écosystèmes",
      "Agrosystèmes",
      "Corps humain",
      "Systèmes de régulation",
      "Comportements"
    ),
    matiere(
      "ses",
      "SES",
      "Science économique",
      "Marché et prix",
      "Monnaie",
      "Sociologie",
      "Socialisation",
      "Liens sociaux",
      "Science politique",
      "Vote et opinion",
      "État et pouvoir"
    ),
    matiere(
      "hggsp",
      "HGGSP",
      "De nouveaux espaces de conquête",
      "Mers et océans",
      "Espace extra-atmosphérique",
      "Faire la guerre, faire la paix",
      "Formes de conflit",
      "La paix",
      "Histoire et mémoires",
      "Mémoires de conflits",
      "Usages politiques du passé"
    ),
    matiere(
      "nsi",
      "NSI",
      "Représentation des données",
      "Types et encodage",
      "Booléens",
      "Traitement de données en tables",
      "CSV et index",
      "Fusion et sélection",
      "Interactions homme-machine",
      "Événements",
      "Interfaces"
    ),
    matiere(
      "hlp",
      "HLP",
      "Les pouvoirs de la parole",
      "L'art de la parole",
      "Autorité de la parole",
      "Les représentations du monde",
      "Découverte du monde",
      "Décrire et imaginer",
      "L'humain et l'animal",
      "Frontières",
      "Fables et savoirs"
    ),
    matiere(
      "sciences-de-lingenieur",
      "Sciences de l'ingénieur",
      "Analyse des systèmes complexes",
      "Fonctions et structure",
      "Chaîne d'énergie et d'information",
      "Modélisation cinématique et statique",
      "Liaisons et mouvements",
      "Équilibre et actions mécaniques",
      "Énergie et puissance des actionneurs",
      "Moteurs et convertisseurs",
      "Rendement et bilans"
    ),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
  ],
  "2nde": [
    matiere(
      "francais",
      "Français",
      "Le roman et le récit",
      "Narrateur et point de vue",
      "Personnages et temps du récit",
      "La poésie",
      "Le lyrisme",
      "Images et rythmes",
      "Le théâtre",
      "La tragédie et la comédie",
      "Le texte et la scène"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Fonctions",
      "Notion de fonction",
      "Variations et représentations",
      "Géométrie et statistiques",
      "Géométrie repérée",
      "Statistique descriptive",
      "Probabilités",
      "Expériences aléatoires",
      "Arbres et tableaux"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "Le monde méditerranéen antique",
      "La Grèce des cités",
      "Rome et l'Empire",
      "EMC — La liberté et l'État de droit",
      "Les libertés fondamentales",
      "L'État de droit",
      "Sociétés et environnements",
      "Ressources et développement",
      "Risques et aménagement"
    ),
    matiere(
      "svt",
      "SVT",
      "La Terre, la vie et l'organisation du vivant",
      "L'organisme pluricellulaire",
      "Biodiversité et évolution",
      "Les enjeux contemporains de la planète",
      "Les agrosystèmes",
      "Le sol et l'érosion",
      "Corps humain et santé",
      "Microbiote et immunité",
      "Comportements et santé"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Constitution de la matière",
      "Espèces chimiques",
      "De l'atome à l'entité",
      "Mouvement et interactions",
      "Décrire un mouvement",
      "Les interactions fondamentales",
      "Ondes et signaux",
      "Émission et réception",
      "Information et bruit"
    ),
    matiere(
      "ses",
      "SES",
      "Comment les sciences sociales raisonnent-elles ?",
      "Économie, sociologie, science politique",
      "Le raisonnement scientifique",
      "Comment crée-t-on et mesure-t-on les richesses ?",
      "La production",
      "Le PIB et ses limites",
      "Comment se forment les prix ?",
      "Marché et prix",
      "Monnaie et financement"
    ),
    matiere(
      "snt",
      "SNT",
      "Internet et le Web",
      "Réseaux et protocoles",
      "Le Web et ses usages",
      "Les données structurées",
      "Données et métadonnées",
      "Traitement et tableur",
      "Informatique embarquée et objets connectés",
      "Capteurs et actionneurs",
      "Impacts sociaux"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Art de vivre ensemble",
      "La vie au lycée",
      "Les relations",
      "Identité et échanges",
      "Mémoire et identité",
      "Voyager et échanger",
      "Art et pouvoir",
      "Décrire une œuvre",
      "Convictions et débats"
    ),
    matiere(
      "emc",
      "Enseignement moral et civique",
      "La liberté et l'État de droit",
      "Les libertés publiques",
      "La hiérarchie des normes",
      "La protection des libertés",
      "Le Conseil constitutionnel",
      "Justice administrative et judiciaire",
      "La démocratie et la participation",
      "Élections et représentativité",
      "Nouvelles formes d'engagement"
    ),
    langue("espagnol", "Espagnol", "l'espagnol"),
    langue("allemand", "Allemand", "l'allemand"),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
    langue("japonais", "Japonais", "le japonais"),
    langue("russe", "Russe", "le russe"),
  ],
  "3e": [
    matiere(
      "francais",
      "Français",
      "Le roman et la société",
      "Le personnage de roman",
      "Roman et regard social",
      "L'argumentation",
      "Convaincre et persuader",
      "Le débat",
      "La poésie lyrique",
      "Le je poétique",
      "Images et émotions"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Arithmétique et fractions",
      "Nombres premiers",
      "Fractions et puissances",
      "Fonctions et théorème de Thalès",
      "Notion de fonction",
      "Théorème de Thalès",
      "Statistiques et probabilités",
      "Médiane et quartiles",
      "Probabilités simples"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "Le XXe siècle",
      "Guerres mondiales",
      "Totalitarismes et décolonisation",
      "EMC — La citoyenneté et la République",
      "Les valeurs de la République",
      "Le citoyen et la loi",
      "La France et l'Union européenne",
      "Le territoire français",
      "L'Europe politique"
    ),
    matiere(
      "svt",
      "SVT",
      "Le corps humain et la santé",
      "Système nerveux",
      "Microbes et immunité",
      "Génétique et évolution",
      "Information génétique",
      "Diversité et évolution",
      "La planète et les risques",
      "Climat et météo",
      "Activités humaines"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Réactions chimiques et énergie",
      "Transformation chimique",
      "Énergie et conversions",
      "Signaux et lumière",
      "Lumière et couleurs",
      "Signaux sonores",
      "Chimie de la vie courante",
      "Ions et pH",
      "Matériaux et environnement"
    ),
    matiere(
      "technologie",
      "Technologie",
      "Objets connectés",
      "Capteurs",
      "Réseaux locaux",
      "Projet technique",
      "Cahier des charges",
      "Prototype",
      "Design responsable",
      "Usage et impact",
      "Cycle de vie d'un objet"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Le monde du travail",
      "Métiers",
      "Chercher un emploi",
      "Engagement et société",
      "Droits et devoirs",
      "Agir ensemble",
      "Médias et opinion",
      "Informer et commenter",
      "Esprit critique"
    ),
    matiere(
      "arts",
      "Arts",
      "Arts plastiques — l'image et le message",
      "Image et signification",
      "Détournement",
      "Éducation musicale — les styles",
      "Reconnaître un style",
      "Musique et époque",
      "Arts plastiques — l'exposition",
      "Présenter une œuvre",
      "Éducation musicale — créer"
    ),
    matiere(
      "emc",
      "Enseignement moral et civique",
      "Les valeurs et principes de la République",
      "Liberté, égalité, fraternité",
      "Laïcité et indivisibilité",
      "La citoyenneté démocratique",
      "Voter et participer",
      "La souveraineté nationale",
      "La défense nationale et la sécurité",
      "Missions des armées",
      "Parcours citoyen et JDC"
    ),
    langue("espagnol", "Espagnol", "l'espagnol"),
    langue("allemand", "Allemand", "l'allemand"),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
    langue("hebreu", "Hébreu", "l'hébreu"),
    langue("latin", "Latin", "le latin"),
  ],
  "4e": [
    matiere(
      "francais",
      "Français",
      "La nouvelle",
      "Le fantastique",
      "Le réalisme",
      "Le théâtre",
      "Comédie et dialogue",
      "La mise en scène du texte",
      "La poésie engagée",
      "Dire le monde",
      "Images et rythmes"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Calcul littéral",
      "Expressions",
      "Équations",
      "Théorème de Pythagore",
      "Le triangle rectangle",
      "Calculer une longueur",
      "Statistiques et probabilités",
      "Moyenne et étendue",
      "Expériences aléatoires"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "Le XVIIIe siècle et les révolutions",
      "L'Europe des Lumières",
      "La Révolution française",
      "EMC — La liberté et les droits",
      "Liberté d'expression",
      "Droits de l'enfant",
      "L'Europe et le monde au XIXe siècle",
      "Industrialisation",
      "Conquêtes et sociétés"
    ),
    matiere(
      "svt",
      "SVT",
      "Nutrition et organisation du vivant",
      "Alimentation",
      "Digestion et transport",
      "La tectonique des plaques",
      "Séismes et volcans",
      "Les plaques lithosphériques",
      "Reproduction et hérédité",
      "Reproduction sexuée",
      "Information héréditaire"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Transformations chimiques",
      "Atomes et molécules",
      "Réaction chimique",
      "Électricité",
      "Circuit en série",
      "Circuit en dérivation",
      "Lumière et son",
      "Propagation de la lumière",
      "Vitesse du son"
    ),
    matiere(
      "technologie",
      "Technologie",
      "Réseaux",
      "Identifier un réseau",
      "Adresse et routage",
      "Design et innovation",
      "Besoin et usage",
      "Prototype et essai",
      "Informatique et réseaux",
      "Structurer l'information",
      "Communiquer et collaborer"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Voyages et découvertes",
      "Préparer un voyage",
      "Raconter un séjour",
      "Médias et information",
      "La presse",
      "Vérifier une information",
      "Engagement et débats",
      "Donner son avis",
      "Convaincre"
    ),
    matiere(
      "arts",
      "Arts",
      "Arts plastiques — l'espace",
      "Volume et relief",
      "Espace de la représentation",
      "Éducation musicale — les instruments",
      "Familles d'instruments",
      "Timbre et formation",
      "Arts plastiques — l'œuvre et le spectateur",
      "Regarder une œuvre",
      "Éducation musicale — écouter"
    ),
    matiere(
      "emc",
      "Enseignement moral et civique",
      "La liberté, une conquête",
      "Les libertés fondamentales",
      "La liberté d'expression",
      "Les droits de l'enfant et de l'homme",
      "La CIDE",
      "Les droits universels",
      "La justice en France",
      "Principes de la justice",
      "Justice des mineurs"
    ),
    langue("espagnol", "Espagnol", "l'espagnol"),
    langue("allemand", "Allemand", "l'allemand"),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
    langue("portugais", "Portugais", "le portugais"),
    langue("turc", "Turc", "le turc"),
  ],
  "5e": [
    matiere(
      "francais",
      "Français",
      "Le récit d'aventures",
      "Le héros et les épreuves",
      "Le suspense",
      "Le portrait et la description",
      "Décrire un lieu",
      "Portrait physique et moral",
      "La poésie",
      "Images et sonorités",
      "Jeux de langage"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Proportionnalité",
      "Tableaux et pourcentages",
      "Échelles",
      "Nombres relatifs et repérage",
      "Nombres relatifs",
      "Repérage dans le plan",
      "Statistiques",
      "Effectifs et fréquences",
      "Diagrammes"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "Chrétientés et islam, VIe-XIIIe siècles",
      "Byzance et l'Occident",
      "L'islam médiéval",
      "EMC — L'égalité et la discrimination",
      "Égalité en droits",
      "Discriminations",
      "L'Afrique médiévale",
      "Royaumes et traites",
      "Sociétés et cultures"
    ),
    matiere(
      "svt",
      "SVT",
      "Respiration et milieux de vie",
      "Respirer dans l'air et dans l'eau",
      "Peuplement des milieux",
      "La planète Terre",
      "Météo et climats",
      "Risques naturels",
      "Reproduction et sexualité",
      "La puberté",
      "De la fécondation à la naissance"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Organisation de la matière",
      "États de la matière",
      "Mélanges",
      "Mouvements et interactions",
      "Décrire un mouvement",
      "Actions mécaniques",
      "L'énergie",
      "Sources et formes",
      "Conversions"
    ),
    matiere(
      "technologie",
      "Technologie",
      "Matériaux",
      "Familles de matériaux",
      "Choix d'un matériau",
      "Informatique et programmation",
      "Algorithme",
      "Programme simple",
      "Objets techniques",
      "Fonction et solution",
      "Cycle de vie"
    ),
    matiere(
      "anglais",
      "Anglais",
      "School life",
      "La journée de classe",
      "Les matières et l'emploi du temps",
      "Famille et loisirs",
      "La famille",
      "Les loisirs",
      "Récits et personnages",
      "Raconter au passé",
      "Un personnage célèbre"
    ),
    matiere(
      "arts",
      "Arts",
      "Arts plastiques — la composition",
      "Cadrage",
      "Organisation du plan",
      "Éducation musicale — la mélodie",
      "Hauteur et contour",
      "Phrase musicale",
      "Arts plastiques — la lumière",
      "Ombre et contraste",
      "Éducation musicale — les familles"
    ),
    matiere(
      "emc",
      "Enseignement moral et civique",
      "L'égalité en droits",
      "Principes d'égalité",
      "Lutter contre les discriminations",
      "Identités et diversité",
      "Identité légale et personnelle",
      "Respect de l'autre",
      "Droits et devoirs des collégiens",
      "Le règlement intérieur",
      "Les délégués et la participation"
    ),
    langue("espagnol", "Espagnol", "l'espagnol"),
    langue("allemand", "Allemand", "l'allemand"),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
    langue("russe", "Russe", "le russe"),
    langue("coreen", "Coréen", "le coréen"),
  ],
  "6e": [
    matiere(
      "francais",
      "Français",
      "Le récit",
      "Le schéma narratif",
      "Les personnages",
      "La phrase et ses classes de mots",
      "Classes de mots",
      "Les fonctions dans la phrase",
      "Le genre et le point de vue",
      "Récit et description",
      "Le narrateur"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Nombres entiers et décimaux",
      "Numération",
      "Calculs",
      "Géométrie plane",
      "Figures usuelles",
      "Droites et angles",
      "Grandeurs et mesures",
      "Longueurs et durées",
      "Aires et périmètres"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "La longue histoire de l'humanité",
      "La préhistoire",
      "Les premiers États",
      "EMC — La règle et le vivre-ensemble",
      "La règle commune",
      "Vivre ensemble",
      "La Méditerranée antique",
      "L'Égypte et la Mésopotamie",
      "La Grèce et Rome"
    ),
    matiere(
      "sciences-et-technologie",
      "Sciences et technologie",
      "Le vivant et son environnement",
      "Caractéristiques du vivant",
      "Milieu de vie",
      "Matière, mouvement et signaux",
      "États et mélanges",
      "Mouvements simples",
      "La Terre et le ciel",
      "La planète Terre",
      "Le système solaire"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Se présenter",
      "Identité",
      "Goûts et couleurs",
      "La vie au quotidien",
      "La maison",
      "Les routines",
      "Le monde autour de soi",
      "La ville",
      "Les animaux et la nature"
    ),
    matiere(
      "arts",
      "Arts",
      "Arts plastiques — la couleur et la forme",
      "Couleurs primaires",
      "Formes simples",
      "Éducation musicale — le rythme",
      "La pulsation",
      "Le rythme",
      "Arts plastiques — le récit en images",
      "La bande dessinée",
      "Chanter ensemble"
    ),
    matiere(
      "emc",
      "Enseignement moral et civique",
      "La règle et le vivre-ensemble",
      "La règle commune",
      "Vivre ensemble au collège",
      "L'égalité et la différence",
      "Respecter les différences",
      "Refuser les discriminations",
      "La liberté et la responsabilité",
      "Liberté et sécurité",
      "Être responsable"
    ),
    langue("espagnol", "Espagnol", "l'espagnol"),
    langue("allemand", "Allemand", "l'allemand"),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
    langue("latin", "Latin", "le latin"),
    langue("grec", "Grec", "le grec ancien"),
    langue("portugais", "Portugais", "le portugais"),
    langue("japonais", "Japonais", "le japonais"),
  ],
  terminale: [
    matiere(
      "philosophie",
      "Philosophie",
      "La conscience",
      "Conscience et inconscient",
      "Le sujet",
      "La vérité",
      "Opinion et vérité",
      "Raison et démonstration",
      "La morale",
      "Devoir et bonheur",
      "Liberté et responsabilité"
    ),
    matiere(
      "histoire-geographie",
      "Histoire-Géographie",
      "Les relations entre les puissances",
      "La guerre froide",
      "Le monde depuis 1991",
      "EMC — La démocratie",
      "Les principes démocratiques",
      "Les fragilités de la démocratie",
      "L'environnement, entre exploitation et protection",
      "Ressources et conflits",
      "Transition et acteurs"
    ),
    matiere(
      "enseignement-scientifique",
      "Enseignement scientifique",
      "Science, climat et société",
      "L'atmosphère",
      "Le réchauffement climatique",
      "La biodiversité",
      "Érosion de la biodiversité",
      "Préserver le vivant",
      "Une histoire du vivant",
      "Évolution et parentés",
      "L'humain dans le vivant"
    ),
    matiere(
      "anglais",
      "Anglais",
      "Citoyenneté et mondes virtuels",
      "Citoyenneté",
      "Réseaux sociaux",
      "Sciences et responsabilité",
      "Inventions",
      "Éthique et progrès",
      "Frontières et identités",
      "Appartenances",
      "Diversité et vivre-ensemble"
    ),
    matiere(
      "mathematiques",
      "Mathématiques",
      "Limites et continuité",
      "Limites de suites",
      "Asymptotes",
      "Compléments sur la dérivation",
      "Convexité",
      "Primitives",
      "Probabilités",
      "Lois discrètes",
      "Indépendance"
    ),
    matiere(
      "physique-chimie",
      "Physique-Chimie",
      "Acides, bases et cinétique",
      "Acide-base",
      "Vitesse de réaction",
      "Mouvement dans un champ",
      "Champ de pesanteur",
      "Champ électrique",
      "Énergie et transferts",
      "Conversions",
      "Transferts thermiques"
    ),
    matiere(
      "svt",
      "SVT",
      "Génétique et évolution",
      "L'origine du génotype",
      "L'évolution humaine",
      "Le passé géologique",
      "Le temps en géologie",
      "Paléoclimats",
      "De la plante sauvage à la plante domestiquée",
      "Photosynthèse",
      "Domestication"
    ),
    matiere(
      "ses",
      "SES",
      "Sources de la croissance",
      "Productivité",
      "Progrès technique",
      "Travail et emploi",
      "Organisation du travail",
      "Chômage",
      "Action publique et environnement",
      "Externalités",
      "Instruments"
    ),
    matiere(
      "hggsp",
      "HGGSP",
      "L'enjeu de la connaissance",
      "Production des savoirs",
      "Circulation des savoirs",
      "Relations entre États",
      "Puissance",
      "Coopération",
      "Histoire, mémoires et justice",
      "Justice et mémoire",
      "Patrimoines"
    ),
    matiere(
      "nsi",
      "NSI",
      "Structures de données",
      "Listes et arbres",
      "Graphes",
      "Bases de données",
      "Modèle relationnel",
      "SQL",
      "Architectures et systèmes",
      "Processus",
      "Protocoles de routage"
    ),
    matiere(
      "hlp",
      "HLP",
      "La recherche de soi",
      "Éducation et transmission",
      "Expressions de la sensibilité",
      "L'humanité en question",
      "Création et techniques",
      "L'humain et ses limites",
      "Savoirs et croyances",
      "Démontrer",
      "Interpréter"
    ),
    matiere(
      "sciences-de-lingenieur",
      "Sciences de l'ingénieur",
      "Dynamique et commande des systèmes",
      "Principe fondamental de la dynamique",
      "Asservissement et stabilité",
      "Systèmes multiphysiques et réseaux",
      "Modélisation causale et acausale",
      "Bus et protocoles de communication",
      "Conversion et stockage d'énergie avancés",
      "Batteries et piles à combustible",
      "Gestion intelligente de l'énergie"
    ),
    langue("italien", "Italien", "l'italien"),
    langue("chinois", "Chinois", "le chinois"),
    langue("arabe", "Arabe", "l'arabe"),
  ],
};

export function estAnneeScolaire(valeur: string): valeur is SchoolYear {
  return (SCHOOL_YEARS as readonly string[]).includes(valeur);
}

export function libelleAnnee(annee: SchoolYear): string {
  if (annee === "1ere") {
    return "1re";
  }
  if (annee === "terminale") {
    return "Terminale";
  }
  return annee;
}

export function matiereDuProgramme(
  annee: SchoolYear,
  matiereId: string
): SubjectSpec | undefined {
  return PROGRAM[annee].find((entree) => entree.id === matiereId);
}

/** Chemins relatifs `année/matière/0N.json` attendus sur le disque. */
export function cheminsChapitresAttendus(): string[] {
  const chemins: string[] = [];
  for (const annee of SCHOOL_YEARS) {
    for (const matiereCourante of PROGRAM[annee]) {
      for (const chapitre of matiereCourante.chapters) {
        chemins.push(`${annee}/${matiereCourante.id}/${chapitre.file}.json`);
      }
    }
  }
  return chemins;
}
