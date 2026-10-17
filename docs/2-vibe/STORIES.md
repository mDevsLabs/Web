# Stories Vibe — publications éphémères de 24 h

Guide de maintenance des Stories : ce qui est stocké, où la limite s'applique, et
quels contrats ne doivent pas être « unifiés » par erreur. Règles générales du
portage : [AGENTS.md](./AGENTS.md) et [INTEGRATION.md](./INTEGRATION.md).

---

## 1. Ce que c'est

Une story est une **photo ou une vidéo de 50 Mo au plus**, visible 24 h dans un
rail au-dessus du fil et autour de la photo de profil de son auteur, puis rangée
dans une **archive** sur le profil. Elle se consulte en plein écran, média par
média, avec légende, réactions (❤️ 🔥 😮) et réponse en message privé.

| Forfait | Stories par jour |
|---|---|
| Free | 1 |
| Plus | 5 |
| Pro | 10 |
| Max | illimité |

Trois états, tous **dérivés** — aucune colonne « statut » :

| État | Prédicat |
|---|---|
| live | `deleted_at IS NULL AND archived_at IS NULL AND expires_at > NOW()` |
| archivée | `deleted_at IS NULL AND (archived_at IS NOT NULL OR expires_at <= NOW())` |
| supprimée | `deleted_at IS NOT NULL` |

D'où : **aucun cron**. L'expiration est un filtre de lecture. La suppression reste
un soft-delete, donc réversible sans toucher au schéma.

---

## 2. Où est le code

| Couche | Emplacement |
|---|---|
| DDL (création au chargement) | `vibe-stories.ts` → `ensureStoriesTables()` |
| DDL (base de l'app mobile) | `apps/vibe/lib/db/migrations/026_vibe_stories.sql` |
| Routes et logique métier | `vibe-stories.ts` (copie jumelle dans `scripts/`) |
| Limites par forfait | `TIER_DAILY_STORY_LIMITS` dans `config.ts` |
| Client (lecteur, rail, anneau, compositeur) | `components/vibe/stories/` |
| Méthodes API | `ApiService` dans `lib/vibe/services/api.ts` |
| Miroir d'affichage | `lib/vibe/services/tierLimits.ts` |
| Styles | `apps/vibe/src/index.css` (classe `.vibe-story-ring`) |
| Verrous | `tests/unit/vibe-stories-*.test.ts` |

### Deux DDL, un seul contrat

`ensureStoriesTables()` et la migration `026` décrivent **la même structure**. Le
premier équipe la base au chargement du backend, la seconde équipe celle de l'app
mobile via `apps/vibe/lib/db/migrator.ts`. Une divergence ne se voit que sur
l'environnement où un seul des deux a tourné — d'où
`tests/unit/vibe-stories-schema.test.ts`, qui compare les deux.

> ⚠️ Le migrateur Vibe **vérifie les sommes de contrôle** : une migration déjà
> appliquée ne doit plus être modifiée. Après déploiement de `026`, un changement
> de structure passe par une migration `027`, jamais par une retouche de `026`.

---

## 3. Deux plafonds média, et ils vont en sens inverse

C'est le point le plus facile à casser. **Ne pas les unifier.**

| Quoi | Valeur | Autorité |
|---|---|---|
| Envoi d'un média (`POST /v1/upload-file`) | 50 Mo en Free, **1 Go** en Plus/Pro/Max | `MEDIA_UPLOAD_LIMITS_BYTES` (`config.ts`), appliqué par `handleUploadFile` |
| Média d'une story | **50 Mo, quel que soit le forfait** | `STORY_MEDIA_MAX_BYTES` (`vibe-stories.ts`) |

Comme l'upload accepte désormais 1 Go pour les payants, **passer par
`/upload-file` ne garantit plus la borne de la story**. `POST /v1/stories` doit donc
recontrôler, et le fait de deux manières :

1. **Taille** : un `HEAD` signé (`buildS3Client` + `findStorageNodeForRecord`) lit
   le `Content-Length` de l'objet. Le `file_size_bytes` fourni par le navigateur est
   falsifiable et n'est jamais l'autorité. Un objet injoignable est **refusé**, pas
   accepté « en confiance ».
2. **Origine** : seules les origines du pool configuré (`getStorageNodes()`) sont
   acceptées, et seulement dans le namespace `uploads/`. Sans cela, un compte
   publierait une URL externe que le navigateur d'un autre chargerait comme
   `<img>`/`<video>` dans son fil — contenu illégitime servi depuis un profil, et
   fuite d'IP du spectateur vers l'hôte choisi. La comparaison porte sur
   `URL.origin`, jamais sur un préfixe de chaîne (`s3.z1storage.com.evil.tld`
   passe un `startsWith`).

---

## 4. Le quota se renouvelle à minuit, heure de Paris

Contrairement au quota d'images, qui compare sur `CURRENT_DATE` — une date **UTC**.

Conséquence d'implémentation : la base ne doit pas poser la date. `usage_date` est
calculé dans le module (`getStoryDayKey()`, via `Intl` en `Europe/Paris`, locale
`fr-CA` pour obtenir l'ordre ISO) puis passé explicitement à l'upsert. Écrire
`usage_date = CURRENT_DATE` ferait basculer le compteur à 1 h ou 2 h du matin pour
un francophone. La **DST est absorbée par `Intl`** : surtout, ne pas la recalculer à
la main par une soustraction d'écart UTC.

Le 429 renvoie `resetsInMs` (temps restant avant minuit parisien) pour un compte à
rebours d'affichage, et le message dit « Réinitialisation à minuit, heure de Paris. »

**Cette divergence avec le quota images est délibérée.** Un nettoyage qui
« réaligne » les deux sur UTC a perdu.

### Forme des erreurs

Vibe a sa propre convention, différente de celle de l'API mAI : `error` est une
**chaîne**, les champs machine (`code`, `limit`, `used`, `type`, `resetsInMs`) sont
**à plat**. `ApiService.executeRequest` fabrique `new Error(errJson.error)` ;
imbriquer un objet y produirait un « [object Object] » à l'écran.

---

## 5. L'anneau autour de l'avatar

`ProfileAvatar` n'a **aucune prop d'anneau** et compte une vingtaine de lieux de
rendu, avec un jumeau dans `apps/vibe/src` aux imports différents. Ajouter une prop
aurait forcé à éditer les deux arbres. D'où deux coques externes :

- `StoryRing` — enveloppe le composant quand on construit du neuf (rail, listes).
- `ProfileStoryRing` — se **superpose** à un avatar déjà en place (en-tête de
  profil), parce que cet avatar porte un overlay « Changer » calé sur son
  conteneur : l'envelopper aurait élargi la zone de survol de ce bouton.

États portés par des attributs `data-*`, jamais par des classes conditionnelles :
`data-live="false"` = pas de story (avatar nu), `data-seen="false"` = dégradé,
`data-seen="true"` = gris. Une seule story inédite suffit à maintenir l'anneau actif.

Sites habillés : le fil (`feed/PostCard.tsx`, avatar de carte), l'en-tête de profil
(`pages/ProfilePage.tsx`) et la barre latérale (`layout/Sidebar.tsx`, avatar de
soi, en variante `compact` car l'avatar y fait 32 px).

**L'onglet « moi » de la barre d'onglets mobile n'a volontairement pas d'anneau.**
C'est un `Link` vers le profil : y loger un bouton serait un élément interactif
imbriqué dans un lien (balisage invalide) et détournerait la navigation. Le parcours
mobile reste celui de Snapchat et d'Instagram — onglet → profil → anneau du profil.
Ne pas « compléter » ce site lors d'une revue.

Le dégradé conique vit dans `apps/vibe/src/index.css` (jamais en classes
utilitaires) pour rester ajustable en un endroit. **Après tout changement de style :
`node scripts/build-vibe-css.mjs`.** Le script sort en code 1 si un sélecteur
échappe à `.vibe-root` — c'est la garde, pas un bug.

---

## 6. Le lecteur

`StoryViewer.tsx` reprend la grammaire de `feed/MediaLightbox.tsx` (barres
segmentées, tap gauche/droite, swipe à 60 px, `Escape`, haptique) avec deux écarts
volontaires :

- **Le portail se rend dans `.vibe-root`, pas dans `document.body`.** MediaLightbox
  portale sur `body` et sort donc du conteneur : il perd les tokens de thème. Un
  lecteur de stories est un lecteur de thème, il doit rester dans `.vibe-root`.
  À vérifier visuellement : un ancêtre avec `transform` ou `filter` crée un
  containing block qui peut casser le `fixed`.
- **Vidéo muette et `playsInline`** : sans `muted`, l'autoplay est refusé par le
  navigateur. Les vidéos de post sont interactives, une story ne l'est pas.

Réponses : envoyées par le flux **DM existant** (`ApiService.sendMessage`), aucune
route story n'est nécessaire. Vues : `POST /:id/view` est idempotente (clé composée
`story_id, viewer_id`), donc revoir une story ne gonfle pas le compteur. Liste des
vues : réservée à l'auteur, vérifiée **avant** la lecture (`403` sinon).

**Hors périmètre v1** : les stickers et le dessin libre (canvas) — la tranche 2 de
l'éditeur. Le temps réel des vues et réactions non plus : `EVENT_TYPES` du service
temps réel n'a aucun type `story_*`, et le serveur détecte notifications et MP par
lecture de tables. Les vues se rafraîchissent par invalidation du cache
(`invalidateCache("/v1/stories")`).

---

## 7. Le rail n'est pas pré-hydraté

Les pages `/vibe/**` sont générées et acceptent **une seule** graine serveur par
route (`scripts/build-vibe-routes.mjs`). Celle du fil est prise par
`readers.feed`. Le rail appelle donc `GET /v1/stories/tray`, servi par le cache TTL
d'ApiService (15 s). Ne pas ajouter une clé `stories` au registre d'hydratation :
sans page qui la consomme, ce serait du code mort, et la glisser dans le seed du
feed en changerait la forme pour `useInfiniteFeed`.

---

## 8. Avant de déployer

1. `deno check vibe-stories.ts config.ts storage.ts` — un `pnpm build` réussi ne
   dit **rien** du backend, qui est hors `tsconfig.json`.
2. Vérifier l'identité byte à byte des copies (`vibe-stories.ts`, `config.ts`,
   `storage.ts`, `vibe.ts` avec leur pendant dans `scripts/`) —
   `tests/unit/vibe-stories-routes.test.ts` le verrouille.
3. Les URLs publiques des buckets doivent être dans `img-src` **et** `media-src` de
   la CSP (`next.config.ts`), sinon les stories se chargent du CDN mais sont
   bloquées. Déployer d'abord avec `CSP_REPORT_ONLY=1` et lire les rapports.
4. `node scripts/audit-backend.mjs` régénère l'inventaire des routes.

## 9. Ce qui reste ouvert

- **Mémoire de l'isolate** : `handleUploadFile` lit le fichier entier en mémoire
  (`await file.arrayBuffer()`) avant le `PUT`, et `uploadWithFallback` peut rejouer
  le même corps sur 10 buckets. Un envoi de 1 Go est donc 1 Go de tampon, revu
  jusqu'à dix fois. Le refus de taille précède toujours la lecture du corps, et la
  valeur vit dans une seule table : baisser le plafond payant à 256 Mo est un
  changement de deux lignes, à faire si l'isolate ne suit pas.
- **Comptabilité** : `/upload-file` n'inscrit rien dans `cloud_storage_usage`. Un
  envoi de 1 Go par un compte payant n'est donc **pas** décompté de son quota de
  stockage. Soit le décompter, soit l'assumer par écrit — pas par omission.
- Stickers et dessin libre (tranche 2).
- Temps réel des vues et réactions.
