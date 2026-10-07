# Port Vibe dans mAI Web

Ce dossier contient l’application Vibe adaptée à l’hôte Next.js. La source autonome est dans [apps/vibe](../../apps/vibe/README.md) ; les règles du port et son architecture sont dans [docs/2-vibe](../../docs/2-vibe/README.md).

## Sources et sorties générées

- apps/vibe/src/index.css est la source de components/vibe/vibe.css. Régénérez avec node scripts/build-vibe-css.mjs.
- La table ROUTES de scripts/build-vibe-routes.mjs produit les pages app/(chat)/vibe/.
- components/vibe/pages/vibe-routes.tsx contient les adaptateurs et reste une source éditable.

Ne modifiez pas manuellement le CSS ni les pages générées. Effectuez les changements dans leur source puis relancez le script correspondant.

## Contrats du port

- Le thème et les styles restent sous .vibe-root.
- Pour les classes liées au thème, utilisez vibe-dark: ; la variante dark: suit le thème de l’hôte.
- Les liens internes passent par components/vibe/router.tsx.
- Le comportement, l’authentification et les API intégrés sont décrits dans [le guide d’intégration](../../docs/2-vibe/INTEGRATION.md).
