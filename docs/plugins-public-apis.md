# API publiques utilisées par les plugins

Ces plugins n'exigent pas de clé API. Ils effectuent uniquement des requêtes
HTTPS GET vers les domaines fixes déclarés dans `lib/plugins/shared/public-api.ts`.

| Plugin | Source | Configuration |
| --- | --- | --- |
| GitHub public | `api.github.com` | `GITHUB_TOKEN` facultatif pour relever la limite de débit; s'il est configuré, limiter le jeton aux dépôts publics en lecture, sans accès en écriture ni aux dépôts privés. |
| Open Food Facts | `world.openfoodfacts.org` | Déclarer `PUBLIC_API_CONTACT_EMAIL` et enregistrer l'application auprès d'Open Food Facts avant la mise en production. Les données sont contributives. |
| Open Library | `openlibrary.org` | `PUBLIC_API_CONTACT_EMAIL` facultatif mais recommandé pour identifier le client. |
| Crossref | `api.crossref.org` | `PUBLIC_API_CONTACT_EMAIL` facultatif; envoyé comme `mailto` et dans l'agent utilisateur. |
| Banque mondiale | `api.worldbank.org` | Aucune clé ni variable spécifique. |
| Jours fériés | `nagerholidays.com` | Aucune clé ni variable spécifique. |
| TVmaze | `api.tvmaze.com` | Aucune clé; les réponses attribuent explicitement TVmaze (CC BY-SA). |

`PUBLIC_API_CONTACT_EMAIL` est une coordonnée non secrète, par exemple
`support@example.com`; elle ne doit pas contenir de clé. `GITHUB_TOKEN` est
facultatif, ne doit jamais être exposé côté navigateur et doit se limiter à la
lecture des dépôts publics, sans droit d'écriture ni accès aux dépôts privés.
Aucun secret n'est requis pour utiliser les autres services publics.

Les outils bornent leurs entrées, la pagination et les réponses, appliquent un
délai réseau commun et refusent les redirections. Les réponses incluent des
références vers leur source.
