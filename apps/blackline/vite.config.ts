import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Chunking du jeu.
//
// POURQUOI CES RÈGLES EXISTENT
//
// Le jeu a deux audiences : le MENU (interface, ~70 Ko) et le MOTEUR (three,
// 522 Ko + les modèles du monde). Le menu doit s'afficher SANS le moteur —
// c'est la propriété que `scripts/check-bundle.mjs` vérifie, et c'est ce qui
// permet à l'hôte mAI d'afficher son interface pendant que le moteur arrive.
//
// LA RÈGLE QUI COMPTE
//
// `manualChunks` Attention : une affectation manuelle ÉCRASE le découpage
// naturel de Rollup. Un module importé DYNAMIQUEMENT et capturé par une règle
// manuelle se retrouve dans un chunk STATIQUE : le moteur est alors téléchargé
// et évalué dès l'entrée, et le contrôle du bundle échoue.
//
// C'est exactement ce qui est arrivé à la visionneuse de l'arsenal
// (`src/ui/weapon-viewer-impl.ts`) : la règle « tout `src/ui/` va dans
// `interface` » la capturait, alors qu'elle n'est chargée qu'à l'ouverture de
// l'arsenal. Elle est donc EXCLUE de la règle, et Rollup lui rend son chunk
// dynamique.
//
// `onlyExplicitManualChunks` : un module qui n'est explicitement affecté
// reste dans le découpage naturel de Rollup — c'est ce qui permet aux
// imports dynamiques de garder leur propre chunk.
export default defineConfig({
  base: './',
  build: {
    // UN SEUL point d'entrée : `src/mount.ts`.
    //
    // C'est lui que l'hôte mAI importe, par un chemin FIXE
    // (`/blackline/assets/blackline.js`), et c'est lui que charge
    // l'application autonome (`index.html`). Les deux appellent le même
    // `mountBlackline` — seul le conteneur et la racine diffèrent.
    //
    // UN point d'entrée, et non deux : Rollup fusionnerait de toute façon
    // les points d'entrée qui partagent leur code, et le chunk fusionné
    // n'exposerait qu'un seul jeu d'exports — celui que l'hôte cherche.
    target: 'es2022',
    sourcemap: false,
    // Les NOMS de fonction et de classe sont conservés : ils apparaissent
    // dans les traces d'erreur et dans le débogueur, où un nom minifié est
    // illisible. Le contrat d'intégration, lui, passe par un OBJET (voir
    // `src/mount.ts`) : ses PROPRIÉTÉS ne sont jamais renommées.
    esbuild: { keepNames: true },
    rollupOptions: {
      // DEUX points d'entrée, deux mondes.
      //
      // - `index.html` : l'application AUTONOME (Electron, Capacitor, le
      //   `index.html` du dépôt). Elle charge le jeu et le monte sur le
      //   document qu'elle possède.
      //
      // - `src/mount.ts` : le point d'entrée PUBLIC, importé par l'hôte mAI
      //   par un chemin fixe (`/blackline/assets/blackline.js`).
      //
      // Les deux partagent le même code de montage (`src/entry.ts`) :
      // l'application autonome et l'hôte ne font QUE la même chose, avec un
      // conteneur et une racine différents.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mount: resolve(import.meta.dirname, 'src/mount.ts'),
      },
      output: {
        onlyExplicitManualChunks: true,
        // Le contrat d'intégration doit SURVIVRE au build.
        //
        // Rollup renomme les exports d'un chunk d'entrée, et `strict` expose
        // le chunk tel quel — SANS les exports du point d'entrée, c'est-à-dire
        // sans le contrat. `allow-extension` les conserve.
        //
        // L'hôte mAI cherche `window.blackline.mount` : sans cela, le jeu ne
        // se monterait pas — et sans le moindre message, puisque le
        // chargement du module réussit.
        preserveEntrySignatures: 'allow-extension',
        // Le chunk d'ENTRÉE PUBLIC porte un nom FIXE. L'hôte mAI l'insère
        // sans lire de manifeste : un nom changeant à chaque build
        // l'obligerait à faire un aller-retour avant de charger le jeu, et le
        // navigateur ne pourrait pas le mettre en cache.
        //
        // L'entrée de l'APPLICATION AUTONOME (`main.js`) garde son HACHAGE :
        // elle est servie en `immutable` (vercel.json), et un nom stable sur
        // un contenu changeant serait un cache trompeur — l'ancienne version
        // serait servie indéfiniment.
        //
        // Les AUTRES chunks gardent leur hachage : ils sont chargés à la
        // demande (moteur, pages arsenal/boutique/guide), et un nom immuable
        // sur un contenu changeant serait un cache trompeur.
        entryFileNames: (chunk) =>
          chunk.name === 'mount' ? 'assets/blackline.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // Modules chargés à la demande : jamais dans un chunk statique.
          //
          // `src/ui/weapon-viewer-impl.ts` est la visionneuse 3D de l'arsenal :
          // elle n'est chargée qu'à l'ouverture de l'arsenal. Capturée par la
          // règle « tout `src/ui/` va dans `interface` », elle tirait le
          // moteur dans le chunk d'entrée — et le contrôle du bundle
          // échouait.
          if (id.endsWith('/src/ui/weapon-viewer-impl.ts')) return undefined;
          if (id.includes('node_modules/three/examples')) return 'three-effects';
          if (id.includes('node_modules/three')) return 'three-core';
          if (
            id.includes('/src/world/') ||
            id.endsWith('/src/architecture.ts')
          )
            return 'world-models';
          if (
            id.endsWith('/src/skins.ts') ||
            id.endsWith('/src/surfaces.ts') ||
            id.endsWith('/src/viewmodel.ts')
          )
            return 'world-models';
          if (
            id.includes('/src/render/') ||
            id.endsWith('/src/world.ts') ||
            id.endsWith('/src/scenery.ts')
          )
            return 'world-models';
          if (id.endsWith('/src/ui/arsenal.ts')) return 'page-arsenal';
          if (id.endsWith('/src/ui/pages/shop.ts')) return 'page-shop';
          if (id.endsWith('/src/ui/pages/guide.ts')) return 'page-guide';
          if (id.includes('/src/ui/')) return 'interface';
        },
      },
    },
  },
});
