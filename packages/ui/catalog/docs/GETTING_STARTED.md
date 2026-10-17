# Installation et première intégration

Les deux packages sont distribués avec sources, ESM, CommonJS, déclarations TypeScript, catalogues et guides. Installer un package ne requiert pas de régénérer les 1 212 composants ou 2 600 icônes. Le monorepo sert à développer, générer et parcourir la bibliothèque.

## 1. Choisir la méthode d’installation

| Besoin | Méthode | Précondition |
| --- | --- | --- |
| Utiliser les ZIP individuels | Extraire puis npm install --install-links | Les dossiers extraits contiennent package.json et dist |
| Installer une copie npm locale autonome | Installer les fichiers .tgz | Tarballs présents dans artifacts du monorepo |
| Développer la bibliothèque | npm ci depuis la racine du monorepo | Node 22.12+, npm 10+, lockfile fourni |
| Installer par nom depuis npm | npm install @mdevs/ui @mdevs/icons | Une publication séparée a réellement été effectuée |

### Dossiers ZIP

Depuis le projet consommateur, après extraction :

```sh
npm install --install-links /chemin/mdevs-ui /chemin/mdevs-icons
```

`--install-links` permet d’empaqueter/copier les dossiers locaux et de résoudre leurs dépendances dans le projet hôte. Il évite de dépendre d’un simple lien vers des dossiers externes dont les dépendances n’auraient pas été installées. Conserver le contenu complet de chaque package, notamment `dist`, `catalog`, `AGENTS.md`, `llms.txt` et les licences.

### Tarballs

```sh
npm install /chemin/mdevs-ui-0.2.0.tgz /chemin/mdevs-icons-0.2.0.tgz
```

Les tarballs sont produits avec `npm run pack:packages`. L’installation des dossiers ou tarballs peut contacter npm pour résoudre React, ReactDOM, Radix et leurs dépendances ; la présence d’un ZIP ne garantit pas une installation entièrement hors ligne.

### Peers et versions

Les deux packages déclarent React `^18.3.1 || ^19.0.0`. UI déclare aussi ReactDOM dans cette plage ; les icônes utilisent seulement React. Garder React et ReactDOM compatibles dans le projet consommateur. Pour un projet React existant, conserver la version prise en charge qu’il utilise au lieu de forcer une mise à niveau.

Le monorepo exige Node 22.12+ ; les package.json des dépendances déclarent Node 18+. Python 3.10+ et les devDependencies du dépôt sont requis pour régénérer, pas pour afficher un composant déjà compilé.

## 2. Charger le CSS au bon endroit

Importer `@mdevs/ui/styles.css` une seule fois à l’entrée globale du projet. Les icônes ne nécessitent pas ce fichier pour dessiner un SVG. Le CSS de UI est sous `@layer mdevs` ; un style non stratifié de l’application peut le remplacer.

Le package ne définit pas un reset de `html` et `body` pour tout le site. L’application reste responsable de son fond, de son conteneur racine et de sa structure globale. Exemple de fond hôte :

```css
.application-shell {
  background: var(--md-bg);
  min-height: 100dvh;
}
```

Appliquer cette classe dans le périmètre de ThemeProvider permet de lire ses tokens. Un élément situé à l’extérieur d’un ThemeProvider local n’hérite pas de ses variables.

## 3. Exemple React complet

```tsx
import {createRoot} from 'react-dom/client';
import {Button, GlassCard, ThemeProvider} from '@mdevs/ui';
import {ArrowRightIcon} from '@mdevs/icons';
import '@mdevs/ui/styles.css';

function App() {
  return <ThemeProvider theme="system">
    <main className="application-shell">
      <GlassCard title="Votre espace" description="Une interface claire et des reflets discrets.">
        <Button onClick={() => console.log('Continuer')}>
          Continuer <ArrowRightIcon size="1em"/>
        </Button>
      </GlassCard>
    </main>
  </ThemeProvider>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');
createRoot(root).render(<App/>);
```

Cet exemple suppose une page contenant `<div id="root"></div>`, un bundler compatible JSX/TypeScript et le CSS hôte ci-dessus. Le handler de démonstration est local ; remplacer `console.log` par l’action de l’application.

Pour lancer le catalogue livré :

```sh
npm ci
npm run build
npm run dev
```

Pour choisir un autre port, transmettre l’argument au workspace qui exécute Vite :

```sh
npm run dev --workspace @mdevs/catalog -- --port 5174
```

Le script racine `dev` appelle un autre script npm ; cette forme directe évite de transformer accidentellement le port en argument de dossier pour Vite.

## 4. Imports ciblés et types

```tsx
import {Button} from '@mdevs/ui/primitives/button';
import {InvoiceForm} from '@mdevs/ui/invoice/invoice-form';
import type {Invoice} from '@mdevs/ui/invoice';
import {SearchIcon} from '@mdevs/icons/controls/search';
```

Les imports racine sont aussi publics. Le bundler ESM peut éliminer les exports inutilisés. Une entrée racine CommonJS peut charger son graphe entier ; pour ce cas, privilégier un sous-chemin ciblé. Le catalogue interactif charge un inventaire important pour explorer toute la bibliothèque ; sa taille ne mesure pas celle d’un bouton utilisé isolément.

Lire `catalog/manifest.json` pour choisir le bon nom. Les modèles métier sont exportés par le domaine ; une sous-entrée de composant n’est pas nécessairement une entrée de types commune. Le `src` inclus sert à l’inspection ; les applications importent les chemins définis dans `exports`.

## 5. Next.js App Router

Importer le CSS depuis le layout global :

```tsx
// app/layout.tsx
import type {ReactNode} from 'react';
import '@mdevs/ui/styles.css';

export default function RootLayout({children}: {children: ReactNode}) {
  return <html lang="fr"><body>{children}</body></html>;
}
```

Placer état et handlers dans un composant client :

```tsx
// app/settings.tsx
'use client';
import {useState} from 'react';
import {Switch, ThemeProvider} from '@mdevs/ui';

export function Settings() {
  const [enabled, setEnabled] = useState(true);
  return <ThemeProvider theme="system">
    <Switch label="Notifications" checked={enabled} onCheckedChange={setEnabled}/>
  </ThemeProvider>;
}
```

Les modules distribués portent `"use client"`. Le rendu React serveur classique fonctionne, mais cela ne les transforme pas en Server Components. À une frontière serveur/client, transmettre des valeurs sérialisables et définir les callbacks dans la couche client concernée.

Ne pas lire `window`, `localStorage` ou un media query pendant le rendu serveur. ThemeProvider utilise CSS pour `system` et ne persiste pas le choix. La politique de mémorisation d’un thème appartient à l’application.

## 6. Thèmes, portails et tokens

```tsx
import type {CSSProperties} from 'react';
import {ThemeProvider} from '@mdevs/ui';

const tokens = {
  '--md-blur': '12px',
  '--md-input-radius': '10px',
  '--md-accent-ink': '#ffffff',
} as CSSProperties;

<ThemeProvider theme="dark" accent="#4f46e5" radius="18px" style={tokens}>
  <div>Contenu de l’application</div>
</ThemeProvider>
```

`accent` et `radius` remplacent les tokens homonymes présents dans `style`. Le contexte de ThemeProvider recopie les seules variables CSS `--*` vers les portails ; un `padding` ou une largeur de layout ne sont pas propagés. Une variable définie uniquement par un ancêtre externe doit aussi être passée dans `style` si l’overlay en a besoin.

Un ThemeProvider imbriqué prend ses propres valeurs par défaut. Définir explicitement le thème/accent souhaité pour cette zone. Sans provider, les tokens globaux permettent d’utiliser une primitive, mais le périmètre explicite facilite la personnalisation et la cohérence des portails.

## 7. Connecter le premier domaine métier

Le guide [FORM_PATTERNS](FORM_PATTERNS.md) traite la sauvegarde, les erreurs et les changements d’enregistrement ; [UI_PLAYBOOK](UI_PLAYBOOK.md) compare les familles. Pour un premier écran :

1. Choisir un domaine dans le manifeste.
2. Lire son `types.ts` et son `schema.json`.
3. Créer ou recevoir des données réellement conformes.
4. Raccorder les callbacks au parent.
5. Charger le CSS et donner aux régions/champs leurs libellés.

Une valeur initiale de formulaire est utilisée au montage. Un filtre et un tableau ne partagent pas d’état implicitement. Les exemples maintenus dans `examples/docs/` montrent ces flux et sont inclus dans le typecheck du dépôt.

## 8. SVG et appareils

```tsx
import {SearchIcon} from '@mdevs/icons/controls/search';

<SearchIcon size={24}/>
<SearchIcon size="1.25rem"/>
<SearchIcon width="100%" height="100%" style={{maxWidth:48}}/>
```

Le `viewBox` par défaut reste 24 × 24 et l’image est vectorielle. `size` n’est pas une zone de clic ; une action tactile doit utiliser un bouton accessible. Une taille en pourcentage a besoin d’un conteneur avec dimensions définies. Voir [ICONS](ICONS.md) pour les noms accessibles et priorités de props.

## 9. Premier contrôle dans le projet hôte

- Typecheck du projet consommateur, avec les imports réellement installés.
- CSS chargé et absence d’erreur de résolution d’exports.
- Réactivité du contrôle : valeur et callback évoluent ensemble.
- Modes clair/sombre, fond suffisamment lisible et fallback opaque.
- Parcours Tab/Entrée/Échap des contrôles utilisés.
- Largeur mobile et défilement local des tables longues.
- Pour une modale, focus à l’ouverture et à la fermeture.

En cas d’échec, suivre [TROUBLESHOOTING](TROUBLESHOOTING.md). Les vérifications de la livraison n’exonèrent pas l’application de tester sa composition et ses données.

## Police locale et icônes monochromes

L’import styles.css charge Inter variable 4.1 normal 100–900 via une URL WOFF2 relative. Le fichier est livré dans dist/fonts avec métadonnées et licence SIL OFL. Vérifier la requête dans le bundler et la politique font-src du projet ; aucune URL Google Fonts/CDN n’est nécessaire. Inter est la police UI par défaut, avec swap et fallback système.

Les icônes 0.2.0 utilisent un trait 1,5 px et leur propre couleur noire/blanche, pilotée par --md-icon-color dans ThemeProvider. Sans UI, la bascule système dépend du support light-dark ; color="#000" fournit un repli. Pour hériter volontairement de la couleur d’un bouton, fournir style={{color:'currentColor'}}. [STYLE.md](STYLE.md) détaille les règles et les assets.
