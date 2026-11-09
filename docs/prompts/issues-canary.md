# Prompt unique — toutes les corrections ouvertes

Un seul prompt. Il décrit les 64 issues ouvertes (#9 à #72) et demande de les corriger toutes.

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce prompt unique regroupe les 64 corrections encore ouvertes, de l’issue #9 à l’issue #72. Tu dois les traiter toutes, dans l’ordre des groupes ci-dessous, sans t’arrêter après un groupe et sans en ajouter.

La description de chaque issue fait foi. Ne te contente pas du numéro. Si un constat n’est plus reproductible sur canary, dis-le et ne le corrige pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de any pour faire taire le compilateur. Quand deux issues touchent le même fichier, garde les deux critères d’acceptation. Ne marque une issue comme réglée que si ses critères sont vérifiés.

Les groupes servent seulement à ordonner le travail. Ils ne sont pas des prompts séparés.

Groupe — Comptes, jetons et installeurs

1. Issue #9 — [Majeure][P1] Auth — l’API Hono accepte un mot de passe d’un caractère

Constat
Sur `canary`, l’inscription Hono ne borne pas `password`. `auth.ts:40-41` (`/register`) et `auth.ts:96-97` (`/verify-register`) vérifient seulement que la valeur est truthy. Le hash est calculé ensuite (`auth.ts:135`). Les alias `/v1/*`, `/api/*` et `/api/vibe/*` réutilisent le même handler.

Le parcours Next refuse déjà moins de 6 caractères (`app/(auth)/actions.ts:209`). La mise à jour de mot de passe du même module Hono le refuse aussi (`auth.ts:923-924`). Seule la création de compte est en écart.

Impact
Un client de l’API peut créer un compte avec un mot de passe d’un caractère après validation de l’OTP. Ce n’est pas un contournement de l’OTP : c’est une politique plus faible que le parcours web, qui affaiblit les comptes créés par cette API.

Reproduction
1. Appeler `POST /register` avec un e-mail, un nom et un mot de passe de 1 caractère.
2. Valider l’OTP via `POST /verify-register` avec le même mot de passe.
3. Rejouer avec 0, 5 puis 6 caractères, sur les alias `/v1`, `/api` et `/api/vibe`.

Résultat attendu
Les deux étapes rejettent un mot de passe hors bornes, avant l’envoi de l’OTP et à nouveau dans `/verify-register`. La borne minimale reste alignée sur le parcours Next (6). Une borne maximale explicite est appliquée des deux côtés.

Périmètre
- `auth.ts`
- schéma partagé avec `app/(auth)/actions.ts`, sans faire diverger les deux parcours
- tests d’inscription sur le handler et ses alias

Piste de correction
Extraire un schéma serveur (type string, minimum 6, maximum explicite) et l’appliquer aux deux étapes. Ne pas affaiblir le contrôle déjà présent sur la mise à jour de mot de passe.

Critères d'acceptation
- 0, 1 et 5 caractères sont refusés sur `/register` et `/verify-register`, y compris les alias.
- 6 caractères reste accepté si le reste du payload est valide.
- Un test automatisé couvre ces cas.
- Connexion et changement de mot de passe ne régressent pas.

Hors périmètre
- Ne pas présenter le défaut comme un contournement de l’OTP.
- Ne pas modifier le stockage du JWT (issue #10) ni inventer une politique de complexité absente du parcours Next.

2. Issue #10 — [Majeure][P1] Session — le JWT HttpOnly est recopié dans des stockages lisibles

Constat
Le jeton de session est lu côté serveur puis remis au client. `app/(chat)/site/layout.tsx:52-53` le lit, la ligne 77 le passe à `AuthProvider`. `lib/site/auth-storage.ts:59-64` l’écrit dans `localStorage` (`MAI_AUTH_KEY` / `mai_user`) et dans le cookie `mai_token`, lisible par JavaScript, pour 30 jours.

Impact
La protection HttpOnly est perdue sur ce parcours : un script exécuté dans l’origine peut lire et exfiltrer le jeton. Cela augmente l’impact d’une XSS éventuelle. Ce constat ne prouve pas qu’une XSS existe.

Reproduction
1. Ouvrir une session Site et inspecter `localStorage` ainsi que `document.cookie`.
2. Vérifier la présence du JWT dans `mai_token` et dans la clé de session.
3. Confirmer que le layout serveur transmet `initialToken` au composant client.

Résultat attendu
Le bearer reste côté serveur. Les appels sensibles passent par des routes serveur ou un cookie HttpOnly avec protection CSRF adaptée. Le jeton n’est plus une prop client ni une clé `localStorage`.

Périmètre
- `app/(chat)/site/layout.tsx`
- `components/site/auth-provider.tsx`
- `lib/site/auth-storage.ts`
- handoff Desktop qui reconnaît aujourd’hui `mai_token`

Piste de correction
Conserver la session en cookie HttpOnly et faire transiter les appels sensibles par le BFF. Prévoir la suppression des anciennes clés à la prochaine visite, et ajuster le handoff Desktop pour qu’il ne dépende plus d’un cookie lisible.

Critères d'acceptation
- Après connexion, le JWT n’apparaît ni dans `localStorage` ni dans un cookie lisible par `document.cookie`.
- Les parcours Site authentifiés continuent de fonctionner.
- Les anciennes clés sont effacées ou migrées.
- Aucun test ne dépend d’un jeton exposé au renderer.

Hors périmètre
- Ne pas conclure qu’une XSS est déjà présente.
- Ne pas élargir le correctif à toute l’authentification NextAuth hors de ce handoff.

3. Issue #13 — [Majeure][P1] Desktop — le contrôle de mise à jour peut proposer un downgrade

Constat
`apps/desktop/src/updater.ts` ne comprend pas les tags publiés. `cleanVersionString` ne retire qu’un `v` initial. `hasUpdate` vaut vrai dès que la chaîne diffère, sans comparer l’ordre. La boucle retient la première release qui a un asset compatible, sans tri semver.

Le générateur de tags produit pourtant `stable.x.y.z`, `beta.x.y.z-n` et `pr.x.y.z-n` (`scripts/release-version.mjs`).

Impact
Une installation `0.9.3` peut voir `stable.0.9.2` comme une mise à jour et se downgrader. Une installation déjà à jour peut se voir proposer le même numéro sous un autre préfixe. Une préversion ou une release sans asset pour la plateforme peut fausser le choix.

Reproduction
Couvrir par tests unitaires, sans télécharger d’installeur : version identique avec préfixe `stable.`, version plus ancienne, version plus récente, beta/pr, et release sans asset compatible.

Résultat attendu
Le canal demandé est filtré, la meilleure release compatible est choisie explicitement, et le téléchargement n’est proposé que si `candidate > current`.

Périmètre
- `apps/desktop/src/updater.ts`
- tests unitaires du comparateur et de la sélection
- `scripts/release-version.mjs` comme contrat de tags, à ne pas réécrire sans besoin

Piste de correction
Parser canal et semver, ignorer un tag égal ou plus ancien, et ne pas traiter une simple différence de chaîne comme une mise à jour.

Critères d'acceptation
- `stable.0.9.3` n’est pas une mise à jour pour `0.9.3`.
- `stable.0.9.2` n’est pas proposé à `0.9.3`.
- Une version plus récente du bon canal l’est.
- Une release sans asset plateforme est ignorée.

Hors périmètre
- Ne pas implémenter ici la vérification d’intégrité des binaires (issue #28).
- Ne pas télécharger ni ouvrir un installeur pour prouver le correctif.

4. Issue #28 — [Majeure][P1] Desktop — les installeurs téléchargés s’ouvrent sans contrôle d’intégrité

Constat
La fenêtre À propos demande au processus principal de télécharger puis d’ouvrir un installeur. `apps/desktop/src/about-window.ts` accepte `downloadUrl` et `fileName` par IPC. `updater.ts` (`downloadAndInstallUpdate`) utilise l’URL fournie, écrit le fichier, le rend exécutable sous Linux, puis appelle `shell.openPath` sans hash, taille attendue ni contrôle de signature.

Les artefacts Desktop sont par ailleurs produits non signés sur macOS et Windows dans le workflow de build.

Impact
HTTPS protège le transport, pas une seconde vérification avant lancement. Si le renderer, les métadonnées de release ou le canal IPC sont compromis, le processus principal peut écrire un chemin choisi et ouvrir un contenu non authentifié. Ce constat ne démontre pas une compromission actuelle.

Reproduction
Lire le handler IPC `about:download-update` et `downloadAndInstallUpdate`. Confirmer l’absence de allowlist d’hôte, de contrôle du `senderFrame`, de basename strict et de vérification SHA-256 avant `shell.openPath`.

Résultat attendu
Le Main choisit lui-même l’asset. Le renderer ne transmet qu’un identifiant opaque. L’URL est HTTPS et allowlistée, le nom de fichier est un basename, la taille et le SHA-256 viennent d’un manifeste authentifié, et l’installeur n’est ouvert qu’après contrôle.

Périmètre
- `apps/desktop/src/about-window.ts`
- `apps/desktop/src/about-preload.ts`
- `apps/desktop/src/updater.ts`
- workflow de signature, seulement si le correctif l’exige pour ne plus ignorer un binaire non authentifié

Piste de correction
Déplacer la sélection d’asset dans le Main. Valider le sender, imposer HTTPS et une allowlist, exiger un basename sans séparateur, vérifier taille et empreinte, puis ne pas ignorer le résultat de `shell.openPath`.

Critères d'acceptation
- Une URL hors allowlist ou un `fileName` contenant un séparateur est rejeté.
- `shell.openPath` n’est pas appelé si l’empreinte ne correspond pas.
- Le renderer ne peut plus choisir une URL arbitraire.
- Aucun installeur réel n’est exécuté pendant les tests.

Hors périmètre
- Ne pas prétendre qu’une compromission du renderer a été observée.
- Ne pas confondre ce correctif avec la comparaison de versions (issue #13).

5. Issue #36 — [Majeure][P1] Journaux — le masquage d’e-mail laisse passer les adresses courtes

Constat
`lib/site/email.ts` journalise des envois avec `console.log` et une regex `/(.{2}).*(@.*)/` (lignes 24, 189 et 229). Cette regex exige au moins trois caractères avant `@`. Une adresse courte n’est pas masquée et part entière dans les logs.

Le même fichier contient un repli en dur vers une adresse personnelle lorsque `GMAIL_USER` est absent (ligne 209) et une adresse d’administration en dur (ligne 298). `suspicious/noConsole` est désactivé dans `biome.jsonc`. Le dépôt compte encore 743 `console.log` hors `apps/` et `packages/`.

Impact
Des adresses peuvent apparaître en clair dans les journaux de production. Le repli en dur expose en plus une adresse personnelle si la variable d’environnement manque. Le volume de `console.log` empêche de couper ces traces par niveau.

Reproduction
1. Appliquer la regex actuelle à `ab@x.fr` et à `a@x.fr` : la substitution ne matche pas.
2. Lire les `console.log` des lignes 27, 190 et 230.
3. Confirmer les littéraux d’adresses aux lignes 209 et 298, sans les recopier dans un nouveau journal.

Résultat attendu
Toute adresse journalisée est masquée, y compris les parties locales d’un ou deux caractères. Aucune adresse personnelle ne sert de repli. Les traces d’envoi passent par le logger applicatif et peuvent être coupées en production.

Périmètre
- `lib/site/email.ts` en priorité
- helper de masquage partagé si l’issue #34 est traitée dans le même lot ; sinon un helper local testé
- ne pas lancer ici la suppression des 743 `console.log`

Piste de correction
Remplacer la regex par un masquage qui couvre les parties locales courtes. Retirer les adresses en dur. Remplacer les `console.log` de ce fichier par le logger existant (`logError` / logger info), sans imprimer l’adresse brute.

Critères d'acceptation
- `a@x.fr` et `ab@x.fr` sont masqués dans un test unitaire.
- Le fichier ne contient plus d’adresse personnelle en littéral.
- Un envoi réussi ne écrit plus l’adresse complète sur la sortie standard.

Hors périmètre
- Ne pas recopier les adresses trouvées dans le code dans l’issue, les commits ou les logs de test.
- Ne pas traiter dans ce lot les `console.log` de `scripts/admin.ts` ni réactiver `noConsole` sur tout le dépôt : le noter comme suite, pas comme critère.


Groupe — Dépendances signalées

6. Issue #30 — [Majeure][P2] Site — Next.js 16.3.8 reste en deçà de la version racine

Constat
Sur `canary`, le décalage de lock cité auparavant n’existe plus : `apps/site/package.json` et la racine du lock concordent (`0.9.3`, Next `16.3.8`). La racine de l’application utilise déjà Next `16.4.2`.

L’audit antérieur citait des advisories couvrant Next jusqu’à `16.4.0`, notamment GHSA-2464-fhr4-w9xw et GHSA-673q-mjm6-r5xr, et signalait l’optimisation d’images activée dans `apps/site/next.config.ts`. Ces advisories n’ont pas été rejouées dans cette revue : il faut les revérifier avant d’affirmer qu’elles s’appliquent encore à `16.3.8`.

Impact
Le Site autonome peut être construit avec une version plus ancienne que celle déjà retenue à la racine. Selon les advisories encore ouvertes, cela peut couvrir des chemins d’image, de Server Actions ou de déni de service. L’audit ne prouve pas à lui seul que chaque chemin est exploitable ici.

Reproduction
1. Comparer `next` dans `apps/site/package.json`, le lock et la racine.
2. Relire les advisories citées et `npm audit` dans `apps/site` après une installation propre.
3. Noter si l’optimisation d’images et AVIF sont toujours activées.

Résultat attendu
Next du Site autonome est aligné sur une version qui n’est plus dans les advisories confirmées, au moins au niveau déjà adopté à la racine si celui-ci est corrigé. Le lock régénéré reste cohérent avec le manifeste.

Périmètre
- `apps/site/package.json`
- `apps/site/package-lock.json`
- `apps/site/next.config.ts` uniquement pour vérifier l’atteignabilité, pas pour désactiver les images sans raison

Piste de correction
Revérifier les advisories, aligner Next, régénérer le lock, puis rejouer `npm ci`, le build et un audit. Ajouter un test ciblé d’optimisation d’images seulement si le comportement change.

Critères d'acceptation
- `npm ci` dans `apps/site` réussit.
- La version verrouillée de Next n’est plus dans les advisories confirmées par le nouvel audit.
- Le correctif ne réintroduit pas le décalage manifeste/lock de l’ancienne formulation de cette issue.

Hors périmètre
- Ne pas recopier l’ancien décompte de 26 vulnérabilités comme un fait actuel.
- Ne pas traiter Undici/Nodemailer de la racine ici (issue #31) ni les dépendances Vibe (issue #33).
- Ne pas prétendre qu’une exploitation a été tentée.

7. Issue #33 — [Majeure][P2] Vibe — DOMPurify, markdown-it et Nodemailer restent signalés

Constat
Le lock de `apps/vibe` contient encore DOMPurify `3.4.16`, markdown-it `15.0.2` et Nodemailer `10.0.15`. L’audit antérieur citait des XSS DOMPurify (dont GHSA-cg2g-xh64-v4q7), un DoS markdown-it corrigé en `>=15.0.3` (GHSA-gfr2-rv44-r23c) et un parsing d’adresses Nodemailer corrigé en `>=10.1.4`.

Le sanitizer `apps/vibe/src/components/common/richSanitizer.ts` n’active ni `SAFE_FOR_TEMPLATES` ni `IN_PLACE`.

Impact
Les trois dépendances directes restent sur les versions signalées. Le score critique d’un audit ne prouve pas une XSS exploitable dans Vibe tant que les options dangereuses ne sont pas activées. La mise à jour reste nécessaire pour réduire l’exposition actuelle et future.

Reproduction
Lire les versions verrouillées, relancer `npm audit` dans `apps/vibe`, puis confirmer que le sanitizer n’active pas les flags exclus.

Résultat attendu
DOMPurify `>=3.4.17` (ou la version corrigée confirmée par l’advisory à jour), markdown-it `>=15.0.3` et Nodemailer `>=10.1.4`, avec un lock cohérent.

Périmètre
- `apps/vibe/package.json`
- `apps/vibe/package-lock.json`
- tests du HTML riche, de KaTeX et des liens après mise à jour du sanitizer

Piste de correction
Mettre à jour les trois dépendances directes, régénérer le lock, lancer les tests backend et le build frontend. Ne pas élargir la configuration du sanitizer pour « faire passer » un test.

Critères d'acceptation
- Les trois versions verrouillées atteignent les planchers confirmés.
- Le build et les tests de contenu riche passent.
- Le rapport d’audit ne présente plus ces trois alertes, ou documente une advisory sans correctif.

Hors périmètre
- Ne pas présenter le score critical comme la preuve d’une XSS exploitable.
- Ne pas corriger ici le décalage de types React de `bookIcons.ts` (issue #12), sauf s’il bloque le build de validation.

8. Issue #35 — [Majeure][P2] Electron — Coder embarque encore Electron 44.5.1

Constat
Sur `canary`, les deux applications ne sont plus dans le même état. Le lock Coder résout Electron `44.5.1`. Le lock Desktop résout Electron `44.10.2`, au-dessus du plancher `44.9.1` cité pour GHSA-jr5w-w6x2-84p9.

Coder verrouille node-forge `1.4.3`, plus `1.4.0`. L’advisory GHSA-86w9-cpqp-85rv était signalée sans version corrigée : il faut la relire avant de dire que `1.4.3` la ferme.

Impact
Le runtime livré avec Coder reste sur une version d’Electron signalée pour la mitigation de certificats intermédiaires. Desktop semble déjà au-dessus du plancher cité, mais seul un audit frais le confirme. L’usage réel de chaque primitive node-forge n’a pas été démontré.

Reproduction
Comparer `electron` et `node-forge` dans les `package.json` et lockfiles de `apps/coder` et `apps/desktop`. Relancer l’audit des deux applications.

Résultat attendu
Coder est sur Electron `>=44.9.1` si l’advisory est toujours ouverte. Desktop n’est pas redescendu. node-forge est traité selon l’advisory à jour, sans forcer une montée inutile si `1.4.3` couvre déjà les alertes corrigées.

Périmètre
- `apps/coder/package.json` et son lock
- `apps/desktop` seulement pour confirmer `44.10.2` et ne pas le downgrader
- usage de node-forge dans le proxy Coder, en lecture

Piste de correction
Mettre à jour Electron côté Coder, rejouer fenêtres, webviews, IPC et mise à jour en test, puis documenter ce qui reste de GHSA-86w9-cpqp-85rv.

Critères d'acceptation
- Le lock Coder ne contient plus Electron `44.5.1` si l’advisory l’exige encore.
- Desktop reste `>=44.9.1`.
- L’audit frais est cité dans le correctif, pas l’ancien décompte.

Hors périmètre
- Ne pas réécrire l’issue comme si Desktop était encore en `44.5.1`.
- Ne pas ouvrir d’installeur non vérifié (issue #28).
- Ne pas affirmer que chaque primitive X.509 vulnérable est appelée.

9. Issue #37 — [Majeure][P2] Blackline — Vite 6.4.4 contourne server.fs.deny en développement

Constat
`apps/blackline/package.json` épingle Vite `6.4.4`. L’advisory GHSA-8g5g-mxqh-grgj décrit un contournement de `server.fs.deny` par paramètres de requête sur cette version, corrigé en `6.4.5`. Les scripts `dev` et `preview` lancent Vite avec `--host 0.0.0.0`.

Impact
Un client capable d’atteindre le serveur de développement peut lire des fichiers que la politique `fs.deny` devrait refuser. Le constat concerne l’outillage de développement, pas le bundle statique de production.

Reproduction
Vérifier la version épinglée et les scripts `--host`. Relire l’advisory. Ne pas exploiter le contournement contre une machine qui n’est pas un banc de test isolé.

Résultat attendu
Vite est au moins en `6.4.5`. Le lock est régénéré. L’exposition `0.0.0.0` est documentée ou restreinte aux réseaux de confiance.

Périmètre
- `apps/blackline/package.json` et son lock
- scripts `dev` / `preview`
- typecheck et tests Blackline après la montée

Piste de correction
Passer à Vite `6.4.5` ou ultérieur compatible, régénérer le lock, relancer typecheck et tests. Ne pas « corriger » l’advisory en désactivant `fs.deny`.

Critères d'acceptation
- La version verrouillée n’est plus `6.4.4`.
- `npm audit` ne signale plus GHSA-8g5g-mxqh-grgj.
- Le serveur de dev n’est pas élargi à de nouveaux hôtes.

Hors périmètre
- Ne pas présenter ce défaut comme une faille du build de production.
- Ne pas écrire de preuve de contournement opérationnelle.

10. Issue #39 — [Majeure][P2] Mobile — la chaîne Capacitor conserve tar 6.2.1

Constat
`apps/mobile/package.json` déclare `@capacitor/cli` en `^6.2.3`. Le lock contient encore `tar@6.2.1`. `@xmldom/xmldom` est déjà en `0.9.12`, le plancher cité par l’ancienne formulation : ne plus le traiter comme non corrigé.

L’audit antérieur parlait de 28 alertes sous la chaîne de build. Ce décompte n’a pas été rejoué. Le risque décrit porte sur un développeur ou un runner qui traite une archive non fiable, pas sur le binaire Capacitor embarqué.

Impact
Une archive hostile traitée par la chaîne de build peut encore viser les défauts de `tar` 6.2.1 (écriture, traversal, liens, déni de service), si l’advisory reste ouverte. L’audit ne démontre pas une exploitation dans le workflow actuel.

Reproduction
Relire `apps/mobile/pnpm-lock.yaml` pour `tar` et `xmldom`, puis relancer `pnpm audit --ignore-workspace` dans `apps/mobile`.

Résultat attendu
L’arbre de `@capacitor/cli` ne contient plus `tar` 6.2.1 si un correctif compatible existe. La montée ne force pas un major de `tar` à l’aveugle. xmldom n’est pas redescendu sous `0.9.12`.

Périmètre
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- audit isolé après régénération

Piste de correction
Chercher une version de `@capacitor/cli` compatible dont l’arbre corrige `tar`. Régénérer le lock, refaire l’installation isolée, le build, puis un audit. Documenter les alertes `glob` / `minimatch` encore ouvertes sans les corriger en cascade dans ce lot si elles n’ont pas de parent compatible.

Critères d'acceptation
- `tar@6.2.1` a disparu du lock, ou l’absence de correctif compatible est documentée avec l’audit frais.
- `@xmldom/xmldom` reste `>=0.9.12`.
- Les builds Android/iOS ne sont pas cassés par une montée majeure non demandée.

Hors périmètre
- Ne plus affirmer que xmldom est en `0.9.11`.
- Ne pas recopier le décompte de 28 alertes comme un fait actuel.
- Ne pas élargir le correctif au runtime de l’application mobile.


Groupe — Build, provenance et CI

11. Issue #11 — [Majeure][P2] Site — figer l’installation maintenant que le lock est resynchronisé

Constat
L’échec `npm ci` décrit auparavant (lock `1.1.5` contre manifeste `0.9.3`, Next `16.2.10` contre `16.3.8`) n’est plus présent sur `canary`. Les specs racine de `apps/site/package-lock.json` concordent avec `package.json`, y compris Next `16.3.8`.

Le dépôt n’a toujours aucun job qui exécute `npm ci` pour `apps/site`. Le décalage peut donc revenir sans signal.

Impact
Sans garde-fou, la prochaine dérive de lock bloque à nouveau l’installation reproductible et la validation du Site autonome. Ce n’est plus un échec constaté sur cet arbre : c’est une régression non empêchée.

Reproduction
1. Comparer les specs de `apps/site/package.json` et de la racine du lock.
2. Lancer `npm ci --ignore-scripts` dans `apps/site` sur un checkout propre.
3. Chercher ce contrôle dans `.github/workflows/build.yml` : il est absent.

Résultat attendu
`npm ci` passe sur l’arbre actuel. Un contrôle requis échoue si le lock et le manifeste divergent à nouveau. Le lock n’est pas régénéré tant que `npm ci` réussit.

Périmètre
- `apps/site/package.json`
- `apps/site/package-lock.json` seulement si `npm ci` échoue encore
- le job qualité de l’issue #15, s’il est créé dans le même lot ; sinon un contrôle minimal qui ne duplique pas tout le workflow

Piste de correction
Confirmer `npm ci`. Si cela passe, ne pas toucher au lock. Ajouter le contrôle au job qualité plutôt que d’inventer un second pipeline.

Critères d'acceptation
- `npm ci --ignore-scripts` réussit dans `apps/site`.
- Une divergence volontaire manifeste/lock ferait échouer le contrôle.
- Aucun commit ne régénère le lock sans échec reproduit.

Hors périmètre
- Ne pas réécrire l’issue comme si Next `16.2.10` était encore verrouillé.
- Ne pas absorber la mise à jour de sécurité Next (issue #30) ni le job complet lint/typecheck/test (issue #15), sauf pour y accrocher ce contrôle.

12. Issue #12 — [Majeure][P2] Vibe — le build npm casse sur les types React de bookIcons

Constat
`apps/vibe/src/components/common/bookIcons.ts` type les icônes `@mdevs/icons` comme `BookIconComponent` (`ComponentType<SVGProps<SVGSVGElement>>`). Vibe déclare React `^19.3.0` ; la racine épingle React `19.3.1`. Les paquets locaux liés en `file:` peuvent donc exposer une autre identité de types React.

Un build antérieur échouait avec 33 erreurs `TS2322` dans ce fichier. Ce décompte n’a pas été rejoué : la condition de conflit est toujours dans le code, le nombre d’erreurs doit être reconfirmé.

Impact
Si le conflit d’identité React est toujours résolu ainsi, `tsc -b` échoue avant `vite build` et bloque les jobs Android/iOS qui lancent ce script.

Reproduction
cd apps/vibe
npm ci --ignore-scripts
npm run build

Résultat attendu
Le build npm verrouillé passe. Les icônes restent typées sans `any`. Une seule identité de React, React DOM et `@types/react*` est résolue entre la racine, `packages/icons`, `packages/ui` et Vibe.

Périmètre
- `apps/vibe/package.json`
- `apps/vibe/src/components/common/bookIcons.ts`
- dépendances React des paquets locaux liés

Piste de correction
Aligner et dédupliquer React plutôt que d’assouplir `BookIconComponent`. Rejouer une installation propre. Ajouter `npm run build` à la validation de Vibe si l’issue #15 crée le job qualité.

Critères d'acceptation
- `npm run build` dans `apps/vibe` se termine sans `TS2322` sur `bookIcons.ts`.
- Aucun `any` n’est introduit pour faire taire le compilateur.
- Le nombre d’erreurs avant correctif est noté, pas recopié depuis l’ancienne mesure s’il a changé.

Hors périmètre
- Ne pas mettre à jour DOMPurify dans ce lot (issue #33), sauf si le build l’exige.
- Ne pas réécrire le catalogue d’icônes.

13. Issue #14 — [Majeure][P2] Wakies — source:check ne peut pas valider un checkout canary

Constat
`scripts/check-wakies-source.mjs` lit `apps/wakies/SOURCE_MANIFEST.json` puis hash les octets du working tree. Sur `canary`, ce manifeste est absent : le contrôle échoue avant toute comparaison d’empreinte.

Le script compare encore le hash brut à `retainedSha256` ou `sha256`, sans canonicaliser les fins de ligne. `apps/wakies/.gitattributes` contient `* text=auto`. L’écart CRLF/LF décrit auparavant reste donc possible dès que le manifeste revient, mais les empreintes chiffrées de l’ancienne issue ne sont plus vérifiables ici.

Impact
`pnpm --dir apps/wakies source:check` ne distingue pas un checkout incomplet, une normalisation Git et une vraie altération. Le signal de provenance est inutilisable.

Reproduction
git status --short
corepack pnpm --dir apps/wakies source:check
Attendu sur cet arbre : échec à la lecture du manifeste manquant, pas le message CRLF historique.

Résultat attendu
Le manifeste présent décrit des empreintes reproductibles sur un checkout propre, texte canonicalisé. Une vraie modification de source échoue encore. Une conversion CRLF/LF seule ne échoue plus.

Périmètre
- `scripts/check-wakies-source.mjs`
- `apps/wakies/SOURCE_MANIFEST.json` s’il doit être rétabli
- `apps/wakies/.gitattributes`
- le job qualité, pour exécuter `source:check`

Piste de correction
Restaurer ou régénérer le manifeste depuis la source de provenance, stocker une empreinte locale normalisée distincte de l’empreinte amont, et hasher les fichiers texte après canonicalisation explicite.

Critères d'acceptation
- `source:check` passe sur un checkout propre de `canary`.
- Un octet modifié dans un fichier listé le fait échouer.
- Un fichier texte dont seules les fins de ligne diffèrent ne le fait pas échouer.

Hors périmètre
- Ne pas réutiliser les SHA `8d33f251…` / `10febda8…` comme des faits de cet arbre : le manifeste n’y est pas.
- Ne pas désactiver le contrôle pour le faire passer.

14. Issue #15 — [Majeure][P2] CI — aucun job de lint, de typecheck ni de tests

Constat
`.github/workflows/build.yml` ne contient aucune invocation de `ultracite`, `biome`, `typecheck`, `vitest` ou `test:unit`. Le seul garde-fou local est `.husky/pre-commit`, contournable avec `--no-verify` ou depuis l’interface GitHub.

`.lint-diagnostics.txt` n’est plus dans l’arbre `canary`. Il ne peut plus servir de preuve actuelle. L’absence de job reste le défaut.

Impact
Une régression de types, de lint ou de tests unitaires peut atteindre la branche protégée. `deploy-vercel` ne remplace pas `tsc --noEmit`. Les tests de `tests/unit/` ne protègent aucun merge.

Reproduction
rg -n "ultracite|typecheck|vitest|test:unit|biome" .github/workflows/build.yml
Aucun résultat attendu avant correctif.

Résultat attendu
Un job `quality` requis exécute le lint, le typecheck et les tests unitaires de l’application Next. Il échoue si l’un des trois échoue. Il peut accueillir le `npm ci` de l’issue #11 et le `source:check` de l’issue #14 sans devenir un second workflow.

Périmètre
- `.github/workflows/build.yml`
- scripts déjà déclarés dans le `package.json` racine (`check`, `typecheck`, `test:unit`)
- ne pas exiger dans ce lot le typecheck du backend racine (issue #17) : le job doit pouvoir l’appeler ensuite

Piste de correction
Ajouter un job qui installe via le gestionnaire déjà utilisé par le dépôt, puis lance les trois commandes. Ne pas corriger ici toutes les erreurs de lint préexistantes : si le job échoue, lister les erreurs et ne corriger que celles qui empêchent le job d’être honnête, ou le faire échouer visiblement plutôt que de désactiver des règles.

Critères d'acceptation
- Le workflow contient un job qui lance lint, typecheck et tests unitaires.
- Ce job n’est pas contournable par l’absence de Husky.
- Aucune règle Biome n’est passée à `off` pour faire passer le job.

Hors périmètre
- Ne pas citer `.lint-diagnostics.txt` comme un artefact encore versionné.
- Ne pas absorber le découpage des fonctions de 1 000 lignes ni la suppression des `any`.
- Ne pas réintroduire un second ordonnanceur cron : le workflow supprimé ne doit pas revenir sous une autre forme.

15. Issue #17 — [Majeure][P2] Types — le backend racine reste hors du typecheck

Constat
`tsconfig.json` inclut l’application Next et certains scripts, et exclut nommément une partie de `scripts/`. Les modules Hono à la racine (`main.ts`, `auth.ts`, `vibe-*.ts`, `images.ts`, `config.ts`…) ne sont ni inclus ni exclus : `tsc --noEmit` ne les voit pas.

`AGENTS.md` documente ce second runtime comme non typé. Ces fichiers sont pourtant déployés sur Val Town. L’ancienne mesure parlait d’environ 43 000 lignes ; l’ordre de grandeur reste celui des modules racine, à recompter avant d’écrire un chiffre dans le correctif.

Impact
Une faute de type dans le backend de production n’est découverte qu’à l’exécution. Les plus gros modules sont précisément ceux que le typecheck ignore.

Reproduction
Ouvrir `tsconfig.json` et confirmer que `main.ts` n’est pas dans `include`. Lancer `pnpm run typecheck` puis vérifier qu’une erreur volontaire dans `main.ts` ne le fait pas échouer. Retirer l’erreur ensuite.

Résultat attendu
Un second projet TypeScript couvre les modules racine réellement déployés et échoue sur une erreur de type. Il est branché au job qualité, ou documenté comme commande requise si le job n’existe pas encore.

Périmètre
- `tsconfig.json` ou un `tsconfig.backend.json` dédié
- modules racine du graphe `main.ts`
- ne pas inclure `apps/` ni `packages/` dans ce projet

Piste de correction
Créer un projet qui étend la config stricte, inclut les `*.ts` racine déployés, et exclut `apps`, `packages`, `node_modules`. Corriger les erreurs bloquantes révélées, sans ajouter de `any` pour les faire taire. Les scripts déjà dupliqués (issue #16) ne doivent pas être typés deux fois : typer la copie exécutée.

Critères d'acceptation
- Une erreur de type introduite dans `main.ts` fait échouer la nouvelle commande.
- `pnpm run typecheck` de l’application Next ne se met pas à compiler Val Town par accident.
- Le correctif indique le nombre de fichiers couverts, recompté.

Hors périmètre
- Ne pas prétendre que les 75 modules sont déjà inclus.
- Ne pas déplacer le backend dans `app/` pour le faire typer.
- Ne pas traiter la duplication `admin.ts` / `scripts/admin.ts` au-delà du choix de la copie à inclure.


Groupe — Chat, fichiers et pages

16. Issue #44 — [Majeure][P2] Chat — le mode Fantôme perd le contexte entre deux tours

Constat
Le mode Fantôme ne doit pas écrire la conversation dans l’historique permanent, mais le contexte doit rester disponible pendant la session. Dans un essai avec `nvidia/nemotron-3.5-super-vl:free`, l’assistant a accusé réception du marqueur `LILAS-427` puis a répondu `INCONNU` au tour suivant. Le constat a été confirmé avec deux tours courts.

Pistes de code sur `canary` : `hooks/use-active-chat.tsx` autour de 641, `lib/chat/context.ts` autour de 421, `lib/chat/stream.ts` autour de 428 (`isGhostMode`). La cause exacte n’est pas établie.

Impact
Une session Fantôme devient inutilisable dès le second tour : l’utilisateur croit parler dans une conversation continue, et le modèle n’a plus le tour précédent. Ce n’est pas le comportement voulu de non-persistance.

Reproduction
1. Activer le mode Fantôme et envoyer un message qui pose le marqueur `LILAS-427`.
2. Vérifier l’accusé de réception.
3. Sans fermer la session, demander de rappeler le marqueur.

Résultat attendu
L’assistant rappelle `LILAS-427`. La conversation peut rester absente de l’historique permanent et des statistiques de compte.

Périmètre
- construction du contexte en mode Fantôme
- envoi du tour suivant dans `use-active-chat`
- tests du contrat de contexte, sans exiger un appel au modèle Nemotron

Piste de correction
Vérifier si le second tour n’envoie que le dernier message, ou si le contexte serveur jette l’historique dès `isGhostMode`. Conserver les messages de la session en mémoire client et les renvoyer, sans les persister.

Critères d'acceptation
- Un test ou une reproduction contrôlée montre que le second tour reçoit le marqueur du premier.
- Aucune ligne Fantôme n’est écrite dans l’historique permanent ni attribuée à un compte.
- Le correctif ne dépend pas d’un modèle précis.

Hors périmètre
- Ne pas « corriger » en désactivant le mode Fantôme.
- Ne pas persister la conversation pour garder le contexte.
- Ne pas généraliser au-delà de la perte de contexte en session.

17. Issue #45 — [Majeure][P2] Chat — la régénération d’un document long renvoie parfois HTTP 500

Constat
Deux régénérations d’une réponse longue ont répondu HTTP 500 sur `/api/chat` (conversations QA B03 et B03bis). Une régénération courte (B02) a réussi. La cause source n’est pas identifiée. B03bis avait une réponse complète avant la seconde tentative.

Impact
La régénération d’un document long échoue de façon non systématique. Combinée à l’issue #46, l’échec peut ensuite effacer le tour valide. Ici, le défaut à corriger est le 500, pas la suppression.

Reproduction
1. Demander la copie exacte d’un document Markdown long (code, tableau, liens, Unicode).
2. Lancer Régénérer en mode truncate.
3. Observer `/api/chat`.
Ne pas conclure qu’un document court échoue aussi.

Résultat attendu
La régénération aboutit, ou l’interface signale un échec récupérable sans laisser la conversation incohérente. Une erreur amont est journalisée avec assez de contexte pour la diagnostiquer, sans fuite de contenu privé.

Périmètre
- route `/api/chat` et le chemin de régénération
- logs d’erreur déjà prévus par `logError`
- ne pas modifier la suppression des messages (issue #46) sauf pour ne pas l’aggraver

Piste de correction
Reproduire avec un document long fixture, capturer l’exception serveur, puis corriger la cause réelle (limite, sérialisation, outil). Si la cause n’est pas reproduite, instrumenter et s’arrêter plutôt qu’inventer un correctif.

Critères d'acceptation
- La fixture longue se régénère sans 500, ou l’échec restant est un message récupérable dont la cause est nommée.
- Une régénération courte continue de passer.
- Le correctif cite l’exception observée, pas une hypothèse.

Hors périmètre
- Ne pas présenter le 500 comme systématique.
- Ne pas absorber la perte persistante du tour (issue #46) comme déjà corrigée par un simple message d’erreur.

18. Issue #46 — [Majeure][P1] Chat — une régénération truncate échouée supprime le tour valide

Constat
Après l’échec d’une régénération truncate, le message utilisateur et la réponse visés disparaissent au rechargement. Le chemin actuel supprime d’abord la suite : `components/chat/message-actions.tsx` autour de 271, `app/(chat)/actions.ts` `deleteTrailingMessages`, `lib/db/queries/chats.ts` `deleteMessagesByChatIdAfterTimestamp`.

La perte a été observée sur B03 et B03bis. B01 et B02 restaient présents. C’est distinct du HTTP 500 de l’issue #45.

Impact
Un échec de génération détruit un tour déjà valide. L’utilisateur perd le texte qu’il venait d’obtenir, y compris après rechargement.

Reproduction
1. Avoir une réponse complète dans la conversation.
2. Lancer Régénérer (truncate) et provoquer un échec de `/api/chat`.
3. Recharger.

Résultat attendu
Tant qu’une nouvelle réponse n’a pas été persistée avec succès, le message utilisateur et la dernière réponse valide restent en base et à l’écran.

Périmètre
- `components/chat/message-actions.tsx`
- `app/(chat)/actions.ts`
- `lib/db/queries/chats.ts`
- test de non-régression sur l’ordre supprimer / régénérer

Piste de correction
Ne supprimer les messages de queue qu’après succès de la nouvelle génération, ou les restaurer si la génération échoue. Le truncate ne doit pas être un engagement irréversible avant la réponse.

Critères d'acceptation
- Un échec simulé de régénération laisse le tour précédent en base.
- Un succès remplace bien l’ancienne réponse, une seule fois.
- Recharger la page ne ressuscite pas un tour qui devait être remplacé, ni n’efface un tour dont le remplacement a échoué.

Hors périmètre
- Ne pas corriger uniquement l’affichage client si la base a déjà supprimé les lignes.
- Ne pas traiter le 500 lui-même comme le seul livrable (issue #45).

19. Issue #47 — [Majeure][P2] Fichiers — les imports PNG, JPEG et TXT acceptés échouent en HTTP 500

Constat
`app/(chat)/api/files/upload/route.ts` accepte notamment `image/png`, `image/jpeg` et `text/plain`. Trois envois QA (PNG 20 062 o, TXT 272 o, JPEG 33 779 o) ont répondu HTTP 500. Le PNG et le TXT affichent « Échec de l’envoi du fichier » ; le JPEG passe par « Chargement » puis disparaît. Aucune pièce jointe n’est conservée.

L’étape en échec (auth, stockage, signature) n’est pas établie.

Impact
Des formats annoncés comme acceptés sont inutilisables. L’utilisateur ne distingue pas un refus de format d’une panne de stockage.

Reproduction
Téléverser un PNG, un TXT et un JPEG sous la limite de 50 Mo vers `/api/files/upload`, avec une session valide. Observer le statut et la liste des pièces jointes.

Résultat attendu
Chaque fichier dont le type est dans `ALLOWED_UPLOAD_TYPES` est conservé, ou l’interface refuse le format avant l’envoi. Un 500 inattendu n’est pas présenté comme un succès ni comme un retrait silencieux.

Périmètre
- `app/(chat)/api/files/upload/route.ts`
- le client d’upload qui retire le JPEG après échec
- logs déjà prévus, sans contenu de fichier

Piste de correction
Reproduire, capturer l’exception, corriger la cause. Si le stockage n’est pas configuré en local, l’API doit répondre une erreur explicite et récupérable, pas un 500 opaque, et le client doit garder l’échec visible.

Critères d'acceptation
- PNG, JPEG et TXT sous la limite ne renvoient plus 500 lorsque le stockage est configuré.
- Sans stockage, la réponse est un échec explicite, et le fichier ne disparaît pas comme s’il avait été retiré volontairement.
- `text/html`, SVG et JavaScript restent refusés.

Hors périmètre
- Ne pas élargir les types acceptés.
- Ne pas conclure que l’échec vient de l’authentification sans trace.

20. Issue #52 — [Majeure][P2] Pages — le remplacement IA peut modifier une autre occurrence

Constat
Un remplacement assisté a modifié la mauvaise occurrence d’un texte répété. Avec `ALPHA beta ALPHA`, l’occurrence non sélectionnée a été remplacée (observation unique, remplacement vu comme `SIGMA` dans la passe Goat). Le remplacement manuel de la seconde occurrence par `OMEGA` fonctionnait.

Code concerné : `components/pages/assistant-panel.tsx` (`intentRef`), `app/(chat)/api/pages/[id]/assistant/route.ts`, `lib/artifacts/patch.ts`. Le comportement n’est pas établi comme universel.

Impact
L’utilisateur valide une proposition qui modifie un autre endroit du document. C’est une corruption de contenu, même si elle n’a été observée qu’une fois.

Reproduction
1. Écrire deux occurrences du même mot, par exemple `ALPHA beta ALPHA`.
2. Sélectionner l’une d’elles et demander à l’assistant de ne remplacer que celle-ci.
3. Examiner la proposition avant application, puis l’appliquer.

Résultat attendu
Seule l’occurrence sélectionnée est ciblée par le patch. Si la sélection ne peut pas être ancrée, l’assistant ne propose pas un remplacement ambigu.

Périmètre
- ancrage de la sélection dans l’assistant Pages
- application des ops de `lib/artifacts/patch.ts`
- test avec deux occurrences identiques

Piste de correction
Transmettre un ancrage stable (offsets ou identifiant de nœud), pas seulement la chaîne. Refuser un patch qui matche plusieurs fois sans ancrage. Ne pas se fier au premier `indexOf`.

Critères d'acceptation
- Un test avec deux occurrences identiques modifie seulement celle qui est sélectionnée.
- Un patch ambigu sans sélection n’est pas appliqué silencieusement.
- Le remplacement manuel continue de fonctionner.

Hors périmètre
- Ne pas présenter l’observation comme systématique.
- Ne pas modifier le comportement du remplacement manuel.


Groupe — Recherche et chiffres publics

21. Issue #48 — [Majeure][P2] Recherche — le filtre « Tout » masque des discussions trouvées

Constat
Dans la recherche globale, « Tout » n’affiche pas les conversations que « Discussions » trouve. Le client envoie `sources: []` lorsque `scope === "all"` (`components/chat/global-search-client.tsx` autour de 319). Le serveur traite cet ensemble comme aucune source (`lib/search/index-query.ts` autour de 1596, `requested.has`).

Recherche QA `QA` : quatre conversations sous Discussions, aucune sous Tout.

Impact
Le filtre le plus large est le plus vide. L’utilisateur conclut qu’il n’y a pas de résultat alors que les discussions existent.

Reproduction
1. Ouvrir la recherche globale et chercher `QA`.
2. Comparer « Tout » et « Discussions ».
3. Inspecter le paramètre `sources` envoyé.

Résultat attendu
« Tout » inclut les sources disponibles pour l’utilisateur, dont les discussions visibles dans leur filtre dédié.

Périmètre
- `components/chat/global-search-client.tsx`
- `app/(chat)/api/recherche/route.ts`
- `lib/search/index-query.ts`
- test : `sources` vide signifie toutes les sources autorisées, pas aucune

Piste de correction
Interpréter l’absence de filtre comme l’union des sources autorisées. Ne pas inverser le sens côté client seulement si le serveur continue de traiter `[]` comme vide pour d’autres appelants : documenter le contrat et couvrir les deux.

Critères d'acceptation
- Une conversation trouvée par « Discussions » apparaît aussi dans « Tout ».
- Un filtre explicite continue de restreindre.
- Les sources réservées aux forfaits payants ne fuient pas vers un compte qui n’y a pas droit.

Hors périmètre
- Ne pas élargir « Tout » à des sources non autorisées pour faire apparaître des résultats.
- Ne pas confondre ce défaut avec le 401 du Support (issue #49) ni le 500 Wakies (issue #50).

22. Issue #49 — [Majeure][P2] Support — la recherche publique reçoit 401 en mode anonyme

Constat
La recherche documentaire du Support et la recherche du site appellent `/api/site/search`. Sans session, la requête répond HTTP 401 `auth_required`. Le champ affiche alors « La documentation ne répond pas pour le moment ».

Fichiers : `proxy.ts`, `lib/security/proxy-policy.ts` (`PREFIXES_API_AUTONOMES`), `app/(chat)/api/site/search/route.ts`, `components/site/support/SupportDocumentationSearch.tsx`, `components/site/ui/search-bar.tsx`.

Impact
Un visiteur anonyme ne peut pas chercher les guides publics. Le message d’indisponibilité masque un refus d’authentification.

Reproduction
1. Ouvrir `/site/support` sans session.
2. Chercher `auth`, puis `quota`.
3. Observer `/api/site/search?limit=6&q=auth&type=doc`.

Résultat attendu
La recherche de contenu public fonctionne sans session. Si une connexion est vraiment requise, l’interface le dit, au lieu d’annoncer une indisponibilité.

Périmètre
- politique du proxy pour la seule route de recherche documentaire publique
- `app/(chat)/api/site/search/route.ts`
- message du champ Support

Piste de correction
Autoriser explicitement la recherche documentaire publique, pas le préfixe `/api/site/` entier. Garder les routes de compte derrière l’auth. Aligner le message d’erreur sur le code réel.

Critères d'acceptation
- `GET /api/site/search?type=doc` répond sans session pour un guide public.
- Une route de compte sous `/api/site/` reste en 401 sans session.
- Le Support n’affiche plus « ne répond pas » pour un 401.

Hors périmètre
- Ne pas rendre publiques toutes les routes `/api/site/`.
- Ne pas affaiblir le cookie de session pour faire passer la recherche.

23. Issue #50 — [Majeure][P2] Wakies — une erreur de recherche s’affiche comme une absence de résultat

Constat
`/api/wakies/search?q=Salut` a répondu HTTP 500 alors qu’une conversation portait ce titre. Le client (`components/wakies/workspace-app.tsx` autour de 179) convertit toute erreur en liste vide, affichée comme « Aucun résultat ». L’origine du 500 n’est pas établie.

Impact
L’utilisateur ne peut pas distinguer une panne d’une recherche vide, et ne réessaie pas. La conversation existante reste introuvable.

Reproduction
1. Avoir une conversation dont le titre contient `Salut`.
2. Lancer la recherche Wakies.
3. Comparer le statut HTTP et le libellé affiché.

Résultat attendu
La conversation apparaît, ou l’interface montre une erreur explicite avec une action pour réessayer. « Aucun résultat » n’est utilisé que pour un HTTP réussi et une liste vide.

Périmètre
- `app/(chat)/api/wakies/search/route.ts`
- `components/wakies/workspace-app.tsx`
- test client : une réponse 500 n’est pas un état vide

Piste de correction
Séparer l’état d’erreur de l’état vide. Ensuite seulement, reproduire le 500 et corriger la cause serveur. Si le 500 n’est pas reproduit, livrer quand même la distinction d’état et noter la cause serveur comme non établie.

Critères d'acceptation
- Un 500 affiche une erreur, pas « Aucun résultat ».
- Une recherche réussie sans hit affiche toujours l’état vide.
- La cause du 500 est soit corrigée avec une trace, soit explicitement non reproduite.

Hors périmètre
- Ne pas inventer la cause du 500.
- Ne pas modifier la recherche globale (issue #48) dans ce correctif.

24. Issue #51 — [Majeure][P2] Vibe — le lien #mAI ouvre un onglet Hashtags vide

Constat
Depuis un post contenant `#mAI`, le lien ouvre `/vibe/explore?q=%23mAI&tab=hashtags`. L’onglet Hashtags indique qu’aucun hashtag n’a été trouvé, alors que l’onglet Publications contient le post tagué.

Code : `components/vibe/common/RichContent.tsx` autour de 99, `components/vibe/pages/ExplorePage.tsx` autour de 291. Ne pas attribuer le résultat à une fenêtre de tendances ni à une version de backend non reliée au déploiement.

Impact
Le lien de hashtag promet des résultats qu’il n’affiche pas. Le contenu existe, mais sous un autre onglet.

Reproduction
1. Ouvrir le post historique qui contient `#mAI`.
2. Cliquer le hashtag.
3. Comparer les onglets Hashtags et Publications.

Résultat attendu
Le lien mène à des résultats qui incluent les publications portant ce tag, ou l’onglet ouvert est celui qui sait les afficher.

Périmètre
- construction du lien dans `RichContent.tsx`
- requête de l’onglet Hashtags dans `ExplorePage.tsx`
- test de routage `#mAI` vers un résultat non vide si le post existe

Piste de correction
Aligner la requête hashtag sur la même normalisation que la recherche de publications, ou ouvrir l’onglet qui interroge les posts. Ne pas fabriquer une tendance artificielle pour faire apparaître le tag.

Critères d'acceptation
- Cliquer `#mAI` sur un post qui porte ce tag montre ce post, ou un résultat hashtag qui le référence.
- Un hashtag vraiment absent reste un état vide honnête.
- La casse et le `#` encodé ne créent pas une requête différente de celle des publications.

Hors périmètre
- Ne pas expliquer le vide par une période de tendances sans preuve dans le code appelé.
- Ne pas modifier le résumé de skill Brave (issue #72).

25. Issue #71 — [Majeure][P2] Tarifs — les quotas API annoncés se contredisent

Constat
Trois familles de chiffres coexistent sur `canary`, sans que le compteur réellement appliqué soit identifié :

- page Tarifs et `config.ts` (`TIER_REQUEST_LIMITS`, autour de 190) : 500 / 1 500 / 3 000 / 7 500 requêtes par semaine ;
- `apps/site/docs/documentation/6-erreurs-et-limites.md`, conditions et confidentialité : 1 000 / 5 000 / 25 000 / 100 000 par mois ;
- d’autres guides parlent de limites quotidiennes encore différentes (`guide-integration-codex.md`, `guide-integration-claude-code.md`).

`apps/site/docs/news/api-v2/index.md` reprend, lui, les chiffres hebdomadaires.

Impact
Un client peut construire son intégration sur un quota qui n’est pas celui annoncé à côté, ou l’inverse. Aucune de ces surfaces ne prouve à elle seule quel compteur est appliqué.

Reproduction
Comparer `config.ts`, la page Tarifs, les conditions, la page confidentialité et `6-erreurs-et-limites.md`. Chercher le compteur réellement incrémenté avant de choisir une formulation.

Résultat attendu
Les surfaces publiques et la configuration publiée annoncent les mêmes quotas et la même période, après lecture du code qui applique la limite. Les guides contradictoires sont alignés ou marqués comme non contractuels.

Périmètre
- `config.ts` et le code qui consomme `TIER_REQUEST_LIMITS` / `getTierRequestLimit`
- `app/(chat)/site/pricing/page.tsx`
- `app/(chat)/site/legal/terms/page.tsx` et `privacy/page.tsx`
- `apps/site/docs/documentation/6-erreurs-et-limites.md` et les guides d’intégration cités

Piste de correction
Identifier le compteur exécuté. Aligner les textes sur ce compteur. Si deux compteurs coexistent vraiment, le dire, au lieu d’en choisir un au hasard. Ne pas changer la limite appliquée seulement pour faire coïncider une page.

Critères d'acceptation
- Une seule paire quota/période est annoncée pour les requêtes API de chaque forfait, ou l’écart restant est expliqué par deux compteurs nommés.
- Le texte ne contredit pas `getTierRequestLimit` si c’est le compteur actif.
- Aucune limite n’est modifiée sans preuve que c’est elle qui s’applique.

Hors périmètre
- Ne pas inférer que le compteur hebdomadaire est le bon uniquement parce qu’il est dans `config.ts`, ni l’inverse.
- Ne pas réécrire les quotas d’images ou de tokens dans ce lot, sauf s’ils sont dans la même phrase contradictoire.


Groupe — Structure et typage

26. Issue #16 — [Majeure][P2] Scripts — quatre fichiers sont dupliqués entre la racine et scripts/

Constat
Sur `canary`, quatre paires sont encore identiques à l’octet :

- `admin-models.ts` / `scripts/admin-models.ts`
- `email.ts` / `scripts/email.ts`
- `openrouter-models.ts` / `scripts/openrouter-models.ts`
- `updateModels.ts` / `scripts/updateModels.ts`

`admin.ts` (1 436 lignes) et `scripts/admin.ts` (2 351 lignes) ont déjà divergé. `package.json` exécute `bun run scripts/admin.ts` : la copie `scripts/` est celle qui tourne. Chaque entrée importe `./admin-models.ts`, donc sa propre copie.

Impact
Un correctif appliqué à une seule copie change le comportement selon le point d’entrée, sans signal. Le typecheck couvre la copie racine et pas forcément la copie exécutée. Personne ne peut dire laquelle de `admin.ts` est la référence.

Reproduction
Comparer les SHA-1 des quatre paires et un diff de `admin.ts`. Lire le script `admin` du `package.json` racine.

Résultat attendu
Chaque script CLI n’existe qu’une fois, sous `scripts/`. Les imports résolvent cette copie. `tsconfig` ne type pas une copie morte. Un garde-fou échoue si deux fichiers `.ts` redeviennent identiques par duplication.

Périmètre
- les cinq paires citées
- `package.json` et `tsconfig.json` pour les chemins
- ne pas déplacer des modules runtime Val Town qui ne sont pas des scripts CLI

Piste de correction
Garder `scripts/` comme source des commandes CLI. Supprimer la copie racine morte après avoir vérifié qu’aucun import de production ne la résout. Pour `admin.ts`, partir de `scripts/admin.ts` et ne récupérer de la racine que ce qui manque encore et qui est appelé.

Critères d'acceptation
- `bun run admin` utilise une seule copie de `admin-models`.
- Les quatre fichiers racine dupliqués ne sont plus importables par erreur.
- Un test ou un script de CI échoue sur une nouvelle paire identique.

Hors périmètre
- Ne pas supprimer `email.ts` racine s’il est dans le graphe Val Town plutôt qu’un simple doublon de script : le vérifier avant suppression.
- Ne pas fusionner aveuglément les 2 102 lignes d’écart.

27. Issue #18 — [Majeure][P2] Structure — cinq fonctions dépassent encore 1 000 lignes

Constat
Sur `canary`, la fermeture en colonne 0 confirme encore :

- `components/search/search-client.tsx:339` → 2769, `SearchClient`
- `components/settings/applications-tab.tsx:107` → 1836, `ApplicationsTab`
- `app/(chat)/projects/page.tsx:149` → 1360, `ProjectsPageInner`
- `components/settings/memory-card.tsx:125` → 1220, `MemoryCard`
- `lib/db/queries/connection.ts:146` → 1200, `ensureTableTypes`

`noExcessiveCognitiveComplexity` est désactivé dans `biome.jsonc`.

Impact
Chaque correctif dans ces corps est illisible, les conflits Git se concentrent sur la même fonction, et un `useState` de `SearchClient` re-renderise un arbre de plus de 2 000 lignes. `ensureTableTypes` peut laisser un schéma partiellement appliqué si une erreur survient au milieu du bloc.

Reproduction
Mesurer l’écart entre la déclaration et l’accolade fermante en colonne 0. Ne pas découper au hasard des lignes.

Résultat attendu
Les cinq corps passent sous une taille relisible par extraction de responsabilités, sans changement de comportement. La règle de complexité peut ensuite passer en `warn`, pas en `off`.

Périmètre
- les cinq fonctions citées, une extraction par responsabilité
- `biome.jsonc` seulement pour ne plus masquer la récidive
- tests existants à faire passer, plus un test ciblé si une extraction isole une fonction pure

Piste de correction
Pour `SearchClient`, extraire facettes et état. Pour `ensureTableTypes`, une fonction par famille de tables, avec une erreur qui ne prétend pas que tout a été appliqué. Ne pas commencer par les fichiers de 800 lignes non listés.

Critères d'acceptation
- Aucune des cinq fonctions ne dépasse 1 000 lignes après le lot, ou le reste est nommé et justifié.
- Le comportement visible des pages Recherche, Applications, Projets et Mémoire ne change pas.
- Aucun `any` n’est ajouté pour faciliter l’extraction.

Hors périmètre
- Ne pas réécrire `MessagesPage.tsx` dans ce lot.
- Ne pas traiter les 2 050 `any` (issue #19) ni les frontières d’import (issue #22) au-delà des fichiers touchés.

28. Issue #19 — [Majeure][P2] Types — des milliers de any explicites avec noExplicitAny désactivé

Constat
`biome.jsonc` désactive `noExplicitAny`. Hors `apps/` et `packages/`, `canary` contient encore au moins 1 850 occurrences de `: any` ou `as any`. L’ancienne mesure, formes comprises, était d’environ 2 050, dont 354 `catch (e: any)`.

Exemples toujours cités à revérifier avant correctif : `components/chat/message.tsx` (`part as any`), `lib/chat/slash-commands.ts`, `vibe-posts-crud.ts` (`c: any`).

Impact
Un `any` en amont annule `strict` pour tout ce qui en dépend. `catch (e: any)` puis `e.message` compile même si la valeur n’est pas une `Error`.

Reproduction
Recompter `: any`, `as any` et `catch (e: any)` hors `apps/`, `packages/` et `*.d.ts`. Ouvrir les trois fichiers cités et confirmer les lignes avant de les modifier.

Résultat attendu
Les `catch (e: any)` du périmètre choisi deviennent `catch (e: unknown)` avec un message sûr. Les `as any` du rendu de message sont remplacés par un garde du type existant. `noExplicitAny` passe en `warn`, pas en `error` tant que les modules `vibe-*` ne sont pas traités.

Périmètre
- d’abord les `catch (e: any)` de `lib/` et `app/`
- `components/chat/message.tsx` pour les `as any` du rendu d’outil
- `biome.jsonc` en `warn`

Piste de correction
Correction mécanique des catch, puis gardes de type sur `UIMessagePart`. Ne pas lancer la suppression des 1 850 occurrences dans ce lot.

Critères d'acceptation
- Le périmètre annoncé n’a plus de `catch (e: any)`.
- `message.tsx` n’utilise plus `as any` pour lire `image_url` si un garde suffit.
- `noExplicitAny` n’est plus `off`.
- Le typecheck Next passe.

Hors périmètre
- Ne pas convertir tout le dépôt d’un coup.
- Ne pas typer le backend racine ici (issue #17).
- Ne pas remplacer un `any` par un autre `any` déguisé en `object`.

29. Issue #22 — [Majeure][P2] Architecture — lib/ importe l’UI et des types métier vivent dans components/

Constat
`lib/` importe des types définis dans `components/`, et au moins deux valeurs : `lib/editor/functions.tsx` importe `MessageResponse`, `lib/vibe/services/` importe `htmlToPlainText` et `stripVibeBasePath`. `ArtifactKind` et `VisibilityType` sont donc des types de domaine dont la source est un composant.

Des routes (`app/(chat)/api/document/route.ts`, `app/(chat)/api/site/v1/status/route.ts`) importent aussi depuis `components/`. Un `import type` reste légal, mais le fichier est à un import de valeur de charger du code client.

Impact
La couche base et les routes dépendent de l’UI pour connaître un type. Un import non typé peut embarquer du client dans un module serveur. Déplacer un composant casse le domaine.

Reproduction
Chercher `from "@/components/` dans `lib/` et dans `app/**/route.ts`. Distinguer `import type` et import de valeur.

Résultat attendu
`ArtifactKind`, `VisibilityType` et `SlashCommand` vivent dans `lib/`. Les utilitaires purs importés par `lib/vibe` y sont déplacés. `lib/**` n’importe plus `@/components/**`. Les routes n’importent une valeur UI que si c’est inévitable et documenté.

Périmètre
- les fichiers `lib/` qui importent `@/components/`
- les deux routes citées
- pas de réécriture visuelle des composants

Piste de correction
Déplacer les types, laisser les composants importer depuis `lib/`, puis ajouter un override Biome qui interdit `@/components/**` depuis `lib/**`.

Critères d'acceptation
- `rg 'from "@/components/' lib` ne renvoie plus d’import de valeur, et plus d’import de type une fois les types déplacés.
- Le typecheck Next passe.
- Aucun comportement d’écran ne change.

Hors périmètre
- Ne pas déplacer des composants React dans `lib/` pour « inverser » la dépendance dans l’autre sens.
- Ne pas traiter les 10 fichiers comme un prétexte pour réarchitecturer Vibe.

30. Issue #24 — [Majeure][P2] Lint — biome.jsonc désactive des garde-fous qui masquent des bugs

Constat
`biome.jsonc` désactive notamment `noEmptyBlockStatements`, `noExplicitAny`, `noArrayIndexKey`, `noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters`, `noUndeclaredVariables`, `useHookAtTopLevel` et `noExcessiveCognitiveComplexity`.

`useHookAtTopLevel` est `off` globalement puis rétabli en `error` seulement pour `components/chat/app-sidebar.tsx`. L’override montre que la règle globale est mal placée : elle devrait être `error`, avec des exemptions ciblées, pas l’inverse.

Ces désactivations recouvrent des défauts mesurés : catch vides (issue #20), `any` (issue #19), `key={i}` (issue #23), fonctions géantes (issue #18).

Impact
Le lint annoncé par `AGENTS.md` ne voit pas les bugs que ces règles auraient signalés. Un override local qui réactive une règle coupée partout donne une fausse impression de protection.

Reproduction
Lire `biome.jsonc` et compter les `off`. Vérifier que l’override `app-sidebar.tsx` rétablit `useHookAtTopLevel`.

Résultat attendu
`noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters`, `noUndeclaredVariables` et `useHookAtTopLevel` sont `error`, après correction des violations réelles. Les quatre règles liées aux issues de dette passent en `warn`, pas en `off`.

Périmètre
- `biome.jsonc`
- corrections mécaniques que `ultracite fix` peut faire sans changer le comportement
- ne pas vider les issues #18, #19, #20 et #23 : ce lot rend la dette visible et corrige les règles sans faux positifs coûteux

Piste de correction
Rétablir d’abord les règles de variables et de hooks. Passer les règles de dette en `warn`. Supprimer l’override `app-sidebar` s’il devient redondant. Ne pas désactiver une règle pour faire passer le job.

Critères d'acceptation
- Les cinq règles de correction/hooks ne sont plus `off`.
- `useHookAtTopLevel` s’applique au dépôt, pas à un seul fichier.
- `pnpm run check` passe, ou les erreurs restantes sont des `warn` assumés.

Hors périmètre
- Ne pas réactiver d’un coup les 31 désactivations si certaines sont des choix documentés du design system.
- Ne pas corriger ici les 50 `key={i}` (issue #23) au-delà du passage en `warn`.


Groupe — Erreurs, code mort et utilitaires

31. Issue #20 — [Majeure][P2] Erreurs — des catch vides avalent des échecs, dont les filtres d’outils

Constat
`canary` compte 94 blocs `catch` vides sous `lib/`, `app/` et `components/`. Cinq sont dans `lib/chat/context.ts` (188, 269, 308, 418, 509). La ligne 308 entoure l’intersection des filtres d’outils. `noEmptyBlockStatements` est `off`.

Un échec de lecture de projet laisse le chat sans instructions ni modèle par défaut, sans trace. Un échec de restriction d’outils élargit la frontière sans bruit.

Impact
Des chemins de contexte, de mémoire et d’outils changent de comportement sans journal. Le cas des filtres d’outils est une frontière de sécurité, pas un simple confort.

Reproduction
Lire les cinq `catch {}` de `lib/chat/context.ts`. Chercher les catch vides de `lib/chat/memory.ts`, `lib/chat/prompt.ts` et `lib/agent/`.

Résultat attendu
Les cinq catch de `lib/chat/context.ts` journalisent via `logError`. Le catch des filtres d’outils ne peut plus échouer en élargissant silencieusement les outils. Tout catch volontairement vide contient un commentaire de raison à l’intérieur du bloc.

Périmètre
- `lib/chat/context.ts` en priorité
- `lib/chat/memory.ts`, `lib/chat/prompt.ts`, `lib/agent/context/project.ts`, `lib/agent/tools/adapters/mcp.ts`
- ne pas réécrire les 94 blocs dans ce lot

Piste de correction
Journaliser les échecs de contexte. Pour l’intersection des filtres, échouer fermé (pas d’élargissement) si la politique ne peut pas être calculée. Commenter les catch légitimes de sandbox déjà justifiés plus haut dans le fichier.

Critères d'acceptation
- `lib/chat/context.ts` n’a plus de `catch {}` sans journal ni commentaire interne.
- Un échec simulé de `intersecterFiltres` n’ajoute pas d’outils.
- Les catch de sandbox documentés ne sont pas transformés en erreurs utilisateur.

Hors périmètre
- Ne pas traiter tous les catch vides du dépôt comme des failles.
- Ne pas activer `noEmptyBlockStatements` en `error` tant que les cas légitimes ne sont pas commentés (le `warn` relève de l’issue #24).

32. Issue #21 — [Majeure][P2] API — 78 routes sortent encore de l’enveloppe errorResponse

Constat
Sur `canary`, 220 routes `app/**/route.ts` existent et 142 importent `errorResponse`. 78 ne l’utilisent donc pas. Plusieurs répondent `{ error: "..." }` au lieu de `{ code, message }`, par exemple `app/(chat)/api/mai-search/recent/route.ts`, `mai-search/vote/route.ts` et `site/v1/images/usage/route.ts`. `api-executor/route.ts` sérialise encore à la main.

Impact
Le client qui lit `data.code` / `data.message` tombe sur un message générique. Une chaîne interne peut partir au client sans le filtrage de `errorResponse`. La même phrase « Non authentifié. » est dupliquée au lieu d’utiliser `auth_required`.

Reproduction
git ls-files 'app/**/route.ts' | while read -r f; do grep -q 'errorResponse(' "$f" || echo "$f"; done

Résultat attendu
Les routes du périmètre répondent via `errorResponse` / `toErrorResponse`. Un test échoue si une route contient `json({ error:`.

Périmètre
- les quatre exemples cités d’abord
- puis les routes `app/(chat)/api/**` qui construisent `{ error: string }` à la main
- `AGENTS.md` : l’enveloppe est obligatoire, y compris pour `/site/v1/**`

Piste de correction
Remplacer les réponses ad hoc par les codes existants (`auth_required`, `invalid_request`, `internal_error`). Ajouter le test de contrat. Ne pas changer les statuts HTTP qui sont déjà corrects.

Critères d'acceptation
- Les exemples cités n’émettent plus `{ error: string }` comme contrat principal.
- Le test de contrat couvre `app/**/route.ts`.
- Un 401 reste 401, avec le code `auth_required`.

Hors périmètre
- Ne pas réécrire le corps métier des 78 routes.
- Ne pas imposer l’enveloppe aux réponses de succès ni aux flux SSE dont le contrat est déjà documenté.

33. Issue #31 — [Majeure][P2] Dépendances — le lock racine conserve Vite 8.3.0 signalé

Constat
L’ancienne formulation demandait Undici `>=7.30.1`, Nodemailer `>=10.1.4` et Zod `>=4.6.6`. Sur `canary`, le lock racine contient Undici `7.30.2`, Nodemailer `10.3.1` et Zod `4.6.7`. Ces trois planchers sont atteints.

Vite `8.3.0` est toujours résolu via Vitest. Le plancher cité était `8.3.3`. Son périmètre est l’outillage de test et de développement, pas le runtime Next. Le décompte de 21 alertes n’a pas été rejoué.

Impact
Le lock peut donner l’impression que l’audit racine est soldé, alors qu’une branche d’outillage reste sous le plancher cité. Il ne faut pas re-bumper Undici ou Nodemailer sans nouvel audit.

Reproduction
Chercher `undici@`, `nodemailer@`, `zod@` et `vite@` dans `pnpm-lock.yaml`. Relancer `pnpm audit` et séparer alertes de production et d’outillage.

Résultat attendu
Vite d’outillage est `>=8.3.3` si l’advisory est toujours ouverte, sans downgrade des trois dépendances déjà au-dessus du plancher. L’audit frais est la source du correctif.

Périmètre
- `pnpm-lock.yaml` racine
- parent Vitest / Vite, pas une surcharge aveugle
- pas les locks `apps/*` (lot M2)

Piste de correction
Mettre à jour le parent compatible, dédupliquer le lock, rejouer typecheck et tests unitaires. Documenter les alertes restantes par périmètre dev ou prod.

Critères d'acceptation
- Undici, Nodemailer et Zod ne redescendent pas sous les planchers déjà atteints.
- Vite `8.3.0` a disparu si l’advisory l’exige encore.
- Les tests unitaires passent.

Hors périmètre
- Ne pas réécrire l’issue comme si Undici `7.30.0` et Nodemailer `10.0.16` étaient encore verrouillés.
- Ne pas traiter le Site autonome ni Vibe ici.

34. Issue #32 — [Majeure][P2] Code mort — des garde-fous exportés ne sont jamais branchés

Constat
Une analyse statique antérieure comptait 174 exports jamais référencés et 41 référencés seulement par des tests. Ces chiffres sont à recompter avant toute suppression.

Deux cas restent le sujet de cette issue : `findCatalogEntriesWithoutImplementation()` n’est appelé par personne, alors qu’il devrait garantir que chaque entrée de `AGENT_TOOL_CATALOG` a une implémentation. `evaluateDurationLimit` et `decideToolPermission` sont couverts par des tests mais pas clairement branchés en production. Un test vert sur un chemin mort donne une fausse assurance.

Impact
Des contrôles de politique peuvent être crus actifs. Des composants entiers peuvent être maintenus sans être montés. Supprimer au hasard peut aussi casser un point d’entrée Val Town non vu par le graphe Next.

Reproduction
Rechercher les symboles cités (`findCatalogEntriesWithoutImplementation`, `evaluateDurationLimit`, `decideToolPermission`, `isAgentEnabled`, `findToolById`) et noter s’ils n’apparaissent qu’à leur définition ou dans `tests/`.

Résultat attendu
Chaque symbole du périmètre est soit appelé par un chemin de production ou de CI, soit supprimé avec son test. `findCatalogEntriesWithoutImplementation()` est exécuté par un contrôle qui échoue si le catalogue et le registre divergent.

Périmètre
- `lib/agent/tools/registry.ts`
- `lib/agent/limits.ts`
- `lib/agent/tools/permissions.ts`
- pas les 174 exports en une seule suppression

Piste de correction
Brancher d’abord les garde-fous de sécurité. Pour le reste de l’échantillon, prouver l’absence d’appel, y compris depuis `main.ts` et les crons Val Town, avant de supprimer. Ne pas supprimer `config.ts` ou `api-quota.ts` au motif qu’ils sont hors build Next.

Critères d'acceptation
- Le catalogue d’outils sans implémentation fait échouer un test ou un job.
- `decideToolPermission` et `evaluateDurationLimit` sont soit appelés par le runtime, soit retirés avec leurs tests, décision écrite dans le correctif.
- Aucun symbole encore importé par `main.ts` n’est supprimé.

Hors périmètre
- Ne pas supprimer en masse les 174 exports.
- Ne pas considérer un test unitaire comme une preuve d’usage en production.

35. Issue #34 — [Majeure][P2] Utilitaires — readEnv, viewerIdOf et asRecord divergent en silence

Constat
Plusieurs helpers sont recopiés. `asRecord` existe en variantes qui ne rendent pas la même chose (`null` ou `{}`). `readEnv` est défini dans `lib/integrations/oauth.ts`, `lib/integrations/status.ts` et `lib/mcp/encryption.ts`. `viewerIdOf` est recopié dans trois requêtes Vibe. Le masquage d’e-mail est recopié, y compris la regex défaillante de l’issue #36.

Les lignes exactes sont à reconfirmer avant édition : l’audit antérieur citait aussi `iso` et `sleep` / `wait` avec des signatures incompatibles.

Impact
Un correctif de sécurité appliqué à une copie laisse les autres exposées. Un appelant qui change de fichier change de contrat sans que le type le dise.

Reproduction
Chercher `function readEnv`, `function viewerIdOf`, `function asRecord` et la regex de masquage. Comparer les corps.

Résultat attendu
Une seule implémentation par helper, avec le contrat le plus strict documenté. Les appelants sont migrés. Le masquage d’e-mail partagé couvre les adresses courtes (issue #36).

Périmètre
- `readEnv` → un module d’environnement déjà existant, pas un troisième
- `viewerIdOf` → `lib/vibe/server/`
- `asRecord` → un garde qui retourne `null`, puis adaptation des appelants qui attendaient `{}`
- masquage d’e-mail → un helper de journalisation

Piste de correction
Unifier sans changer le comportement des appelants au-delà du contrat choisi. Tester `asRecord(null)`, `asRecord([])` et une adresse courte.

Critères d'acceptation
- Chaque nom n’a plus qu’une définition de production.
- Un test fixe le contrat de `asRecord` et du masquage.
- Aucune copie privée ne réintroduit l’ancienne regex.

Hors périmètre
- Ne pas créer `lib/utils/everything.ts`.
- Ne pas modifier le contrat public des routes pour unifier un helper.


Groupe — Interface bloquante et segments

36. Issue #25 — [Majeure][P2] Hydratation — Math.random() initialise la salutation

Constat
`components/chat/greeting.tsx:30-32` tire l’index de salutation dans l’initialiseur de `useState` via `Math.random()`. Le composant est client et rendu dans une page pré-rendue. Le serveur et le client ne tirent pas le même index.

Le tirage a lieu même si un agent actif remplace la salutation. D’autres `Date.now()` / `new Date()` au rendu ont été signalés ; ils ne sont pas reconfirmés comme des mismatches et ne font pas partie du critère.

Impact
React signale un mismatch et régénère le sous-arbre à chaque ouverture de l’accueil. Le défaut est intermittent selon que la salutation personnalisée est affichée ou non.

Reproduction
Ouvrir `/chat` sans agent actif, avec le rendu serveur actif, et observer l’avertissement d’hydratation. Lire l’initialiseur aux lignes 30-32.

Résultat attendu
Le premier rendu serveur et le premier rendu client produisent le même texte. Un tirage aléatoire, s’il reste souhaité, n’a lieu qu’après hydratation.

Périmètre
- `components/chat/greeting.tsx`
- test ou rendu déterministe du premier passage

Piste de correction
Initialiser l’index à 0, puis le retirer dans un effet, ou rendre le bloc de salutation seulement côté client. Ne pas utiliser `Math.random()` pendant le rendu.

Critères d'acceptation
- Le HTML initial et le premier rendu client affichent la même salutation.
- Un agent actif n’invoque plus un tirage inutile qui peut diverger.
- Aucun `suppressHydrationWarning` n’est ajouté pour masquer le symptôme.

Hors périmètre
- Ne pas « corriger » tous les `new Date()` du dépôt dans ce lot.
- Ne pas changer le texte des salutations.

37. Issue #26 — [Majeure][P2] Wakies — setInterval d’état masque l’API globale

Constat
`components/wakies/WorkspaceDialog.tsx:108` déclare `const [interval, setInterval] = useState("86400")`. Le setter masque `setInterval` / `clearInterval` dans tout le composant. Le fichier n’appelle pas `clearInterval`.

L’ancienne formulation citait aussi des `setInterval` non nettoyés dans `lib/wakies/queries/tasks.ts`, `app/(chat)/api/wakies/tasks/route.ts` et `app/api/cron/wakies/route.ts`. Sur `canary`, ces fichiers n’emploient `setInterval` que dans des commentaires qui expliquent pourquoi ils n’en utilisent pas. Ce volet est caduc.

Le décompte de 53 `useEffect(..., [])` n’a pas été rejoué et ne prouve pas une fuite.

Impact
Un minuteur ajouté dans ce dialogue appellerait le setter React au lieu de l’API du navigateur. Aucune fuite actuelle n’est démontrée dans les routes de tâches.

Reproduction
Lire la ligne 108 et le `onChange` qui appelle `setInterval`. Chercher `clearInterval` dans le fichier : absent.

Résultat attendu
L’état est renommé (`scheduleInterval` / `setScheduleInterval`). Le composant peut à nouveau appeler l’API globale. `noShadow` peut passer en `warn` si cela ne noie pas le lint.

Périmètre
- `components/wakies/WorkspaceDialog.tsx`
- `biome.jsonc` seulement pour `noShadow`, si le warn est tenable

Piste de correction
Renommer l’état et ses usages. Ne pas ajouter de minuteur. Ne pas modifier les routes de tâches.

Critères d'acceptation
- Le fichier ne déclare plus de binding nommé `setInterval`.
- Le sélecteur d’intervalle de planification fonctionne encore.
- Aucune route cron n’est modifiée pour un `setInterval` qui n’existe pas.

Hors périmètre
- Ne pas auditer les 53 effets dans ce lot.
- Ne pas inventer une fuite serveur pour justifier le correctif.

38. Issue #38 — [Majeure][P2] Routes — des segments restent sans loading.tsx ni metadata

Constat
`canary` compte 107 `page.tsx`, 15 `loading.tsx` et 80 pages sans `metadata` ni `generateMetadata`. `app/(chat)/error.tsx` existe déjà, ainsi que `app/error.tsx`, `app/global-error.tsx` et `app/(wakies)/wakies/share/error.tsx`. Il ne faut pas réajouter la frontière `(chat)`.

`loading.tsx` existe déjà pour Projets, Recherche, Réglages et Statistiques. Il manque encore sur des segments lourds, notamment Vibe et la recherche globale si leur segment n’a pas de fallback.

Impact
Sans `loading.tsx`, la navigation vers une page lourde ne montre pas de fallback. Sans metadata, les onglets héritent tous du titre racine. Une erreur de segment déjà couverte par `(chat)/error.tsx` ne doit pas être re-traitée comme absente.

Reproduction
Compter `page.tsx`, `loading.tsx` et les exports `metadata`. Ouvrir une route Vibe ou `/search` et noter l’absence de fallback voisin.

Résultat attendu
Les routes les plus lentes encore nues ont un `loading.tsx`. Un helper rend l’ajout de metadata mécanique sur les pages sans titre. Les fichiers d’erreur déjà corrects ne sont pas réécrits.

Périmètre
- segments sans `loading.tsx` parmi `/vibe`, la recherche et les pages lourdes encore nues
- helper `pageMetadata` et quelques pages représentatives, pas les 80 d’un coup si le lot déborde
- ne pas toucher `app/error.tsx` ni `app/(chat)/error.tsx` sans défaut reproduit

Piste de correction
Ajouter des fallbacks ciblés, en français, cohérents avec ceux qui existent. Introduire le helper et l’appliquer aux pages dont l’onglet est ambigu, en commençant par celles déjà ouvertes dans ce lot.

Critères d'acceptation
- Aucun `loading.tsx` existant n’est dupliqué.
- Les nouvelles pages de fallback sont en français.
- Au moins les segments lourds encore nus identifiés dans le correctif ont un `loading.tsx`.
- Le décompte final est recompté, pas recopié.

Hors périmètre
- Ne pas créer 93 `loading.tsx` mécaniquement.
- Ne pas présenter plusieurs absences de `error.tsx` local comme une panne actuelle du shell `(chat)`.

39. Issue #56 — [Majeure][P2] Dialogues — l’overlay recouvre Projets et Bots

Constat
Les dialogues Nouveau projet et Créer un bot ont leurs contrôles interceptés par `div[data-slot="dialog-overlay"].md-overlay`. Le clic QA échoue avec `REF_NOT_INTERACTABLE`, cause `covered`.

Sur `canary`, `components/ui/dialog.tsx` rend l’overlay puis un contenu en `z-50`. `packages/ui/src/styles.css` donne à `.md-overlay` `z-index: 1000` et `position: fixed; inset: 0`. L’overlay peut donc passer au-dessus du contenu. Cette revue n’a pas rejoué le clic navigateur.

Impact
Créer un projet ou un bot peut être impossible : les champs et le sélecteur sont visuellement là, mais les clics tombent sur l’overlay.

Reproduction
1. Ouvrir `/projects` puis Nouveau projet, et cliquer le nom ou le sélecteur Par défaut / Automatique.
2. Ouvrir `/agents` puis Créer un bot, et cliquer un champ.
3. Inspecter l’élément qui reçoit le clic.

Résultat attendu
L’overlay bloque l’arrière-plan et reste sous le contenu du dialogue. Les champs des deux formulaires reçoivent le clic.

Périmètre
- `components/ui/dialog.tsx`
- la règle `.md-overlay` réellement appliquée à ce dialogue
- ne pas corriger seulement le z-index d’une copie non utilisée

Piste de correction
Mettre le contenu au-dessus de l’overlay, ou baisser l’overlay sous le contenu, sans le retirer. Vérifier que les autres dialogues du même primitive restent modaux.

Critères d'acceptation
- Le sélecteur de projet et un champ du formulaire bot reçoivent le clic.
- L’arrière-plan reste inerte.
- Le correctif vise la feuille de style qui s’applique vraiment au slot `dialog-overlay`.

Hors périmètre
- Ne pas confondre avec le dépassement de hauteur (issue #57).
- Ne pas retirer l’overlay pour « débloquer » les clics.

40. Issue #68 — [Majeure][P2] CLI — la page publique recommande un paquet npm introuvable

Constat
`app/(chat)/site/projects/cli/page.tsx` affiche `npm install -g @mdevslabs/mai-cli`. Ce nom répond 404. Le paquet publié cité est `@mdevs/mai-cli`, déjà utilisé dans `apps/site/lib/downloads-data.ts`. `apps/site/docs/documentation/app-cli.md` et `apps/site/app/projects/cli/page.tsx` répètent le nom introuvable.

Le 404 du registre n’est pas un second bug : c’est la conséquence du mauvais nom.

Impact
La commande copiée depuis la page publique n’installe pas le CLI. Le visiteur peut croire que le produit n’est pas publié.

Reproduction
1. Ouvrir `/site/projects/cli` et copier la commande.
2. Comparer avec `apps/site/lib/downloads-data.ts`.
3. Ne pas compter une installation ratée comme un défaut du paquet `@mdevs/mai-cli`.

Résultat attendu
Toutes les commandes publiques d’installation du CLI utilisent le nom qui se résout, ou disent explicitement que le paquet n’est pas publié. Les copies du Site intégré et du Site autonome concordent.

Périmètre
- `app/(chat)/site/projects/cli/page.tsx`
- `apps/site/app/projects/cli/page.tsx`
- `apps/site/docs/documentation/app-cli.md`
- `apps/site/lib/downloads-data.ts` comme référence déjà cohérente

Piste de correction
Remplacer `@mdevslabs/mai-cli` par le nom publié, partout où la commande est montrée à l’utilisateur. Ne pas créer de nouveau paquet.

Critères d'acceptation
- Plus aucune commande publique n’affiche `@mdevslabs/mai-cli`.
- La page CLI et la page de téléchargement annoncent le même nom.
- Le 404 n’est pas ouvert comme issue séparée.

Hors périmètre
- Ne pas modifier les SDK Python ou TypeScript ici (issues #69 et #70).
- Ne pas publier un paquet npm dans ce correctif.


Groupe — Rendu, export et contenu affiché

41. Issue #23 — [Mineure][P3] React — 50 listes utilisent encore key={i}

Constat
`canary` contient encore 50 `key={i}` dans `components/` et `app/`. `noArrayIndexKey` est `off`. Les cas à risque cités restent à confirmer ligne à ligne : mentions filtrées (`mention-utils.tsx`), listes éditables (`agent-editor-dialog.tsx`), liste tronquée (`document-parser-card.tsx`). `greeting.tsx` est une liste statique, risque faible.

Impact
Sur une liste filtrée, triée ou dont on supprime une ligne, React réutilise le DOM de la position. Une saisie non contrôlée peut glisser d’une ligne à l’autre. Rien ne casse au premier rendu.

Reproduction
`rg -n 'key=\{i\}' components app -g '*.tsx'`. Pour une liste éditable, supprimer la deuxième ligne et observer l’état local.

Résultat attendu
Les listes mutables ont une clé stable, créée avec l’élément. Les listes réellement statiques peuvent garder l’index derrière un override commenté. La règle globale passe en `warn` si l’issue #24 n’a pas déjà fait ce passage.

Périmètre
- les occurrences dont la liste est filtrée, triée, tronquée ou éditable
- pas une réécriture de toutes les listes statiques

Piste de correction
Utiliser un id métier. À défaut, générer l’id à la création de l’élément, jamais au rendu. Ne pas appeler `crypto.randomUUID()` dans le JSX.

Critères d'acceptation
- Les listes mutables citées n’utilisent plus `key={i}`.
- Supprimer une ligne d’un formulaire éditable ne déplace pas la saisie des lignes suivantes.
- Aucune clé n’est générée pendant le rendu.

Hors périmètre
- Ne pas traiter ce lot comme un prétexte pour réactiver toutes les règles Biome.
- Ne pas changer l’ordre ni le filtre des listes.

42. Issue #53 — [Mineure][P2] Export — le PDF remplace des caractères Unicode

Constat
`lib/export/document-export.ts` documente des polices PDF standard WinAnsi : les accents français passent, pas les emoji ni une partie d’Unicode. L’export PDF remplace donc des caractères que le document source contient.

Impact
Un export PDF n’est pas fidèle dès que le texte sort de WinAnsi. Le document source, lui, n’est pas modifié.

Reproduction
Exporter en PDF un document contenant des emoji, des guillemets typographiques ou des caractères hors WinAnsi. Comparer au texte source.

Résultat attendu
Les caractères exportables le restent. Ceux qu’une police standard ne peut pas encoder sont soit rendus avec une police qui le peut, soit remplacés de façon visible et documentée, sans altérer la page.

Périmètre
- `lib/export/document-export.ts` chemin PDF
- fixture Unicode
- pas le gras inline (issue #54), sauf si le même encoder est touché

Piste de correction
Encodage Unicode réel, ou repli explicite. Ne pas élargir le remplacement silencieux.

Critères d'acceptation
- La fixture Unicode est lisible dans le PDF, ou le caractère non supporté est marqué sans disparaître du document source.
- Les accents français déjà corrects le restent.

Hors périmètre
- Ne pas changer l’export DOCX dans ce correctif s’il encode déjà Unicode.
- Ne pas réécrire le parseur Markdown.

43. Issue #54 — [Mineure][P2] Export — le PDF et le DOCX perdent le gras inline

Constat
`lib/export/document-export.ts` construit des runs inline (`inlineRuns`, autour de 545, et le commentaire autour de 142). Le gras inline Markdown n’est pas conservé dans les exports PDF et DOCX observés.

Impact
Une page correctement formatée à l’écran sort en texte plat pour le gras. L’italique, le code et les liens peuvent être dans le même trou ; ne les inclure que s’ils passent par le même chemin cassé.

Reproduction
Exporter en PDF et en DOCX un paragraphe `mot **gras** mot`. Comparer au rendu écran.

Résultat attendu
Le gras inline est présent dans les deux formats. Le texte sans marqueur ne devient pas gras.

Périmètre
- `lib/export/document-export.ts`
- fixtures PDF et DOCX

Piste de correction
Brancher le run gras déjà prévu, ou le créer s’il est ignoré à l’écriture. Couvrir les deux exporters.

Critères d'acceptation
- `**gras**` est gras dans le PDF et le DOCX.
- Un mot voisin ne l’est pas.
- Le correctif Unicode de l’issue #53 n’est pas défait si les deux fichiers sont touchés ensemble.

Hors périmètre
- Ne pas refondre le moteur d’export.
- Ne pas traiter les tableaux comme un bug de gras.

44. Issue #57 — [Mineure][P2] Projets — le dialogue Nouveau projet dépasse les fenêtres peu hautes

Constat
À 1270×649, le dialogue Nouveau projet mesure environ 769 px, commence à `y=-60` et place ses actions hors écran, sans défilement interne. Le dialogue Bot, lui, défile. Sources : `app/(chat)/projects/page.tsx` autour de 1082 et `components/ui/dialog.tsx` autour de 64.

Impact
Sur une fenêtre peu haute, le titre ou les actions du nouveau projet sont inatteignables. Ce n’est pas le même défaut que l’overlay qui intercepte les clics (issue #56).

Reproduction
Régler le viewport à 1270×649, ouvrir `/projects` puis Nouveau projet, et chercher les actions.

Résultat attendu
Le dialogue reste dans le viewport. Son contenu défile si nécessaire. Les actions restent accessibles.

Périmètre
- le contenu de `DialogContent` dans la page Projets
- le primitive seulement si le plafond de hauteur doit être partagé

Piste de correction
Limiter la hauteur au viewport et rendre le corps scrollable, comme le dialogue Bot. Ne pas réduire le formulaire au point de cacher des champs sans scroll.

Critères d'acceptation
- À 1270×649, le sommet du dialogue est visible et les actions sont atteignables par scroll interne.
- Le dialogue Bot ne régresse pas.
- Le correctif ne retire pas l’overlay.

Hors périmètre
- Ne pas traiter le clic `covered` ici.
- Ne pas généraliser à toutes les tailles d’écran sans mesure.

45. Issue #65 — [Mineure][P2] Responsive — le titre Confidentialité est tronqué à 320–360 px

Constat
`app/(chat)/site/legal/privacy/page.tsx:43-49` affiche un H1 en `uppercase`, `text-4xl` dès le plus petit breakpoint, italique et très resserré. À 320 et 360 px, la fin du titre est masquée. À 390 px, le texte peut dépasser sa carte sans dépasser le viewport : ce cas n’est pas une troncature de viewport.

Impact
Sur un téléphone étroit, le titre de la politique de confidentialité n’est pas lisible en entier.

Reproduction
Ouvrir `/site/legal/privacy` à 320 px, puis 360 px, puis 390 px.

Résultat attendu
Le titre complet reste lisible à 320 et 360 px, par retour à la ligne, sans déborder du viewport.

Périmètre
- `app/(chat)/site/legal/privacy/page.tsx` lignes du H1
- ne pas réécrire la politique

Piste de correction
Autoriser le retour à la ligne et réduire l’échelle sur très petit écran. Ne pas couper avec `overflow: hidden` ni `whitespace-nowrap`.

Critères d'acceptation
- À 320 et 360 px, « Confidentialité » est entièrement visible.
- Le cas 390 px n’est pas décrit comme une troncature de viewport s’il ne fait que dépasser la carte.

Hors périmètre
- Ne pas changer le contenu juridique.
- Ne pas appliquer le même correctif à toutes les pages légales sans les mesurer.

46. Issue #66 — [Mineure][P2] Responsive — le bouton Documentation déborde à 768 px

Constat
À 768×1024, le bouton « Parcourir la documentation » du hero `/site/docs` déborde d’environ 179 px, jusqu’à environ `x=947`. Le constat a été reproduit deux fois. Il ne faut pas le généraliser à toutes les largeurs. Source : `app/(chat)/site/docs/DocsClient.tsx` autour de 156-178.

Impact
À la largeur tablette observée, le bouton principal du hero n’est pas entièrement visible ni utilisable.

Reproduction
Ouvrir `/site/docs` à 768×1024 et mesurer le bouton du hero.

Résultat attendu
Le bouton reste dans le viewport à 768 px, sans être coupé, et reste activable.

Périmètre
- `app/(chat)/site/docs/DocsClient.tsx` bloc hero

Piste de correction
Permettre au hero de passer à la ligne avant 768 px, ou contraindre la largeur du bouton. Ne pas masquer le débordement.

Critères d'acceptation
- À 768×1024, le bouton est entièrement dans le viewport.
- Le libellé reste « Parcourir la documentation ».
- Le correctif ne prétend pas couvrir des largeurs non mesurées.

Hors périmètre
- Ne pas refondre toute la page Docs.
- Ne pas généraliser le débordement de 179 px à d’autres viewports.

47. Issue #67 — [Mineure][P2] Chat — fermer la recherche locale laisse le Markdown simplifié

Constat
Après une recherche non vide dans une conversation, Échap masque la barre mais laisse le rendu textuel simplifié. Effacer le terme restaure tableaux, code et formules. Sources : `components/chat/messages.tsx` autour de 68 et 181, `components/chat/message.tsx` autour de 534.

Impact
L’utilisateur croit avoir quitté la recherche, mais le message reste en texte brut. Le mode de rendu dépend d’un terme que l’interface ne montre plus.

Reproduction
1. Lancer une recherche non vide dans une conversation qui a un tableau, un bloc de code et une formule.
2. Fermer avec Échap sans effacer le terme.
3. Effacer le terme et comparer.

Résultat attendu
Fermer la recherche restaure le rendu riche, ou la barre reste visible tant que le rendu dépend du terme.

Périmètre
- état de recherche dans `messages.tsx`
- branche de rendu simplifié dans `message.tsx`

Piste de correction
Lier le rendu simplifié à la visibilité de la recherche, ou vider le terme quand on ferme. Ne pas laisser un terme caché piloter le Markdown.

Critères d'acceptation
- Échap restaure le rendu riche, ou laisse la barre visible avec le terme.
- Effacer le terme restaure toujours le rendu riche.
- Une recherche ouverte continue de surligner.

Hors périmètre
- Ne pas modifier la recherche globale (issue #48).
- Ne pas changer le moteur Markdown au-delà de cette bascule.

48. Issue #72 — [Mineure][P3] Skills — le résumé Brave Tech Watch décrit Maps

Constat
Dans `lib/skill-templates/index.ts` autour de 193, la skill « Veille technologique Brave » a pour description « Zones de chalandise, temps de trajet et comparaison de lieux via Maps. » Ses instructions décrivent une veille via le serveur MCP Brave Search : sources, faits datés, incertitudes. Le résumé ne correspond pas aux instructions.

Impact
La carte et la fiche annoncent un outil de cartographie. L’utilisateur active une veille documentaire à la place.

Reproduction
Ouvrir la carte « Veille technologique Brave » et comparer le résumé aux instructions.

Résultat attendu
Le résumé décrit la veille via Brave Search, pas Maps.

Périmètre
- l’entrée `brave-tech-watch` de `lib/skill-templates/index.ts`
- une copie générée seulement si l’interface lit un autre fichier

Piste de correction
Réécrire la description pour qu’elle corresponde aux instructions déjà présentes. Ne pas changer les instructions ni le serveur MCP.

Critères d'acceptation
- La description ne parle plus de chalandise, de temps de trajet ni de Maps.
- Le nom, l’id et `mcpServerNames` restent ceux de Brave Search.

Hors périmètre
- Ne pas modifier le routage des hashtags (issue #51).
- Ne pas inventer de nouvelles capacités de veille.


Groupe — Accessibilité des contrôles

49. Issue #55 — [Mineure][P3] Agent — une erreur d’outil JSON s’affiche comme Terminé

Constat
Une erreur d’outil dont la charge est du JSON s’affiche comme « Terminé » avec une coche verte. `lib/agent/tool-controller.ts` distingue `completed` et `failed` selon `result.success`. Le rendu (`components/ai-elements/tool.tsx`, `components/chat/message.tsx`) peut afficher le libellé de succès si l’état ou la charge dépliée ne portent pas l’échec.

Impact
L’utilisateur croit qu’un outil a réussi. Il peut enchaîner sur un résultat inutilisable.

Reproduction
Provoquer un outil qui renvoie un JSON d’erreur. Observer le libellé et l’icône dans le fil.

Résultat attendu
Un échec d’outil est annoncé comme tel, y compris si la charge est du JSON. Un succès réel garde la coche.

Périmètre
- `lib/agent/tool-controller.ts`
- `lib/agent/types.ts` (`unwrapAgentToolOutput`)
- `components/ai-elements/tool.tsx` et le rendu dans `message.tsx`

Piste de correction
Ne pas déduire le succès de la seule présence d’un JSON. Faire porter l’état `failed` jusqu’au libellé. Ajouter un cas de test sur une charge `{ "error": ... }` ou l’équivalent réel du dépôt.

Critères d'acceptation
- Le cas d’échec observé n’affiche plus « Terminé » ni la coche de succès.
- Un outil réussi n’affiche pas une erreur.
- Le statut accessible n’est pas uniquement une couleur.

Hors périmètre
- Ne pas changer la politique d’autorisation des outils (issue #32).
- Ne pas présenter toutes les coches vertes comme fausses.

50. Issue #58 — [Mineure][P2] Accessibilité — les libellés Projet et Bot ne sont pas associés aux champs

Constat
Dans Nouveau projet et Créer un bot, les textes visibles Nom, Description et Instructions système ne sont pas reliés à leurs champs. `getByLabel` exact ne les trouve pas : le nom accessible vient du placeholder. Sources : `app/(chat)/projects/page.tsx` autour de 1091 et `components/agents/agent-editor-dialog.tsx` autour de 173 et 237.

Impact
Un lecteur d’écran ou une recherche par libellé n’atteint pas le champ annoncé à l’écran. Le placeholder n’est pas un substitut fiable.

Reproduction
Ouvrir les deux formulaires et chercher les champs par leur libellé visible dans l’arbre d’accessibilité.

Résultat attendu
Chaque champ reçoit son nom accessible depuis le libellé visible, via `htmlFor` / `id` ou `aria-labelledby`.

Périmètre
- formulaire Nouveau projet
- formulaire Créer un bot, champs cités

Piste de correction
Associer chaque `Label` au contrôle. Ne pas supprimer le placeholder s’il aide, mais ne plus s’en servir comme seul nom.

Critères d'acceptation
- `getByLabel` exact trouve Nom, Description et Instructions système dans les deux formulaires.
- Le nom accessible n’est plus uniquement le placeholder.

Hors périmètre
- Ne pas refondre les dialogues.
- Ne pas traiter les pastilles de couleur ici (issue #59).

51. Issue #59 — [Mineure][P3] Accessibilité — les choix de couleur des projets n’ont pas de nom

Constat
Le sélecteur de couleur de projet (`app/(chat)/projects/page.tsx` autour de 1162) expose des contrôles sans nom accessible. La couleur n’est perceptible que visuellement.

Impact
Un utilisateur qui n’accède pas à la couleur ne peut pas savoir quelle pastille est laquelle, ni laquelle est choisie si l’état n’est pas nommé.

Reproduction
Ouvrir Nouveau projet, section Couleur, et inspecter chaque pastille dans l’arbre d’accessibilité.

Résultat attendu
Chaque choix a un nom accessible (couleur ou rôle) et expose son état sélectionné.

Périmètre
- sélecteur de couleur des projets
- le même sélecteur s’il est dupliqué dans l’édition

Piste de correction
Ajouter un nom et `aria-pressed` ou un vrai groupe radio. Ne pas compter sur la seule couleur.

Critères d'acceptation
- Chaque pastille a un nom accessible non vide.
- La pastille active est distinguée autrement que par la couleur.

Hors périmètre
- Ne pas changer la palette.
- Ne pas modifier les libellés de texte (issue #58) au-delà du nécessaire pour le groupe.

52. Issue #60 — [Mineure][P2] Accessibilité — le bouton d’arrêt n’a pas de nom accessible

Constat
`components/chat/input/stop-button.tsx` rend un bouton icône sans `aria-label`, sans texte et sans `title`. Il est affiché pendant `submitted` ou `streaming` (`multimodal-input.tsx` autour de 1044). Le nom accessible n’est ni « Arrêter » ni « Stop ».

Impact
Pendant une génération, le seul contrôle d’arrêt n’est pas annoncé. Un utilisateur de lecteur d’écran ne sait pas à quoi sert le bouton.

Reproduction
Lancer une génération et inspecter le bouton d’arrêt dans l’arbre d’accessibilité.

Résultat attendu
Le bouton a un nom accessible français, par exemple « Arrêter la génération ».

Périmètre
- `components/chat/input/stop-button.tsx`

Piste de correction
Ajouter `aria-label` en français. Ne pas remplacer l’icône par du texte visible si la maquette est iconique, tant que le nom accessible existe.

Critères d'acceptation
- Le bouton expose « Arrêter la génération » ou un libellé français équivalent.
- Il reste le bouton d’arrêt existant, pas un second contrôle.

Hors périmètre
- Ne pas changer la logique d’arrêt.
- Ne pas traduire d’autres boutons icône non cités.

53. Issue #61 — [Mineure][P3] Accessibilité — les filtres de Bibliothèque n’annoncent pas leur état

Constat
Les filtres de catégorie et les filtres avancés de `/library` changent le contenu, mais leur état actif est seulement visuel. Les boutons n’exposent ni `aria-pressed` ni `aria-selected`. Source : `components/library/library-header.tsx` autour de 231 et 328.

Impact
Un lecteur d’écran ne sait pas quel filtre est actif. Le contenu change sans que le contrôle l’annonce.

Reproduction
Ouvrir `/library`, activer Favoris ou un filtre avancé, et lire l’état du contrôle dans l’arbre d’accessibilité.

Résultat attendu
L’état sélectionné est exposé, par `aria-pressed` ou par un modèle d’onglets adapté au comportement réel.

Périmètre
- `components/library/library-header.tsx`

Piste de correction
Choisir le motif qui correspond à l’UI (boutons à bascule ou onglets), pas les deux. Annoncer l’état sans changer le filtre.

Critères d'acceptation
- Le filtre actif expose un état programmatique.
- Le filtre inactif ne l’expose pas.
- Le contenu filtré ne change pas de règle métier.

Hors périmètre
- Ne pas renommer le panneau Filtres avancés ici (issue #62), sauf si le même contrôle porte les deux défauts.

54. Issue #62 — [Mineure][P3] Accessibilité — le panneau Filtres avancés n’a pas de nom

Constat
Le panneau Filtres avancés de Bibliothèque n’a ni `aria-label` ni `aria-labelledby`. `components/ui/popover.tsx` ne fournit pas de nom par défaut. Source : `components/library/library-header.tsx` autour de 224.

Impact
À l’ouverture, le panneau n’annonce pas ce qu’il est. L’utilisateur entend un dialogue ou un popover anonyme.

Reproduction
Ouvrir `/library`, puis Filtres avancés, et inspecter le panneau.

Résultat attendu
Le panneau a un nom accessible du type « Filtres avancés de la bibliothèque ».

Périmètre
- en-tête Bibliothèque
- primitive popover seulement si le nom ne peut pas être posé par l’appelant

Piste de correction
Passer un nom à l’appelant. Ne pas donner le même nom à tous les popovers du dépôt.

Critères d'acceptation
- Le panneau ouvert expose ce nom.
- Les autres popovers ne reçoivent pas un libellé Bibliothèque par défaut.

Hors périmètre
- Ne pas changer la logique de filtre (issue #61) au-delà du nom du panneau.

55. Issue #63 — [Mineure][P3] Accessibilité — Agents et Applications imbriquent deux landmarks main

Constat
`components/ui/sidebar.tsx` rend un `main` (`SidebarInset`). `app/(chat)/agents/agents-client.tsx` autour de 474 et `app/(chat)/tools/tools-client.tsx` autour de 80 en rendent un second. Les routes Agents et Applications exposent donc un landmark principal imbriqué.

Impact
La navigation par landmarks devient ambiguë : deux régions prétendent être le contenu principal.

Reproduction
Visiter `/agents` puis `/tools` et compter les landmarks `main`.

Résultat attendu
Chaque page expose une structure de landmarks cohérente, avec un seul contenu principal approprié.

Périmètre
- `SidebarInset` et les deux pages citées
- ne pas retirer le landmark de la coque si c’est lui qui doit rester, ni l’inverse sans vérifier les autres routes

Piste de correction
Retirer le `main` interne ou le remplacer par une `section` nommée, après avoir vérifié que la coque expose déjà le landmark. Ne pas laisser la page sans aucun `main`.

Critères d'acceptation
- `/agents` et `/tools` n’imbriquent plus deux `main`.
- Il reste un landmark de contenu principal.
- Les autres pages qui utilisent déjà un seul `main` ne le perdent pas.

Hors périmètre
- Ne pas réécrire toute la hiérarchie de titres (issue #64).

56. Issue #64 — [Mineure][P3] Accessibilité — les pages Support répètent un H1

Constat
`app/(chat)/site/support/layout.tsx` rend un H1, et les pages Nouveau ticket et Statistiques en rendent un autre. La hiérarchie est redondante. Plusieurs H1 ne sont pas, en soi, une invalidité HTML : le problème à décrire est la redondance pour la navigation par titres.

Impact
Un lecteur d’écran qui liste les titres de niveau 1 annonce deux titres de page. Le titre de section n’est plus distingué du titre d’écran.

Reproduction
Ouvrir Support, Nouveau ticket, puis Statistiques, et lister les H1.

Résultat attendu
La hiérarchie distingue le titre de page et les titres de section. Un seul des deux niveaux reste un H1.

Périmètre
- `app/(chat)/site/support/layout.tsx`
- `app/(chat)/site/support/new/NewTicketClient.tsx`
- `app/(chat)/site/support/stats/SupportStatsClient.tsx`
- les copies `apps/site` seulement si elles dupliquent le même layout

Piste de correction
Descendre le titre de section en H2, ou retirer le H1 du layout si la page enfant porte déjà le titre de page. Garder un H1 visible.

Critères d'acceptation
- Nouveau ticket et Statistiques n’annoncent plus deux titres de page de même niveau sans distinction.
- Il reste un H1.
- Le correctif ne parle pas d’invalidité HTML.

Hors périmètre
- Ne pas réécrire les textes d’aide.
- Ne pas traiter les landmarks `main` ici (issue #63).


Groupe — Hygiène documentaire et dépôt

57. Issue #27 — [Mineure][P3] Dépôt — des rapports et fichiers temporaires sont versionnés

Constat
`.lint-diagnostics.txt` n’est plus dans l’arbre. Restent versionnés : `RAPPORT_IMPLANTATION_MDEVS_UI_ICONS.txt` (environ 51 Ko), 21 fichiers sous `artifacts/`, quatre `.bak` dans `apps/site`, et `lib/quizzly/curriculum/5e/arts/06-part.tmp`.

Impact
Le dépôt mélange sources et sorties d’outils. Un `.bak` ou un `.tmp` peut être servi ou importé par erreur. Le rapport d’implantation n’a pas de rôle à l’exécution.

Reproduction
Lister les fichiers suivis dont le nom finit par `.bak` ou `.tmp`, plus le rapport racine et `artifacts/`.

Résultat attendu
Ces artefacts ne sont plus suivis. `.gitignore` empêche leur retour. Aucune source nécessaire au build n’est supprimée.

Périmètre
- les fichiers cités
- `.gitignore`
- vérifier qu’aucun import ne référence le `.tmp` ou un `.bak`

Piste de correction
Retirer du suivi les sorties confirmées inutiles. Si un fichier d’`artifacts/` est une fixture de test, le déplacer vers `tests/` au lieu de le supprimer aveuglément.

Critères d'acceptation
- Les `.bak`, le `.tmp` et le rapport ne sont plus versionnés, ou l’exception est justifiée dans le correctif.
- Le build et les tests qui lisaient une fixture déplacée passent encore.
- `.lint-diagnostics.txt` n’est pas « supprimé » une seconde fois : il est déjà absent.

Hors périmètre
- Ne pas vider `artifacts/` s’il contient des fixtures référencées, sans les reloger.
- Ne pas réécrire l’historique Git.

58. Issue #29 — [Mineure][P3] Sécurité — le biome-ignore du layout dit seulement Required

Constat
`app/layout.tsx:106` ignore `noDangerouslySetInnerHtml` avec le motif « Required ». Le HTML injecté sert à éviter le flash de thème. D’autres exceptions du dépôt nomment la fonction qui purifie ou la raison précise. Celle-ci ne le fait pas.

Impact
Un lecteur du diff ne sait pas pourquoi l’exception existe, ni quelle invariant la rend acceptable. Le commentaire inutile n’est pas, à lui seul, une XSS.

Reproduction
Lire `app/layout.tsx` autour de 105-111 et comparer avec les autres `biome-ignore` de `noDangerouslySetInnerHtml`.

Résultat attendu
Le commentaire dit ce que le script fait (anti-FOUC), pourquoi il est inline, et pourquoi il n’est pas un vecteur de donnée utilisateur. La convention « nommer la protection » est respectée.

Périmètre
- `app/layout.tsx` commentaire et, si besoin, le script inline déjà présent

Piste de correction
Remplacer « Required » par une justification précise. Ne pas retirer le script anti-FOUC sans solution équivalente. Mentionner le rapport à la CSP si le choix `next/script` contre script inline est le sujet.

Critères d'acceptation
- Le motif n’est plus le seul mot « Required ».
- Le script anti-FOUC fonctionne encore.
- Aucune donnée utilisateur n’est concaténée dans ce HTML.

Hors périmètre
- Ne pas supprimer toutes les exceptions `dangerouslySetInnerHTML`.
- Ne pas traiter ce commentaire comme une faille prouvée.

59. Issue #40 — [Mineure][P3] Lint — dix eslint-disable sont inertes, dont une dépendance manquante

Constat
L’application racine est lintée par Biome, pas par ESLint : pas de dépendance `eslint` à la racine, pas de config ESLint hors `apps/site`. `apps/site` a, lui, ESLint 9. Le dire « aucun ESLint dans le dépôt » est donc faux.

Dix commentaires `eslint-disable` restent dans l’arbre racine, aux lignes déjà relevées (`use-quota-meter.ts:51`, `prompt-input.tsx:666`, `code-block.tsx:35` et `:38`, quatre `no-img-element`, deux logos). Biome ne lit pas ces commentaires. Dans `use-quota-meter.ts`, le commentaire prétend ignorer des dépendances manquantes (`costPercent`, `costAiUsed`) que Biome peut encore signaler.

Impact
Le commentaire donne une fausse assurance. Le toast de quota peut ne pas se réévaluer quand le pourcentage change. Les autres commentaires sont du bruit, pas des désactivations effectives.

Reproduction
Lire les dix commentaires. Confirmer que la racine n’a pas ESLint et que `apps/site` en a un. Lire l’effet de `use-quota-meter.ts` autour de 51.

Résultat attendu
Les commentaires inertes sont supprimés ou remplacés par un `biome-ignore` justifié. Les dépendances manquantes du quota sont corrigées ou réellement exclues, avec une raison.

Périmètre
- les dix commentaires de l’arbre racine
- `components/chat/input/use-quota-meter.ts`
- pas la config ESLint de `apps/site`

Piste de correction
Corriger le tableau de dépendances du quota. Supprimer les `eslint-disable` dont la règle Biome équivalente est déjà `off` (`noBitwiseOperators`, `noImgElement`).

Critères d'acceptation
- L’arbre racine ne contient plus d’`eslint-disable`, ou chaque reste est un `biome-ignore` motivé.
- Le toast de quota dépend des valeurs qu’il lit, ou l’exclusion est justifiée.
- ESLint de `apps/site` n’est pas retiré.

Hors périmètre
- Ne pas ajouter ESLint à la racine pour rendre les commentaires utiles.
- Ne pas réactiver `noImgElement` dans ce lot.

60. Issue #41 — [Mineure][P2] Site — les scripts de package.json ne pointent plus au bon endroit

Constat
`apps/site/package.json` déclare `admin`, `reset:*`, `code:create` et `newsletter:send` vers `scripts/admin.ts` et `scripts/newsletter-send.ts`. Ces fichiers ne sont pas dans `apps/site/scripts/` (seulement des migrations). Les scripts réels sont à la racine du dépôt : `scripts/admin.ts` et `scripts/newsletter-send.ts`. Lancées depuis `apps/site`, les commandes ne trouvent pas leur cible.

Impact
Une commande documentée dans le manifeste du Site autonome échoue. Le risque a été relevé à la revue du commit `78f553c`.

Reproduction
Depuis `apps/site`, lancer `npm run admin` ou `npm run newsletter:send` et observer le chemin résolu.

Résultat attendu
Chaque script conservé pointe vers un fichier qui existe quand on le lance depuis `apps/site`, ou la commande est retirée si elle n’a plus de sens dans cette application.

Périmètre
- `apps/site/package.json`
- chemins vers `scripts/admin.ts` et `scripts/newsletter-send.ts`

Piste de correction
Pointer vers les scripts racine avec un chemin relatif correct, ou supprimer les commandes obsolètes. Vérifier une commande conservée.

Critères d'acceptation
- Les commandes conservées se lancent depuis `apps/site` sans `ENOENT`.
- Les commandes retirées ne restent pas dans `package.json`.
- Aucun script de migration existant n’est écrasé.

Hors périmètre
- Ne pas fusionner les copies `admin.ts` (issue #16) dans ce correctif.
- Ne pas exécuter de reset destructif sur une base réelle pour prouver le script.

61. Issue #42 — [Mineure][P2] Quizzly — le rang de Gemini 3.8 Flash n’est pas sourcé

Constat
`apps/site/docs/news/introducing-quizzly/index.md` affirme que Gemini 3.8 Flash était 10e du classement Texte d’Arena au 4 novembre 2026, sans relevé daté. Une annonce consultée au lancement le situait 7e. Cela ne réfute pas le rang du 4 novembre : la preuve datée manque dans le billet.

Impact
Le billet présente un rang daté comme établi. Un lecteur ne peut pas le vérifier, et un autre chiffre circule pour un autre moment.

Reproduction
Lire le paragraphe Gemini du billet et chercher une source datée du 4 novembre dans la page.

Résultat attendu
Le rang est accompagné d’une source datée, ou la phrase ne le présente plus comme un fait établi.

Périmètre
- `apps/site/docs/news/introducing-quizzly/index.md`

Piste de correction
Ajouter la source datée, ou reformuler. Ne pas remplacer 10e par 7e : ce second chiffre ne date pas du 4 novembre.

Critères d'acceptation
- La phrase ne présente plus un rang daté sans source, ou la source est dans le billet.
- Le rang du 4 novembre n’est pas déclaré faux.

Hors périmètre
- Ne pas modifier le lien « Sources officielles » ici (issue #43), sauf si la source ajoutée crée cette section.
- Ne pas changer le modèle utilisé pour générer les quiz.

62. Issue #43 — [Mineure][P3] Quizzly — le sommaire pointe vers une ancre absente

Constat
Dans `apps/site/docs/news/introducing-quizzly/index.md`, le sommaire lien vers `#sources-officielles`. Aucune section de cette ancre n’existe dans le billet.

Impact
Le lien du sommaire ne mène nulle part. Le lecteur cherche des sources qui ne sont pas balisées.

Reproduction
Ouvrir le billet et activer « Sources officielles » dans le sommaire.

Résultat attendu
Le lien atteint une section existante, ou il est retiré du sommaire.

Périmètre
- le même fichier Markdown

Piste de correction
Ajouter la section et l’ancre, ou corriger le lien. Si l’issue #42 ajoute des sources, réutiliser cette section plutôt que d’en créer deux.

Critères d'acceptation
- Cliquer le lien du sommaire fait défiler jusqu’à une section présente.
- L’ancre et le `href` concordent.

Hors périmètre
- Ne pas inventer de sources pour remplir la section.
- Ne pas réécrire le billet.

63. Issue #69 — [Mineure][P3] Docs — le guide Python cite un paquet absent de PyPI

Constat
`apps/site/docs/documentation/api-python-sdk.md` recommande d’installer `mdevslabs-python`. Deux contrôles du registre PyPI ont renvoyé 404. Aucune installation réelle n’a été tentée. Cela ne prouve pas que le code du SDK n’existe nulle part.

Impact
Un lecteur qui suit le guide ne peut pas installer le paquet documenté, sans savoir si le SDK est simplement non publié.

Reproduction
Lire les commandes du guide, puis chercher `mdevslabs-python` sur PyPI. Ne pas lancer d’installation comme preuve.

Résultat attendu
Le guide cite un paquet installable, ou il dit clairement que le SDK n’est pas publié et ne donne pas une commande qui échoue.

Périmètre
- `apps/site/docs/documentation/api-python-sdk.md`

Piste de correction
Vérifier le nom publié. S’il n’existe pas, retirer ou nuancer la commande. Ne pas publier le paquet dans ce correctif.

Critères d'acceptation
- La commande documentée n’envoie plus vers un 404 connu, ou le texte dit que le paquet n’est pas disponible.
- Le correctif ne conclut pas que le code SDK est absent du dépôt sans l’avoir cherché.

Hors périmètre
- Ne pas créer le paquet PyPI.
- Ne pas traiter le SDK TypeScript ici (issue #70).

64. Issue #70 — [Mineure][P3] Docs — le guide TypeScript cite un paquet absent de npm

Constat
`apps/site/docs/documentation/api-typescript-sdk.md` recommande `@mdevslabs/sdk`. Deux contrôles npm ont renvoyé 404. Aucune installation n’a été tentée. Cela ne prouve pas que le code du SDK n’existe nulle part. Le 404 n’est pas un bug distinct du nom documenté.

Impact
Le guide d’installation TypeScript échoue si on le suit tel quel, sans dire si le SDK est non publié.

Reproduction
Lire les commandes du guide aux lignes citées (8-21, 29, 52, 181, 205) et chercher le nom sur npm.

Résultat attendu
Le nom documenté est installable, ou le guide dit que le SDK n’est pas disponible et retire les commandes qui échouent.

Périmètre
- `apps/site/docs/documentation/api-typescript-sdk.md`

Piste de correction
Aligner le nom sur le paquet publié s’il existe sous un autre scope, sinon nuancer le guide. Ne pas publier le paquet ici.

Critères d'acceptation
- Plus aucune commande du guide n’impose `@mdevslabs/sdk` si ce nom reste en 404.
- Le texte ne prétend pas que le code est introuvable dans le dépôt sans recherche.

Hors périmètre
- Ne pas modifier la page CLI (issue #68) dans ce correctif.
- Ne pas créer de paquet npm.


Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```
