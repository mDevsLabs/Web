import {
  BarChart3Icon,
  BookOpenIcon,
  BrainIcon,
  CalculatorIcon,
  CalendarIcon,
  CoinsIcon,
  CloudSunIcon,
  FileTextIcon,
  GlobeIcon,
  HelpCircleIcon,
  ImageIcon,
  LightbulbIcon,
  NotebookIcon,
  PencilIcon,
  PlayIcon,
  QrCodeIcon,
  TrophyIcon,
  Volume2Icon,
} from "lucide-react";
import type { ComponentType } from "react";

export const TOOL_IDS = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
  "imageGenerate",
  "audioGenerate",
  "codeExecution",
  "webSearch",
  "calculator",
  "dateTime",
  "note",
  "memory",
  "readUrl",
  "generateChart",
  "currencyConverter",
  "qrCodeGenerator",
  "askUser",
  "quizzly",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolMeta = {
  id: ToolId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  isArtifact?: boolean;
};

export const TOOLS_META: Record<ToolId, ToolMeta> = {
  audioGenerate: {
    description:
      "Transforme un texte en voix ou extrait audio, avec choix de la voix et du style. À activer pour écouter un contenu, créer une narration, un podcast ou un doublage.",
    icon: Volume2Icon as any,
    id: "audioGenerate",
    label: "Générer audio",
  },
  calculator: {
    description:
      "Calcule avec précision : arithmétique, trigonométrie, logarithmes, pourcentages et conversions d'unités (longueur, masse, température…). À activer dès qu'un calcul exact est requis.",
    icon: CalculatorIcon as any,
    id: "calculator",
    label: "Calculatrice",
  },
  codeExecution: {
    description:
      "Écrit puis exécute du code Python ou JavaScript dans le navigateur (Pyodide). À activer pour tester un algorithme, traiter des données ou vérifier un résultat.",
    icon: PlayIcon as any,
    id: "codeExecution",
    label: "Exécuter code",
  },
  createDocument: {
    description:
      "Crée un artefact consultable à côté du chat : document texte, code, feuille de calcul ou page HTML. À activer pour tout contenu long ou structuré.",
    icon: FileTextIcon as any,
    id: "createDocument",
    isArtifact: true,
    label: "Créer document",
  },
  currencyConverter: {
    description:
      "Convertit des devises (EUR, USD, GBP, JPY, etc.) et cryptomonnaies (BTC, ETH, SOL) en temps réel avec les taux de change actualisés.",
    icon: CoinsIcon as any,
    id: "currencyConverter",
    label: "Convertisseur devises",
  },
  dateTime: {
    description:
      "Indique l'heure et la date actuelles, convertit entre fuseaux horaires, calcule des écarts et formate. À activer pour toute question sur le temps réel ou un calendrier.",
    icon: CalendarIcon as any,
    id: "dateTime",
    label: "Date & heure",
  },
  editDocument: {
    description:
      "Modifie précisément un passage d'un artefact existant sans réécrire le reste. À activer pour corriger ou ajuster un document ouvert.",
    icon: PencilIcon as any,
    id: "editDocument",
    isArtifact: true,
    label: "Éditer document",
  },
  generateChart: {
    description:
      "Génère un graphique visuel (barres, camembert, anneau) au format SVG à partir de données numériques. Idéal pour visualiser des métriques ou statistiques.",
    icon: BarChart3Icon as any,
    id: "generateChart",
    label: "Générer graphique",
  },
  getWeather: {
    description:
      "Fournit la météo actuelle et les prévisions de 1 à 7 jours pour une ville ou des coordonnées. À activer pour toute question sur le climat ou les conditions du jour.",
    icon: CloudSunIcon as any,
    id: "getWeather",
    label: "Météo",
  },
  imageGenerate: {
    description:
      "Génère une illustration à partir d'une description via mAI Studio. À activer pour créer, dessiner ou visualiser une image (soumis au quota journalier).",
    icon: ImageIcon as any,
    id: "imageGenerate",
    label: "Générer image",
  },
  memory: {
    description:
      "Retient durablement des informations sur vous (préférences, contexte, faits) et les réutilise. Consultable et modifiable dans l'onglet Mémoire des paramètres.",
    icon: BrainIcon as any,
    id: "memory",
    label: "Mémoire",
  },
  note: {
    description:
      "Produit une note structurée prête à télécharger : markdown, texte, JSON, CSV, HTML ou code. À activer quand un fichier propre vaut mieux qu'une réponse dans le chat.",
    icon: NotebookIcon as any,
    id: "note",
    label: "Créer note",
  },
  qrCodeGenerator: {
    description:
      "Génère un QR Code vectoriel haute résolution (SVG/PNG) pour un lien, texte, carte vCard ou Wi-Fi.",
    icon: QrCodeIcon as any,
    id: "qrCodeGenerator",
    label: "Générer QR Code",
  },
  readUrl: {
    description:
      "Extrait et lit le contenu textuel propre d'une page Web ou d'une documentation technique à partir de son URL en ignorant les menus et éléments parasites.",
    icon: BookOpenIcon as any,
    id: "readUrl",
    label: "Lire page Web / Doc",
  },
  requestSuggestions: {
    description:
      "Analyse un artefact ouvert et propose des améliorations concrètes de structure, de clarté et de style. À activer sur demande explicite de retours.",
    icon: LightbulbIcon as any,
    id: "requestSuggestions",
    label: "Suggestions",
  },
  updateDocument: {
    description:
      "Réécrit intégralement un artefact existant en conservant son titre. À activer pour une refonte complète ; préférer « Éditer document » pour des ajustements ponctuels.",
    icon: FileTextIcon as any,
    id: "updateDocument",
    isArtifact: true,
    label: "Réécrire document",
  },
  webSearch: {
    description:
      "Recherche sur le Web en temps réel : actualités, documentation, prix, vérifications factuelles. À activer pour toute question portant sur des informations récentes ou vérifiables.",
    icon: GlobeIcon as any,
    id: "webSearch",
    label: "Recherche Web",
  },
  askUser: {
    description:
      "Formulaire interactif de questions (1 à 10 questions, choix unique ou multiple avec saisie personnalisée) pour préciser un besoin ou recueillir les préférences de l'utilisateur.",
    icon: HelpCircleIcon as any,
    id: "askUser",
    label: "Questions à l'utilisateur",
  },
  quizzly: {
    description:
      "Générateur de quiz interactifs sur mesure avec correction dynamique vert/rouge, explications détaillées et score final.",
    icon: TrophyIcon as any,
    id: "quizzly",
    label: "Quizzly",
  },
};

// Hints injectés dans le prompt système (côté modèle) — source unique,
// importée par app/(chat)/api/chat/route.ts.
export const TOOL_SYSTEM_HINTS: Record<ToolId, string> = {
  audioGenerate:
    "audioGenerate (synthèse vocale : transforme un texte en voix. Exécuter immédiatement avec la voix par défaut 'flux-alexis-en' sans demander le choix de la voix)",
  calculator:
    "calculator (calculs exacts : arithmétique, trigonométrie, logarithmes, conversions d'unités — longueur, masse, température, temps, volume, données, énergie, pression, vitesse, surface, angle)",
  codeExecution:
    "codeExecution (exécute du Python/JS dans le navigateur : tester un algorithme, traiter des données, vérifier un résultat)",
  createDocument:
    "createDocument (crée un artefact texte/code/sheet/html : tout contenu long ou structuré que l'utilisateur pourra ouvrir et éditer)",
  currencyConverter:
    "currencyConverter (conversion de devises EUR, USD, GBP, JPY, CHF, etc. et cryptos BTC, ETH, SOL en temps réel avec taux de change)",
  dateTime:
    "dateTime (date/heure actuelle, conversions entre fuseaux horaires, différences entre dates, calcul de la date de Pâques, formatage)",
  editDocument:
    "editDocument (modification ciblée d'un artefact existant : à privilégier pour de petits changements)",
  generateChart:
    "generateChart (crée des graphiques SVG vectoriels de type barres, camembert ou anneau à partir de séries de données)",
  getWeather:
    "getWeather (météo actuelle et prévisions 1 à 7 jours, celsius/fahrenheit, par ville ou coordonnées)",
  imageGenerate:
    "imageGenerate (génère une image à partir d'une description via mAI Studio)",
  memory:
    "memory (mémoire personnalisée — retenir, oublier, lister ou retrouver des informations durables sur l'utilisateur)",
  note: "note (crée une note formatée et téléchargeable : markdown, texte, JSON, CSV, HTML, code)",
  qrCodeGenerator:
    "qrCodeGenerator (génère un QR code vectoriel SVG/PNG scannable pour un lien, texte, contact ou Wi-Fi)",
  readUrl:
    "readUrl (extrait et lit le texte propre et structuré d'une page Web ou d'une documentation en ligne via son URL)",
  requestSuggestions:
    "requestSuggestions (propose des améliorations sur un artefact existant : structure, clarté, style)",
  updateDocument:
    "updateDocument (réécriture complète d'un artefact : pour une refonte ; préférer editDocument pour des ajustements)",
  webSearch:
    "webSearch (recherche sur le Web en temps réel : actualités, documentation, faits vérifiables — citer les sources retournées)",
  askUser:
    "askUser (pose de 1 à 10 questions précises et structurées à l'utilisateur avec choix uniques/multiples et option champ libre lorsqu'une demande est incomplète, nécessite des éclaircissements, ou des préférences avant de poursuivre)",
  quizzly:
    "quizzly (génère un quiz interactif complet de 1 à 50 questions avec choix unique/multiple, réponses correctes, explications et calcul de score pour tester l'utilisateur de manière ludique)",
};

export const DEFAULT_ENABLED_TOOLS: ToolId[] = []; // tous désactivés par défaut
