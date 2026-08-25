# Plan d'implémentation — mAI Web

Corrections : bug quota Studio Images, renommages, emojis, boutons retour, mobile, suppression vue API.

---

## 1. Bug quota Studio Images ("0/3" au lieu du tier réel)

**Cause racine** : `app/(chat)/images/page.tsx` retombe sur un fallback codé en dur `3`
(lignes 205, 397) quand `/api/images/usage` échoue, alors que la page Paramètres
utilise le tier réel (Plus=5, Pro=10, Max=20). Deux sources de données séparées
(`/api/images/usage` vs `/api/settings`) + fraîcheur différente (polling 30s vs fetch unique).

### Fichiers à créer
- **`hooks/use-settings.ts`** (nouveau) :
  - Type `SettingsPayload` (user, aiUsage, imagesUsage, cloudUsage)
  - `useSettings(options?)` : SWR clé unique **`/api/settings`** → cache partagé avec la page Paramètres et le bandeau de quota de `multimodal-input.tsx` (même clé déjà en place) → cohérence garantie par construction
  - `resolveImagesUsage(data)` : logique de résolution centralisée — tier = `imagesUsage.plan || user.tier || "Free"` ; fallback `getTierImageDailyLimit(tier)` ; retourne `{ dailyLimit, plan, resetAt, usedToday }`

### Fichiers à modifier
- **`lib/constants.ts`** : ajouter `getTierImageDailyLimit(tier)` (miroir de `config.ts:40-52`, non importable car Deno/Val Town)
- **`app/(chat)/images/page.tsx`** :
  - Remplacer `useSWR("/api/images/usage")` par `useSettings({ refreshInterval: 30_000, revalidateOnFocus: true })` + `resolveImagesUsage`
  - Supprimer les fallbacks `?? 3` (:397) et `return 3` (:205) ; badge = `{usedToday} / {dailyLimit}` issus de `resolveImagesUsage`
  - Adapter `handleGenerate` (toast :259, preflight :269-275) aux nouvelles variables ; `mutateUsage()` invalide la clé partagée
- **`app/(chat)/settings/page.tsx`** :
  - Refactorer le fetch manuel (`fetchSettings` useEffect :330-360) en `useSWR("/api/settings")` via le hook partagé (sans polling, revalidateOnFocus)
  - Sync des champs du formulaire (username/email/phone/newsletter/notifyLimits) **une seule fois** au premier chargement (ref `initialSyncDone`) pour ne pas écraser la saisie utilisateur lors des revalidations
  - `profile`/`aiUsage`/`imagesUsage`/`cloudUsage` dérivés de `settingsData` ; avatar upload → mise à jour optimiste via `mutate`
  - Carte Images (:1130-1186) : remplacer le ternaire tier local (:1151-1158) par `resolveImagesUsage` (même fonction que Studio → valeurs identiques à coup sûr)
- **`app/(chat)/api/settings/route.ts`** : normalisation `imagesUsage` (:76-83) — `Number(x || 3)` écrase un `0` légitime → préserver `null`/`undefined` et laisser le fallback tier côté client ; supprimer `apiUsage`, `totalApiRequests` (:37-42), `tierLimitsApi` (:44-52)

## 2. Renommages (texte uniquement, routes inchangées)

| Fichier | Avant | Après |
|---|---|---|
| `components/chat/app-sidebar.tsx` :280-284 | Bibliothèque | Stockage |
| `components/chat/app-sidebar.tsx` :306-310 | Studio Images | Images |
| `components/chat/chat-header.tsx` :181 | Bibliothèque | Stockage |
| `components/chat/sidebar-user-nav.tsx` :128 | Bibliothèque de fichiers | Stockage de fichiers |
| `components/chat/cloud-file-picker-dialog.tsx` :113/:156 | Bibliothèque Cloud | Stockage Cloud |
| `components/chat/slash-commands.tsx` :99 | Ouvrir la Bibliothèque Cloud | Ouvrir le Stockage (garder alias /stockage, /library) |
| `app/(chat)/library/page.tsx` :654 | Bibliothèque de fichiers | Stockage de fichiers |
| `app/(chat)/images/page.tsx` :378 | Studio Images mAI | Images mAI |
| `app/(chat)/settings/page.tsx` :1139 | Générations d'Images (Studio mAI) | Générations d'Images |

Textes annexes : "depuis le studio" (images/page.tsx ~:897), "Éditer dans le studio" (~:1024) → formulations sans "studio".

## 3. Emojis UI → icônes Lucide

- `components/chat/multimodal-input.tsx` : 👻 (:449, :1520, :1538) → icône `Ghost` dans les éléments UI / texte sobre ; ⚠️ toast (:311) et bannière quota (:1079) → `TriangleAlert`
- `components/chat/slash-commands.tsx` :62 : 👻 → icône `Ghost`
- `hooks/use-active-chat.tsx` :145/:172 : retirer 👻 des titres/messages
- `components/chat/project-icon.tsx` : **inchangé** (les emojis sont des clés de lookup legacy, l'affichage utilise déjà Lucide)
- `app/(chat)/api/chat/route.ts` :341/:359 : **inchangé** (prompts système, pas UI)

Scan regex emoji complet sur app/ components/ hooks/ pour ratisser large.

## 4. Boutons retour intelligents

- Créer **`components/chat/page-back-button.tsx`** : bouton tactile ≥40px, `ArrowLeftIcon`, label "Retour" (masqué < sm), comportement : `router.back()` si `window.history.state?.idx > 0`, sinon `router.push("/")`
- Intégrer dans les en-têtes de :
  - `app/(chat)/images/page.tsx` (header :370-416)
  - `app/(chat)/library/page.tsx` (header :644-677)
  - `app/(chat)/projects/page.tsx` (header ~:574)
  - `app/(chat)/settings/page.tsx` (au-dessus du h1 :538)

## 5. Mobile (améliorations standards)

Sur les 4 pages concernées :
- En-têtes : sous-titres `hidden sm:block`, titres `truncate`/`line-clamp`, badges quota repliés proprement (`flex-wrap`, tailles réduites xs)
- Paddings : `px-4 py-3 sm:px-6 sm:py-4` ; onglets horizontalement scrollables (`overflow-x-auto`)
- Grilles/galeries : vérifier 1 colonne mobile (déjà `grid-cols-1 sm:…` sur /images)
- Zones tactiles ≥ 40px sur boutons d'action des cartes (galerie images : p-2 au lieu de p-1)

## 6. Suppression vue Usage API

- `app/(chat)/settings/page.tsx` : carte :1238-1285, type `APIUsageData` :80-84, state :193, setter :349, mémo `apiPercent` :528-533, sous-titre header :542-545 ("consommation IA et API" → "consommation IA"), import `Code2Icon` si inutilisé ailleurs
- `app/(chat)/api/settings/route.ts` : bloc `apiUsage` :61-65 (+ cf. §1)

*(Aucun autre consommateur de `apiUsage` dans le codebase — vérifié.)*

## 7. Vérification

- `pnpm run check` (ultracite/Biome)
- `npx tsc --noEmit`
- Revue manuelle des diffs
