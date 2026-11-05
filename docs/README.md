# Documentation mAI

Sept espaces, classés par partie du dépôt. Les règles transversales — double
runtime, forfaits, migrations, conventions de code — sont dans
[AGENTS.md](../AGENTS.md), à la racine. **Une page documentaire qui diverge du
code a tort** : vérifiez la source avant d'appliquer une instruction.

| Espace | Ce qu'il couvre | Entrée |
| --- | --- | --- |
| `1-web` | Application Next.js, backend Hono, Agent, base, sécurité, intégrations OAuth | [mAI Web](1-web/README.md) |
| `2-vibe` | Source Vite de Vibe et son port sous `/vibe` | [Vibe](2-vibe/README.md) |
| `3-wakies` | Référence OpenMuse et le port sous `/wakies` | [Wakies](3-wakies/README.md) |
| `4-coder` | Application Electron de développement | [mAI Coder](4-coder/README.md) |
| `5-site` | Site officiel autonome et son port sous `/site` | [Site officiel](5-site/README.md) |
| `6-blackline` | FPS Three.js monté sous `/blackline` | [Blackline](6-blackline/README.md) |

Chaque espace porte son propre `AGENTS.md` : ce sont les règles impératives du
domaine, à lire **avant** toute modification dans le dossier correspondant.

## Dossiers et fichiers hors section

- [`CLEANUP.md`](CLEANUP.md), [`CLEANUP_INVENTORY.json`](CLEANUP_INVENTORY.json),
  [`CLEANUP_IMAGES.json`](CLEANUP_IMAGES.json) — inventaire du retrait des
  services autonomes OpenMuse et de ce qui doit rester protégé.
- [`CORRECTIONS_UI_NATIVE.md`](CORRECTIONS_UI_NATIVE.md) et
  `CORRECTIONS_UI_PREVIEW_2/3/4.md` — journal des corrections d'interface native.
- Les médias (captures, démonstrations) vivent à côté du guide qui les cite, pas
  dans un dépôt commun.

## Précaution de lecture

Cette documentation décrit des runtimes qui ne se recouvrent pas : le build Next
racine, le backend Val Town déployé à part, les applications de `apps/` (qui ne
sont pas des membres du workspace pnpm) et les paquets de `packages/`. Une
commande ou une règle prise dans le mauvais projet échoue silencieusement — ou
pire, s'applique au mauvais arbre. Vérifiez le chemin avant d'exécuter.
