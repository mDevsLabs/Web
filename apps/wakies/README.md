# Wakies — références et intégration mAI

L’interface exécutée vit dans `components/wakies`, le domaine dans `lib/wakies` et les routes dans `app/(chat)/api/wakies`. Le paquet de ce dossier délègue dev, build et typecheck à l’hôte ; aucune application Hono ou Expo n’est lancée par le build Next.

`integration/web` contient les sources CSS nécessaires au générateur Wakies. Les images, médias et la licence MIT d’OpenMuse sont conservés. La référence mobile et son domaine partagé restent des archives de lecture : deux adaptations locales antérieures y sont protégées. Cette référence n’est pas la procédure de compilation ou de connexion de mAI.

Les services autonomes, leurs tests, CI et configurations mono-propriétaire ont été retirés. Il n’y a plus de configuration Google OAuth OpenMuse à saisir : Wakies utilise la session mAI. Gmail, Calendar, les ordinateurs persistants et le worker autonome ne sont pas activés par ce nettoyage.

`SOURCE_MANIFEST.json` et `PROVENANCE.json` conservent le commit d’origine, les empreintes des fichiers conservés et retirés, ainsi que les adaptations locales. `node ../../scripts/check-wakies-source.mjs` vérifie cette provenance. Les anciens guides en anglais sont des archives historiques du projet amont.

Pour l’installation, les migrations et la messagerie, lire `docs/3-wakies/INTEGRATION.md` et `MESSAGING.md` depuis la racine. Le nettoyage est détaillé dans `docs/CLEANUP.md`.
