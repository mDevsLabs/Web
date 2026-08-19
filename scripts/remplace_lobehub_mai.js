import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Configuration de la recherche et du remplacement
const SEARCH_STRING = 'LobeHub';
const REPLACE_STRING = 'mAI';
const TARGET_DIR_NAME = 'locales';
const SESSIONS_DIR = path.join(import.meta.dirname, '.remplace_sessions');

// Regex globale pour identifier le terme
const SEARCH_REGEX = new RegExp(SEARCH_STRING, 'g');

// Création de l'interface pour poser des questions dans le terminal (y/n)
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify la fonction question
const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

function ensureSessionsDir() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
}

function saveSession(session) {
    ensureSessionsDir();
    session.updatedAt = new Date().toISOString();
    const safeName = session.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(SESSIONS_DIR, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
}

function getSessions() {
    ensureSessionsDir();
    return fs.readdirSync(SESSIONS_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const filePath = path.join(SESSIONS_DIR, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    filename: file,
                    path: filePath,
                    name: data.name || file.replace('.json', ''),
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    ignoredCount: data.ignoredOccurrences ? data.ignoredOccurrences.length : 0,
                    modifiedCount: data.stats && data.stats.modified ? data.stats.modified : 0,
                    data
                };
            } catch {
                return null;
            }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getAllFiles(dir) {
    let results = [];
    const list = await fs.promises.readdir(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat && stat.isDirectory()) {
            const subResults = await getAllFiles(filePath);
            results = results.concat(subResults);
        } else {
            results.push(filePath);
        }
    }
    return results;
}

async function showMenu() {
    while (true) {
        console.log(`\n========================================================`);
        console.log(`   🤖 GESTIONNAIRE DE REMPLACEMENT LOBEHUB ➔ mAI`);
        console.log(`========================================================`);
        console.log(`[1] 🆕 Commencer une NOUVELLE session`);
        console.log(`[2] 📂 CHARGER une session existante`);
        console.log(`[3] 🗑️  SUPPRIMER une session existante`);
        console.log(`[4] 📤 EXPORTER une session`);
        console.log(`[5] 📥 IMPORTER une session`);
        console.log(`[6] ✏️  RENOMMER une session`);
        console.log(`[7] 🚪 Quitter le script`);
        console.log(`========================================================`);
        
        const choice = (await askQuestion(`👉 Votre choix [1-7] : `)).trim();
        
        if (choice === '1') {
            const session = await createNewSessionMenu();
            if (session) return session;
        } else if (choice === '2') {
            const session = await loadSessionMenu();
            if (session) return session;
        } else if (choice === '3') {
            await deleteSessionMenu();
        } else if (choice === '4') {
            await exportSessionMenu();
        } else if (choice === '5') {
            await importSessionMenu();
        } else if (choice === '6') {
            await renameSessionMenu();
        } else if (choice === '7') {
            console.log(`\n👋 Au revoir !`);
            rl.close();
            process.exit(0);
        } else {
            console.log(`❌ Choix invalide.`);
        }
    }
}

async function createNewSessionMenu() {
    console.log(`\n🆕 --- CRÉER UNE NOUVELLE SESSION ---`);
    const nameInput = (await askQuestion(`Nom de la session (laisser vide pour auto) : `)).trim();
    let sessionName = nameInput || `session_${new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-')}`;
    const safeName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(SESSIONS_DIR, `${safeName}.json`);
    
    if (fs.existsSync(filePath)) {
        console.log(`⚠️  Session "${safeName}" existe déjà.`);
        const overwrite = (await askQuestion(`[c]harger, [e]craser, [a]nnuler ? : `)).trim().toLowerCase();
        if (overwrite === 'c') {
            try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return null; }
        } else if (overwrite === 'a') { return null; }
    }
    
    const session = { name: safeName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ignoredOccurrences: [], stats: { modified: 0, ignored: 0 } };
    saveSession(session);
    console.log(`✅ Session "${safeName}" créée !`);
    return session;
}

async function loadSessionMenu() {
    const sessions = getSessions();
    if (!sessions.length) { console.log(`📭 Aucune session.`); return null; }
    console.log(`\n📂 --- CHARGER UNE SESSION ---`);
    sessions.forEach((s, idx) => console.log(`  [${idx + 1}] 📝 ${s.name} (Modifié : ${s.modifiedCount}, Ignoré : ${s.ignoredCount})`));
    console.log(`  [${sessions.length + 1}] 🔙 Retour`);
    
    const choice = parseInt((await askQuestion(`👉 Choix : `)).trim(), 10);
    if (isNaN(choice) || choice < 1 || choice > sessions.length + 1) return null;
    if (choice === sessions.length + 1) return null;
    return sessions[choice - 1].data;
}

async function deleteSessionMenu() {
    const sessions = getSessions();
    if (!sessions.length) { console.log(`📭 Aucune session.`); return; }
    sessions.forEach((s, idx) => console.log(`  [${idx + 1}] 📝 ${s.name}`));
    const choice = parseInt((await askQuestion(`👉 Supprimer [1-${sessions.length}] (0 pour annuler) : `)).trim(), 10);
    if (choice > 0 && choice <= sessions.length) {
        fs.unlinkSync(sessions[choice - 1].path);
        console.log(`🗑️  Supprimé.`);
    }
}

async function exportSessionMenu() {
    const sessions = getSessions();
    if (!sessions.length) { console.log(`📭 Aucune session.`); return; }
    sessions.forEach((s, idx) => console.log(`  [${idx + 1}] 📝 ${s.name}`));
    const choice = parseInt((await askQuestion(`👉 Exporter [1-${sessions.length}] (0 pour annuler) : `)).trim(), 10);
    if (choice > 0 && choice <= sessions.length) {
        const dest = (await askQuestion(`Chemin d'export (ex: ./export.json) : `)).trim();
        if (dest) {
            fs.copyFileSync(sessions[choice - 1].path, path.resolve(dest));
            console.log(`✅ Exporté vers ${dest}`);
        }
    }
}

async function importSessionMenu() {
    const src = (await askQuestion(`Chemin du fichier JSON à importer : `)).trim();
    if (fs.existsSync(src)) {
        try {
            const data = JSON.parse(fs.readFileSync(src, 'utf8'));
            if (!data.name) data.name = `imported_${Date.now()}`;
            saveSession(data);
            console.log(`✅ Import réussi sous le nom "${data.name}"`);
        } catch (e) {
            console.log(`❌ Erreur d'import.`);
        }
    } else {
        console.log(`❌ Fichier introuvable.`);
    }
}

async function renameSessionMenu() {
    const sessions = getSessions();
    if (!sessions.length) { console.log(`📭 Aucune session.`); return; }
    sessions.forEach((s, idx) => console.log(`  [${idx + 1}] 📝 ${s.name}`));
    const choice = parseInt((await askQuestion(`👉 Renommer [1-${sessions.length}] (0 pour annuler) : `)).trim(), 10);
    if (choice > 0 && choice <= sessions.length) {
        const newName = (await askQuestion(`Nouveau nom : `)).trim();
        if (newName) {
            const s = sessions[choice - 1].data;
            fs.unlinkSync(sessions[choice - 1].path);
            s.name = newName;
            saveSession(s);
            console.log(`✅ Renommé en "${newName}"`);
        }
    }
}

async function main() {
    const targetDir = path.join(process.cwd(), TARGET_DIR_NAME);
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Dossier "${TARGET_DIR_NAME}" introuvable.`);
        rl.close(); return;
    }
    const currentSession = await showMenu();
    if (!currentSession) { rl.close(); return; }

    console.log(`\n🔍 Recherche de "${SEARCH_STRING}"...\n`);
    let modifiedFilesCount = 0;
    let replaceAll = false;
    let ignoreAll = false;
    let sessionSavedCountAtStart = currentSession.stats.modified;

    try {
        const allFiles = await getAllFiles(targetDir);
        for (const filePath of allFiles) {
            const content = await fs.promises.readFile(filePath, 'utf8');
            if (content.match(SEARCH_REGEX)) {
                const relativePath = path.relative(process.cwd(), filePath);
                
                if (replaceAll) {
                    const newContent = content.replace(SEARCH_REGEX, REPLACE_STRING);
                    await fs.promises.writeFile(filePath, newContent, 'utf8');
                    currentSession.stats.modified += (content.match(SEARCH_REGEX) || []).length;
                    saveSession(currentSession);
                    console.log(`   ✅ \x1b[36m${relativePath}\x1b[0m modifié automatiquement.`);
                    modifiedFilesCount++;
                    continue;
                }
                
                if (ignoreAll) {
                    continue;
                }

                const lines = content.split('\n');
                let modifiedLines = [];
                let fileModified = false;
                let quitRequested = false;

                for (let i = 0; i < lines.length; i++) {
                    const originalLine = lines[i];
                    let match;
                    const lineRegex = new RegExp(SEARCH_REGEX.source, SEARCH_REGEX.flags);
                    let currentLineBuilder = "";
                    let lastIndex = 0;
                    let lineModified = false;

                    while ((match = lineRegex.exec(originalLine)) !== null) {
                        if (quitRequested) break;
                        
                        currentLineBuilder += originalLine.substring(lastIndex, match.index);

                        const firstColonIndex = originalLine.indexOf(':');
                        if (firstColonIndex !== -1 && match.index < firstColonIndex) {
                            currentLineBuilder += match[0];
                            lastIndex = lineRegex.lastIndex;
                            continue;
                        }

                        const occurrenceKey = `${relativePath}::${i + 1}::${match.index}::${originalLine.trim()}`;

                        if (currentSession.ignoredOccurrences.includes(occurrenceKey) || ignoreAll) {
                            currentLineBuilder += match[0];
                            lastIndex = lineRegex.lastIndex;
                            continue;
                        }
                        if (replaceAll) {
                            currentLineBuilder += REPLACE_STRING;
                            lineModified = true;
                            currentSession.stats.modified++;
                            lastIndex = lineRegex.lastIndex;
                            continue;
                        }

                        console.log(`\n⚠️  Occurrence dans \x1b[36m${relativePath}\x1b[0m (Ligne ${i + 1})`);
                        const lineToDisplay = originalLine.substring(0, match.index) + `\x1b[31m${match[0]}\x1b[0m` + originalLine.substring(lineRegex.lastIndex);
                        console.log(`   ${i + 1}: ${lineToDisplay.trim()}\n`);

                        let validResponse = false;
                        while (!validResponse) {
                            const answer = await askQuestion(`   Remplacer ? [y=Oui, n=Non, ya=Oui Tout, na=Non Tout, q=Quitter] : `);
                            const choice = answer.trim().toLowerCase();

                            if (choice === 'y' || choice === 'yes') {
                                currentLineBuilder += REPLACE_STRING;
                                lineModified = true;
                                currentSession.stats.modified++;
                                saveSession(currentSession);
                                validResponse = true;
                            } else if (choice === 'n' || choice === 'no') {
                                currentLineBuilder += match[0];
                                currentSession.ignoredOccurrences.push(occurrenceKey);
                                currentSession.stats.ignored++;
                                saveSession(currentSession);
                                validResponse = true;
                            } else if (choice === 'ya' || choice === 'yesall') {
                                replaceAll = true;
                                currentLineBuilder += REPLACE_STRING;
                                lineModified = true;
                                currentSession.stats.modified++;
                                saveSession(currentSession);
                                validResponse = true;
                                console.log(`✅ Remplacement global activé.`);
                            } else if (choice === 'na' || choice === 'noall') {
                                ignoreAll = true;
                                currentLineBuilder += match[0];
                                validResponse = true;
                                console.log(`⏭️  Ignorer global activé.`);
                            } else if (choice === 'q' || choice === 'quit') {
                                quitRequested = true;
                                currentLineBuilder += match[0];
                                validResponse = true;
                            } else {
                                console.log(`❌ Invalide.`);
                            }
                        }
                        lastIndex = lineRegex.lastIndex;
                    }
                    if (quitRequested) {
                        currentLineBuilder += originalLine.substring(lastIndex);
                        modifiedLines.push(currentLineBuilder);
                        for (let j = i + 1; j < lines.length; j++) modifiedLines.push(lines[j]);
                        break;
                    } else {
                        currentLineBuilder += originalLine.substring(lastIndex);
                        modifiedLines.push(currentLineBuilder);
                    }
                    if (lineModified) fileModified = true;
                }
                if (fileModified) {
                    await fs.promises.writeFile(filePath, modifiedLines.join('\n'), 'utf8');
                    console.log(`   💾 Fichier sauvegardé : \x1b[36m${relativePath}\x1b[0m\n`);
                    modifiedFilesCount++;
                }
                if (quitRequested) {
                    saveSession(currentSession);
                    console.log(`\n🛑 Interrompu.`);
                    rl.close(); return;
                }
            }
        }
        saveSession(currentSession);
        console.log(`\n🎉 Fichiers modifiés : ${modifiedFilesCount}`);
    } catch (e) { console.error(e); } finally { rl.close(); }
}
main();