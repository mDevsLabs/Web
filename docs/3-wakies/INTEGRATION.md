# Wakies intégré : sources OpenMuse, services mAI

Source officielle : OpenMuse main 1ac68f3909f2478ab6280883f1ab5ea65eb5719d. Hôte : mAI canary c7a390aedc0424d83fc552d13ea189ab417c7f66. Les modifications locales antérieures sont conservées.

## Modules exécutés

apps/wakies contient réellement les 226 fichiers suivis de la source officielle, sans .git imbriqué. apps/mobile est la référence Expo ; apps/server, worker, computer et packages restent des sources optionnelles non déployées. Leur configuration Intelligence ne fait pas partie du chemin exécuté dans mAI.

components/wakies est le port React DOM actif sous app/(wakies)/wakies. WorkspaceNavigation, AppsScreen, GoalsScreen et IdeasScreen complètent la navigation inspirée d'OpenMuse. Les pages, mémoires, tâches et personnalisations mAI sont conservées. lib/wakies adapte ces composants aux services hôte. Les API vivent sous app/(chat)/api/wakies ; API_INVENTORY.json liste leurs méthodes et points d'authentification ; API_CONTRACTS.json conserve les schémas et expressions de réponse extraits des 23 fichiers de routes.

## Conversations

useChat et DefaultChatTransport envoient uniquement le dernier message utilisateur. Le serveur refuse les parties système/outils fournies par le navigateur, reconstruit les 199 derniers messages PostgreSQL, valide le modèle contre fetchUserModels et le forfait, puis appelle getLanguageModel et streamText. Les UIMessage structurés restent la représentation des messages. L'interface charge 50 messages et permet le chargement des précédents. L'actualisation interappareils passe par une lecture serveur toutes les 30 secondes, seulement hors génération, si la page est visible et connectée.

Le message utilisateur est persisté avant génération ; les réponses possèdent un UUID serveur et les réponses partielles sont conservées. La migration additive 0043_wakies_chat_turns réserve les tours sous verrou transactionnel, empêche les doublons et les générations concurrentes. Elle doit être appliquée avec le runner habituel avant utilisation du nouveau chat. Aucun DDL au runtime.

Les brouillons et la file issue d'OpenMuse restent en mémoire tant que l'interface est montée. Une erreur, un arrêt ou un changement de conversation suspend la file ; aucune exécution en arrière-plan n'est garantie. Ils ne sont pas synchronisés entre appareils.

## Données et outils

Les seize tables historiques restent présentes. Les tables propriétaires ont userId ; certaines tables enfants sont isolées par leur conversation ou Wakie propriétaire. Chaque fonction de requête exige userId. Les migrations 0037, 0041 et la migration locale 0042 sont conservées.

Session getMaiUser, restrictions Plus/Pro/Max, catalogue, fournisseurs, quotas et comptage d'usage sont ceux de mAI. Les mutations vérifient leur origine. Skills, plugins et MCP utilisent leurs registres hôte. Les outils incompatibles avec le modèle sont absents. Les outils MCP soumis à approbation et les plugins à effets externes ne sont pas exposés au chat tant que la reprise sécurisée des approbations n'est pas raccordée ; le mode Agent reste le parcours approprié pour ces actions.

Les pièces jointes réutilisent les uploads et blobs privés de mAI, avec chemin durable et signature serveur. Images/PDF natifs selon les capacités du modèle ; texte/JSON et PDF textuels réellement extraits en repli. Les PDF scannés sans OCR et les formats non supportés produisent une erreur explicite. Le sélecteur Mes fichiers mAI liste les blobs privés du compte avec pagination, métadonnées vérifiées, liens temporaires et suppression. Il réutilise le stockage des pièces jointes du chat ; la bibliothèque cloud Val Town possède un contrat distinct et reste accessible dans mAI.

## Capacités secondaires

Activité utilise les tâches, résultats et cron Wakies existants. Objectifs utilise des pages Markdown privées avec checklist et contrôle de révision : il s'agit d'objectifs simples, pas du moteur autonome de suivi OpenMuse. Idées indique explicitement l'indisponibilité du moteur de suggestions. Apps lit les capacités réelles de mAI. Navigateur isolé, Linux, terminal, voix temps réel, worker et connecteurs autonomes Gmail/Calendar ne sont pas configurés ; leurs sources sont conservées.

## Styles et appareils

build-wakies-css.mjs génère wakies.css et wakies-editor.css depuis apps/wakies/integration/web, dans la couche wakies-base. wakies-ui.css vient de packages/ui/dist/styles.css, dans la couche mdevs, sans font-face ni thème système sombre. Les sélecteurs sont ancrés sous .wakies-root. Les dialogues propres à Wakies restent dans cette racine ; le sélecteur de modèles partagé utilise son portail et les styles de l'hôte, sans recevoir les styles Wakies.

La navigation principale est latérale sur ordinateur et basse sur téléphone/tablette, avec un tiroir pour les Wakies et leurs conversations. Les corrections, tests et limites de validation sont décrits dans [UI_VALIDATION.md](UI_VALIDATION.md).

Le port DOM évite d'ajouter Expo ou react-native-web au build et conserve le React de l'hôte. Capacitor et Electron chargent toujours le site mAI et la route /wakies. Le CSS traite navigation tactile, largeur responsive et safe-area. Une compatibilité CSS ne constitue pas un test exécuté sur appareil.

Voir OPENMUSE_MIGRATION.md et VALIDATION_OPENMUSE.md. Les documents historiques restent identifiables comme tels.
