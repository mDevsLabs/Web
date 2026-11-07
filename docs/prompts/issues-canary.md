# Prompts de correction — issues ouvertes, branche canary

Référence de code : `canary` @ `39df0a52`. Les issues GitHub ont été réécrites dans le même format avant ces prompts. Chaque prompt est autonome.

Règle de taille : un lot majeur contient 5 issues, un lot mineur en contient 8. Ne pas mélanger les lots.

## Sommaire

- **M1 — Comptes, jetons et installeurs** (majeure, 5) : #9, #10, #13, #28, #36
- **M2 — Dépendances signalées** (majeure, 5) : #30, #33, #35, #37, #39
- **M3 — Build, provenance et CI** (majeure, 5) : #11, #12, #14, #15, #17
- **M4 — Chat, fichiers et pages** (majeure, 5) : #44, #45, #46, #47, #52
- **M5 — Recherche et chiffres publics** (majeure, 5) : #48, #49, #50, #51, #71
- **M6 — Structure et typage** (majeure, 5) : #16, #18, #19, #22, #24
- **M7 — Erreurs, code mort et utilitaires** (majeure, 5) : #20, #21, #31, #32, #34
- **M8 — Interface bloquante et segments** (majeure, 5) : #25, #26, #38, #56, #68
- **m1 — Rendu, export et contenu affiché** (mineure, 8) : #23, #53, #54, #57, #65, #66, #67, #72
- **m2 — Accessibilité des contrôles** (mineure, 8) : #55, #58, #59, #60, #61, #62, #63, #64
- **m3 — Hygiène documentaire et dépôt** (mineure, 8) : #27, #29, #40, #41, #42, #43, #69, #70

---

## Prompt M1

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M1 — Comptes, jetons et installeurs. Il contient 5 issues majeures, ni plus ni moins. Corriger les failles de compte, de session, de mise à jour Desktop et de journaux d’e-mail. Chaque issue est indépendante : ne pas les fusionner en un seul refactor d’authentification.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #9 — [Majeure][P1] Auth — l’API Hono accepte un mot de passe d’un caractère
   https://github.com/mDevsLabs/Web/issues/9
   Périmètre : `auth.ts`
   Hors périmètre : Ne pas présenter le défaut comme un contournement de l’OTP.

2. Issue #10 — [Majeure][P1] Session — le JWT HttpOnly est recopié dans des stockages lisibles
   https://github.com/mDevsLabs/Web/issues/10
   Périmètre : `app/(chat)/site/layout.tsx`
   Hors périmètre : Ne pas conclure qu’une XSS est déjà présente.

3. Issue #13 — [Majeure][P1] Desktop — le contrôle de mise à jour peut proposer un downgrade
   https://github.com/mDevsLabs/Web/issues/13
   Périmètre : `apps/desktop/src/updater.ts`
   Hors périmètre : Ne pas implémenter ici la vérification d’intégrité des binaires (issue #28).

4. Issue #28 — [Majeure][P1] Desktop — les installeurs téléchargés s’ouvrent sans contrôle d’intégrité
   https://github.com/mDevsLabs/Web/issues/28
   Périmètre : `apps/desktop/src/about-window.ts`
   Hors périmètre : Ne pas prétendre qu’une compromission du renderer a été observée.

5. Issue #36 — [Majeure][P1] Journaux — le masquage d’e-mail laisse passer les adresses courtes
   https://github.com/mDevsLabs/Web/issues/36
   Périmètre : `lib/site/email.ts` en priorité
   Hors périmètre : Ne pas recopier les adresses trouvées dans le code dans l’issue, les commits ou les logs de test.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M2

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M2 — Dépendances signalées. Il contient 5 issues majeures, ni plus ni moins. Mettre à jour uniquement les dépendances encore sous un plancher d’advisory confirmé. Rejouer l’audit. Ne pas recopier les versions déjà corrigées sur canary.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #30 — [Majeure][P2] Site — Next.js 16.3.8 reste en deçà de la version racine
   https://github.com/mDevsLabs/Web/issues/30
   Périmètre : `apps/site/package.json`
   Hors périmètre : Ne pas recopier l’ancien décompte de 26 vulnérabilités comme un fait actuel.

2. Issue #33 — [Majeure][P2] Vibe — DOMPurify, markdown-it et Nodemailer restent signalés
   https://github.com/mDevsLabs/Web/issues/33
   Périmètre : `apps/vibe/package.json`
   Hors périmètre : Ne pas présenter le score critical comme la preuve d’une XSS exploitable.

3. Issue #35 — [Majeure][P2] Electron — Coder embarque encore Electron 44.5.1
   https://github.com/mDevsLabs/Web/issues/35
   Périmètre : `apps/coder/package.json` et son lock
   Hors périmètre : Ne pas réécrire l’issue comme si Desktop était encore en `44.5.1`.

4. Issue #37 — [Majeure][P2] Blackline — Vite 6.4.4 contourne server.fs.deny en développement
   https://github.com/mDevsLabs/Web/issues/37
   Périmètre : `apps/blackline/package.json` et son lock
   Hors périmètre : Ne pas présenter ce défaut comme une faille du build de production.

5. Issue #39 — [Majeure][P2] Mobile — la chaîne Capacitor conserve tar 6.2.1
   https://github.com/mDevsLabs/Web/issues/39
   Périmètre : `apps/mobile/package.json`
   Hors périmètre : Ne plus affirmer que xmldom est en `0.9.11`.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M3

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M3 — Build, provenance et CI. Il contient 5 issues majeures, ni plus ni moins. Rendre l’installation, le build Vibe, la provenance Wakies et le typecheck backend vérifiables. Un seul job qualité suffit pour accueillir les contrôles : ne pas créer plusieurs workflows concurrents.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #11 — [Majeure][P2] Site — figer l’installation maintenant que le lock est resynchronisé
   https://github.com/mDevsLabs/Web/issues/11
   Périmètre : `apps/site/package.json`
   Hors périmètre : Ne pas réécrire l’issue comme si Next `16.2.10` était encore verrouillé.

2. Issue #12 — [Majeure][P2] Vibe — le build npm casse sur les types React de bookIcons
   https://github.com/mDevsLabs/Web/issues/12
   Périmètre : `apps/vibe/package.json`
   Hors périmètre : Ne pas mettre à jour DOMPurify dans ce lot (issue #33), sauf si le build l’exige.

3. Issue #14 — [Majeure][P2] Wakies — source:check ne peut pas valider un checkout canary
   https://github.com/mDevsLabs/Web/issues/14
   Périmètre : `scripts/check-wakies-source.mjs`
   Hors périmètre : Ne pas réutiliser les SHA `8d33f251…` / `10febda8…` comme des faits de cet arbre : le manifeste n’y est pas.

4. Issue #15 — [Majeure][P2] CI — aucun job de lint, de typecheck ni de tests
   https://github.com/mDevsLabs/Web/issues/15
   Périmètre : `.github/workflows/build.yml`
   Hors périmètre : Ne pas citer `.lint-diagnostics.txt` comme un artefact encore versionné.

5. Issue #17 — [Majeure][P2] Types — le backend racine reste hors du typecheck
   https://github.com/mDevsLabs/Web/issues/17
   Périmètre : `tsconfig.json` ou un `tsconfig.backend.json` dédié
   Hors périmètre : Ne pas prétendre que les 75 modules sont déjà inclus.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M4

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M4 — Chat, fichiers et pages. Il contient 5 issues majeures, ni plus ni moins. Corriger les pertes de contexte, de tours, de fichiers et d’occurrences. Ne pas inventer une cause quand l’issue dit qu’elle n’est pas établie.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #44 — [Majeure][P2] Chat — le mode Fantôme perd le contexte entre deux tours
   https://github.com/mDevsLabs/Web/issues/44
   Périmètre : construction du contexte en mode Fantôme
   Hors périmètre : Ne pas « corriger » en désactivant le mode Fantôme.

2. Issue #45 — [Majeure][P2] Chat — la régénération d’un document long renvoie parfois HTTP 500
   https://github.com/mDevsLabs/Web/issues/45
   Périmètre : route `/api/chat` et le chemin de régénération
   Hors périmètre : Ne pas présenter le 500 comme systématique.

3. Issue #46 — [Majeure][P1] Chat — une régénération truncate échouée supprime le tour valide
   https://github.com/mDevsLabs/Web/issues/46
   Périmètre : `components/chat/message-actions.tsx`
   Hors périmètre : Ne pas corriger uniquement l’affichage client si la base a déjà supprimé les lignes.

4. Issue #47 — [Majeure][P2] Fichiers — les imports PNG, JPEG et TXT acceptés échouent en HTTP 500
   https://github.com/mDevsLabs/Web/issues/47
   Périmètre : `app/(chat)/api/files/upload/route.ts`
   Hors périmètre : Ne pas élargir les types acceptés.

5. Issue #52 — [Majeure][P2] Pages — le remplacement IA peut modifier une autre occurrence
   https://github.com/mDevsLabs/Web/issues/52
   Périmètre : ancrage de la sélection dans l’assistant Pages
   Hors périmètre : Ne pas présenter l’observation comme systématique.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M5

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M5 — Recherche et chiffres publics. Il contient 5 issues majeures, ni plus ni moins. Rendre les recherches honnêtes et aligner les quotas annoncés sur le compteur réellement appliqué. Ne pas élargir une autorisation au-delà de la route citée.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #48 — [Majeure][P2] Recherche — le filtre « Tout » masque des discussions trouvées
   https://github.com/mDevsLabs/Web/issues/48
   Périmètre : `components/chat/global-search-client.tsx`
   Hors périmètre : Ne pas élargir « Tout » à des sources non autorisées pour faire apparaître des résultats.

2. Issue #49 — [Majeure][P2] Support — la recherche publique reçoit 401 en mode anonyme
   https://github.com/mDevsLabs/Web/issues/49
   Périmètre : politique du proxy pour la seule route de recherche documentaire publique
   Hors périmètre : Ne pas rendre publiques toutes les routes `/api/site/`.

3. Issue #50 — [Majeure][P2] Wakies — une erreur de recherche s’affiche comme une absence de résultat
   https://github.com/mDevsLabs/Web/issues/50
   Périmètre : `app/(chat)/api/wakies/search/route.ts`
   Hors périmètre : Ne pas inventer la cause du 500.

4. Issue #51 — [Majeure][P2] Vibe — le lien #mAI ouvre un onglet Hashtags vide
   https://github.com/mDevsLabs/Web/issues/51
   Périmètre : construction du lien dans `RichContent.tsx`
   Hors périmètre : Ne pas expliquer le vide par une période de tendances sans preuve dans le code appelé.

5. Issue #71 — [Majeure][P2] Tarifs — les quotas API annoncés se contredisent
   https://github.com/mDevsLabs/Web/issues/71
   Périmètre : `config.ts` et le code qui consomme `TIER_REQUEST_LIMITS` / `getTierRequestLimit`
   Hors périmètre : Ne pas inférer que le compteur hebdomadaire est le bon uniquement parce qu’il est dans `config.ts`, ni l’inverse.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M6

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M6 — Structure et typage. Il contient 5 issues majeures, ni plus ni moins. Réduire la dette structurelle visible sans réécrire le dépôt. Extraire par responsabilité, déplacer les types, et rendre le lint honnête. Pas de suppression de masse.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #16 — [Majeure][P2] Scripts — quatre fichiers sont dupliqués entre la racine et scripts/
   https://github.com/mDevsLabs/Web/issues/16
   Périmètre : les cinq paires citées
   Hors périmètre : Ne pas supprimer `email.ts` racine s’il est dans le graphe Val Town plutôt qu’un simple doublon de script : le vérifier avant suppression.

2. Issue #18 — [Majeure][P2] Structure — cinq fonctions dépassent encore 1 000 lignes
   https://github.com/mDevsLabs/Web/issues/18
   Périmètre : les cinq fonctions citées, une extraction par responsabilité
   Hors périmètre : Ne pas réécrire `MessagesPage.tsx` dans ce lot.

3. Issue #19 — [Majeure][P2] Types — des milliers de any explicites avec noExplicitAny désactivé
   https://github.com/mDevsLabs/Web/issues/19
   Périmètre : d’abord les `catch (e: any)` de `lib/` et `app/`
   Hors périmètre : Ne pas convertir tout le dépôt d’un coup.

4. Issue #22 — [Majeure][P2] Architecture — lib/ importe l’UI et des types métier vivent dans components/
   https://github.com/mDevsLabs/Web/issues/22
   Périmètre : les fichiers `lib/` qui importent `@/components/`
   Hors périmètre : Ne pas déplacer des composants React dans `lib/` pour « inverser » la dépendance dans l’autre sens.

5. Issue #24 — [Majeure][P2] Lint — biome.jsonc désactive des garde-fous qui masquent des bugs
   https://github.com/mDevsLabs/Web/issues/24
   Périmètre : `biome.jsonc`
   Hors périmètre : Ne pas réactiver d’un coup les 31 désactivations si certaines sont des choix documentés du design system.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M7

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M7 — Erreurs, code mort et utilitaires. Il contient 5 issues majeures, ni plus ni moins. Fermer les échecs silencieux, unifier les contrats d’erreur et les helpers, brancher ou retirer les garde-fous morts, et solder le reste d’audit racine. Ne pas supprimer un export encore atteint par Val Town.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #20 — [Majeure][P2] Erreurs — des catch vides avalent des échecs, dont les filtres d’outils
   https://github.com/mDevsLabs/Web/issues/20
   Périmètre : `lib/chat/context.ts` en priorité
   Hors périmètre : Ne pas traiter tous les catch vides du dépôt comme des failles.

2. Issue #21 — [Majeure][P2] API — 78 routes sortent encore de l’enveloppe errorResponse
   https://github.com/mDevsLabs/Web/issues/21
   Périmètre : les quatre exemples cités d’abord
   Hors périmètre : Ne pas réécrire le corps métier des 78 routes.

3. Issue #31 — [Majeure][P2] Dépendances — le lock racine conserve Vite 8.3.0 signalé
   https://github.com/mDevsLabs/Web/issues/31
   Périmètre : `pnpm-lock.yaml` racine
   Hors périmètre : Ne pas réécrire l’issue comme si Undici `7.30.0` et Nodemailer `10.0.16` étaient encore verrouillés.

4. Issue #32 — [Majeure][P2] Code mort — des garde-fous exportés ne sont jamais branchés
   https://github.com/mDevsLabs/Web/issues/32
   Périmètre : `lib/agent/tools/registry.ts`
   Hors périmètre : Ne pas supprimer en masse les 174 exports.

5. Issue #34 — [Majeure][P2] Utilitaires — readEnv, viewerIdOf et asRecord divergent en silence
   https://github.com/mDevsLabs/Web/issues/34
   Périmètre : `readEnv` → un module d’environnement déjà existant, pas un troisième
   Hors périmètre : Ne pas créer `lib/utils/everything.ts`.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt M8

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est M8 — Interface bloquante et segments. Il contient 5 issues majeures, ni plus ni moins. Débloquer les dialogues, l’hydratation, le nommage qui masque une API, les segments nus et la commande CLI publique. Ne pas élargir chaque correctif à tout le dépôt.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #25 — [Majeure][P2] Hydratation — Math.random() initialise la salutation
   https://github.com/mDevsLabs/Web/issues/25
   Périmètre : `components/chat/greeting.tsx`
   Hors périmètre : Ne pas « corriger » tous les `new Date()` du dépôt dans ce lot.

2. Issue #26 — [Majeure][P2] Wakies — setInterval d’état masque l’API globale
   https://github.com/mDevsLabs/Web/issues/26
   Périmètre : `components/wakies/WorkspaceDialog.tsx`
   Hors périmètre : Ne pas auditer les 53 effets dans ce lot.

3. Issue #38 — [Majeure][P2] Routes — des segments restent sans loading.tsx ni metadata
   https://github.com/mDevsLabs/Web/issues/38
   Périmètre : segments sans `loading.tsx` parmi `/vibe`, la recherche et les pages lourdes encore nues
   Hors périmètre : Ne pas créer 93 `loading.tsx` mécaniquement.

4. Issue #56 — [Majeure][P2] Dialogues — l’overlay recouvre Projets et Bots
   https://github.com/mDevsLabs/Web/issues/56
   Périmètre : `components/ui/dialog.tsx`
   Hors périmètre : Ne pas confondre avec le dépassement de hauteur (issue #57).

5. Issue #68 — [Majeure][P2] CLI — la page publique recommande un paquet npm introuvable
   https://github.com/mDevsLabs/Web/issues/68
   Périmètre : `app/(chat)/site/projects/cli/page.tsx`
   Hors périmètre : Ne pas modifier les SDK Python ou TypeScript ici (issues #69 et #70).

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt m1

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est m1 — Rendu, export et contenu affiché. Il contient 8 issues mineures, ni plus ni moins. Corriger des défauts localisés d’affichage, d’export et de clés de liste. L’issue #72 est un texte de skill, pas un bug d’export : la traiter à part, dans le même lot seulement parce qu’elle est mineure et bornée.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #23 — [Mineure][P3] React — 50 listes utilisent encore key={i}
   https://github.com/mDevsLabs/Web/issues/23
   Périmètre : les occurrences dont la liste est filtrée, triée, tronquée ou éditable
   Hors périmètre : Ne pas traiter ce lot comme un prétexte pour réactiver toutes les règles Biome.

2. Issue #53 — [Mineure][P2] Export — le PDF remplace des caractères Unicode
   https://github.com/mDevsLabs/Web/issues/53
   Périmètre : `lib/export/document-export.ts` chemin PDF
   Hors périmètre : Ne pas changer l’export DOCX dans ce correctif s’il encode déjà Unicode.

3. Issue #54 — [Mineure][P2] Export — le PDF et le DOCX perdent le gras inline
   https://github.com/mDevsLabs/Web/issues/54
   Périmètre : `lib/export/document-export.ts`
   Hors périmètre : Ne pas refondre le moteur d’export.

4. Issue #57 — [Mineure][P2] Projets — le dialogue Nouveau projet dépasse les fenêtres peu hautes
   https://github.com/mDevsLabs/Web/issues/57
   Périmètre : le contenu de `DialogContent` dans la page Projets
   Hors périmètre : Ne pas traiter le clic `covered` ici.

5. Issue #65 — [Mineure][P2] Responsive — le titre Confidentialité est tronqué à 320–360 px
   https://github.com/mDevsLabs/Web/issues/65
   Périmètre : `app/(chat)/site/legal/privacy/page.tsx` lignes du H1
   Hors périmètre : Ne pas changer le contenu juridique.

6. Issue #66 — [Mineure][P2] Responsive — le bouton Documentation déborde à 768 px
   https://github.com/mDevsLabs/Web/issues/66
   Périmètre : `app/(chat)/site/docs/DocsClient.tsx` bloc hero
   Hors périmètre : Ne pas refondre toute la page Docs.

7. Issue #67 — [Mineure][P2] Chat — fermer la recherche locale laisse le Markdown simplifié
   https://github.com/mDevsLabs/Web/issues/67
   Périmètre : état de recherche dans `messages.tsx`
   Hors périmètre : Ne pas modifier la recherche globale (issue #48).

8. Issue #72 — [Mineure][P3] Skills — le résumé Brave Tech Watch décrit Maps
   https://github.com/mDevsLabs/Web/issues/72
   Périmètre : l’entrée `brave-tech-watch` de `lib/skill-templates/index.ts`
   Hors périmètre : Ne pas modifier le routage des hashtags (issue #51).

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt m2

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est m2 — Accessibilité des contrôles. Il contient 8 issues mineures, ni plus ni moins. Exposer un nom, un état ou une hiérarchie accessible sur les contrôles cités. Ne pas changer le comportement métier. Ne pas présenter plusieurs H1 comme une invalidité HTML.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #55 — [Mineure][P3] Agent — une erreur d’outil JSON s’affiche comme Terminé
   https://github.com/mDevsLabs/Web/issues/55
   Périmètre : `lib/agent/tool-controller.ts`
   Hors périmètre : Ne pas changer la politique d’autorisation des outils (issue #32).

2. Issue #58 — [Mineure][P2] Accessibilité — les libellés Projet et Bot ne sont pas associés aux champs
   https://github.com/mDevsLabs/Web/issues/58
   Périmètre : formulaire Nouveau projet
   Hors périmètre : Ne pas refondre les dialogues.

3. Issue #59 — [Mineure][P3] Accessibilité — les choix de couleur des projets n’ont pas de nom
   https://github.com/mDevsLabs/Web/issues/59
   Périmètre : sélecteur de couleur des projets
   Hors périmètre : Ne pas changer la palette.

4. Issue #60 — [Mineure][P2] Accessibilité — le bouton d’arrêt n’a pas de nom accessible
   https://github.com/mDevsLabs/Web/issues/60
   Périmètre : `components/chat/input/stop-button.tsx`
   Hors périmètre : Ne pas changer la logique d’arrêt.

5. Issue #61 — [Mineure][P3] Accessibilité — les filtres de Bibliothèque n’annoncent pas leur état
   https://github.com/mDevsLabs/Web/issues/61
   Périmètre : `components/library/library-header.tsx`
   Hors périmètre : Ne pas renommer le panneau Filtres avancés ici (issue #62), sauf si le même contrôle porte les deux défauts.

6. Issue #62 — [Mineure][P3] Accessibilité — le panneau Filtres avancés n’a pas de nom
   https://github.com/mDevsLabs/Web/issues/62
   Périmètre : en-tête Bibliothèque
   Hors périmètre : Ne pas changer la logique de filtre (issue #61) au-delà du nom du panneau.

7. Issue #63 — [Mineure][P3] Accessibilité — Agents et Applications imbriquent deux landmarks main
   https://github.com/mDevsLabs/Web/issues/63
   Périmètre : `SidebarInset` et les deux pages citées
   Hors périmètre : Ne pas réécrire toute la hiérarchie de titres (issue #64).

8. Issue #64 — [Mineure][P3] Accessibilité — les pages Support répètent un H1
   https://github.com/mDevsLabs/Web/issues/64
   Périmètre : `app/(chat)/site/support/layout.tsx`
   Hors périmètre : Ne pas réécrire les textes d’aide.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```

## Prompt m3

```text
Tu es un développeur spécialisé dans le TypeScript.

Tu travailles dans le dépôt mDevsLabs/Web, sur la branche canary (commit de référence 39df0a52). Ce lot est m3 — Hygiène documentaire et dépôt. Il contient 8 issues mineures, ni plus ni moins. Aligner la documentation et retirer les artefacts ou commentaires trompeurs. Ne pas publier de paquet, ne pas inventer une source, ne pas réécrire l’historique.

Lis le corps à jour de chaque issue avant de modifier le code. Le corps fait foi pour les garde-fous. Si un constat n’est plus reproductible sur canary, dis-le et ne le « corrige » pas par hypothèse. Interface, messages et commentaires de correctif en français. N’ajoute pas de `any` pour faire taire le compilateur. Ne traite aucune issue hors de cette liste.

Issues à traiter :

1. Issue #27 — [Mineure][P3] Dépôt — des rapports et fichiers temporaires sont versionnés
   https://github.com/mDevsLabs/Web/issues/27
   Périmètre : les fichiers cités
   Hors périmètre : Ne pas vider `artifacts/` s’il contient des fixtures référencées, sans les reloger.

2. Issue #29 — [Mineure][P3] Sécurité — le biome-ignore du layout dit seulement Required
   https://github.com/mDevsLabs/Web/issues/29
   Périmètre : `app/layout.tsx` commentaire et, si besoin, le script inline déjà présent
   Hors périmètre : Ne pas supprimer toutes les exceptions `dangerouslySetInnerHTML`.

3. Issue #40 — [Mineure][P3] Lint — dix eslint-disable sont inertes, dont une dépendance manquante
   https://github.com/mDevsLabs/Web/issues/40
   Périmètre : les dix commentaires de l’arbre racine
   Hors périmètre : Ne pas ajouter ESLint à la racine pour rendre les commentaires utiles.

4. Issue #41 — [Mineure][P2] Site — les scripts de package.json ne pointent plus au bon endroit
   https://github.com/mDevsLabs/Web/issues/41
   Périmètre : `apps/site/package.json`
   Hors périmètre : Ne pas fusionner les copies `admin.ts` (issue #16) dans ce correctif.

5. Issue #42 — [Mineure][P2] Quizzly — le rang de Gemini 3.8 Flash n’est pas sourcé
   https://github.com/mDevsLabs/Web/issues/42
   Périmètre : `apps/site/docs/news/introducing-quizzly/index.md`
   Hors périmètre : Ne pas modifier le lien « Sources officielles » ici (issue #43), sauf si la source ajoutée crée cette section.

6. Issue #43 — [Mineure][P3] Quizzly — le sommaire pointe vers une ancre absente
   https://github.com/mDevsLabs/Web/issues/43
   Périmètre : le même fichier Markdown
   Hors périmètre : Ne pas inventer de sources pour remplir la section.

7. Issue #69 — [Mineure][P3] Docs — le guide Python cite un paquet absent de PyPI
   https://github.com/mDevsLabs/Web/issues/69
   Périmètre : `apps/site/docs/documentation/api-python-sdk.md`
   Hors périmètre : Ne pas créer le paquet PyPI.

8. Issue #70 — [Mineure][P3] Docs — le guide TypeScript cite un paquet absent de npm
   https://github.com/mDevsLabs/Web/issues/70
   Périmètre : `apps/site/docs/documentation/api-typescript-sdk.md`
   Hors périmètre : Ne pas modifier la page CLI (issue #68) dans ce correctif.

Quand un correctif touche un fichier partagé par deux issues de ce lot, garde les deux critères d’acceptation. Ne marque pas une issue comme réglée si son critère n’est pas vérifié.

Analyser le code concerné puis poser des questions si nécessaire avant de procéder aux modifications.
```
