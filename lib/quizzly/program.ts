/**
 * Carte scolaire de Quizzly.
 *
 * Le tronc commun, de la 6e à la terminale, tient dans cette table : elle
 * fixe les dossiers, les titres de chapitres et l'ordre du parcours. Chaque
 * matière a trois chapitres. Les arts s'arrêtent après la 3e, la
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

export type ChapterFileName = "01" | "02" | "03";

export type ChapterSpec = {
  file: ChapterFileName;
  order: 1 | 2 | 3;
  title: string;
  units: [UnitSpec, UnitSpec];
};

export type SubjectSpec = {
  chapters: [ChapterSpec, ChapterSpec, ChapterSpec];
  id: string;
  label: string;
};

const u = (id: "u1" | "u2", title: string): UnitSpec => ({ id, title });

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
  const fichiers = ["01", "02", "03"] as const;
  const ordres = [1, 2, 3] as const;
  const chapters = ordres.map((order, index) => {
    const base = index * 3;
    return {
      file: fichiers[index],
      order,
      title: morceaux[base] ?? "",
      units: [
        u("u1", morceaux[base + 1] ?? ""),
        u("u2", morceaux[base + 2] ?? ""),
      ],
    };
  });
  return {
    chapters: chapters as [ChapterSpec, ChapterSpec, ChapterSpec],
    id,
    label,
  };
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
