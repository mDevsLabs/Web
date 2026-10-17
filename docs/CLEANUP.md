# Nettoyage du dépôt

Le chantier retire 141 fichiers : 135 fichiers des services autonomes, tests, configurations et CI OpenMuse remplacés par l’hôte mAI, et six scripts temporaires d’inspection ou de réécriture. [CLEANUP_INVENTORY.json](CLEANUP_INVENTORY.json) conserve chaque chemin, son empreinte et la justification du retrait.

## Preuves et exclusions

Le build racine utilise Next et les générateurs Vibe, Wakies et Site. Le paquet `apps/wakies` délègue ses commandes à l’hôte ; le typecheck exclut les apps de référence et Vitest ne collecte pas les tests autonomes OpenMuse. Les générateurs Wakies lisent `integration/web` et les styles du paquet UI, pas les serveurs OpenMuse.

L’audit des références a recherché les chemins supprimés dans le code applicatif, les composants Wakies portés, les scripts, les tests et les configurations de build/typecheck. Aucun chemin vers `apps/wakies/apps/`, `apps/wakies/packages/`, `apps/wakies/tests/` ou les configurations autonomes supprimées n’est référencé par ces points d’entrée. Les seules références opérationnelles à `apps/wakies/` ciblent les sources `integration/web` conservées ; les occurrences historiques restent dans la documentation et les inventaires.

Les services retirés utilisaient une identité mono-propriétaire et leur propre SQLite, worker ou OAuth Google. L’intégration exécutée utilise la session mAI, PostgreSQL et les outils de l’hôte. Les anciennes variables Google ne sont plus proposées comme configuration de Wakies ; aucune connexion Google, Gmail ou Calendar n’est activée par ce nettoyage.

Deux fichiers de l’interface mobile de référence portaient déjà des adaptations locales. Toute cette référence et son domaine partagé restent conservés. Le manifeste garde les empreintes officielles et les empreintes locales exactes de ces deux adaptations ; le vérificateur continue de contrôler les deux provenances.

Les fichiers backend Val Town à la racine, les miroirs CLI sous `scripts/`, les applications Coder, Vibe, Site, Desktop et Mobile mAI et les packages partagés sont conservés. Ils ont des points d’entrée ou des usages indépendants du build Next. Les licences, médias et sources des générateurs restent présents. Les documents historiques sont identifiés comme archives, pas comme procédures de production.

## Images et provenance

Les 2 859 images présentes au début de ce chantier ont été inventoriées par chemin et SHA-256, hors dépendances et caches. [CLEANUP_IMAGES.json](CLEANUP_IMAGES.json) conserve ces empreintes ; `node scripts/check-cleanup.mjs` rejoue le contrôle de présence et de contenu, ainsi que la vérification des retraits. Le contrôle final compare chaque empreinte. Aucune suppression d’image n’est inscrite à l’inventaire des retraits.

Des suppressions d’anciennes mascottes étaient déjà présentes dans l’état initial du dépôt : `blue.png`, `mint.png`, `orange.png`, `purple.png` et `red.png` sous `public/wakies`. Le chantier ne modifie pas ces suppressions antérieures.

Le manifeste OpenMuse distingue `files` (fichiers conservés), `retiredFiles` (empreintes des sources retirées) et `localAdaptations` (références localement adaptées). `node scripts/check-wakies-source.mjs` contrôle les fichiers conservés, interdit le retrait d’images et vérifie que les fichiers déclarés retirés sont absents. Le commit de provenance permet de retrouver les sources autonomes en amont.

## Validation

Le bilan d’exécution du chantier est dans [VALIDATION_MESSAGING.md](3-wakies/VALIDATION_MESSAGING.md). Les contrôles du backend distant et l’application des migrations à la production restent distincts des vérifications locales.
