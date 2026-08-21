# mAI Desktop

Application desktop Electron – simple conteneur pour https://mai-officiel.vercel.app

## Structure

```
apps/desktop/
  src/
    main.ts      # Process principal Electron (BrowserWindow + loadURL)
    preload.ts   # Preload sécurisé (contextIsolation)
  build/
    icon.png     # Icône Linux / source
    icon.ico     # Icône Windows (générée)
    icon.icns    # Icône macOS (générée)
    entitlements.mac.plist
  scripts/
    generate-icons.mjs  # Génère ico/icns depuis public/logo.png
```

## Logo

Le logo est `public/logo.png` (676×676) du site. `generate-icons.mjs` le copie et génère `icon.ico`/`icon.icns` sans dépendance native (embed PNG). Si `sharp` est installé, il génère des variantes multi-résolutions propres.

## Dev

```bash
cd apps/desktop
pnpm install
pnpm run generate:icons
pnpm run dev
```

## Build local

```bash
pnpm run dist        # build selon OS courant
pnpm run dist:win    # nécessite Windows ou wine
pnpm run dist:mac    # nécessite macOS
pnpm run dist:linux  # Linux
```

Sortie : `apps/desktop/dist-elec/`

## CI

Workflow `.github/workflows/desktop.yml` build les 3 plateformes en parallèle et publie les artefacts + Release GitHub.
