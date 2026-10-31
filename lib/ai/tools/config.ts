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
  ImagePlusIcon,
  KeyRoundIcon,
  LightbulbIcon,
  LineChartIcon,
  NotebookIcon,
  PencilIcon,
  PlayIcon,
  PodcastIcon,
  QrCodeIcon,
  TrophyIcon,
  UserRoundIcon,
  Volume2Icon,
  WaypointsIcon,
} from "@mdevs/icons";
import type { ComponentType } from "react";

// Source unique : `lib/ai/tools/ids.ts` distingue les outils réellement
// implémentés par `createChatTools` (NATIVE_TOOL_IDS) de ceux livrés par un
// plugin (PLUGIN_PROVIDED_TOOL_IDS), tout en exposant la liste complète des
// identifiants sélectionnables dans l'interface.
import { type ChatToolId, TOOL_IDS } from "./ids";

export { TOOL_SYSTEM_HINTS } from "./hints";
export { TOOL_IDS };

export type NativeToolId = ChatToolId;

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
  // « plugin » : l'outil n'est pas instancié par `createChatTools` mais fourni
  // par un plugin installable (réservé aux forfaits payants).
  providedBy?: "native" | "plugin";
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
  getUsageStats: {
    description:
      "Analyse l'historique de consommation : tokens dans le temps (texte, image, audio), conversations créées par mode et classement des modèles. Les images sont comptées en nombre de générations, pas en tokens.",
    icon: LineChartIcon as any,
    id: "getUsageStats",
    label: "Analyser mes statistiques",
  },
  getWeather: {
    description:
      "Fournit la météo actuelle et les prévisions de 1 à 7 jours pour une ville ou des coordonnées. À activer pour toute question sur le climat ou les conditions du jour.",
    icon: CloudSunIcon as any,
    id: "getWeather",
    label: "Météo",
    providedBy: "plugin",
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
    providedBy: "plugin",
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
  updateProfilePicture: {
    description:
      "Prépare le changement de votre photo de profil à partir d'une image jointe ou d'une URL HTTPS. Rien n'est appliqué sans votre accord : une carte affiche l'aperçu de l'image, son origine et l'action ; confirmez-y le changement (valable uniquement pour cette image exacte).",
    icon: ImagePlusIcon as any,
    id: "updateProfilePicture",
    label: "Changer ma photo",
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

// Les outils sont activés uniquement par une action explicite de l'utilisateur.
// Le bouton d'analyse des statistiques transmet son outil avec le brouillon.
export const DEFAULT_ENABLED_TOOLS: ToolId[] = [];
