// Phrases injectées dans le prompt système pour chaque outil sélectionnable.
// Module sans React : le schéma envoyé au modèle (`tool.description`) et le
// prompt doivent pouvoir citer les mêmes faits sans tirer les icônes de
// `config.ts`. Le typage `Record<ChatToolId, string>` refuse un identifiant
// du catalogue sans phrase — une phrase manquante ne doit plus être remplacée
// par « Outil disponible pour cet échange ».

import { type ChatToolId, TOOL_IDS } from "./ids";

export const TOOL_SYSTEM_HINTS = {
  askUser:
    "askUser (pose de 1 à 10 questions précises et structurées à l'utilisateur avec choix uniques/multiples et option champ libre lorsqu'une demande est incomplète, nécessite des éclaircissements, ou des préférences avant de poursuivre)",
  audioGenerate:
    "audioGenerate (synthèse vocale : transforme un texte en voix. Exécuter immédiatement avec la voix par défaut 'flux-alexis-en' sans demander le choix de la voix)",
  audioPodcast:
    "audioPodcast (crée un podcast-débat entre un animateur et une experte : écrire le dialogue en segments vivants de 2 à 4 phrases, accroche à conclusion, puis les synthétiser avec 2 voix distinctes — ne jamais demander de choix de voix)",
  calculator:
    "calculator (calculs exacts : arithmétique, pourcentages — X % de Y, ajout d'un pourcentage, variation entre deux valeurs —, trigonométrie, logarithmes, conversions d'unités — longueur, masse, température, temps, volume, données, énergie, pression, vitesse, surface, angle. Ne jamais calculer un pourcentage de tête)",
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
  getUsageStats:
    "getUsageStats (analyse l'historique de consommation : tokens dans le temps pour texte et audio, nombre d'images générées, conversations créées par mode Chat/Agent, classement des modèles — les images et l'audio ne sont PAS en tokens et ne doivent pas être comparés au texte ; signale tout avertissement renvoyé)",
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
    "readUrl (extrait et lit le texte propre et structuré d'une page Web ou d'une documentation en ligne via son URL. À enchaîner après webSearch pour lire la page retenue avant de répondre)",
  requestSuggestions:
    "requestSuggestions (propose des améliorations sur un artefact existant : structure, clarté, style)",
  updateAccountProfile:
    "updateAccountProfile (prépare la modification du nom d'utilisateur et/ou du téléphone via une carte de confirmation sécurisée : à n'appeler que sur demande explicite de l'utilisateur, ne demande JAMAIS le mot de passe, n'exécute rien toi-même et attends le résultat (submitted ou cancelled) renvoyé par la carte avant de confirmer ; les erreurs de validation restent affichées dans la carte)",
  updateDocument:
    "updateDocument (réécriture complète d'un artefact : pour une refonte ; préférer editDocument pour des ajustements)",
  updateProfilePicture:
    "updateProfilePicture (prépare le changement de la photo de profil via une carte de confirmation : source = image jointe à la conversation OU URL HTTPS fournie par l'utilisateur ; à n'appeler QUE sur demande explicite de changer la photo de profil, n'exécute rien toi-même et attends le résultat (submitted, cancelled ou failed) renvoyé par la carte avant de confirmer ; une confirmation ne vaut que pour l'image exacte affichée)",
  webCapture:
    "webCapture (capture d'écran réelle d'une URL + métadonnées OpenGraph/SEO et technologies détectées — pour critiquer un design, auditer une page ou montrer un site)",
  webSearch:
    "webSearch (recherche sur le Web en temps réel : actualités, documentation, faits vérifiables — citer les sources retournées. Quand l'extrait ne suffit pas, appeler readUrl sur l'URL retenue avant de répondre)",
} satisfies Record<ChatToolId, string>;

/** Hints natifs plus ceux d'un registre (plugins), indexables par n'importe quel id. */
export function mergeToolHints(
  extra: Readonly<Record<string, string>> = {}
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const id of TOOL_IDS) {
    merged[id] = TOOL_SYSTEM_HINTS[id];
  }
  for (const [id, hint] of Object.entries(extra)) {
    const text = hint.trim();
    if (text) {
      merged[id] = text;
    }
  }
  return merged;
}
