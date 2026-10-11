# Wakies intégré : sources OpenMuse, services mAI

Source officielle : OpenMuse main 1ac68f3909f2478ab6280883f1ab5ea65eb5719d. Hôte : mAI canary c7a390aedc0424d83fc552d13ea189ab417c7f66. Les modifications locales antérieures sont conservées.

## Modules exécutés

apps/wakies contient réellement les 226 fichiers suivis de la source officielle, sans .git imbriqué. apps/mobile est la référence Expo ; apps/server, worker, computer et packages restent des sources optionnelles non déployées. Leur configuration Intelligence ne fait pas partie du chemin exécuté dans mAI.

components/wakies est le port React DOM actif sous app/(wakies)/wakies. WorkspaceNavigation, GoalsScreen et IdeasScreen complètent la navigation inspirée d'OpenMuse. L'écran « Applications » et les conversations de groupe sont retirés. Les pages, mémoires, tâches et personnalisations mAI sont conservées. lib/wakies adapte ces composants aux services hôte. Les API vivent sous app/(chat)/api/wakies ; API_INVENTORY.json liste leurs méthodes et points d'authentification ; API_CONTRACTS.json conserve les schémas et expressions de réponse extraits des 23 fichiers de routes.

## Conversations

useChat et DefaultChatTransport envoient uniquement le dernier message utilisateur. Le serveur refuse les parties système/outils fournies par le navigateur, reconstruit les 199 derniers messages PostgreSQL, valide le modèle contre fetchUserModels et le forfait, puis appelle getLanguageModel et streamText. Les UIMessage structurés restent la représentation des messages. L'interface charge 50 messages et permet le chargement des précédents. L'actualisation interappareils passe par une lecture serveur toutes les 30 secondes, seulement hors génération, si la page est visible et connectée.

Le message utilisateur est persisté avant génération ; les réponses possèdent un UUID serveur et les réponses partielles sont conservées. La migration additive 0043_wakies_chat_turns réserve les tours sous verrou transactionnel, empêche les doublons et les générations concurrentes. Elle doit être appliquée avec le runner habituel avant utilisation du nouveau chat. Aucun DDL au runtime.

## Messagerie

Un message peut être CITÉ : la route de chat accepte `replyToId`, vérifie que la cible appartient bien à la conversation ET au compte (`messageCite`), la stocke sur le message (`WakiesMessage.replyToId`) et la présente au modèle comme un bloc de prompt (`reponseA`). Le fil affiche la même citation, avec le nom réel de l'auteur — « Vous », le nom du Wakie du fil, ou « Wakie » quand le nom est inconnu. Aucune citation n'est affichée si la cible n'est pas chargée : le rendu ne fabrique pas d'extrait.

La lecture se marque sur un `seq` RÉELLEMENT affiché (migration 0048, `WakiesConversation.lastReadSeq`), par `POST /api/wakies/conversations/:id/read {seq}`. Le curseur ne recule jamais (`greatest`) : deux onglets dont l'un affiche une page ancienne ne ressuscitent pas de non-lus déjà lus. La liste des conversations reçoit du serveur l'aperçu du dernier message, son horodatage, ses participants (`membreIds`) et le compteur de non-lus — le client ne recalcule ni un aperçu ni un état de lecture.

Deux actions de compte sur un message : le TRANSFERT (`POST /api/wakies/messages/:id/forward`) copie le message dans une autre conversation du même compte — l'original reste intact, les parts sont recopiées à l'identique et une part de provenance (`data-wakies-forward`) porte la conversation d'origine, ce qui évite d'écrire un faux « Transféré de … » en texte ; et « Enregistrer en page » (`POST /api/wakies/messages/:id/page`) épingle le message et crée une page Markdown de citation attribuée et datée, dans l'espace du Wakie. Un message sans texte (appel d'outil, pièce jointe seule) est refusé en 400, pas sauvé vide.

La RECHERCHE (`GET /api/wakies/search?q=`) cherche d'un côté les TITRES de conversation et de l'autre le texte des messages, bornée aux 100 derniers messages de chaque conversation (200 lignes scannées, 20 résultats) : c'est une recherche de reprise, pas une indexation plein-texte. Le seuil est de deux caractères, comme l'annuaire, et l'interface l'annonce. Un résultat ouvre le fil et met le message en évidence.

Le fil affiche des séparateurs de jour calculés dans le fuseau du navigateur (« Aujourd'hui », « Hier », puis la date) à partir des horodatages RÉELS du serveur. Les décisions de rendu pures — citation, provenance, sections de jour, curseur de lecture — vivent dans `lib/wakies/shared/transcript.ts` et sont couvertes par `tests/unit/wakies-transcript.test.ts`.

Les brouillons et la file issue d'OpenMuse restent en mémoire tant que l'interface est montée. Une erreur, un arrêt ou un changement de conversation suspend la file ; aucune exécution en arrière-plan n'est garantie. Ils ne sont pas synchronisés entre appareils.

## Données et outils

Les seize tables historiques restent présentes. Les tables propriétaires ont userId ; certaines tables enfants sont isolées par leur conversation ou Wakie propriétaire. Chaque fonction de requête exige userId. Les migrations 0037, 0041 et la migration locale 0042 sont conservées.

Session getMaiUser, restrictions Plus/Pro/Max, catalogue, fournisseurs, quotas et comptage d'usage sont ceux de mAI. Les mutations vérifient leur origine. Skills, plugins et MCP utilisent leurs registres hôte. Les outils incompatibles avec le modèle sont absents. Les outils MCP soumis à approbation et les plugins à effets externes ne sont pas exposés au chat tant que la reprise sécurisée des approbations n'est pas raccordée ; le mode Agent reste le parcours approprié pour ces actions.

Les pièces jointes réutilisent les uploads et blobs privés de mAI, avec chemin durable et signature serveur. Images/PDF natifs selon les capacités du modèle ; texte/JSON et PDF textuels réellement extraits en repli. Les PDF scannés sans OCR et les formats non supportés produisent une erreur explicite. Le sélecteur Mes fichiers mAI liste les blobs privés du compte avec pagination, métadonnées vérifiées, liens temporaires et suppression. Il réutilise le stockage des pièces jointes du chat ; la bibliothèque cloud Val Town possède un contrat distinct et reste accessible dans mAI.

## Fiche et profil

Chaque Wakie a une fiche sociale (`GET/PATCH /api/wakies/wakies/:id/profile`) : pseudo, bio, liens, persona publiée, visibilité, avatar et bannière. Le propriétaire y accède depuis « Mon profil » ; un autre compte reçoit la fiche PUBLIQUE — `trouverWakiePublic` ne sélectionne ni instructions, ni capacités, ni mémoires. La galerie (`/wakies/:id/images`) re-signe chaque blob pour son propriétaire et sert en même temps le QUOTA du forfait (`quota: null` = illimité) : « 3 / 10 » affiché est la même valeur que celle qui refusera l'envoi. Le tiroir `WakieProfileDrawer` publie et retire des images en réutilisant `televerser`, donc le chemin de blob des pièces jointes.

Le profil Vibe du compte est lu en LECTURE SEULE par `lib/vibe/server/profil.ts` et sert deux surfaces : la carte « Mon profil » (`GET /api/wakies/me/profile`) et le prompt d'un tour, sous forme d'un résumé borné (`profilUtilisateur`). Quand Vibe n'a rien de plus que le pseudo, le bloc n'est pas ajouté. Wakies n'écrit jamais dans le profil Vibe : Vibe fait foi, la carte renvoie vers lui.

Les mentions `@` du composer proposent les membres RÉELS du fil (`GET /conversations/:id/members`) puis les Wakies du compte ; la résolution reste serveur (`resoudreMentions`) et une mention ne rend jamais un Wakie répondant — elle apporte son contexte en lecture seule. Les commandes `/slash` réutilisent les commandes du compte (`CustomCommand`, `kind = slash`) : outils activés pour le seul tour courant, prompt prédéfini, ou note affichée.

## Capacités secondaires

Activité utilise les tâches, résultats et cron Wakies existants. Objectifs utilise des pages Markdown privées avec checklist et contrôle de révision : il s'agit d'objectifs simples, pas du moteur autonome de suivi OpenMuse. Idées indique explicitement l'indisponibilité du moteur de suggestions. Apps lit les capacités réelles de mAI. Navigateur isolé, Linux, terminal, voix temps réel, worker et connecteurs autonomes Gmail/Calendar ne sont pas configurés ; les anciennes sources de services autonomes ont été retirées et leur provenance reste tracée.

## Styles et appareils

build-wakies-css.mjs génère wakies.css et wakies-editor.css depuis apps/wakies/integration/web, dans la couche wakies-base. wakies-ui.css vient de packages/ui/dist/styles.css, dans la couche mdevs, sans font-face ni thème système sombre. Les sélecteurs sont ancrés sous .wakies-root. Les dialogues propres à Wakies restent dans cette racine ; le sélecteur de modèles partagé utilise son portail et les styles de l'hôte, sans recevoir les styles Wakies.

La navigation principale est latérale sur ordinateur et basse sur téléphone/tablette, avec un tiroir pour les Wakies et leurs conversations. Les corrections, tests et limites de validation sont décrits dans [UI_VALIDATION.md](UI_VALIDATION.md).

Le port DOM évite d'ajouter Expo ou react-native-web au build et conserve le React de l'hôte. Capacitor et Electron chargent toujours le site mAI et la route /wakies. Le CSS traite navigation tactile, largeur responsive et safe-area. Une compatibilité CSS ne constitue pas un test exécuté sur appareil.

Voir OPENMUSE_MIGRATION.md et VALIDATION_OPENMUSE.md. Les documents historiques restent identifiables comme tels.

## Messagerie enrichie et nettoyage

Voir [MESSAGING.md](MESSAGING.md) pour les préférences, notifications et migrations 0049/0050, ainsi que [le rapport de nettoyage](../CLEANUP.md) pour les sources autonomes retirées. Les images et les générateurs CSS restent conservés.
