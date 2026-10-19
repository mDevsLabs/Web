# 📦 Compilation Desktop & CI/CD — mAI Coder

Ce guide explique comment compiler mAI Coder en binaire installable pour Windows et macOS, tant en local que via le workflow GitHub Actions unifié.

---

## 1. ⚙️ Prérequis Locaux

- **Node.js** : Version 20.x obligatoire.
- **Python** : 3.11 ou supérieur (requis pour la compilation des modules natifs C++ `node-gyp`).
- **Windows** : Visual Studio 2022 avec la charge de travail *Développement Desktop en C++*.
- **macOS** : Xcode et les Command Line Tools (`xcode-select --install`).

---

## 2. 🪟 Compilation pour Windows

La compilation Windows produit un installeur exécutable standard (**NSIS** `.exe`) et un package d'entreprise (**MSI** `.msi`) :

```bash
cd apps/coder

# 1. Vérification des types et tests unitaires
npm run typecheck
npm test

# 2. Compilation des bundles Electron et Vite
npm run build

# 3. Compilation des dépendances natives (node-pty, better-sqlite3)
npm run rebuild:native

# 4. Packaging avec electron-builder
npm run release:win
```
Les artefacts sont générés dans `apps/coder/release/` :
- `mAI-Coder-<version>-x64.exe`
- `mAI-Coder-<version>-x64.msi`

---

## 3. 🍏 Compilation pour macOS

La compilation macOS génère une image disque (**DMG** `.dmg`) et une archive compressée (**ZIP** `.zip`) :

```bash
cd apps/coder

# Compilation non signée (idéale pour tests et développement)
npm run release:mac:unsigned
```

Pour une compilation de production officielle signée avec notarisation Apple Developer :
- Définir `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` et `APPLE_TEAM_ID`.
- Exécuter `npm run release:mac`.

---

## 4. 🚀 Intégration CI/CD GitHub Actions

Le workflow racine [`.github/workflows/build.yml`](file:///C:/Users/maria/Desktop/MATHIAS/Dossiers%20Mathias/mCompany/mAI%20Web/.github/workflows/build.yml) automatise ce processus dès qu'une modification touche `apps/coder/**` :
- **`coder-windows`** : Tourne sur `windows-2022`, configure MSVC et Python, et produit les installeurs Windows.
- **`coder-macos`** : Tourne sur `macos-latest` et produit les binaires macOS.
- **`release-coder`** : Regroupe les artefacts et publie la Release GitHub automatiquement lors d'un tag ou d'un push sur `main`.
