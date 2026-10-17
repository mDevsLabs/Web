# API publiques utilisées par les plugins

Ces plugins n'exigent pas de clé API. Ils effectuent uniquement des requêtes
HTTPS GET vers les domaines fixes déclarés dans `lib/plugins/shared/public-api.ts`.

> Les plugins qui **se connectent au compte d'un utilisateur** (Google, GitHub)
> ne relèvent pas de ce fichier : leur flux OAuth, leurs portées et leurs
> variables sont décrits dans [INTEGRATIONS.md](INTEGRATIONS.md).

| Plugin | Source | Configuration |
| --- | --- | --- |
| Open Food Facts | `world.openfoodfacts.org` | Déclarer `PUBLIC_API_CONTACT_EMAIL` et enregistrer l'application auprès d'Open Food Facts avant la mise en production. Les données sont contributives. |
| Open Library | `openlibrary.org` | `PUBLIC_API_CONTACT_EMAIL` facultatif mais recommandé pour identifier le client. |
| Crossref | `api.crossref.org` | `PUBLIC_API_CONTACT_EMAIL` facultatif; envoyé comme `mailto` et dans l'agent utilisateur. |
| Banque mondiale | `api.worldbank.org` | Aucune clé ni variable spécifique. |
| Jours fériés | `nagerholidays.com` | Aucune clé ni variable spécifique. |
| TVmaze | `api.tvmaze.com` | Aucune clé; les réponses attribuent explicitement TVmaze (CC BY-SA). |
| Wikidata | `www.wikidata.org` | Aucune clé; `PUBLIC_API_CONTACT_EMAIL` facultatif pour identifier le client. |
| GitLab public | `gitlab.com` | Aucune clé ni jeton; seuls les projets dont la visibilité est `public` sont lus. |
| Eurostat | `ec.europa.eu` | Aucune clé; les sorties JSON-stat sont filtrées et bornées. |
| OpenAlex | `api.openalex.org` | Aucune clé; `PUBLIC_API_CONTACT_EMAIL` facultatif pour le pool poli. |

`PUBLIC_API_CONTACT_EMAIL` est une coordonnée non secrète, par exemple
`support@example.com`; elle ne doit pas contenir de clé. Aucun secret n'est
requis pour utiliser ces services publics : un plugin de ce tableau ne lit que
des données ouvertes et ne reçoit jamais de jeton de compte.

Les outils bornent leurs entrées, la pagination et les réponses, appliquent un
délai réseau commun et refusent les redirections. Les réponses incluent des
références vers leur source.
