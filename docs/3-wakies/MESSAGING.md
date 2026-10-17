# Messagerie et amis Wakies

Wakies est une messagerie d’agents IA avec un espace de travail. Les amis sont des Wakies publics suivis. Chaque conversation porte un seul Wakie, qui répond à chaque tour. Les messages sont conservés ; aucune story ou expiration automatique n’est ajoutée.

## Découvrir et discuter

Dans Amis, recherchez un nom ou un pseudo, consultez les informations publiques puis choisissez « Cloner et discuter ». Le choix de l’espace détermine où le clone est créé. Le serveur applique le quota de Wakies ; la conversation consomme ensuite les quotas habituels de mAI.

Seules la persona et les informations publiées servent au clone. Les secrets, outils privés, souvenirs et conversations du propriétaire ne sont pas copiés. Le clone est indépendant : retirer l’ami public ne le supprime pas. Si la conversation ne peut pas être créée après le clonage, le clone reste disponible dans Messages et l’interface l’annonce.

## Conversations et préférences

| Opération | Route et comportement |
| --- | --- |
| Liste | `GET /api/wakies/conversations` : aperçu et non-lus calculés par le serveur |
| Préférences | `PATCH /api/wakies/conversations/:id` avec `favorite` et/ou `muted`, booléens facultatifs |
| Création | `POST /api/wakies/conversations` avec `wakieId` et `title` |
| Historique | `GET /api/wakies/conversations/:id/messages` : pagination par `seq`, URLs de pièces jointes resignées |
| Lecture | `POST /api/wakies/conversations/:id/read` avec le dernier `seq` affiché ; le curseur ne recule pas |
| Interactions | Routes de réactions, épingles, transfert et enregistrement en page existantes |

Les favoris apparaissent avant les autres conversations, puis l’activité récente détermine l’ordre. La sourdine bloque les nouvelles alertes, sans supprimer les messages ou les non-lus. Les citations et transferts conservent leurs références réelles ; une cible non chargée n’est pas reconstruite.

Les conversations de groupe entre Wakies sont retirées du produit. Les colonnes `isGroup` et la table `WakieConversationMember` restent en base — les migrations sont additives — et `listConversations` écarte les fils de groupe existants pour qu'ils n'apparaissent pas comme des conversations fantômes.

## Actualisation et lecture

SWR relève les listes, l’historique et les interactions toutes les cinq secondes lorsque la page est visible, au retour du focus et après les mutations. Pendant le streaming local, aucune relève ne remplace les messages en cours. La fusion par identifiant et `seq` conserve les pages anciennes et les brouillons.

La fin du fil doit être visible dans une page visible avant l’écriture du curseur de lecture. Le serveur conserve les non-lus tant que cette écriture n’a pas abouti.

## Notifications

Une réponse terminée produit un événement durable `WakiesNotification` dans la transaction qui termine le tour IA. Les messages partiels ou les tours échoués ne produisent pas d’événement. L’unicité par message et le verrou par compte empêchent les doublons de persistance et les dépassements de curseur entre transactions concurrentes.

`GET /api/wakies/notifications` initialise le curseur sans annoncer l’historique. `?after=<entier>` retourne au plus cent événements dans l’ordre, avec `cursor`, `scope` et `notifications`. Le scope est une empreinte du compte ; aucune adresse mail ou clé ne passe dans ce contrat. Les événements indiquent l’identifiant de message, la conversation, le titre, l’aperçu, la sourdine et leur séquence.

Le panneau interne conserve les cinquante dernières alertes reçues pendant la session de l’interface. Les réponses d’une conversation actuellement affichée et les nouvelles alertes de conversations en sourdine ne s’y ajoutent pas.

Le bouton « Autoriser les notifications du navigateur » demande la permission depuis un geste explicite. Les alertes navigateur apparaissent en arrière-plan si la permission est accordée. Un verrou Web Locks et un curseur local par compte évitent les alertes en double entre onglets ; le tag navigateur fournit aussi une déduplication sur les navigateurs sans Web Locks. Un clic sur une alerte ouvre sa conversation et ramène la fenêtre au premier plan.

La relève des notifications continue lorsque l’onglet est en arrière-plan, sous réserve des limitations du navigateur. L’application doit rester ouverte : aucun Web Push ou service de livraison après fermeture n’est configuré.

## Migrations et contrôles

Appliquer les migrations **0049** (préférences) et **0050** (événements et clé des réactions humaines) avant le déploiement applicatif. Elles sont additives et idempotentes ; les messages existants restent conservés. La clé calculée `actorKey` distingue une réaction humaine (`byWakieId = null`) des réactions IA.

Les tests couvrent la fusion, le classement, les permissions, la déduplication navigateur, les routes et l’isolation. Les vérifications de déploiement et de base réelle restent séparées des tests unitaires.

## Rattrapage de l’historique

`GET /api/wakies/conversations/:id/messages?apres=SEQ&limite=100` avance en ordre croissant et retourne `seqSuivant` tant qu’une page reste disponible. `avant` et `apres` sont mutuellement exclusifs. Le client relève au plus cinq pages par tick, conserve les pages anciennes et renouvelle les signatures de la page récente.
