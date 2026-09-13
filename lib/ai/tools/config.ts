import {
  BarChart3Icon,
  BookOpenIcon,
  BrainIcon,
  CalculatorIcon,
  CalendarIcon,
  CalendarPlusIcon,
  CameraIcon,
  CloudSunIcon,
  CoinsIcon,
  FileSearchIcon,
  FileTextIcon,
  GaugeIcon,
  GlobeIcon,
  HelpCircleIcon,
  ImageIcon,
  KeyRoundIcon,
  LightbulbIcon,
  NotebookIcon,
  PencilIcon,
  PlayIcon,
  PodcastIcon,
  QrCodeIcon,
  TrophyIcon,
  UserRoundIcon,
  Volume2Icon,
  WaypointsIcon,
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
  "audioPodcast",
  "codeExecution",
  "webSearch",
  "webCapture",
  "calculator",
  "dateTime",
  "calendarReminder",
  "note",
  "memory",
  "readUrl",
  "documentParser",
  "generateChart",
  "generateDiagram",
  "cryptoTools",
  "currencyConverter",
  "qrCodeGenerator",
  "askUser",
  "quizzly",
  "updateAccountProfile",
  "getAccountUsage",
] as const;

export type NativeToolId = (typeof TOOL_IDS)[number];

// Un identifiant d'outil sélectionnable : outil natif (menu +, skills,
// planification) ou outil fourni par un plugin installé. Le `string & {}`
// préserve l'autocomplétion des identifiants natifs tout en acceptant les
// identifiants dynamiques des plugins.
export type ToolId = NativeToolId | (string & {});

export type ToolMeta = {
  id: ToolId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  isArtifact?: boolean;
};

export const TOOLS_META: Record<ToolId, ToolMeta> = {
  askUser: {
    description:
      "Formulaire interactif de questions (1 à 10 questions, choix unique ou multiple avec saisie personnalisée) pour préciser un besoin ou recueillir les préférences de l'utilisateur.",
    icon: HelpCircleIcon as any,
    id: "askUser",
    label: "Questions à l'utilisateur",
  },
  audioGenerate: {
    description:
      "Transforme un texte en voix ou extrait audio, avec choix de la voix et du style. À activer pour écouter un contenu, créer une narration, un podcast ou un doublage.",
    icon: Volume2Icon as any,
    id: "audioGenerate",
    label: "Générer audio",
  },
  audioPodcast: {
    description:
      "Transforme un document, un projet ou un sujet en débat audio animé entre deux intervenants virtuels (format podcast NotebookLM), joué dans un lecteur dédié.",
    icon: PodcastIcon as any,
    id: "audioPodcast",
    label: "Podcast dual-voice",
  },
  calculator: {
    description:
      "Calcule avec précision : arithmétique, trigonométrie, logarithmes, pourcentages et conversions d'unités (longueur, masse, température…). À activer dès qu'un calcul exact est requis.",
    icon: CalculatorIcon as any,
    id: "calculator",
    label: "Calculatrice",
  },
  calendarReminder: {
    description:
      "Détecte une date, une réunion ou une échéance dans la discussion et crée un événement téléchargeable (.ics) avec liens Google Calendar et Outlook pré-remplis.",
    icon: CalendarPlusIcon as any,
    id: "calendarReminder",
    label: "Rappel d'agenda",
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
  cryptoTools: {
    description:
      "Boîte à outils développeur sécurisée : hashage SHA-256/384/512 et bcrypt, décodage et vérification de JWT, génération de secrets aléatoires, test de regex et formatage SQL.",
    icon: KeyRoundIcon as any,
    id: "cryptoTools",
    label: "Outils crypto & dev",
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
  documentParser: {
    description:
      "Analyse avancée d'un document joint (PDF, DOCX, CSV) : extraction sémantique du texte par pages/chapitres et détection des tableaux, exportables vers le tableur interactif.",
    icon: FileSearchIcon as any,
    id: "documentParser",
    label: "Analyser document",
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
  generateDiagram: {
    description:
      "Génère un diagramme interactif (architecture, séquence, flowchart, mindmap, gantt…) en syntaxe Mermaid ou PlantUML, rendu dans le chat avec zoom, pan et export PNG/SVG.",
    icon: WaypointsIcon as any,
    id: "generateDiagram",
    label: "Générer diagramme",
  },
  getAccountUsage: {
    description:
      "Affiche votre forfait (Free/Plus/Pro/Max) et votre consommation : tokens IA hebdomadaires, images générées du jour, synthèse vocale et stockage cloud, avec jauges et dates de réinitialisation.",
    icon: GaugeIcon as any,
    id: "getAccountUsage",
    label: "Consommation & forfait",
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
  quizzly: {
    description:
      "Générateur de quiz interactifs sur mesure avec correction dynamique vert/rouge, explications détaillées et score final.",
    icon: TrophyIcon as any,
    id: "quizzly",
    label: "Quizzly",
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
  updateAccountProfile: {
    description:
      "Prépare la modification de votre nom d'utilisateur et/ou de votre numéro de téléphone. Rien n'est appliqué sans votre accord : une carte de confirmation affiche les valeurs avant → après et vous y saisissez vous-même votre mot de passe, qui n'est jamais transmis à l'IA.",
    icon: UserRoundIcon as any,
    id: "updateAccountProfile",
    label: "Modifier mon profil",
  },
  updateDocument: {
    description:
      "Réécrit intégralement un artefact existant en conservant son titre. À activer pour une refonte complète ; préférer « Éditer document » pour des ajustements ponctuels.",
    icon: FileTextIcon as any,
    id: "updateDocument",
    isArtifact: true,
    label: "Réécrire document",
  },
  webCapture: {
    description:
      "Capture une page web réelle : screenshot de l'URL, métadonnées OpenGraph, informations SEO et technologies détectées. À activer pour critiquer un design, auditer une landing page ou analyser le SEO d'un site.",
    icon: CameraIcon as any,
    id: "webCapture",
    label: "Capture d'écran Web",
  },
  webSearch: {
    description:
      "Recherche sur le Web en temps réel : actualités, documentation, prix, vérifications factuelles. À activer pour toute question portant sur des informations récentes ou vérifiables.",
    icon: GlobeIcon as any,
    id: "webSearch",
    label: "Recherche Web",
  },
};

// Hints injectés dans le prompt système (côté modèle) — source unique,
// importée par app/(chat)/api/chat/route.ts.
export const TOOL_SYSTEM_HINTS: Record<ToolId, string> = {
  askUser:
    "askUser (pose de 1 à 10 questions précises et structurées à l'utilisateur avec choix uniques/multiples et option champ libre lorsqu'une demande est incomplète, nécessite des éclaircissements, ou des préférences avant de poursuivre)",
  audioGenerate:
    "audioGenerate (synthèse vocale : transforme un texte en voix. Exécuter immédiatement avec la voix par défaut 'flux-alexis-en' sans demander le choix de la voix)",
  audioPodcast:
    "audioPodcast (crée un podcast-débat entre un animateur et une experte : écrire le dialogue en segments vivants de 2 à 4 phrases, accroche à conclusion, puis les synthétiser avec 2 voix distinctes — ne jamais demander de choix de voix)",
  calculator:
    "calculator (calculs exacts : arithmétique, trigonométrie, logarithmes, conversions d'unités — longueur, masse, température, temps, volume, données, énergie, pression, vitesse, surface, angle)",
  calendarReminder:
    "calendarReminder (détecte une date/échéance/réunion dans la conversation et génère un événement téléchargeable .ics + liens Google Calendar/Outlook — demander la zone horaire en cas d'ambiguïté)",
  codeExecution:
    "codeExecution (exécute du Python/JS dans le navigateur : tester un algorithme, traiter des données, vérifier un résultat)",
  createDocument:
    "createDocument (crée un artefact texte/code/sheet/html : tout contenu long ou structuré que l'utilisateur pourra ouvrir et éditer)",
  cryptoTools:
    "cryptoTools (boîte à outils dev : hash SHA-256/384/512, bcrypt hash/compare, décodage et vérification de JWT, génération de secrets aléatoires, test de regex détaillé, formatage SQL multi-dialectes)",
  currencyConverter:
    "currencyConverter (conversion de devises EUR, USD, GBP, JPY, CHF, etc. et cryptos BTC, ETH, SOL en temps réel avec taux de change)",
  dateTime:
    "dateTime (date/heure actuelle, conversions entre fuseaux horaires, différences entre dates, calcul de la date de Pâques, formatage)",
  documentParser:
    "documentParser (analyse avancée d'un document joint PDF/DOCX/CSV : extraction du texte par pages/chapitres, détection des titres, extraction des tableaux — renvoyer ensuite les tableaux via createDocument kind='sheet')",
  editDocument:
    "editDocument (modification ciblée d'un artefact existant : à privilégier pour de petits changements)",
  generateChart:
    "generateChart (crée des graphiques SVG vectoriels de type barres, camembert ou anneau à partir de séries de données)",
  generateDiagram:
    "generateDiagram (génère un diagramme visuel interactif en Mermaid ou PlantUML : architecture, séquence, flowchart, mindmap, gantt, timeline — code propre sans balises ```)",
  getAccountUsage:
    "getAccountUsage (affiche le forfait Free/Plus/Pro/Max, les tokens IA consommés/limite, les images du jour, la synthèse vocale et le stockage cloud sous forme de carte — commente ensuite brièvement les points notables : taux supérieur à 80 %, quota épuisé, réinitialisation proche)",
  getWeather:
    "getWeather (météo actuelle et prévisions 1 à 7 jours, celsius/fahrenheit, par ville ou coordonnées)",
  imageGenerate:
    "imageGenerate (génère une image à partir d'une description via mAI Studio)",
  memory:
    "memory (mémoire personnalisée — retenir, oublier, lister ou retrouver des informations durables sur l'utilisateur)",
  note: "note (crée une note formatée et téléchargeable : markdown, texte, JSON, CSV, HTML, code)",
  qrCodeGenerator:
    "qrCodeGenerator (génère un QR code vectoriel SVG/PNG scannable pour un lien, texte, contact ou Wi-Fi)",
  quizzly:
    "quizzly (génère un quiz interactif complet de 1 à 50 questions avec choix unique/multiple, réponses correctes, explications et calcul de score pour tester l'utilisateur de manière ludique)",
  readUrl:
    "readUrl (extrait et lit le texte propre et structuré d'une page Web ou d'une documentation en ligne via son URL)",
  requestSuggestions:
    "requestSuggestions (propose des améliorations sur un artefact existant : structure, clarté, style)",
  updateAccountProfile:
    "updateAccountProfile (prépare la modification du nom d'utilisateur et/ou du téléphone via une carte de confirmation sécurisée : à n'appeler que sur demande explicite de l'utilisateur, ne demande JAMAIS le mot de passe, n'exécute rien toi-même et attends le résultat (submitted ou cancelled) renvoyé par la carte avant de confirmer ; les erreurs de validation restent affichées dans la carte)",
  updateDocument:
    "updateDocument (réécriture complète d'un artefact : pour une refonte ; préférer editDocument pour des ajustements)",
  webCapture:
    "webCapture (capture d'écran réelle d'une URL + métadonnées OpenGraph/SEO et technologies détectées — pour critiquer un design, auditer une page ou montrer un site)",
  webSearch:
    "webSearch (recherche sur le Web en temps réel : actualités, documentation, faits vérifiables — citer les sources retournées)",
};

export const DEFAULT_ENABLED_TOOLS: ToolId[] = []; // tous désactivés par défaut
