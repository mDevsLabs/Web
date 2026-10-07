# Port Wakies dans mAI Web

Ce dossier contient l’interface portée depuis [apps/wakies](../../apps/wakies/README.md). La version intégrée utilise les services de l’hôte ; les possibilités de l’application source ne sont pas toutes disponibles dans /wakies.

## Sources générées

Les sources CSS sont apps/wakies/src/client/style.css et editor.css. Le script node scripts/build-wakies-css.mjs produit components/wakies/wakies.css et wakies-editor.css. Corrigez les sources puis relancez le script ; ne modifiez pas les sorties générées.

## Contrats du port

- Les styles restent sous .wakies-root et l’application vit dans son groupe de routes dédié.
- Wakies utilise la session mAI, ses quotas et les tables PostgreSQL Wakies. Les requêtes doivent isoler chaque utilisateur par userId.
- Le chat passe par l’API de l’hôte et son moteur Markdown Streamdown.
- Le vocabulaire de l’hôte est conversation/conversationId.
- Les liens, services disponibles et limites sont documentés dans [l’intégration](../../docs/3-wakies/INTEGRATION.md) et les [règles de développement](../../docs/3-wakies/AGENTS.md).
