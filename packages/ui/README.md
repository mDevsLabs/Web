# @mdevs/ui

Bibliothèque React et TypeScript de composants d’interface. La version 0.2.0 contient 132 primitives et 1 080 composants métier répartis en 108 domaines. Les composants métier réutilisent dix familles d’affichage et exposent des modèles typés.

~~~tsx
import {ThemeProvider, Button, GlassCard} from "@mdevs/ui";
import "@mdevs/ui/styles.css";

<ThemeProvider theme="system">
  <GlassCard title="Bienvenue">
    <Button>Continuer</Button>
  </GlassCard>
</ThemeProvider>
~~~

## Installation et style

React et React DOM 18.3 ou 19 sont des peer dependencies ; Radix est une dépendance du package. Les sous-chemins publics et les fichiers inclus sont déclarés dans package.json. Importez styles.css une seule fois au niveau global de l’application.

Le ThemeProvider propose les thèmes clair, sombre et système. Les valeurs, l’état métier, l’authentification, les appels réseau et la persistance restent à la charge du projet hôte. Les composants ne remplacent pas une validation ou une autorisation côté serveur.

## Référence

- [Manifeste des exports](catalog/manifest.json)
- [Index de la documentation](catalog/docs/README.md)
- [Guides par domaine](catalog/)
- [Règles d’intégration](AGENTS.md)
- [Tokens et conventions visuelles](STYLE.md)

Les licences sont dans LICENSE et LICENSE-INTER.txt. Vérifiez le manifeste et les déclarations TypeScript avant de supposer un export ou un contrat de props.
