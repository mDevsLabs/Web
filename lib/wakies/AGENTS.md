# Consignes du domaine Wakies

Lire [AGENTS.md](../../AGENTS.md) et [les règles Wakies](../../docs/3-wakies/AGENTS.md).

- Tout accès aux données est `server-only` et reçoit `userId` en premier paramètre ; une ressource enfant se contrôle via son propriétaire.
- Les fonctions pures de `shared/` et les fonctions navigateur de `client/` ne doivent pas importer un module serveur ou de secrets.
- Publier ou cloner ne copie que les informations volontairement publiques. Les capacités, secrets, souvenirs et historiques privés d’un autre compte restent inaccessibles.
- La lecture est monotone sur `lastReadSeq`. Les préférences de conversation sont des booléens ; une valeur absente du PATCH conserve le réglage actuel.
- Un événement `WakiesNotification` est écrit dans la transaction de fin d’un tour `completed`. Un tour interrompu ou échoué conserve ses messages sans produire d’alerte.
- Le réglage `WakiesSettings.replyAlertsEnabled` décide si l’événement est écrit (migration 0065). Il est lu **dans la transaction**, jamais à la lecture : une ligne de réglages absente vaut « activé ».
- Sérialiser l’allocation des événements de notification par compte avec le verrou transactionnel. Le curseur de notification est indépendant du `seq` des messages et du curseur de lecture.
- Une réaction humaine porte `byWakieId = null`. L’unicité utilise `actorKey`, calculée par PostgreSQL, jamais fournie par le navigateur.
- Les migrations 0049 et 0050 sont nécessaires avant de déployer ces fonctionnalités ; aucune réparation DDL au runtime.
