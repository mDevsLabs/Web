#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const args = process.argv.slice(2);
let options = {
  version: null,
  target: null, // 'all', 'root', 'desktop', 'cli'
  interactive: true
};

// Parser les arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
🚀 M-AI Version Updater - Mise à jour des versions 📦

Utilisation :
  node scripts/update_versions.mjs [options]

Options :
  --version <v>    Définir la version à appliquer (ex: 1.2.3)
  --all            Appliquer à tous les package.json (racine, desktop, cli)
  --root           Appliquer uniquement à la racine
  --desktop        Appliquer uniquement à apps/desktop
  --cli            Appliquer uniquement à apps/cli
  --help, -h       Afficher cette aide
    `);
    process.exit(0);
  }
  if (args[i] === '--version' && args[i+1]) {
    options.version = args[++i];
  }
  if (args[i] === '--all') { options.target = 'all'; options.interactive = false; }
  if (args[i] === '--root') { options.target = 'root'; options.interactive = false; }
  if (args[i] === '--desktop') { options.target = 'desktop'; options.interactive = false; }
  if (args[i] === '--cli') { options.target = 'cli'; options.interactive = false; }
}

const TARGETS = [
  { id: 'root', name: 'Racine', file: 'package.json' },
  { id: 'desktop', name: 'Desktop', file: 'apps/desktop/package.json' },
  { id: 'cli', name: 'CLI', file: 'apps/cli/package.json' }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

function readPackageVersion(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return 'Introuvable ❌';
    const content = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(content);
    return json.version || 'Inconnue ❓';
  } catch (e) {
    return 'Erreur ⚠️';
  }
}

function updatePackageVersion(filePath, newVersion) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Le fichier ${filePath} est introuvable.`);
      return false;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(content);
    const oldVersion = json.version;
    json.version = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ ${filePath} mis à jour : ${oldVersion} ➔ \x1b[32m${newVersion}\x1b[0m`);
    return true;
  } catch (e) {
    console.log(`❌ Erreur lors de la mise à jour de ${filePath} : ${e.message}`);
    return false;
  }
}

async function showMenu() {
  while (true) {
    console.log(`\n========================================================`);
    console.log(`   🚀 M-AI GESTIONNAIRE DE VERSIONS 📦`);
    console.log(`========================================================`);
    console.log(`Statut actuel des versions :`);
    TARGETS.forEach((t, idx) => {
      console.log(`  ${t.name.padEnd(10)} : \x1b[36m${readPackageVersion(t.file)}\x1b[0m`);
    });
    console.log(`========================================================`);
    console.log(`[1] 🌟 Mettre à jour TOUS les fichiers avec une seule version`);
    console.log(`[2] 🎯 Mettre à jour chaque fichier individuellement`);
    console.log(`[3] 🏠 Mettre à jour uniquement la racine`);
    console.log(`[4] 💻 Mettre à jour uniquement Desktop`);
    console.log(`[5] 🛠️  Mettre à jour uniquement CLI`);
    console.log(`[q] 🚪 Quitter le script`);
    console.log(`========================================================`);
    
    const choice = (await askQuestion(`👉 Votre choix : `)).trim().toLowerCase();
    
    if (choice === 'q' || choice === 'quit') {
      console.log(`\n👋 Au revoir ! Passez une excellente journée ! ✨`);
      rl.close();
      process.exit(0);
    } else if (choice === '1') {
      const v = await askQuestion(`✨ Entrez la nouvelle version pour TOUS les fichiers : `);
      if (v.trim()) {
        TARGETS.forEach(t => updatePackageVersion(t.file, v.trim()));
      }
    } else if (choice === '2') {
      console.log(`\n📝 Mise à jour individuelle :`);
      for (const t of TARGETS) {
        const currentV = readPackageVersion(t.file);
        const v = await askQuestion(`   Nouvelle version pour ${t.name} (actuelle: ${currentV}, ou Entrée pour ignorer) : `);
        if (v.trim()) {
          updatePackageVersion(t.file, v.trim());
        } else {
          console.log(`   ⏭️  Ignoré.`);
        }
      }
    } else if (choice === '3') {
      const v = await askQuestion(`✨ Entrez la nouvelle version pour la Racine : `);
      if (v.trim()) updatePackageVersion(TARGETS[0].file, v.trim());
    } else if (choice === '4') {
      const v = await askQuestion(`✨ Entrez la nouvelle version pour Desktop : `);
      if (v.trim()) updatePackageVersion(TARGETS[1].file, v.trim());
    } else if (choice === '5') {
      const v = await askQuestion(`✨ Entrez la nouvelle version pour CLI : `);
      if (v.trim()) updatePackageVersion(TARGETS[2].file, v.trim());
    } else {
      console.log(`❌ Choix invalide, veuillez réessayer.`);
    }
  }
}

async function main() {
  if (options.interactive) {
    await showMenu();
  } else {
    // Mode non interactif
    if (!options.version) {
      console.log(`❌ L'option --version est requise en mode non interactif.`);
      rl.close();
      process.exit(1);
    }
    
    console.log(`\n🚀 Mise à jour automatique de la version à ${options.version}...\n`);
    
    if (options.target === 'all') {
      TARGETS.forEach(t => updatePackageVersion(t.file, options.version));
    } else if (options.target === 'root') {
      updatePackageVersion(TARGETS[0].file, options.version);
    } else if (options.target === 'desktop') {
      updatePackageVersion(TARGETS[1].file, options.version);
    } else if (options.target === 'cli') {
      updatePackageVersion(TARGETS[2].file, options.version);
    }
    
    console.log(`\n🎉 Terminé ! ✨`);
    rl.close();
  }
}

main();
