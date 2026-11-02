/**
 * Fiches de synthèse pédagogiques Quizzly.
 *
 * Contenu de référence pour réviser avant ou après un quiz.
 * Classé par matière et niveau scolaire (collège et lycée).
 */

export type FicheSynthese = {
  commonMistakes: string[];
  formulaOrRule?: string;
  id: string;
  keyPoints: string[];
  mnemonic?: string;
  schoolYears: string[];
  subjectId: string;
  subjectLabel: string;
  summary: string;
  title: string;
};

export const FICHES_SYNTHESE: readonly FicheSynthese[] = [
  // --- MATHÉMATIQUES ---
  {
    commonMistakes: [
      "Oublier de vérifier que le triangle est rectangle avant d'appliquer le théorème.",
      "Confondre l'hypoténuse (le plus grand côté opposé à l'angle droit) avec un des côtés de l'angle droit.",
      "Additionner les longueurs au lieu d'additionner leurs carrés (a + b ≠ c).",
    ],
    formulaOrRule: "BC² = AB² + AC²  (où [BC] est l'hypoténuse)",
    id: "maths-pythagore",
    keyPoints: [
      "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés.",
      "La réciproque sert à prouver qu'un triangle est rectangle lorsque les trois longueurs sont connues.",
      "La contraposée prouve qu'un triangle n'est pas rectangle si l'égalité n'est pas vérifiée.",
    ],
    mnemonic:
      "L'Hypoténuse est le Boss : son carré vaut la somme des deux autres !",
    schoolYears: ["4e", "3e", "2nde"],
    subjectId: "mathematiques",
    subjectLabel: "Mathématiques",
    summary:
      "Le théorème de Pythagore relie les longueurs des côtés dans un triangle rectangle. Il permet de calculer une longueur manquante ou de vérifier la perpendicularité.",
    title: "Théorème de Pythagore & Réciproque",
  },
  {
    commonMistakes: [
      "Intervertir le numérateur et le dénominateur dans les rapports de longueurs.",
      "Oublier de mentionner l'alignement des points dans le même ordre pour la réciproque.",
    ],
    formulaOrRule: "AM / AB = AN / AC = MN / BC  (avec (MN) // (BC))",
    id: "maths-thales",
    keyPoints: [
      "Deux droites sécantes coupées par deux droites parallèles forment des triangles aux côtés proportionnels (configuration triangle ou papillon).",
      "Permet de calculer une longueur inconnue à partir de rapports d'agrandissement ou réduction.",
      "La réciproque permet de démontrer que deux droites sont parallèles.",
    ],
    mnemonic: "Petit côté sur Grand côté : toujours le même sommet de départ !",
    schoolYears: ["3e", "2nde", "1ere"],
    subjectId: "mathematiques",
    subjectLabel: "Mathématiques",
    summary:
      "Le théorème de Thalès exprime la proportionnalité des longueurs découpées sur des droites sécantes par des droites parallèles.",
    title: "Théorème de Thalès & Configurations",
  },
  {
    commonMistakes: [
      "Oublier de changer le sens de l'inégalité lors de la multiplication ou division par un nombre négatif.",
      "Développer (a + b)² en a² + b² (il manque le double produit 2ab !).",
    ],
    formulaOrRule: "(a + b)² = a² + 2ab + b²  |  (a - b)(a + b) = a² - b²",
    id: "maths-calcul-litteral",
    keyPoints: [
      "Les trois identités remarquables sont indispensables pour factoriser ou développer rapidement.",
      "Résoudre une équation-produit nul A × B = 0 revient à résoudre A = 0 ou B = 0.",
      "Pour factoriser, chercher d'abord un facteur commun avant d'utiliser une identité remarquable.",
    ],
    mnemonic: "Double produit : n'oublie jamais le 2ab au milieu !",
    schoolYears: ["3e", "2nde", "1ere"],
    subjectId: "mathematiques",
    subjectLabel: "Mathématiques",
    summary:
      "Le calcul littéral manipule des variables pour résoudre des équations, simplifier des expressions et modéliser des problèmes algébriques.",
    title: "Identités remarquables & Équations",
  },
  {
    commonMistakes: [
      "Confondre la dérivée d'un produit (uv)' avec u'v' (la vraie formule est u'v + uv').",
      "Confondre le signe de f'(x) avec les variations de f(x).",
    ],
    formulaOrRule:
      "(uv)' = u'v + uv'  |  (u/v)' = (u'v - uv') / v²  |  (xⁿ)' = n·xⁿ⁻¹",
    id: "maths-derivees",
    keyPoints: [
      "Le nombre dérivé f'(a) correspond au coefficient directeur de la tangente à la courbe au point d'abscisse a.",
      "Si f'(x) > 0 sur un intervalle, f est strictement croissante ; si f'(x) < 0, f est strictement décroissante.",
      "Les extremums locaux s'obtiennent là où la dérivée s'annule en changeant de signe.",
    ],
    mnemonic: "Signe de la dérivée = Sens de variation de la fonction.",
    schoolYears: ["1ere", "terminale"],
    subjectId: "mathematiques",
    subjectLabel: "Mathématiques",
    summary:
      "La dérivation étudie le taux de variation instantané d'une fonction et constitue l'outil fondamental d'étude des variations et d'optimisation.",
    title: "Dérivation & Étude de fonctions",
  },

  // --- FRANÇAIS ---
  {
    commonMistakes: [
      "Utiliser l'imparfait pour une action soudaine ou brève dans un récit au passé.",
      "Confondre les terminaisons de l'imparfait (-ait) et du passé simple (-a, -it).",
    ],
    formulaOrRule:
      "Imparfait = Description / Arrière-plan | Passé Simple = Action soudaine / Premier plan",
    id: "francais-temps-recit",
    keyPoints: [
      "L'imparfait exprime une action non délimitée dans le temps, une habitude, ou une description de décor.",
      "Le passé simple exprime une action ponctuelle, achevée, qui fait progresser la chronologie de l'histoire.",
      "Le plus-que-parfait indique une action antérieure à une autre action passée.",
    ],
    mnemonic: "Imparfait = Décor qui dure ; Passé simple = Coup de théâtre !",
    schoolYears: ["6e", "5e", "4e", "3e"],
    subjectId: "francais",
    subjectLabel: "Français",
    summary:
      "Dans un récit au passé, l'alternance entre l'imparfait et le passé simple structure la dynamique narrative et la mise en relief des événements.",
    title: "Temps du récit : Imparfait et Passé Simple",
  },
  {
    commonMistakes: [
      "Confondre métaphore et comparaison (la métaphore ne contient AUCUN outil de comparaison).",
      "Prendre une hyperbole pour une simple métaphore.",
    ],
    formulaOrRule:
      "Comparaison = Comparé + Outil ('comme', 'tel') + Comparant | Métaphore = Comparé + Comparant (sans outil)",
    id: "francais-figures-style",
    keyPoints: [
      "Figures d'analogie : Comparaison, métaphore, personnification, allégorie.",
      "Figures d'opposition : Antithèse, oxymore (deux termes contradictoires juxtaposés ex: « obscure clarté »).",
      "Figures d'insistance : Hyperbole (exagération), anaphore (répétition en début de vers ou de phrase).",
    ],
    mnemonic: "Oxymore = Deux contraires collés l'un contre l'autre.",
    schoolYears: ["4e", "3e", "2nde", "1ere"],
    subjectId: "francais",
    subjectLabel: "Français",
    summary:
      "Les figures de style enrichissent l'expression littéraire, suscitent des images et renforcent l'impact émotionnel et persuasif des textes.",
    title: "Figures de style indispensables",
  },

  // --- HISTOIRE-GÉOGRAPHIE ---
  {
    commonMistakes: [
      "Confondre la prise de la Bastille (14 juillet 1789) avec la proclamation de la République (septembre 1792).",
      "Oublier que la Révolution française a aboli les privilèges dès la nuit du 4 août 1789.",
    ],
    formulaOrRule:
      "1789 (Fin Ancien Régime) → 1792 (Première République) → 1799 (Coup d'État de Bonaparte)",
    id: "histoire-revolution-francaise",
    keyPoints: [
      "5 mai 1789 : Ouverture des États généraux à Versailles et Serment du Jeu de Paume (20 juin).",
      "14 juillet 1789 : Prise de la Bastille, symbole de la chute de l'arbitraire royal.",
      "26 août 1789 : Déclaration des Droits de l'Homme et du Citoyen (DDHC), affirmation de l'égalité et de la liberté.",
      "1792-1794 : La Convention, la République en guerre et la période de la Terreur.",
    ],
    mnemonic:
      "1789 : Bastille (juillet), Privilèges abolis (août), Droits de l'Homme proclamés !",
    schoolYears: ["4e", "2nde", "1ere"],
    subjectId: "histoire-geographie",
    subjectLabel: "Histoire-Géographie",
    summary:
      "La Révolution française (1789-1799) met fin à la monarchie absolue et à la société d'ordres, instaurant les principes démocratiques modernes.",
    title: "La Révolution française (1789-1799)",
  },
  {
    commonMistakes: [
      "Confondre mondialisation et internationalisation (la mondialisation est une interdépendance globale et instantanée).",
      "Croire que les flux ne concernent que les marchandises (les flux d'informations et de capitaux sont majeurs).",
    ],
    formulaOrRule:
      "Mondialisation = Réseaux de transport + TIC + Libéralisation des échanges + FTN",
    id: "geo-mondialisation",
    keyPoints: [
      "Les façades maritimes (Asie orientale, Europe du Nord, Amérique du Nord) concentrent l'essentiel du commerce mondial (maritimisation).",
      "Les métropoles globales (New York, Londres, Tokyo, Paris) commandent les flux financiers, culturels et technologiques.",
      "Des inégalités spatiales fortes : intégration des littoraux et métropoles, marginalisation des territoires enclavés.",
    ],
    mnemonic:
      "Pôles, Flux, Réseaux : la mondialisation interconnecte les métropoles côtières.",
    schoolYears: ["3e", "2nde", "terminale"],
    subjectId: "histoire-geographie",
    subjectLabel: "Histoire-Géographie",
    summary:
      "La mondialisation organise l'espace mondial en réseaux hiérarchisés, favorisant la littoralisation et la métropolisation des activités économiques.",
    title: "Mondialisation & Dynamiques territoriales",
  },

  // --- SCIENCES DE LA VIE ET DE LA TERRE (SVT) ---
  {
    commonMistakes: [
      "Penser que les plantes ne respirent pas : elles respirent en permanence (jour et nuit) et font la photosynthèse le jour.",
      "Confondre chloroplaste (organite de la photosynthèse) et mitochondrie (organite de la respiration).",
    ],
    formulaOrRule: "6 CO₂ + 6 H₂O + Lumière → C₆H₁₂O₆ (Glucose) + 6 O₂",
    id: "svt-photosynthese",
    keyPoints: [
      "La photosynthèse a lieu dans les chloroplastes des cellules végétales grâce aux pigments chlorophylliens.",
      "Elle convertit l'énergie lumineuse en énergie chimique stockée sous forme de matière organique (amidon, sucres).",
      "Elle absorbe du dioxyde de carbone et libère du dioxygène indispensable à la majorité des êtres vivants.",
    ],
    mnemonic: "Lumière + CO₂ + Eau = Sucre + Oxygène !",
    schoolYears: ["6e", "5e", "2nde", "1ere"],
    subjectId: "svt",
    subjectLabel: "SVT",
    summary:
      "La photosynthèse est le mécanisme autotrophe par lequel les végétaux chlorophylliens produisent leur matière organique à partir de lumière, d'eau et de CO₂.",
    title: "La Photosynthèse & Métabolisme cellulaire",
  },
  {
    commonMistakes: [
      "Confondre mitose (division conforme produisant 2 cellules identiques 2n) et méiose (production de 4 gamètes haploïdes n).",
      "Confondre gène (portion d'ADN) et allèle (version d'un gène).",
    ],
    formulaOrRule:
      "Cellule somatique = 2n chromosomes (diploïde) | Gamète = n chromosomes (haploïde)",
    id: "svt-genetique",
    keyPoints: [
      "L'ADN est constitué d'une double hélice de nucléotides (Adénine-Thymine, Guanine-Cytosine).",
      "La mitose assure la reproduction cellulaire à l'identique pour la croissance et le renouvellement tissulaire.",
      "La méiose et la fécondation brassent les allèles et assurent la diversité génétique des individus.",
    ],
    mnemonic: "A avec T, G avec C : les paires de bases sont inséparables !",
    schoolYears: ["3e", "2nde", "1ere", "terminale"],
    subjectId: "svt",
    subjectLabel: "SVT",
    summary:
      "La génétique explique la transmission des caractères héréditaires à travers la réplication de l'ADN, la division cellulaire et les brassages alléliques.",
    title: "Génétique, ADN & Divisions cellulaires",
  },

  // --- PHYSIQUE-CHIMIE ---
  {
    commonMistakes: [
      "Confondre masse (en kg, constante) et poids (force en Newton, dépend de la gravité : P = m × g).",
      "Oublier d'équilibrer les équations de réaction chimique (conservation de la masse et des atomes).",
    ],
    formulaOrRule: "P = m × g  (P en N, m en kg, g ≈ 9,81 N/kg)",
    id: "pc-masse-poids",
    keyPoints: [
      "La masse mesure la quantité de matière contenue dans un corps ; elle ne varie pas selon l'endroit.",
      "Le poids est la force d'attraction gravitationnelle exercée par un astre sur un objet.",
      "La loi de Lavoisier s'applique à toute réaction chimique : rien ne se perd, rien ne se crée, tout se transforme.",
    ],
    mnemonic:
      "Masse = Matière en kg ; Poids = Poussée de la gravité en Newtons !",
    schoolYears: ["4e", "3e", "2nde"],
    subjectId: "physique-chimie",
    subjectLabel: "Physique-Chimie",
    summary:
      "La distinction entre masse et poids et les lois de conservation constituent les piliers de la mécanique et de la chimie élémentaire.",
    title: "Masse, Poids & Équations chimiques",
  },

  // --- ANGLAIS ---
  {
    commonMistakes: [
      "Utiliser le Present Perfect avec un marqueur de temps révolu (ex: 'yesterday' impose le Prétérit).",
      "Oublier le 's' à la 3e personne du singulier au présent simple (he/she/it).",
    ],
    formulaOrRule:
      "Prétérit = Action datée et terminée | Present Perfect = Action passée ayant un lien avec le présent (Have/Has + Participe Passé)",
    id: "anglais-preterit-present-perfect",
    keyPoints: [
      "Prétérit simple : s'emploie avec des dates précises (yesterday, in 2010, ago, last week).",
      "Present Perfect : s'emploie pour des bilans, des expériences (ever, never) ou des actions récentes (just, already, yet).",
      "Les verbes irréguliers doivent être appris par cœur dans leurs trois formes (Base verbale, Prétérit, Participe passé).",
    ],
    mnemonic:
      "Date dans le passé = Prétérit obligatoire ! Expérience de vie = Present Perfect.",
    schoolYears: ["6e", "5e", "4e", "3e", "2nde", "1ere", "terminale"],
    subjectId: "anglais",
    subjectLabel: "Anglais",
    summary:
      "La distinction entre le prétérit et le present perfect est cruciale en anglais pour situer correctement une action dans le temps et par rapport au présent.",
    title: "Prétérit vs Present Perfect",
  },

  // --- PHILOSOPHIE ---
  {
    commonMistakes: [
      "Confondre liberté et licence (faire tout ce qui nous plaît sans contrainte).",
      "Assimiler l'inconscient à un simple manque d'attention (Freud en fait une instance psychique active et dynamique).",
    ],
    formulaOrRule:
      "« La liberté consiste à obéir à la loi qu'on s'est prescrite. » — Rousseau",
    id: "philo-conscience-liberte",
    keyPoints: [
      "La conscience permet au sujet d'avoir un retour réflexif sur ses états intérieurs et sur le monde (Descartes : « Cogito ergo sum »).",
      "Pour Freud, le psychisme est divisé entre le Ça (pulsions), le Moi (conscient) et le Surmoi (interdits intériorisés).",
      "La liberté politique et morale suppose la responsabilité et le respect des règles collectives choisies par la raison.",
    ],
    mnemonic:
      "Conscience = Savoir qu'on sait ; Liberté = Maîtrise de soi par la raison.",
    schoolYears: ["terminale"],
    subjectId: "philosophie",
    subjectLabel: "Philosophie",
    summary:
      "L'étude de la conscience, de l'inconscient et de la liberté interroge la capacité de l'être humain à se connaître et à agir de manière autonome.",
    title: "Conscience, Inconscient & Liberté",
  },
];

export function fichesPourNiveau(niveau: string): FicheSynthese[] {
  return FICHES_SYNTHESE.filter((f) => f.schoolYears.includes(niveau));
}

export function fichesPourMatiere(matiereId: string): FicheSynthese[] {
  return FICHES_SYNTHESE.filter((f) => f.subjectId === matiereId);
}
