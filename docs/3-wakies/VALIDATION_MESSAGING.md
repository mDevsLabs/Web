# Validation du chantier Wakies et du nettoyage

Revue locale du 11 octobre 2026. Les changements préexistants et ceux d’autres travaux dans l’arbre sont conservés.

## Contrôles de conservation

- `node scripts/check-cleanup.mjs` : **141 retraits confirmés**, **2 859 images initiales intactes**, comparaison de chaque SHA-256 avec [CLEANUP_IMAGES.json](../CLEANUP_IMAGES.json).
  - *Chantier suivant (20 octobre 2026)* : l’inventaire est passé à **182 retraits** et le registre des images à **2 856 entrées** — trois désignations provisoires pointant vers des artefacts de build ignorés par Git ont été remplacées par leurs sources suivies, d’empreintes identiques. Voir [CLEANUP.md](../CLEANUP.md).
- `node scripts/check-wakies-source.mjs` : **91 sources conservées vérifiées**, **135 sources autonomes retirées**. Les deux adaptations mobiles locales sont contrôlées avec leurs empreintes propres.
- Les migrations 0049 et 0050 disposent de leur SQL, de leurs entrées de journal et de leurs colonnes dans le contrôle du schéma. Elles n’ont pas été exécutées contre une base de production.

## Revue navigateur

`node tests/manual/wakies-messaging-display.mjs` utilise Playwright et Chromium via Edge. Les vérifications passent en **375 px** et **1 100 px** : le panneau de cinquante notifications reste borné, défile et laisse la conversation visible. Les captures sont enregistrées dans le répertoire temporaire `mai-messaging-display`.

Ce contrôle porte sur les styles distribués et le balisage des notifications. Il ne constitue pas un scénario complet avec authentification, fournisseur IA et base réelle.

`node tests/manual/wakies-messaging-flows.mjs` monte les **composants React réels** `ConversationList` et `FriendsScreen`, avec une API contrôlée. Les parcours passent à 375 et 1 100 px : ajout aux favoris, sourdine, recherche, consultation d’une fiche publique, clonage dans l’espace choisi puis ouverture de la nouvelle conversation. Les requêtes et l’absence d’erreurs React sont vérifiées.

La dépendance `@date-fns/tz` **1.5.0**, déjà utilisée par le moteur de récurrence, est désormais déclarée dans `package.json` et le verrouillage. Une installation propre ne doit pas retirer cette capacité de planification.

## Tests et compilation

Le contrôle Biome ciblé passe sur **139 fichiers** du domaine Wakies, des API et de la validation. Le dernier contrôle global `pnpm check` signale **14 erreurs** dans d’autres parties de l’arbre, notamment Vibe et les intégrations.

Les relances globales des tests unitaires et du contrôle TypeScript n’ont pas fourni de validation finale complète. La tâche et les tests encore en cours ont été arrêtés à la demande de l’utilisateur ; aucun nouveau test n’est lancé. Les parcours navigateur et les contrôles de conservation mentionnés ci-dessus avaient déjà terminé avec succès.

La première compilation Turbopack a échoué dans les modules internes de `next/font/google`, pour Plus Jakarta Sans. Les générateurs CSS Vibe, Wakies et Site ont terminé correctement. La compilation de secours Webpack a été interrompue pour exécuter les contrôles séparément sur une machine fortement sollicitée ; elle n’est pas considérée comme réussie.

## Limites

Les tests locaux ne certifient pas le backend Hono déployé sur Val Town, les fournisseurs externes ou une migration PostgreSQL en production. Les notifications navigateur nécessitent une application ouverte et une permission accordée ; aucun Web Push après fermeture n’est configuré.
