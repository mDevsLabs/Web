import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { sendEmail, runNewsletterStudio } from './newsletter-send';

// ─────────────────────────────────────────────
// Chargement automatique des variables d'environnement
// ─────────────────────────────────────────────
function loadEnv() {
  if (!process.env.DATABASE_URL) {
    const envPaths = ['.env', '.env.local'];
    for (const envPath of envPaths) {
      const fullPath = path.resolve(process.cwd(), envPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...vals] = trimmed.split('=');
            let val = vals.join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = val;
            }
          }
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Erreur : DATABASE_URL est introuvable dans votre environnement ou vos fichiers .env.");
  process.exit(1);
}

const sql = neon(dbUrl);

// ─────────────────────────────────────────────
// Styles & Palette ANSI CLI
// ─────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  cyan: "\x1b[36m",
  brightCyan: "\x1b[96m",
  green: "\x1b[32m",
  brightGreen: "\x1b[92m",
  yellow: "\x1b[33m",
  brightYellow: "\x1b[93m",
  red: "\x1b[31m",
  brightRed: "\x1b[91m",
  magenta: "\x1b[35m",
  brightMagenta: "\x1b[95m",
  white: "\x1b[37m",
  brightWhite: "\x1b[97m",
  bgPurple: "\x1b[48;5;55m",
};

// ─────────────────────────────────────────────
// Initialisation de la table des réinitialisations en attente
// ─────────────────────────────────────────────
export async function initPendingResetsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_pending_resets (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      reset_type VARCHAR(50) NOT NULL, -- 'all', 'api', 'mai', 'images', 'audio'
      expires_at TIMESTAMP WITH TIME ZONE NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available', 'used', 'expired'
      used_at TIMESTAMP WITH TIME ZONE NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_pending_resets_user_status 
      ON user_pending_resets (user_id, status);
  `;
}

// ─────────────────────────────────────────────
// Initialisation de la table des augmentations temporaires (Boosts)
// ─────────────────────────────────────────────
export async function initQuotaBoostsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_quota_boosts (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL, -- 'all' ou identifiant utilisateur
      quota_type VARCHAR(50) NOT NULL, -- 'mai', 'api', 'images', 'audio'
      boost_amount NUMERIC NOT NULL,
      boost_mode VARCHAR(20) NOT NULL DEFAULT 'add',
      starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      reason VARCHAR(255) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_quota_boosts_active 
      ON user_quota_boosts (user_id, quota_type, starts_at, expires_at, is_active);
  `;
}

// ─────────────────────────────────────────────
// Template d'E-mail de Réinitialisation de Quotas
// ─────────────────────────────────────────────
function buildQuotaEmailHtml(params: {
  title: string;
  username: string;
  quotasDescription: string;
  timingDescription: string;
  badgeLabel: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${params.title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#080c14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f1f5f9;">
      <div style="max-width:560px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);">
        
        <!-- Header & Logo -->
        <div style="background:linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #0f172a 100%); padding:36px 24px 28px 24px; text-align:center; border-bottom:1px solid #2e1065;">
          <img src="https://upload.fs.fr/azq3C6GLea.png" alt="mAI Logo" style="height:44px; width:auto; max-width:180px; object-fit:contain; display:inline-block;" />
          <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:16px 0 0 0; letter-spacing:-0.5px;">${params.title}</h1>
        </div>

        <!-- Body Content -->
        <div style="padding:32px 28px; line-height:1.7; font-size:15px; color:#cbd5e1;">
          <p style="margin-top:0; font-size:16px; font-weight:600; color:#ffffff;">Bonjour <strong>${params.username}</strong>,</p>
          <p>${params.quotasDescription}</p>
          <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:14px 18px; margin:18px 0; color:#93c5fd; font-size:14px;">
            ${params.timingDescription}
          </div>
          
          <div style="background:linear-gradient(180deg, #131d31 0%, #0c1322 100%); border:1px solid #334155; border-radius:16px; padding:22px; text-align:center; margin:24px 0;">
            <span style="display:inline-block; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.35); font-weight:800; font-size:13px; padding:6px 18px; border-radius:100px; text-transform:uppercase; letter-spacing:0.5px;">
              ${params.badgeLabel}
            </span>
            <p style="font-size:13px; color:#94a3b8; margin:12px 0 0 0;">Accédez à votre espace compte mAI pour suivre l'état de votre consommation en temps réel.</p>
          </div>

          <p style="font-size:12px; color:#64748b; margin-top:24px;">Cet e-mail est adressé à tous les utilisateurs concernés lors d'une mise à jour de leurs quotas d'utilisation.</p>
        </div>

        <!-- Footer -->
        <div style="background-color:#070a12; padding:20px 24px; text-align:center; border-top:1px solid #1e293b; font-size:12px; color:#64748b;">
          <p style="margin:0 0 4px 0; font-weight:600; color:#94a3b8;">© 2026 mAI — Plateforme d'IA &amp; APIs Souveraines</p>
          <p style="margin:0; font-size:11px;">Données sécurisées dans l'UE • Priorité Zero Data Retention (ZDR)</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

export type ResetType = 'all' | 'api' | 'mai' | 'images' | 'audio';

export interface TargetUser {
  id: string;
  email: string;
  username: string;
}

export async function performReset(params: {
  users: TargetUser[];
  resetType: ResetType;
  isInstant: boolean;
  expiresAt?: Date | null;
  notify?: boolean;
}) {
  const { users, resetType, isInstant, expiresAt, notify = true } = params;
  if (users.length === 0) {
    console.log(`\n${c.yellow}⚠️ Aucun utilisateur ciblé pour la réinitialisation.${c.reset}`);
    return;
  }

  await initPendingResetsTable();

  const resetLabels: Record<ResetType, string> = {
    all: "Tous les quotas (API + mAI + Images + Audio)",
    api: "Quotas de requêtes d'API",
    mai: "Tokens de modèles mAI",
    images: "Quotas journaliers de génération d'Images",
    audio: "Quotas de synthèse vocale Audio",
  };

  const badgeLabels: Record<ResetType, string> = {
    all: "Tous les quotas réinitialisés à 100%",
    api: "Quotas API réinitialisés à 100%",
    mai: "Tokens mAI réinitialisés à 100%",
    images: "Quotas Images réinitialisés",
    audio: "Quotas Audio réinitialisés",
  };

  const targetLabel = resetLabels[resetType] || "Quotas";
  const badgeLabel = badgeLabels[resetType] || "Quotas réinitialisés";

  if (isInstant) {
    // 1. Réinitialisation instantanée directe en DB (ne figure pas dans le tableau de l'utilisateur)
    console.log(`\n${c.cyan}⏳ Application de la réinitialisation instantanée (${targetLabel}) pour ${users.length} utilisateur(s)...${c.reset}`);
    for (const u of users) {
      // La colonne user_id n'a pas le même type selon les tables (integer / varchar) :
      // on convertit toujours la COLONNE en text pour éviter "operator does not exist: integer = text".
      if (resetType === 'all' || resetType === 'api') {
        await sql`UPDATE mprojects_api_keys SET request_count = 0 WHERE user_id::text = ${u.id} OR user_id::text = ${u.username} OR user_id::text = ${u.email}`;
      }
      if (resetType === 'all' || resetType === 'mai') {
        await sql`UPDATE weekly_usage SET tokens_used = 0 WHERE user_id::text = ${u.id} OR user_id::text = ${u.username} OR user_id::text = ${u.email}`;
      }
      if (resetType === 'all' || resetType === 'images') {
        await sql`UPDATE mprojects_daily_image_usage SET images_generated = 0, updated_at = NOW() WHERE (user_id::text = ${u.id} OR user_id::text = ${u.username} OR user_id::text = ${u.email}) AND usage_date = CURRENT_DATE`;
      }
      if (resetType === 'all' || resetType === 'audio') {
        await sql`UPDATE weekly_speech_usage SET tokens_used = 0, requests_count = 0 WHERE user_id::text = ${u.id} OR user_id::text = ${u.username} OR user_id::text = ${u.email}`;
      }
    }
    console.log(`${c.brightGreen}✔ Succès : Réinitialisation instantanée appliquée avec succès en base de données !${c.reset}`);
  } else {
    // 2. Réinitialisation différée avec date d'expiration (ajoutée dans le tableau de l'utilisateur)
    const expStr = expiresAt ? expiresAt.toLocaleString('fr-FR') : 'Illimitée';
    console.log(`\n${c.cyan}⏳ Enregistrement des réinitialisations à réclamer (Expiration : ${expStr})...${c.reset}`);
    for (const u of users) {
      await sql`
        INSERT INTO user_pending_resets (user_id, reset_type, expires_at, status)
        VALUES (${u.id}::text, ${resetType}, ${expiresAt ? expiresAt.toISOString() : null}, 'available')
      `;
    }
    console.log(`${c.brightGreen}✔ Succès : ${users.length} réinitialisation(s) ajoutée(s) dans la section Réinitialisations des utilisateurs !${c.reset}`);
  }

  if (!notify) return;

  // 3. Envoi des e-mails à TOUS les utilisateurs (même ceux non abonnés à la newsletter)
  console.log(`\n  ${c.brightYellow}➔ Envoi des e-mails de notification à ${users.length} utilisateur(s)...${c.reset}`);
  let success = 0;

  const timingDescription = isInstant
    ? "⚡ Cette réinitialisation a eu lieu <strong>à l'instant</strong>. Vos compteurs sont d'ores et déjà remis à zéro."
    : `📅 Une réinitialisation est <strong>disponible dans vos paramètres de compte</strong> (section <em>Réinitialisations</em>). Vous pouvez l'activer quand vous le souhaitez avant son expiration le <strong>${expiresAt ? expiresAt.toLocaleString('fr-FR') : 'Sans date d’expiration'}</strong>.`;

  const quotasDescription = resetType === 'all'
    ? "Tous vos quotas mAI ont été réinitialisés : requêtes d'API, tokens mAI hebdomadaires, générations journalières d'images et synthèse vocale audio."
    : `Votre quota concerné par cette réinitialisation : <strong>${targetLabel}</strong>.`;

  for (const user of users) {
    const html = buildQuotaEmailHtml({
      title: resetType === 'all' ? "Réinitialisation globale de vos quotas mAI" : `Réinitialisation : ${targetLabel}`,
      username: user.username,
      quotasDescription,
      timingDescription,
      badgeLabel,
    });

    try {
      const sent = await sendEmail({
        to: user.email,
        subject: resetType === 'all'
          ? "Tous vos quotas mAI ont été réinitialisés"
          : `Votre quota mAI (${targetLabel}) a été réinitialisé`,
        html,
      });
      if (sent) success++;
      await new Promise((r) => setTimeout(r, 80));
    } catch (err: any) {
      console.error(`  ${c.red}✖ Erreur d'envoi pour ${user.email} : ${err?.message || err}${c.reset}`);
    }
  }

  console.log(`  ${c.brightGreen}✔ ${success}/${users.length} notification(s) e-mail envoyée(s) avec succès !${c.reset}`);
}

// ─────────────────────────────────────────────
// Fonctions de compatibilité CLI / raccourcis
// ─────────────────────────────────────────────
export async function getAllUsers(): Promise<TargetUser[]> {
  return (await sql`SELECT id, email, username FROM users`) as unknown as TargetUser[];
}

export async function resetApiUsage(notifyUsers = true) {
  const users = await getAllUsers();
  await performReset({ users, resetType: 'api', isInstant: true, notify: notifyUsers });
}

export async function resetMaiUsage(notifyUsers = true) {
  const users = await getAllUsers();
  await performReset({ users, resetType: 'mai', isInstant: true, notify: notifyUsers });
}

export async function resetImageUsage(notifyUsers = true) {
  const users = await getAllUsers();
  await performReset({ users, resetType: 'images', isInstant: true, notify: notifyUsers });
}

export async function resetAudioUsage(notifyUsers = true) {
  const users = await getAllUsers();
  await performReset({ users, resetType: 'audio', isInstant: true, notify: notifyUsers });
}

export async function resetAllUsage(notifyUsers = true) {
  const users = await getAllUsers();
  await performReset({ users, resetType: 'all', isInstant: true, notify: notifyUsers });
}

// ─────────────────────────────────────────────
// Sélection interactive d'un utilisateur
// ─────────────────────────────────────────────
export async function promptSelectUser(rl: readline.Interface): Promise<TargetUser | null> {
  const users = (await sql`
    SELECT id, username, email, tier 
    FROM users 
    ORDER BY id ASC 
    LIMIT 30
  `) as unknown as (TargetUser & { tier?: string })[];

  if (users.length === 0) {
    console.log(`\n❌ Aucun utilisateur trouvé dans la base de données.`);
    return null;
  }

  console.log(`\n${c.bold}--- 📋 CHOISIR UN UTILISATEUR ---${c.reset}`);
  users.forEach((u, i) => {
    const tierBadge = u.tier ? `[${u.tier}]` : '[Free]';
    console.log(`  ${c.brightCyan}[${i + 1}]${c.reset} ${c.bold}${u.username.padEnd(16)}${c.reset} ${u.email.padEnd(28)} ${c.dim}${tierBadge.padEnd(8)}${c.reset} ${c.dim}(ID: ${u.id})${c.reset}`);
  });
  console.log(`  ${c.brightYellow}[S]${c.reset} 🔍 Rechercher par mot-clé (nom, e-mail ou ID)`);
  console.log(`  ${c.white}[0]${c.reset} ↩️  Annuler`);

  const ans = (await rl.question(`\n  ${c.brightYellow}➔ Choix [1-${users.length}] ou [S] pour rechercher : ${c.reset}`)).trim();

  if (ans === '0' || ans.toLowerCase() === 'annuler') {
    return null;
  }

  const num = parseInt(ans, 10);
  if (!isNaN(num) && num >= 1 && num <= users.length) {
    const selected = users[num - 1];
    console.log(`  ${c.brightGreen}✔ Utilisateur sélectionné : ${selected.username} (${selected.email})${c.reset}`);
    return selected;
  }

  // Recherche par mot-clé si 's' ou si saisie directe
  const searchParam = ans.toLowerCase() === 's'
    ? (await rl.question(`  ${c.brightYellow}➔ Entrez le nom d'utilisateur, l'email ou l'ID : ${c.reset}`)).trim()
    : ans;

  if (!searchParam) return null;

  const found = (await sql`
    SELECT id, username, email, tier 
    FROM users 
    WHERE username ILIKE ${'%' + searchParam + '%'}
       OR email ILIKE ${'%' + searchParam + '%'}
       OR id::text = ${searchParam}
    ORDER BY id ASC
    LIMIT 20
  `) as unknown as (TargetUser & { tier?: string })[];

  if (found.length === 0) {
    console.log(`❌ Aucun utilisateur trouvé pour "${searchParam}".`);
    return null;
  }

  if (found.length === 1) {
    console.log(`  ${c.brightGreen}✔ Utilisateur trouvé : ${found[0].username} (${found[0].email})${c.reset}`);
    return found[0];
  }

  console.log(`\nPlusieurs utilisateurs correspondent à "${searchParam}" :`);
  found.forEach((u, i) => {
    const tierBadge = u.tier ? `[${u.tier}]` : '[Free]';
    console.log(`  ${c.brightCyan}[${i + 1}]${c.reset} ${u.username} (${u.email}) ${tierBadge} (ID: ${u.id})`);
  });
  const subAns = (await rl.question(`  ${c.brightYellow}➔ Choisissez un numéro [1-${found.length}] : ${c.reset}`)).trim();
  const subNum = parseInt(subAns, 10);
  if (!isNaN(subNum) && subNum >= 1 && subNum <= found.length) {
    const chosen = found[subNum - 1];
    console.log(`  ${c.brightGreen}✔ Utilisateur sélectionné : ${chosen.username} (${chosen.email})${c.reset}`);
    return chosen;
  }

  return null;
}

// ─────────────────────────────────────────────
// Assistant interactif de réinitialisation
// ─────────────────────────────────────────────
export async function runResetWizard(rl: readline.Interface, defaultType?: ResetType) {
  console.log(`\n${c.bgPurple}${c.bold}${c.brightWhite} 🔄 ASSISTANT DE RÉINITIALISATION DES QUOTAS 🔄 ${c.reset}\n`);

  // 1. Choix des utilisateurs
  console.log(`${c.bold}1. Destinataire(s) de la réinitialisation :${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} 👤 Choisir un utilisateur spécifique (liste interactive ou recherche)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} ⭐ Tous les utilisateurs enregistrés`);
  const userChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

  let selectedUsers: TargetUser[] = [];
  if (userChoice === '1') {
    const selected = await promptSelectUser(rl);
    if (!selected) {
      console.log(`\n${c.dim}Action annulée (aucun utilisateur sélectionné).${c.reset}`);
      return;
    }
    selectedUsers = [selected];
  } else {
    selectedUsers = await getAllUsers();
    console.log(`  ${c.brightGreen}✔ ${selectedUsers.length} utilisateur(s) sélectionné(s).${c.reset}`);
  }

  // 2. Choix de la réinitialisation
  let targetType: ResetType = defaultType || 'all';
  if (!defaultType) {
    console.log(`\n${c.bold}2. Quel quota réinitialiser ?${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} ⚡ TOUS les quotas (API + mAI + Images + Audio)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} 🔑 Quotas de requêtes d'API (mprojects_api_keys)`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 🧠 Tokens hebdomadaires mAI (weekly_usage)`);
    console.log(`  ${c.brightCyan}[4]${c.reset} 🎨 Quotas journaliers d'Images (mprojects_daily_image_usage)`);
    console.log(`  ${c.brightCyan}[5]${c.reset} 🎙️ Quotas de synthèse Audio (weekly_speech_usage)`);
    const qChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-5] (défaut 1) : ${c.reset}`)).trim() || '1';
    switch (qChoice) {
      case '2': targetType = 'api'; break;
      case '3': targetType = 'mai'; break;
      case '4': targetType = 'images'; break;
      case '5': targetType = 'audio'; break;
      default: targetType = 'all'; break;
    }
  }

  // 3. Choix du timing (Quand)
  console.log(`\n${c.bold}3. Quand effectuer la réinitialisation ?${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} ⚡ Instantanée (mise à zéro immédiate, pas dans le tableau du compte)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 📅 À réclamer avec Date d'Expiration (visible dans le tableau du compte)`);
  const timeChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

  let isInstant = true;
  let expiresAt: Date | null = null;

  if (timeChoice === '2') {
    isInstant = false;
    console.log(`\n${c.bold}Validité de la réinitialisation :${c.reset}`);
    const daysStr = (await rl.question(`  ${c.brightYellow}➔ Nombre de jours de validité (ex: 30, ou vide pour sans date limite) : ${c.reset}`)).trim();
    if (daysStr && !isNaN(Number(daysStr))) {
      expiresAt = new Date(Date.now() + Number(daysStr) * 24 * 60 * 60 * 1000);
      console.log(`  ${c.brightGreen}✔ Expiration fixée au : ${expiresAt.toLocaleString('fr-FR')}${c.reset}`);
    } else {
      console.log(`  ${c.brightYellow}ℹ Aucune date d'expiration (valable indéfiniment jusqu'à utilisation).${c.reset}`);
    }
  }

  // 4. Notification e-mail (peut être désactivée)
  console.log(`\n${c.bold}4. Envoyer une notification e-mail ?${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} ✉️  Envoyer un e-mail à tous les utilisateurs ciblés (défaut)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 🔕 Aucun e-mail (réinitialisation silencieuse)`);
  const notifChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';
  const sendNotifications = notifChoice !== '2';

  // Confirmation
  console.log(`\n${c.bold}RÉCAPITULATIF :${c.reset}`);
  console.log(`  - Destinataire(s) : ${selectedUsers.length} utilisateur(s)`);
  console.log(`  - Quota ciblé     : ${targetType.toUpperCase()}`);
  console.log(`  - Mode            : ${isInstant ? '⚡ Instantané (remis à zéro maintenant)' : `📅 Dans le tableau (Expiration: ${expiresAt ? expiresAt.toLocaleDateString('fr-FR') : 'Illimitée'})`}`);
  console.log(`  - Notifications   : ${sendNotifications ? '✉️ E-mail aux utilisateurs ciblés' : '🔕 Aucun e-mail'}`);

  const confirm = (await rl.question(`\n  ${c.brightYellow}➔ Confirmer et exécuter ? (o/n) : ${c.reset}`)).trim().toLowerCase();
  if (confirm !== 'o' && confirm !== 'oui' && confirm !== 'y') {
    console.log(`\n${c.dim}Action annulée.${c.reset}`);
    return;
  }

  await performReset({
    users: selectedUsers,
    resetType: targetType,
    isInstant,
    expiresAt,
    notify: sendNotifications,
  });
}

// ─────────────────────────────────────────────
// 4b. GESTIONNAIRE D'AUGMENTATIONS DE QUOTAS (BOOSTS TEMPORAIRES)
// ─────────────────────────────────────────────

function buildQuotaBoostEmailHtml(params: {
  title: string;
  username: string;
  quotaName: string;
  boostAmountFormatted: string;
  timingDescription: string;
  reason?: string | null;
}) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${params.title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#080c14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f1f5f9;">
      <div style="max-width:560px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);">
        
        <!-- Header & Logo -->
        <div style="background:linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #0f172a 100%); padding:36px 24px 28px 24px; text-align:center; border-bottom:1px solid #2e1065;">
          <img src="https://upload.fs.fr/azq3C6GLea.png" alt="mAI Logo" style="height:44px; width:auto; max-width:180px; object-fit:contain; display:inline-block;" />
          <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:16px 0 0 0; letter-spacing:-0.5px;">${params.title}</h1>
        </div>

        <!-- Body Content -->
        <div style="padding:32px 28px; line-height:1.7; font-size:15px; color:#cbd5e1;">
          <p style="margin-top:0; font-size:16px; font-weight:600; color:#ffffff;">Bonjour <strong>${params.username}</strong>,</p>
          <p>Excellente nouvelle ! Une augmentation temporaire (Boost) a été activée sur vos quotas mAI :</p>
          
          <div style="background:linear-gradient(180deg, #131d31 0%, #0c1322 100%); border:1px solid #334155; border-radius:16px; padding:22px; text-align:center; margin:22px 0;">
            <span style="display:inline-block; background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.35); font-weight:800; font-size:14px; padding:6px 18px; border-radius:100px; text-transform:uppercase; letter-spacing:0.5px;">
              +${params.boostAmountFormatted} (${params.quotaName})
            </span>
            <p style="font-size:13px; color:#94a3b8; margin:12px 0 0 0;">Votre plafond d'utilisation a été rehaussé pour vous permettre de bénéficier de capacités étendues.</p>
          </div>

          <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:14px 18px; margin:18px 0; color:#93c5fd; font-size:14px;">
            📅 <strong>Période de validité :</strong> ${params.timingDescription}
          </div>

          ${params.reason ? `<p style="font-size:13px; color:#cbd5e1; background:rgba(255,255,255,0.04); padding:10px 14px; border-radius:8px; margin:16px 0;"><strong>Motif :</strong> ${params.reason}</p>` : ''}

          <p style="font-size:12px; color:#64748b; margin-top:24px;">Cette augmentation est immédiatement active sur votre compte, clés d'API et interfaces mAI pendant toute la durée spécifiée.</p>
        </div>

        <!-- Footer -->
        <div style="background-color:#070a12; padding:20px 24px; text-align:center; border-top:1px solid #1e293b; font-size:12px; color:#64748b;">
          <p style="margin:0 0 4px 0; font-weight:600; color:#94a3b8;">© 2026 mAI — Plateforme d'IA &amp; APIs Souveraines</p>
          <p style="margin:0; font-size:11px;">Données sécurisées dans l'UE • Priorité Zero Data Retention (ZDR)</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function parseDateInput(inputStr: string, isStartDate = false): Date | null {
  const s = inputStr.trim().toLowerCase();
  if (!s) return null;
  if (s === 'now' || s === 'maintenant' || s === "aujourd'hui") {
    return new Date();
  }

  // Raccourcis relatifs : ex +7j, +14d, +30j, +1m, ou simplement 7
  const relMatch = s.match(/^\+?(\d+)\s*(j|d|m|h)?$/);
  if (relMatch) {
    const val = parseInt(relMatch[1], 10);
    const unit = relMatch[2] || 'j';
    const d = new Date();
    if (unit === 'h') d.setHours(d.getHours() + val);
    else if (unit === 'm') d.setMonth(d.getMonth() + val);
    else d.setDate(d.getDate() + val);
    return d;
  }

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return isStartDate ? new Date(y, m - 1, d, 0, 0, 0) : new Date(y, m - 1, d, 23, 59, 59);
  }

  // Format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/').map(Number);
    return isStartDate ? new Date(y, m - 1, d, 0, 0, 0) : new Date(y, m - 1, d, 23, 59, 59);
  }

  const parsed = new Date(inputStr);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

export function formatBoostAmount(quotaType: string, amount: number): string {
  if (quotaType === 'mai') {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('fr-FR')}M tokens`;
    return `${amount.toLocaleString('fr-FR')} tokens`;
  }
  if (quotaType === 'api') {
    return `${amount.toLocaleString('fr-FR')} requêtes`;
  }
  if (quotaType === 'images') {
    return `${amount.toLocaleString('fr-FR')} images / jour`;
  }
  if (quotaType === 'audio') {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('fr-FR')}M tokens audio`;
    return `${amount.toLocaleString('fr-FR')} tokens audio`;
  }
  return `${amount.toLocaleString('fr-FR')}`;
}

export async function createQuotaBoost(params: {
  userId: string; // 'all' ou user ID
  quotaType: 'mai' | 'api' | 'images' | 'audio';
  boostAmount: number;
  startsAt: Date;
  expiresAt: Date;
  reason?: string | null;
  notify?: boolean;
}) {
  await initQuotaBoostsTable();
  const { userId, quotaType, boostAmount, startsAt, expiresAt, reason, notify = true } = params;

  await sql`
    INSERT INTO user_quota_boosts (user_id, quota_type, boost_amount, boost_mode, starts_at, expires_at, reason, is_active)
    VALUES (${userId}, ${quotaType}, ${boostAmount}, 'add', ${startsAt.toISOString()}, ${expiresAt.toISOString()}, ${reason || null}, TRUE)
  `;

  if (!notify) return;

  // Récupérer les utilisateurs à notifier
  let recipients: TargetUser[] = [];
  if (userId === 'all') {
    recipients = await getAllUsers();
  } else {
    recipients = (await sql`
      SELECT id, email, username FROM users 
      WHERE id::text = ${userId}::text OR username = ${userId} OR email = ${userId}
      LIMIT 1
    `) as unknown as TargetUser[];
  }

  const quotaLabels: Record<string, string> = {
    mai: "Tokens de modèles mAI",
    api: "Requêtes d'API",
    images: "Générations d'Images",
    audio: "Synthèse vocale Audio",
  };
  const qLabel = quotaLabels[quotaType] || quotaType;
  const amountStr = formatBoostAmount(quotaType, boostAmount);

  const isStartsNow = Math.abs(startsAt.getTime() - Date.now()) < 5 * 60 * 1000;
  const timingDescription = isStartsNow
    ? `⚡ Actif dès <strong>maintenant</strong> jusqu'au <strong>${expiresAt.toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>`
    : `🗓️ Du <strong>${startsAt.toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> au <strong>${expiresAt.toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>`;

  console.log(`\n  ${c.brightYellow}➔ Envoi des e-mails d'annonce de Boost à ${recipients.length} utilisateur(s)...${c.reset}`);
  let success = 0;
  for (const user of recipients) {
    const html = buildQuotaBoostEmailHtml({
      title: `Augmentation de vos quotas mAI (+${amountStr})`,
      username: user.username,
      quotaName: qLabel,
      boostAmountFormatted: amountStr,
      timingDescription,
      reason,
    });

    try {
      const sent = await sendEmail({
        to: user.email,
        subject: `Boost de quota mAI accordé : +${amountStr} (${qLabel})`,
        html,
      });
      if (sent) success++;
      await new Promise((r) => setTimeout(r, 80));
    } catch (err: any) {
      console.error(`  ${c.red}✖ Erreur pour ${user.email} : ${err?.message || err}${c.reset}`);
    }
  }

  console.log(`  ${c.brightGreen}✔ ${success}/${recipients.length} e-mail(s) de Boost envoyé(s) avec succès !${c.reset}`);
}

export async function listActiveQuotaBoosts(_rl?: readline.Interface) {
  await initQuotaBoostsTable();
  const rows = await sql`
    SELECT b.id, b.user_id, b.quota_type, b.boost_amount, b.starts_at, b.expires_at, b.reason, b.is_active,
           u.username, u.email
    FROM user_quota_boosts b
    LEFT JOIN users u ON b.user_id = u.id::text OR b.user_id = u.username OR b.user_id = u.email
    WHERE b.is_active = TRUE AND b.expires_at >= NOW()
    ORDER BY b.created_at DESC
  `;

  console.log(`\n${c.bgPurple}${c.bold}${c.brightWhite} 📋 BOOSTS DE QUOTAS ACTIFS OU PROGRAMMÉS (${rows.length}) 📋 ${c.reset}\n`);
  if (rows.length === 0) {
    console.log(`  ${c.dim}ℹ Aucun boost de quota actif pour le moment.${c.reset}\n`);
    return;
  }

  console.log(`${c.bold}${'ID'.padEnd(5)} | ${'Cible'.padEnd(20)} | ${'Quota'.padEnd(10)} | ${'Boost'.padEnd(20)} | ${'Début'.padEnd(18)} | ${'Fin / Expiration'.padEnd(18)} | ${'Statut'}${c.reset}`);
  console.log('─'.repeat(105));

  const now = new Date();
  rows.forEach((r: any) => {
    const target = r.user_id === 'all' ? '⭐ TOUS LES COMPTES' : (r.username || r.email || r.user_id);
    const boostStr = `+${formatBoostAmount(r.quota_type, Number(r.boost_amount))}`;
    const start = new Date(r.starts_at);
    const end = new Date(r.expires_at);
    const startStr = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const endStr = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const status = start > now ? `${c.yellow}⏳ Programmé${c.reset}` : `${c.brightGreen}⚡ Actif${c.reset}`;

    console.log(`${String(r.id).padEnd(5)} | ${target.padEnd(20).substring(0, 20)} | ${r.quota_type.toUpperCase().padEnd(10)} | ${boostStr.padEnd(20)} | ${startStr.padEnd(18)} | ${endStr.padEnd(18)} | ${status}`);
    if (r.reason) {
      console.log(`      ↳ Motif: ${c.dim}${r.reason}${c.reset}`);
    }
  });
  console.log("");
}

export async function runQuotaBoostWizard(rl: readline.Interface, targetUserArg?: TargetUser | string) {
  console.log(`\n${c.bgPurple}${c.bold}${c.brightWhite} 📈 ASSISTANT D'AUGMENTATION DE QUOTA (BOOST TEMPORAIRE) 📈 ${c.reset}\n`);

  let targetUserId = 'all';
  let targetDisplay = 'Tous les utilisateurs (Global)';
  let targetUsersCount = 0;

  if (targetUserArg) {
    if (typeof targetUserArg === 'object') {
      targetUserId = String(targetUserArg.id);
      targetDisplay = `${targetUserArg.username} (${targetUserArg.email})`;
      targetUsersCount = 1;
      console.log(`  ${c.brightGreen}✔ Utilisateur ciblé : ${targetDisplay}${c.reset}`);
    } else if (targetUserArg === 'all') {
      const allUsers = await getAllUsers();
      targetUserId = 'all';
      targetUsersCount = allUsers.length;
      console.log(`  ${c.brightGreen}✔ Boost global pour ${targetUsersCount} utilisateur(s).${c.reset}`);
    } else {
      const found = (await sql`
        SELECT id, email, username FROM users 
        WHERE id::text = ${targetUserArg}::text OR username = ${targetUserArg} OR email = ${targetUserArg}
        LIMIT 1
      `) as unknown as TargetUser[];
      if (found.length > 0) {
        targetUserId = String(found[0].id);
        targetDisplay = `${found[0].username} (${found[0].email})`;
        targetUsersCount = 1;
        console.log(`  ${c.brightGreen}✔ Utilisateur ciblé : ${targetDisplay}${c.reset}`);
      }
    }
  } else {
    // 1. Destinataires
    console.log(`${c.bold}1. Destinataire(s) du Boost :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 👤 Choisir un utilisateur spécifique (liste interactive ou recherche)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} ⭐ Tous les utilisateurs de la plateforme (Boost Global)`);
    const destChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

    if (destChoice === '1') {
      const selected = await promptSelectUser(rl);
      if (!selected) {
        console.log(`\n${c.dim}Action annulée (aucun utilisateur sélectionné).${c.reset}`);
        return;
      }
      targetUserId = String(selected.id);
      targetDisplay = `${selected.username} (${selected.email})`;
      targetUsersCount = 1;
    } else {
      const allUsers = await getAllUsers();
      targetUsersCount = allUsers.length;
      console.log(`  ${c.brightGreen}✔ Boost global pour ${targetUsersCount} utilisateur(s).${c.reset}`);
    }
  }

  // 2. Quota à augmenter
  console.log(`\n${c.bold}2. Quel quota augmenter ?${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} ⚡ TOUS les quotas simultanément (API + mAI + Images + Audio)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 🧠 Quota mAI (Tokens hebdomadaires)`);
  console.log(`  ${c.brightCyan}[3]${c.reset} 🔑 Quota API (Requêtes mensuelles clés API)`);
  console.log(`  ${c.brightCyan}[4]${c.reset} 🎨 Quota Images (Générations journalières)`);
  console.log(`  ${c.brightCyan}[5]${c.reset} 🎙️ Quota Audio (Tokens de synthèse vocale)`);
  const qChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-5] (défaut 1) : ${c.reset}`)).trim() || '1';

  const typesToBoost: Array<{ type: 'mai' | 'api' | 'images' | 'audio'; label: string; defaultAmount: number }> = [];
  if (qChoice === '2') typesToBoost.push({ type: 'mai', label: 'Tokens mAI', defaultAmount: 5_000_000 });
  else if (qChoice === '3') typesToBoost.push({ type: 'api', label: "Requêtes d'API", defaultAmount: 1_000 });
  else if (qChoice === '4') typesToBoost.push({ type: 'images', label: 'Images journalières', defaultAmount: 10 });
  else if (qChoice === '5') typesToBoost.push({ type: 'audio', label: 'Tokens Speech Audio', defaultAmount: 50_000_000 });
  else {
    typesToBoost.push(
      { type: 'api', label: "Requêtes d'API", defaultAmount: 1_000 },
      { type: 'mai', label: 'Tokens mAI', defaultAmount: 5_000_000 },
      { type: 'images', label: 'Images journalières', defaultAmount: 10 },
      { type: 'audio', label: 'Tokens Speech Audio', defaultAmount: 50_000_000 },
    );
  }

  // 3. Montants du Boost
  console.log(`\n${c.bold}3. Montant de l'augmentation :${c.reset}`);
  const finalBoosts: Array<{ type: 'mai' | 'api' | 'images' | 'audio'; amount: number }> = [];

  for (const item of typesToBoost) {
    const promptStr = `  ${c.brightYellow}➔ Quantité ajoutée pour [${item.label}] (défaut +${item.defaultAmount.toLocaleString('fr-FR')}) : ${c.reset}`;
    const ans = (await rl.question(promptStr)).trim();
    const val = ans && !isNaN(Number(ans.replace(/\s+/g, ''))) ? Number(ans.replace(/\s+/g, '')) : item.defaultAmount;
    finalBoosts.push({ type: item.type, amount: val });
  }

  // 4. Période de validité
  console.log(`\n${c.bold}4. Période de validité du Boost :${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} ⏳ Jusqu'à une date précise (Démarre dès maintenant)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 🗓️ Entre telle date et telle date (Période planifiée)`);
  const periodChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

  let startsAt = new Date();
  let expiresAt: Date | null = null;

  if (periodChoice === '2') {
    // Plage de dates Début -> Fin
    const startStr = (await rl.question(`  ${c.brightYellow}➔ Date de début (ex: 2026-09-01, ou "maintenant") : ${c.reset}`)).trim();
    const parsedStart = parseDateInput(startStr, true);
    if (!parsedStart) {
      console.log(`❌ Format de date de début invalide.`);
      return;
    }
    startsAt = parsedStart;

    const endStr = (await rl.question(`  ${c.brightYellow}➔ Date de fin (ex: 2026-09-30 ou +14j) : ${c.reset}`)).trim();
    const parsedEnd = parseDateInput(endStr, false);
    if (!parsedEnd || parsedEnd <= startsAt) {
      console.log(`❌ Date de fin invalide ou antérieure à la date de début.`);
      return;
    }
    expiresAt = parsedEnd;
  } else {
    // Jusqu'à une date précise
    const endStr = (await rl.question(`  ${c.brightYellow}➔ Jusqu'à quelle date ? (ex: 2026-09-30, ou +14j, +30j) : ${c.reset}`)).trim() || '+30j';
    const parsedEnd = parseDateInput(endStr, false);
    if (!parsedEnd || parsedEnd <= startsAt) {
      console.log(`❌ Date d'expiration invalide ou déjà passée.`);
      return;
    }
    expiresAt = parsedEnd;
  }

  // 5. Motif / Raison (optionnel)
  console.log(`\n${c.bold}5. Motif ou Raison (optionnel) :${c.reset}`);
  const reason = (await rl.question(`  ${c.brightYellow}➔ Motif (ex: Offre spéciale rentrée, compensation technique...) : ${c.reset}`)).trim();

  // 6. Notification e-mail
  console.log(`\n${c.bold}6. Notification :${c.reset}`);
  const notifAns = (await rl.question(`  ${c.brightYellow}➔ Envoyer un e-mail à tous les utilisateurs concernés ? (O/n) : ${c.reset}`)).trim().toLowerCase();
  const sendNotif = notifAns !== 'n' && notifAns !== 'non';

  // 7. Récapitulatif
  console.log(`\n${c.bold}══════════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}  RÉCAPITULATIF DU BOOST DE QUOTA :${c.reset}`);
  console.log(`  - Destinataire(s)  : ${targetDisplay} (${targetUsersCount} compte(s))`);
  console.log(`  - Augmentations    :`);
  finalBoosts.forEach((b) => {
    console.log(`      • ${b.type.toUpperCase()} : +${formatBoostAmount(b.type, b.amount)}`);
  });
  console.log(`  - Début            : ${startsAt.toLocaleString('fr-FR')}`);
  console.log(`  - Fin (Expiration) : ${expiresAt.toLocaleString('fr-FR')}`);
  if (reason) console.log(`  - Motif            : ${reason}`);
  console.log(`  - E-mails          : ${sendNotif ? '✉️ Envoi automatique activé' : 'Non envoyé'}`);
  console.log(`${c.bold}══════════════════════════════════════════════════════════════════${c.reset}\n`);

  const confirm = (await rl.question(`  ${c.brightYellow}➔ Confirmer et enregistrer ce Boost ? (o/n) : ${c.reset}`)).trim().toLowerCase();
  if (confirm !== 'o' && confirm !== 'oui' && confirm !== 'y') {
    console.log(`\n${c.dim}Action annulée.${c.reset}`);
    return;
  }

  console.log(`\n${c.cyan}⏳ Enregistrement du Boost de quota en base de données...${c.reset}`);
  for (const b of finalBoosts) {
    await createQuotaBoost({
      userId: targetUserId,
      quotaType: b.type,
      boostAmount: b.amount,
      startsAt,
      expiresAt,
      reason: reason || null,
      notify: sendNotif,
    });
  }

  console.log(`\n${c.brightGreen}${c.bold}🎉 Boost de quota activé avec succès !${c.reset}\n`);
}

export async function runQuotaBoostManager(rl: readline.Interface) {
  let inMenu = true;
  while (inMenu) {
    console.log(`\n${c.bold}--- GESTIONNAIRE D'AUGMENTATIONS DE QUOTAS (BOOSTS) ---${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 👤 Choisir un utilisateur pour lui appliquer un Boost`);
    console.log(`  ${c.brightCyan}[2]${c.reset} ⭐ Programmer un Boost pour TOUS les utilisateurs (Global)`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 📋 Consulter les augmentations actives ou programmées`);
    console.log(`  ${c.brightRed}[4]${c.reset} ❌ Révoquer / Désactiver un Boost existant`);
    console.log(`  ${c.white}[0]${c.reset} ↩️  Retour au menu principal`);
    console.log("");

    const choice = (await rl.question(`  ${c.brightYellow}➔ Votre choix [0-4] : ${c.reset}`)).trim();
    switch (choice) {
      case '1': {
        const selected = await promptSelectUser(rl);
        if (selected) {
          await runQuotaBoostWizard(rl, selected);
        }
        break;
      }
      case '2':
        await runQuotaBoostWizard(rl, 'all');
        break;
      case '3':
        await listActiveQuotaBoosts(rl);
        break;
      case '4': {
        await listActiveQuotaBoosts(rl);
        const boostIdStr = (await rl.question(`  ${c.brightYellow}➔ ID du Boost à révoquer : ${c.reset}`)).trim();
        if (boostIdStr && !isNaN(Number(boostIdStr))) {
          await sql`UPDATE user_quota_boosts SET is_active = FALSE WHERE id = ${Number(boostIdStr)}`;
          console.log(`\n${c.brightGreen}✔ Le Boost #${boostIdStr} a été désactivé avec succès.${c.reset}\n`);
        } else {
          console.log("Annulé ou ID invalide.");
        }
        break;
      }
      case '0':
      case 'exit':
      case 'quit':
        inMenu = false;
        break;
      default:
        console.log("⚠️ Choix invalide.");
    }
  }
}

// ─────────────────────────────────────────────
// 5. GESTIONNAIRE DE CODES D'ABONNEMENT
// ─────────────────────────────────────────────
export async function initSubscriptionTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscription_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      tier VARCHAR(20) NOT NULL CHECK (tier IN ('Plus', 'Pro', 'Max')),
      max_uses INTEGER NOT NULL DEFAULT 1,
      uses_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMP WITH TIME ZONE NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subscription_code_redemptions (
      id SERIAL PRIMARY KEY,
      code_id INTEGER REFERENCES subscription_codes(id) ON DELETE CASCADE,
      user_id VARCHAR(100) NOT NULL,
      redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT uq_user_code UNIQUE(code_id, user_id)
    );
  `;
}

export function generateRandomCode(tier: string): string {
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `MAI-${tier.toUpperCase()}-${randomChars}`;
}

function renderCodesTable(codes: any[]) {
  if (codes.length === 0) {
    console.log(`\n${c.brightYellow}⚠️  Aucun code d'abonnement trouvé en base de données.${c.reset}\n`);
    return;
  }

  console.log("\n" + "=".repeat(95));
  console.log(
    `| ${"ID".padEnd(4)} | ${"CODE".padEnd(24)} | ${"TIER".padEnd(6)} | ${"UTILISATIONS".padEnd(14)} | ${"STATUT".padEnd(10)} | ${"EXPIRATION".padEnd(20)} |`
  );
  console.log("=".repeat(95));

  for (const item of codes) {
    const id = String(item.id).padEnd(4);
    const code = String(item.code).padEnd(24);
    const tier = String(item.tier).padEnd(6);
    const uses = `${item.uses_count}/${item.max_uses}`.padEnd(14);
    const status = (item.is_active ? "🟢 Actif" : "🔴 Inactif").padEnd(10);
    const exp = item.expires_at ? new Date(item.expires_at).toLocaleDateString('fr-FR') : "Illimitée";
    const expiration = exp.padEnd(20);

    console.log(`| ${id} | ${code} | ${tier} | ${uses} | ${status} | ${expiration} |`);
  }
  console.log("=".repeat(95) + "\n");
}

async function handleCreateCode(rl: readline.Interface) {
  console.log(`\n${c.bold}--- ➕ CRÉATION D'UN NOUVEAU CODE D'ABONNEMENT ---${c.reset}`);

  console.log("\nChoisissez le forfait à débloquer :");
  console.log("  1. Plus");
  console.log("  2. Pro");
  console.log("  3. Max");
  const tierChoice = (await rl.question("👉 Votre choix [1-3] (défaut: 2 - Pro) : ")).trim();
  
  let tier: 'Plus' | 'Pro' | 'Max' = 'Pro';
  if (tierChoice === '1') tier = 'Plus';
  else if (tierChoice === '3') tier = 'Max';

  console.log("\nMode de génération du code :");
  console.log(`  1. Génération intelligente automatique (ex: MAI-${tier.toUpperCase()}-XXXXXX)`);
  console.log("  2. Saisie manuelle d'un code personnalisé");
  const modeChoice = (await rl.question("👉 Votre choix [1-2] (défaut: 1) : ")).trim();

  let finalCode = "";
  if (modeChoice === '2') {
    while (!finalCode) {
      const custom = (await rl.question("👉 Entrez votre code personnalisé : ")).trim().toUpperCase();
      if (custom.length >= 3) {
        finalCode = custom;
      } else {
        console.log("❌ Le code doit comporter au moins 3 caractères.");
      }
    }
  } else {
    finalCode = generateRandomCode(tier);
  }

  const usesInput = (await rl.question("👉 Nombre maximal d'utilisations (défaut: 1) : ")).trim();
  const maxUses = parseInt(usesInput, 10) > 0 ? parseInt(usesInput, 10) : 1;

  const daysInput = (await rl.question("👉 Durée de validité en jours (laisser vide pour illimité) : ")).trim();
  const expiresInDays = parseInt(daysInput, 10) > 0 ? parseInt(daysInput, 10) : null;

  let expiresAt: Date | null = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  try {
    const result = await sql`
      INSERT INTO subscription_codes (code, tier, max_uses, uses_count, is_active, expires_at)
      VALUES (${finalCode}, ${tier}, ${maxUses}, 0, TRUE, ${expiresAt})
      RETURNING *;
    `;

    const item = result[0];
    console.log(`\n${c.brightGreen}${c.bold}🎉 CODE CRÉÉ ET ENREGISTRÉ AVEC SUCCÈS !${c.reset}`);
    console.log(`🔑 Code         : ${c.brightGreen}${c.bold}${item.code}${c.reset}`);
    console.log(`⭐ Forfait      : ${item.tier}`);
    console.log(`👥 Utilisations : 0 / ${item.max_uses}`);
    console.log(`📅 Expiration   : ${item.expires_at ? new Date(item.expires_at).toLocaleString('fr-FR') : 'Illimitée'}\n`);
  } catch (err: any) {
    console.error("❌ Erreur lors de la création :", err.message || err);
  }
}

async function handleListCodes() {
  console.log(`\n${c.bold}--- 📋 LISTE DES CODES D'ABONNEMENT ---${c.reset}`);
  const codes = await sql`SELECT * FROM subscription_codes ORDER BY created_at DESC;`;
  renderCodesTable(codes);
}

async function handleToggleCode(rl: readline.Interface) {
  console.log(`\n${c.bold}--- 🔄 ACTIVER / DÉSACTIVER UN CODE ---${c.reset}`);
  const search = (await rl.question("👉 Entrez le Code ou l'ID du code à basculer : ")).trim();
  if (!search) return;

  const found = await sql`
    SELECT * FROM subscription_codes 
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log("❌ Aucun code correspondant trouvé.");
    return;
  }

  const current = found[0];
  const newStatus = !current.is_active;

  await sql`
    UPDATE subscription_codes 
    SET is_active = ${newStatus}
    WHERE id = ${current.id};
  `;

  console.log(`\n${c.brightGreen}✔ Le statut du code ${c.bold}${current.code}${c.reset} est désormais : ${newStatus ? '🟢 ACTIF' : '🔴 INACTIF'}\n`);
}

async function handleEditCode(rl: readline.Interface) {
  console.log(`\n${c.bold}--- ✏️ MODIFIER UN CODE D'ABONNEMENT ---${c.reset}`);
  const search = (await rl.question("👉 Entrez le Code ou l'ID à modifier : ")).trim();
  if (!search) return;

  const found = await sql`
    SELECT * FROM subscription_codes 
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log("❌ Aucun code trouvé.");
    return;
  }

  const current = found[0];
  console.log(`\nCode actuel : ${c.brightGreen}${current.code}${c.reset} (Tier: ${current.tier}, Max: ${current.max_uses}, Actif: ${current.is_active})`);

  console.log("\nModifier le forfait (laisser vide pour conserver '" + current.tier + "') :");
  console.log("  1. Plus | 2. Pro | 3. Max");
  const tierInput = (await rl.question("👉 Choix [1-3] : ")).trim();
  let newTier = current.tier;
  if (tierInput === '1') newTier = 'Plus';
  if (tierInput === '2') newTier = 'Pro';
  if (tierInput === '3') newTier = 'Max';

  const usesInput = (await rl.question(`👉 Nouveau quota maximal (actuel: ${current.max_uses}) : `)).trim();
  const newMaxUses = parseInt(usesInput, 10) > 0 ? parseInt(usesInput, 10) : current.max_uses;

  const statusInput = (await rl.question(`👉 Rendre actif ? (o/n, actuel: ${current.is_active ? 'Oui' : 'Non'}) : `)).trim().toLowerCase();
  let newActive = current.is_active;
  if (statusInput === 'o' || statusInput === 'oui' || statusInput === 'y') newActive = true;
  else if (statusInput === 'n' || statusInput === 'non') newActive = false;

  await sql`
    UPDATE subscription_codes
    SET tier = ${newTier},
        max_uses = ${newMaxUses},
        is_active = ${newActive}
    WHERE id = ${current.id};
  `;

  console.log(`\n${c.brightGreen}✔ Code ${c.bold}${current.code}${c.reset} mis à jour avec succès !\n`);
}

async function handleDeleteCode(rl: readline.Interface) {
  console.log(`\n${c.bold}--- 🗑️ SUPPRESSION D'UN CODE D'ABONNEMENT ---${c.reset}`);
  const search = (await rl.question("👉 Entrez le Code ou l'ID du code à supprimer : ")).trim();
  if (!search) return;

  const found = await sql`
    SELECT * FROM subscription_codes 
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log("❌ Aucun code trouvé.");
    return;
  }

  const current = found[0];
  const confirm = (await rl.question(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement le code "${current.code}" ? (o/N) : `)).trim().toLowerCase();

  if (confirm === 'o' || confirm === 'oui' || confirm === 'y') {
    await sql`DELETE FROM subscription_codes WHERE id = ${current.id};`;
    console.log(`\n${c.brightGreen}🗑️ Le code ${current.code} a été supprimé définitivement.${c.reset}\n`);
  } else {
    console.log("\n❌ Suppression annulée.\n");
  }
}

export async function runSubscriptionCodeManager() {
  await initSubscriptionTables();
  const rl = readline.createInterface({ input, output });

  console.log("\n=======================================================");
  console.log("🎟️  GESTIONNAIRE INTERACTIF DES CODES D'ABONNEMENT mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log("\n--- MENU DES CODES ---");
    console.log("  1. ➕ Créer un nouveau code d'abonnement");
    console.log("  2. 📋 Lister tous les codes (actifs / inactifs)");
    console.log("  3. 🔄 Activer / Désactiver un code");
    console.log("  4. ✏️  Modifier un code existant");
    console.log("  5. 🗑️  Supprimer un code");
    console.log("  0. ↩️  Retour / Quitter");

    const choice = (await rl.question("\n👉 Entrez votre choix [0-5] : ")).trim();

    switch (choice) {
      case '1':
        await handleCreateCode(rl);
        break;
      case '2':
        await handleListCodes();
        break;
      case '3':
        await handleToggleCode(rl);
        break;
      case '4':
        await handleEditCode(rl);
        break;
      case '5':
        await handleDeleteCode(rl);
        break;
      case '0':
      case 'exit':
      case 'quit':
        running = false;
        break;
      default:
        console.log("⚠️ Option invalide.");
    }
  }

  rl.close();
}

// ─────────────────────────────────────────────
// 6. GESTION DES COMPTES CLIENTS
// ─────────────────────────────────────────────
export async function initCustomersTable() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE profiles ALTER COLUMN display_name DROP NOT NULL;`.catch(() => {});
  } catch (err: any) {
    console.error("ℹ Note lors de la vérification des colonnes dans users/profiles :", err.message || err);
  }
}

export async function initAccountAuditTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_account_actions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_account_actions_user_id ON user_account_actions(user_id)`;
    await sql`
      DO $$
      BEGIN
        ALTER TABLE user_account_actions DROP CONSTRAINT IF EXISTS user_account_actions_action_check;
        ALTER TABLE user_account_actions ALTER COLUMN action TYPE VARCHAR(50);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `;
  } catch (err: any) {
    console.error("ℹ Note lors de la création de la table d'audit :", err.message || err);
  }
}

function renderCustomersTable(customers: any[]) {
  if (customers.length === 0) {
    console.log(`\n${c.brightYellow}⚠️  Aucun compte client trouvé en base de données.${c.reset}\n`);
    return;
  }

  console.log("\n" + "═".repeat(120));
  console.log(
    `║ ${"ID".padEnd(6)} ║ ${"USERNAME".padEnd(18)} ║ ${"NOM AFFICHÉ".padEnd(20)} ║ ${"TIER".padEnd(6)} ║ ${"VÉRIFIÉ".padEnd(10)} ║ ${"POSTS".padEnd(7)} ║ ${"STATUT".padEnd(10)} ║`
  );
  console.log("═".repeat(120));

  for (const user of customers) {
    const id = String(user.id || "").padEnd(6);
    const username = String(user.username || "").padEnd(18).substring(0, 18);
    const displayName = String(user.display_name || "-").padEnd(20).substring(0, 20);
    const tier = String(user.tier || "Free").padEnd(6);
    const isVerified = Boolean(user.is_verified);
    const verifiedBadge = isVerified ? "🔵 Oui" : "⚪ Non";
    const postsCount = String(user.posts_count ?? 0).padEnd(7);
    const status = (user.is_blocked ? "🔴 Bloqué" : "🟢 Actif").padEnd(10);

    console.log(`║ ${id} ║ ${username} ║ ${displayName} ║ ${tier} ║ ${verifiedBadge.padEnd(10)} ║ ${postsCount} ║ ${status} ║`);
  }
  console.log("═".repeat(120) + "\n");
}

async function handleListCustomers() {
  console.log(`\n${c.bold}--- 📋 LISTE DES COMPTES CLIENTS ---${c.reset}`);
  try {
    const customers = await sql`
      SELECT u.id, u.username, u.email, u.tier, u.is_blocked,
             (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
             pr.display_name, pr.posts_count, pr.followers_count
      FROM users u
      LEFT JOIN profiles pr ON pr.user_id = u.id
      ORDER BY u.id ASC;
    `;
    renderCustomersTable(customers);
  } catch (err: any) {
    console.error("❌ Erreur lors de la récupération des clients :", err.message || err);
  }
}

// Liste numérotée des clients et sélection précise par l'administrateur
async function pickCustomer(rl: readline.Interface, actionLabel: string): Promise<any | null> {
  let filter = "";
  while (true) {
    let customers = await sql`
      SELECT u.id, u.username, u.email, u.tier, u.is_blocked,
             (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
             pr.display_name, pr.bio, pr.avatar_url, pr.banner_url, pr.website, pr.location,
             pr.followers_count, pr.following_count, pr.posts_count
      FROM users u
      LEFT JOIN profiles pr ON pr.user_id = u.id
      ORDER BY u.username ASC;
    `;
    const term = filter.trim().toLowerCase();
    if (term) {
      customers = customers.filter(
        (u: any) =>
          String(u.username || "").toLowerCase().includes(term) ||
          String(u.email || "").toLowerCase().includes(term) ||
          String(u.display_name || "").toLowerCase().includes(term) ||
          String(u.id || "").toLowerCase().includes(term)
      );
    }

    console.log(`\n${c.bold}--- 👤 ${actionLabel} : SÉLECTION DU CLIENT ---${c.reset}`);
    if (customers.length === 0) {
      console.log(`    ${c.brightYellow}⚠️  Aucun client ne correspond au filtre "${filter}".${c.reset}`);
    } else {
      console.log("    " + "─".repeat(88));
      console.log(`    #  | ${c.bold}${"CLIENT / EMAIL".padEnd(38)}${c.reset} | ${c.bold}${"TIER".padEnd(8)}${c.reset} | ${c.bold}${"VÉRIFIÉ".padEnd(10)}${c.reset} | ${c.bold}${"STATUT".padEnd(10)}${c.reset}`);
      console.log("    " + "─".repeat(88));
      customers.forEach((u: any, idx: number) => {
        const label = `${u.username || "?"} <${u.email || "?"}>`;
        const tierBadge = `[${u.tier || "Free"}]`.padEnd(8);
        const verifiedBadge = u.is_verified ? `${c.brightCyan}🔵 Oui${c.reset}` : `${c.dim}⚪ Non${c.reset}`;
        const status = u.is_blocked ? `${c.red}🔴 Bloqué${c.reset}` : `${c.green}🟢 Actif${c.reset}`;
        console.log(`    ${String(idx + 1).padStart(2)} | ${label.padEnd(42).substring(0, 42)} | ${tierBadge} | ${verifiedBadge.padEnd(14)} | ${status}`);
      });
      console.log("    " + "─".repeat(88));
    }

    const inputVal = (
      await rl.question(
        `👉 Numéro du client à sélectionner (ou texte pour filtrer, ${c.bold}0${c.reset} pour annuler) : `
      )
    ).trim();
    if (!inputVal) continue;

    if (/^\d+$/.test(inputVal)) {
      const n = parseInt(inputVal, 10);
      if (n === 0) {
        console.log(`${c.dim}↩️  Annulé.${c.reset}`);
        return null;
      }
      const chosen = customers[n - 1];
      if (!chosen) {
        console.log("❌ Numéro invalide.");
        continue;
      }
      return chosen;
    }

    filter = inputVal;
  }
}

async function getFullCustomerProfile(userId: number | string) {
  const rows = await sql`
    SELECT u.id, u.username, u.email, u.tier, u.is_blocked, u.avatar_url as user_avatar,
           (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as effective_verified,
           COALESCE(u.is_verified, FALSE) as is_verified,
           pr.id as profile_id, pr.display_name, pr.bio, pr.avatar_url as profile_avatar,
           pr.banner_url, pr.website, pr.website_url, pr.location, pr.status_emoji, pr.status_text,
           pr.followers_count, pr.following_count, pr.posts_count
    FROM users u
    LEFT JOIN profiles pr ON pr.user_id = u.id
    WHERE u.id = ${Number(userId)}
    LIMIT 1
  `;
  const profile = rows[0] || null;
  if (!profile) return null;

  // Paramètre "code de vérification à chaque connexion" (colonne optionnelle jusqu'à application du script tmp/016)
  try {
    const flagRows = await sql`
      SELECT COALESCE(require_login_verification, TRUE) AS flag
      FROM users WHERE id = ${Number(userId)} LIMIT 1
    `;
    (profile as any).require_login_verification = flagRows[0]?.flag !== false;
  } catch {
    // Colonne non migrée : on considère le code exigé (comportement par défaut de l'API)
    (profile as any).require_login_verification = true;
  }

  return profile;
}

function renderProfileCard(user: any, actualPostsCount?: number) {
  const verifiedBadge = user.effective_verified ? `${c.brightCyan}🔵 VÉRIFIÉ (Actif)${c.reset}` : `${c.dim}⚪ Non vérifié${c.reset}`;
  const statusBadge = user.is_blocked ? `${c.red}🔴 Bloqué${c.reset}` : `${c.green}🟢 Actif${c.reset}`;
  const tierBadge = `[${user.tier || 'Free'}]`;

  console.log("\n" + "╔".padEnd(68, "═") + "╗");
  console.log(`║ ${c.bold}PROFIL UTILISATEUR : @${user.username}${c.reset}`.padEnd(76) + "║");
  console.log("╠".padEnd(68, "═") + "╣");
  console.log(`║  ${c.dim}ID :${c.reset} ${String(user.id).padEnd(20)} ${c.dim}Statut :${c.reset} ${statusBadge}`);
  console.log(`║  ${c.dim}Email :${c.reset} ${String(user.email).padEnd(28)} ${c.dim}Tier :${c.reset} ${tierBadge}`);
  console.log(`║  ${c.dim}Badge Vérifié :${c.reset} ${verifiedBadge}`);
  console.log("╟".padEnd(68, "─") + "╢");
  console.log(`║  ${c.dim}Nom affiché :${c.reset} ${user.display_name || '(aucun)'}`);
  console.log(`║  ${c.dim}Bio :${c.reset} ${user.bio ? user.bio.substring(0, 50) + (user.bio.length > 50 ? '…' : '') : '(vide)'}`);
  console.log(`║  ${c.dim}Localisation :${c.reset} ${user.location || '(non renseignée)'}`);
  console.log(`║  ${c.dim}Site web :${c.reset} ${user.website || user.website_url || '(aucun)'}`);
  console.log(`║  ${c.dim}Avatar :${c.reset} ${user.profile_avatar || user.user_avatar || '(par défaut)'}`);
  console.log(`║  ${c.dim}Bannière :${c.reset} ${user.banner_url || '(par défaut)'}`);
  console.log("╟".padEnd(68, "─") + "╢");
  const postsInfo = actualPostsCount !== undefined && actualPostsCount !== user.posts_count
    ? `${user.posts_count || 0} (⚠️ réel en base : ${actualPostsCount})`
    : `${user.posts_count || 0}`;
  console.log(`║  ${c.dim}Stats :${c.reset} 📝 ${postsInfo} posts  |  👥 ${user.followers_count || 0} abonnés  |  🚶 ${user.following_count || 0} abonnements`);
  console.log("╚".padEnd(68, "═") + "╝\n");
}

export async function handleEditCustomerAvatar(rl: readline.Interface, targetUserArg?: any) {
  let user = targetUserArg;
  if (!user) {
    user = await pickCustomer(rl, "MODIFIER L'IMAGE D'AVATAR D'UN PROFIL CLIENT");
    if (!user) return;
  }

  const full = await getFullCustomerProfile(user.id);
  if (!full) {
    console.log(`❌ Profil introuvable.`);
    return;
  }

  const currentAvatar = full.profile_avatar || full.user_avatar || '';
  console.log(`\n${c.bold}🖼️  AVATAR ACTUEL DE @${full.username} :${c.reset}`);
  console.log(`  ${currentAvatar || c.dim + '(aucun — avatar par défaut)' + c.reset}`);
  console.log(`\n${c.bold}Actions disponibles :${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} 🔗 Définir une nouvelle image via URL`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 🎲 Générer un avatar aléatoire (DiceBear)`);
  console.log(`  ${c.brightCyan}[3]${c.reset} 🧹 Réinitialiser (supprimer l'avatar personnalisé)`);
  console.log(`  ${c.white}[0]${c.reset} ↩️  Annuler`);

  const choice = (await rl.question(`\n  ${c.brightYellow}➔ Choix [0-3] : ${c.reset}`)).trim();
  if (choice === '0') return;

  let newAvatarUrl: string | null = null;
  if (choice === '1') {
    newAvatarUrl = (await rl.question(`  ➔ URL de la nouvelle image d'avatar : `)).trim() || null;
    if (!newAvatarUrl) {
      console.log(`❌ Aucune URL fournie. Action annulée.`);
      return;
    }
  } else if (choice === '2') {
    const seed = `${full.username}-${crypto.randomBytes(4).toString('hex')}`;
    newAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
  } else if (choice === '3') {
    newAvatarUrl = null;
  } else {
    console.log(`❌ Option invalide.`);
    return;
  }

  await sql`UPDATE users SET avatar_url = ${newAvatarUrl} WHERE id = ${Number(full.id)}`;
  await sql`
    INSERT INTO profiles (user_id, display_name, avatar_url, updated_at)
    VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${newAvatarUrl}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET avatar_url = ${newAvatarUrl}, updated_at = NOW()
  `;

  const resultLabel = newAvatarUrl
    ? `✔ Avatar mis à jour pour @${full.username} :\n    ${newAvatarUrl}`
    : `✔ Avatar réinitialisé : @${full.username} utilisera l'avatar par défaut de l'application.`;
  console.log(`\n${c.brightGreen}${resultLabel}${c.reset}\n`);
}

// ─────────────────────────────────────────────
// 6b. MODIFICATION DU NOMBRE D'ABONNÉS D'UN UTILISATEUR VIBE
// ─────────────────────────────────────────────
export async function handleEditVibeUserFollowers(rl: readline.Interface, targetUserArg?: TargetUser | string) {
  let user: TargetUser | null = null;

  if (targetUserArg) {
    if (typeof targetUserArg === 'object') {
      user = targetUserArg;
    } else {
      // Identifiant passé en argument : résoudre id / username / email
      const found = (await sql`
        SELECT id, email, username FROM users
        WHERE id::text = ${targetUserArg} OR username = ${targetUserArg} OR email = ${targetUserArg}
        LIMIT 1
      `) as unknown as TargetUser[];
      user = found[0] || null;
    }
  } else {
    // Sélection interactive d'un utilisateur Vibe (liste + recherche)
    user = await promptSelectUser(rl);
  }

  if (!user) {
    console.log(`\n${c.dim}Action annulée (aucun utilisateur Vibe sélectionné).${c.reset}`);
    return;
  }

  const fallbackDisplayName = user.username || `User_${user.id}`;

  // S'assurer que le profil existe (créé avec le nom d'affichage par défaut sinon) puis lire le compteur actuel
  await sql`
    INSERT INTO profiles (user_id, display_name, updated_at)
    VALUES (${Number(user.id)}, ${fallbackDisplayName}, NOW())
    ON CONFLICT (user_id) DO NOTHING
  `;
  const rows = await sql`SELECT followers_count FROM profiles WHERE user_id = ${Number(user.id)} LIMIT 1`;
  const current = Number(rows[0]?.followers_count ?? 0);

  console.log(`\n${c.bold}👥 NOMBRE D'ABONNÉS — @${user.username} (actuel : ${current.toLocaleString('fr-FR')})${c.reset}`);
  console.log(`  ${c.dim}Laisser vide pour conserver la valeur actuelle.${c.reset}`);
  const folStr = (await rl.question(`  ➔ Nouveau nombre d'abonnés (ou +/-N pour relatif, ex: 1200, +500, -50) : `)).trim();
  if (!folStr) {
    console.log(`  ${c.dim}Inchangé.${c.reset}`);
    return;
  }

  let newFollowers: number | null = null;
  const relMatch = folStr.match(/^([+-])\s*(\d+)$/);
  if (relMatch) {
    const delta = Number(relMatch[2]);
    newFollowers = relMatch[1] === '+' ? current + delta : Math.max(0, current - delta);
  } else if (!isNaN(Number(folStr.replace(/\s+/g, '')))) {
    newFollowers = Math.max(0, Math.floor(Number(folStr.replace(/\s+/g, ''))));
  }
  if (newFollowers === null) {
    console.log(`  ${c.red}❌ Valeur invalide (entier attendu, ex: 1200, +500, -50).${c.reset}`);
    return;
  }

  await sql`
    INSERT INTO profiles (user_id, display_name, followers_count, updated_at)
    VALUES (${Number(user.id)}, ${fallbackDisplayName}, ${newFollowers}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET followers_count = ${newFollowers}, updated_at = NOW()
  `;

  console.log(`  ${c.brightGreen}✔ Nombre d'abonnés de @${user.username} mis à jour : ${current.toLocaleString('fr-FR')} → ${newFollowers.toLocaleString('fr-FR')}${c.reset}\n`);
}

export async function handleToggleVerifiedBadge(rl: readline.Interface, targetUserArg?: any) {
  let user = targetUserArg;
  if (!user) {
    user = await pickCustomer(rl, "GESTION DE LA COCHE VÉRIFIÉE");
    if (!user) return;
  }

  const full = await getFullCustomerProfile(user.id);
  if (!full) {
    console.log(`❌ Utilisateur introuvable.`);
    return;
  }

  const currentVerified = Boolean(full.is_verified);
  const effectiveVerified = Boolean(full.effective_verified);
  const isPaid = ['plus', 'pro', 'max'].includes(String(full.tier || '').toLowerCase());

  console.log(`\n${c.bold}--- 🔵 STATUT DE LA COCHE VÉRIFIÉE : @${full.username} ---${c.reset}`);
  console.log(`  - Statut DB (is_verified) : ${currentVerified ? `${c.brightCyan}🔵 Actif (TRUE)${c.reset}` : `${c.dim}⚪ Inactif (FALSE)${c.reset}`}`);
  console.log(`  - Tier / Abonnement       : [${full.tier || 'Free'}]`);
  console.log(`  - Statut effectif app     : ${effectiveVerified ? `${c.brightGreen}✓ Vérifié visible dans l'app${c.reset}` : `${c.dim}Non vérifié${c.reset}`}`);
  if (isPaid && !currentVerified) {
    console.log(`    ${c.yellow}ℹ Note : Ce compte est au tier "${full.tier}", ce qui lui donne automatiquement le badge vérifié dans l'application.${c.reset}`);
  }

  console.log(`\n${c.bold}Que souhaitez-vous faire ?${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} 🔵 Activer la coche vérifiée (is_verified = TRUE)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} ⚪ Retirer la coche vérifiée (is_verified = FALSE)`);
  console.log(`  ${c.brightCyan}[3]${c.reset} 🔄 Inverser le statut actuel`);
  console.log(`  ${c.white}[0]${c.reset} ↩️  Annuler`);

  const choice = (await rl.question(`\n  ${c.brightYellow}➔ Choix [0-3] : ${c.reset}`)).trim();
  if (choice === '0') return;

  let targetState = currentVerified;
  if (choice === '1') targetState = true;
  else if (choice === '2') targetState = false;
  else if (choice === '3') targetState = !currentVerified;
  else {
    console.log(`❌ Option invalide.`);
    return;
  }

  // Appliquer en DB (users + profiles)
  await sql`UPDATE users SET is_verified = ${targetState} WHERE id = ${Number(full.id)}`;
  await sql`
    INSERT INTO profiles (user_id, display_name, is_verified, updated_at)
    VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${targetState}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET is_verified = ${targetState}, updated_at = NOW()
  `;

  try {
    await sql`
      INSERT INTO user_account_actions (user_id, action, reason)
      VALUES (${String(full.id)}, ${targetState ? 'verify' : 'unverify'}, 'Coche vérifiée mise à jour via console admin')
    `;
  } catch {}

  console.log(`\n${c.brightGreen}✔ Coche vérifiée mise à jour avec succès : ${targetState ? '🔵 ACTIVÉE' : '⚪ DÉSACTIVÉE'} pour @${full.username}.${c.reset}`);

  // Si on désactive la vérification mais que le compte est Plus/Pro/Max, proposer de rétrograder le tier
  if (!targetState && isPaid) {
    console.log(`\n${c.brightYellow}⚠️  RAPPEL IMPORTANT :${c.reset}`);
    console.log(`L'utilisateur @${full.username} a le tier "${full.tier}". Les abonnés payants ont le badge vérifié automatiquement dans l'application.`);
    const downgrade = (await rl.question(`➔ Voulez-vous également passer son tier à "Free" pour supprimer totalement le badge de l'app ? (o/N) : `)).trim().toLowerCase();
    if (['o', 'oui', 'y'].includes(downgrade)) {
      await sql`UPDATE users SET tier = 'Free' WHERE id = ${Number(full.id)}`;
      console.log(`${c.brightGreen}✔ Tier passé à "Free". Le badge n'apparaîtra plus nulle part pour @${full.username}.${c.reset}\n`);
    }
  }
}

export async function handleEditCustomerProfile(rl: readline.Interface, targetUserArg?: any) {
  let user = targetUserArg;
  if (!user) {
    user = await pickCustomer(rl, "MODIFIER UN PROFIL CLIENT");
    if (!user) return;
  }

  let running = true;
  while (running) {
    const full = await getFullCustomerProfile(user.id);
    if (!full) {
      console.log(`❌ Profil introuvable.`);
      return;
    }

    const actualPostsRows = await sql`SELECT COUNT(*)::int as count FROM posts WHERE author_id = ${Number(full.id)}`;
    const actualPosts = actualPostsRows[0]?.count ?? 0;

    renderProfileCard(full, actualPosts);

    console.log(`${c.bold}MODIFICATIONS DISPONIBLES :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 🔵 Basculer la coche Vérifiée (Badge : ${full.is_verified ? '🔵 Activé' : '⚪ Désactivé'})`);
    console.log(`  ${c.brightCyan}[2]${c.reset} 🏷️  Modifier le Tier / Abonnement (Actuel : [${full.tier || 'Free'}])`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 👤 Modifier le Nom d'utilisateur (Username) ou Email`);
    console.log(`  ${c.brightCyan}[4]${c.reset} 📛 Modifier le Nom d'affichage (Display Name)`);
    console.log(`  ${c.brightCyan}[5]${c.reset} 📝 Modifier la Biographie (Bio)`);
    console.log(`  ${c.brightCyan}[6]${c.reset} 🌐 Modifier le Site Web & Localisation`);
    console.log(`  ${c.brightCyan}[7]${c.reset} 🖼️  Modifier l'Avatar & Bannière (URLs)`);
    console.log(`  ${c.brightCyan}[8]${c.reset} 📊 Synchroniser / Recalculer les compteurs (Posts, Abonnés)`);
    console.log(`  ${c.brightGreen}[9]${c.reset} 📰 ${c.bold}Gérer & modifier les posts de ce compte (${actualPosts} posts)${c.reset}`);
    console.log(`  ${c.brightCyan}[10]${c.reset} 🔐 Code de vérification à chaque connexion (Actuel : ${full.require_login_verification ? 'Activé' : 'Désactivé'})`);
    console.log(`  ${c.brightCyan}[11]${c.reset} 👥 Modifier le nombre d'abonnés (Actuel : ${(full.followers_count || 0).toLocaleString('fr-FR')})`);
    console.log(`  ${c.white}[0]${c.reset} ↩️  Retour`);

    const choice = (await rl.question(`\n  ${c.brightYellow}➔ Votre choix [0-11] : ${c.reset}`)).trim();

    switch (choice) {
      case '1':
        await handleToggleVerifiedBadge(rl, full);
        break;
      case '2': {
        console.log(`\n${c.bold}Choisir un nouveau Tier :${c.reset}`);
        console.log(`  [1] Free`);
        console.log(`  [2] Plus`);
        console.log(`  [3] Pro`);
        console.log(`  [4] Max`);
        const tc = (await rl.question(`  ➔ Choix [1-4] (actuel: ${full.tier || 'Free'}) : `)).trim();
        const tierMap: Record<string, string> = { '1': 'Free', '2': 'Plus', '3': 'Pro', '4': 'Max' };
        if (tierMap[tc]) {
          await sql`UPDATE users SET tier = ${tierMap[tc]} WHERE id = ${Number(full.id)}`;
          console.log(`  ${c.brightGreen}✔ Tier mis à jour : ${tierMap[tc]}${c.reset}`);
        } else {
          console.log(`${c.yellow}⚠️ Choix invalide ou inchangé.${c.reset}`);
        }
        break;
      }
      case '3': {
        console.log(`\n${c.bold}Identifiants de compte :${c.reset}`);
        const rawNewUsername = (await rl.question(`  ➔ Nouveau Username (vide pour conserver "${full.username}") : `)).trim().toLowerCase();
        const newUsername = /^[a-z0-9_]{2,30}$/.test(rawNewUsername) ? rawNewUsername : '';
        if (rawNewUsername && !newUsername) {
          console.log(`  ${c.red}❌ Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).${c.reset}`);
        } else if (newUsername && newUsername !== full.username) {
          const exists = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${newUsername}) AND id != ${Number(full.id)} LIMIT 1`;
          if (exists.length > 0) {
            console.log(`  ${c.red}❌ Ce nom d'utilisateur est déjà utilisé par un autre compte.${c.reset}`);
          } else {
            await sql`UPDATE users SET username = ${newUsername} WHERE id = ${Number(full.id)}`;
            console.log(`  ${c.brightGreen}✔ Nom d'utilisateur changé en @${newUsername}${c.reset}`);
            user.username = newUsername;
          }
        }
        const newEmail = (await rl.question(`  ➔ Nouvel Email (vide pour conserver "${full.email}") : `)).trim();
        if (newEmail && newEmail !== full.email) {
          const exists = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${newEmail}) AND id != ${Number(full.id)} LIMIT 1`;
          if (exists.length > 0) {
            console.log(`  ${c.red}❌ Cet e-mail est déjà utilisé par un autre compte.${c.reset}`);
          } else {
            await sql`UPDATE users SET email = ${newEmail} WHERE id = ${Number(full.id)}`;
            console.log(`  ${c.brightGreen}✔ E-mail changé en ${newEmail}${c.reset}`);
            user.email = newEmail;
          }
        }
        break;
      }
      case '4': {
        const newName = (await rl.question(`  ➔ Nom affiché (actuel: "${full.display_name || ''}") : `)).trim();
        const effectiveName = newName || full.display_name || full.username;
        await sql`
          INSERT INTO profiles (user_id, display_name, updated_at)
          VALUES (${Number(full.id)}, ${effectiveName}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET display_name = ${effectiveName}, updated_at = NOW()
        `;
        full.display_name = effectiveName;
        console.log(`  ${c.brightGreen}✔ Nom d'affichage mis à jour : ${effectiveName}${c.reset}`);
        break;
      }
      case '5': {
        console.log(`  Bio actuelle : ${full.bio || '(vide)'}`);
        const newBio = (await rl.question(`  ➔ Nouvelle biographie (tapez '-' pour vider) : `)).trim();
        const bioVal = newBio === '-' ? null : (newBio || full.bio);
        await sql`
          INSERT INTO profiles (user_id, display_name, bio, updated_at)
          VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${bioVal}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET bio = ${bioVal}, updated_at = NOW()
        `;
        full.bio = bioVal || undefined;
        console.log(`  ${c.brightGreen}✔ Biographie mise à jour !${c.reset}`);
        break;
      }
      case '6': {
        const newLoc = (await rl.question(`  ➔ Localisation (actuel: "${full.location || ''}") : `)).trim();
        const newWeb = (await rl.question(`  ➔ Site web (actuel: "${full.website || full.website_url || ''}") : `)).trim();
        await sql`
          INSERT INTO profiles (user_id, display_name, location, website, website_url, updated_at)
          VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${newLoc || null}, ${newWeb || null}, ${newWeb || null}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            location = COALESCE(${newLoc || null}, profiles.location),
            website = COALESCE(${newWeb || null}, profiles.website),
            website_url = COALESCE(${newWeb || null}, profiles.website_url),
            updated_at = NOW()
        `;
        if (newLoc) full.location = newLoc;
        if (newWeb) { full.website = newWeb; full.website_url = newWeb; }
        console.log(`  ${c.brightGreen}✔ Localisation et site web mis à jour !${c.reset}`);
        break;
      }
      case '7': {
        const newAvatar = (await rl.question(`  ➔ URL de l'Avatar (vide pour conserver) : `)).trim();
        if (newAvatar) {
          await sql`UPDATE users SET avatar_url = ${newAvatar} WHERE id = ${Number(full.id)}`;
          await sql`
            INSERT INTO profiles (user_id, display_name, avatar_url, updated_at)
            VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${newAvatar}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET avatar_url = ${newAvatar}, updated_at = NOW()
          `;
          full.profile_avatar = newAvatar;
          console.log(`  ${c.brightGreen}✔ Avatar mis à jour !${c.reset}`);
        }
        const newBanner = (await rl.question(`  ➔ URL de la Bannière (vide pour conserver) : `)).trim();
        if (newBanner) {
          await sql`
            INSERT INTO profiles (user_id, display_name, banner_url, updated_at)
            VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${newBanner}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET banner_url = ${newBanner}, updated_at = NOW()
          `;
          full.banner_url = newBanner;
          console.log(`  ${c.brightGreen}✔ Bannière mise à jour !${c.reset}`);
        }
        break;
      }
      case '8': {
        console.log(`  ${c.cyan}⏳ Recalcul des compteurs réels en base...${c.reset}`);
        const [postsCountRes, followersCountRes, followingCountRes] = await Promise.all([
          sql`SELECT COUNT(*)::int as n FROM posts WHERE author_id = ${Number(full.id)}`,
          sql`SELECT COUNT(*)::int as n FROM follows WHERE following_id = ${Number(full.id)}`.catch(() => [{ n: 0 }]),
          sql`SELECT COUNT(*)::int as n FROM follows WHERE follower_id = ${Number(full.id)}`.catch(() => [{ n: 0 }]),
        ]);
        const realPosts = postsCountRes[0]?.n || 0;
        const realFollowers = followersCountRes[0]?.n || 0;
        const realFollowing = followingCountRes[0]?.n || 0;

        await sql`
          INSERT INTO profiles (user_id, display_name, posts_count, followers_count, following_count, updated_at)
          VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${realPosts}, ${realFollowers}, ${realFollowing}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            posts_count = ${realPosts},
            followers_count = ${realFollowers},
            following_count = ${realFollowing},
            updated_at = NOW()
        `;
        full.posts_count = realPosts;
        full.followers_count = realFollowers;
        full.following_count = realFollowing;
        console.log(`  ${c.brightGreen}✔ Compteurs synchronisés : ${realPosts} posts, ${realFollowers} abonnés, ${realFollowing} abonnements.${c.reset}`);
        break;
      }
      case '9': {
        await handleManagePosts(rl, { id: String(full.id), username: full.username, email: full.email });
        break;
      }
      case '10': {
        const currentFlag = Boolean(full.require_login_verification);
        const targetFlag = !currentFlag;
        console.log(`\n${c.bold}🔐 CODE DE VÉRIFICATION À CHAQUE CONNEXION : @${full.username}${c.reset}`);
        console.log(`  - Statut actuel : ${currentFlag ? `${c.brightGreen}✓ Activé (un code est envoyé à chaque connexion)${c.reset}` : `${c.dim}○ Désactivé (connexion directe sans code)${c.reset}`}`);
        console.log(`\n  ${c.brightCyan}[1]${c.reset} ✅ Exiger un code de vérification à chaque connexion (TRUE)`);
        console.log(`  ${c.brightCyan}[2]${c.reset} ❌ Ne plus exiger de code (connexion directe, FALSE)`);
        console.log(`  ${c.brightCyan}[3]${c.reset} 🔄 Inverser le statut actuel`);
        console.log(`  ${c.white}[0]${c.reset} ↩️  Annuler`);
        const otpChoice = (await rl.question(`\n  ${c.brightYellow}➔ Choix [0-3] : ${c.reset}`)).trim();
        if (otpChoice === '0') break;
        let newState: boolean | null = null;
        if (otpChoice === '1') newState = true;
        else if (otpChoice === '2') newState = false;
        else if (otpChoice === '3') newState = !currentFlag;
        if (newState === null) {
          console.log(`❌ Option invalide.`);
          break;
        }
        try {
          await sql`UPDATE users SET require_login_verification = ${newState} WHERE id = ${Number(full.id)}`;
        } catch (e: any) {
          if (String(e?.message || '').includes('does not exist')) {
            console.log(`\n  ${c.red}❌ La colonne users.require_login_verification n'existe pas en base.${c.reset}`);
            console.log(`  ${c.yellow}ℹ Appliquez d'abord le script SQL temporaire : tmp/016_require_login_verification.sql${c.reset}`);
          } else {
            throw e;
          }
          break;
        }
        console.log(`\n  ${c.brightGreen}✔ Paramètre mis à jour : ${newState ? '🔐 UN CODE DE VÉRIFICATION SERA EXIGÉ À CHAQUE CONNEXION' : '⚡ CONNEXION DIRECTE SANS CODE DE VÉRIFICATION'} pour @${full.username}.${c.reset}`);
        break;
      }
      case '11': {
        console.log(`\n${c.bold}👥 NOMBRE D'ABONNÉS (actuel : ${(full.followers_count || 0).toLocaleString('fr-FR')})${c.reset}`);
        console.log(`  ${c.dim}Laisser vide pour conserver la valeur actuelle.${c.reset}`);
        const folStr = (await rl.question(`  ➔ Nouveau nombre d'abonnés (ou +/-N pour relatif, ex: +500, -50) : `)).trim();
        if (!folStr) {
          console.log(`  ${c.dim}Inchangé.${c.reset}`);
          break;
        }
        let newFollowers: number | null = null;
        const relMatch = folStr.match(/^([+-])\s*(\d+)$/);
        if (relMatch) {
          const delta = Number(relMatch[2]);
          newFollowers = relMatch[1] === '+' ? (full.followers_count || 0) + delta : Math.max(0, (full.followers_count || 0) - delta);
        } else if (!isNaN(Number(folStr.replace(/\s+/g, '')))) {
          newFollowers = Math.max(0, Math.floor(Number(folStr.replace(/\s+/g, ''))));
        }
        if (newFollowers === null) {
          console.log(`  ${c.red}❌ Valeur invalide (entier attendu, ex: 1200, +500, -50).${c.reset}`);
          break;
        }
        await sql`
          INSERT INTO profiles (user_id, display_name, followers_count, updated_at)
          VALUES (${Number(full.id)}, ${full.display_name || full.username}, ${newFollowers}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET followers_count = ${newFollowers}, updated_at = NOW()
        `;
        full.followers_count = newFollowers;
        console.log(`  ${c.brightGreen}✔ Nombre d'abonnés mis à jour : ${(full.followers_count || 0).toLocaleString('fr-FR')} → ${newFollowers.toLocaleString('fr-FR')}${c.reset}`);
        break;
      }
      case '0':
        running = false;
        break;
      default:
        console.log("⚠️ Option invalide.");
    }
  }
}

function accountActionEmailHtml(kind: "block" | "unblock" | "delete", username: string) {
  const title =
    kind === "block"
      ? "Votre compte a été bloqué"
      : kind === "unblock"
        ? "Votre compte a été réactivé"
        : "Votre compte a été supprimé";
  const message =
    kind === "block"
      ? `Votre compte mAI (<strong>${username}</strong>) a été <span style="color:#f87171;">bloqué</span> par un administrateur. Vous ne pouvez plus vous connecter pour le moment.`
      : kind === "unblock"
        ? `Bonne nouvelle : votre compte mAI (<strong>${username}</strong>) a été réactivé. Vous pouvez vous reconnecter normalement.`
        : `Votre compte mAI (<strong>${username}</strong>) a été définitivement supprimé ainsi que toutes les données associées.`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#080c14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f1f5f9; -webkit-font-smoothing:antialiased;">
      <div style="max-width:600px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);">
        <div style="padding:28px 32px; background:linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);">
          <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.3px;">mAI — Statut de votre compte</h1>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px; line-height:1.7; color:#cbd5e1;">Bonjour <strong>${username}</strong>,</p>
          <p style="font-size:15px; line-height:1.7; color:#cbd5e1;">${message}</p>
          <p style="font-size:15px; line-height:1.7; color:#cbd5e1;">Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href="mailto:mprojectsofficiel@gmail.com" style="color:#a78bfa;">mprojectsofficiel@gmail.com</a>.</p>
          <p style="font-size:13px; color:#64748b; margin-top:32px;">Cet e-mail a été envoyé automatiquement par la console d'administration mAI.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function handleToggleBlockCustomer(rl: readline.Interface) {
  const current = await pickCustomer(rl, "BLOQUER / DÉBLOQUER UN COMPTE CLIENT");
  if (!current) return;

  const newStatus = !current.is_blocked;
  const actionWord = newStatus ? "🚫 BLOQUER" : "🟢 DÉBLOQUER";
  const confirm = (
    await rl.question(
      `⚠️  Confirmer le ${c.bold}${actionWord}${c.reset} de "${c.bold}${current.username}${c.reset}" (${current.email}) ? (o/N) : `
    )
  ).trim().toLowerCase();
  if (!['o', 'oui', 'y', 'yes'].includes(confirm)) {
    console.log("\n❌ Action annulée.\n");
    return;
  }

  try {
    await sql`
      UPDATE users 
      SET is_blocked = ${newStatus}
      WHERE id = ${current.id};
    `;

    await sql`
      INSERT INTO user_account_actions (user_id, action, reason)
      VALUES (${current.id}::text, ${newStatus ? 'block' : 'unblock'}, 'Action via console admin')
    `;

    if (newStatus) {
      await sql`DELETE FROM connected_devices WHERE user_id::text = ${current.id}`;
      await sql`DELETE FROM mprojects_api_keys WHERE user_id::text = ${current.id} OR user_id::text = ${current.username} OR user_id::text = ${current.email}`;
      await sql`DELETE FROM weekly_usage WHERE user_id::text = ${current.id}`;
      await sql`DELETE FROM weekly_speech_usage WHERE user_id::text = ${current.id}`;
      await sql`DELETE FROM mprojects_daily_image_usage WHERE user_id::text = ${current.id}`;
      console.log(`\n${c.brightGreen}✔ Le client ${c.bold}${current.username}${c.reset} (${current.email}) a été ${c.bold}🚫 BLOQUÉ${c.reset} et toutes ses sessions actives ont été révoquées.\n`);
    } else {
      console.log(`\n${c.brightGreen}✔ Le client ${c.bold}${current.username}${c.reset} (${current.email}) a été ${c.bold}🟢 DÉBLOQUÉ${c.reset}.\n`);
    }

    // Notification par e-mail au client concerné
    if (current.email) {
      const kind = newStatus ? "block" : "unblock";
      const ok = await sendEmail({
        to: current.email,
        subject: newStatus ? "Votre compte mAI a été bloqué" : "Votre compte mAI a été réactivé",
        html: accountActionEmailHtml(kind, current.username || ""),
      });
      console.log(
        ok
          ? `${c.brightGreen}✉️  E-mail de notification envoyé à ${current.email}.${c.reset}`
          : `${c.brightRed}⚠️  Échec de l'envoi de l'e-mail à ${current.email} (env manquantes ?).${c.reset}`
      );
    }
  } catch (err: any) {
    console.error("❌ Erreur lors de la modification du statut :", err.message || err);
  }
}

async function handleDeleteCustomer(rl: readline.Interface) {
  const current = await pickCustomer(rl, "SUPPRESSION D'UN COMPTE CLIENT");
  if (!current) return;

  const confirm = (
    await rl.question(
      `⚠️  Êtes-vous sûr de vouloir supprimer définitivement le client "${c.bold}${current.username}${c.reset}" (${current.email}) ?\nToutes ses clés API, appareils et données associés seront impactés. (o/N) : `
    )
  ).trim().toLowerCase();
  if (!['o', 'oui', 'y', 'yes'].includes(confirm)) {
    console.log("\n❌ Suppression annulée.\n");
    return;
  }

  try {
    let emailSent = false;
    if (current.email) {
      emailSent = await sendEmail({
        to: current.email,
        subject: "Votre compte mAI a été supprimé",
        html: accountActionEmailHtml("delete", current.username || ""),
      });
    }

    await sql`DELETE FROM connected_devices WHERE user_id::text = ${current.id}`;
    await sql`DELETE FROM mprojects_api_keys WHERE user_id::text = ${current.id} OR user_id::text = ${current.username} OR user_id::text = ${current.email}`;
    await sql`DELETE FROM weekly_usage WHERE user_id::text = ${current.id}`;
    await sql`DELETE FROM users WHERE id = ${current.id};`;
    await sql`
      INSERT INTO user_account_actions (user_id, action, reason)
      VALUES (${current.id}::text, 'delete', 'Suppression via console admin')
    `;

    console.log(`\n${c.brightGreen}🗑️ Le compte de ${current.username} (${current.email}) a été supprimé définitivement.${c.reset}\n`);
    console.log(
      emailSent
        ? `${c.brightGreen}✉️  E-mail de notification envoyé à ${current.email} avant suppression.${c.reset}`
        : `${c.brightRed}⚠️  E-mail de notification NON envoyé à ${current.email} (adresse absente ou env manquantes).${c.reset}`
      );
  } catch (err: any) {
    console.error("❌ Erreur lors de la suppression :", err.message || err);
  }
}

// ─────────────────────────────────────────────
// 6b. GESTIONNAIRE COMPLET DES POSTS / VIBES
// ─────────────────────────────────────────────

export async function handleEditSinglePost(rl: readline.Interface, postId: string) {
  while (true) {
    const postRows = await sql`
      SELECT p.*, u.username, u.email
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      WHERE p.id = ${postId}::uuid
      LIMIT 1
    `;
    if (postRows.length === 0) {
      console.log(`\n${c.red}❌ Publication introuvable (elle a peut-être été supprimée).${c.reset}\n`);
      return;
    }
    const post = postRows[0];
    const mediaRows = await sql`
      SELECT id, url, media_type, alt_text
      FROM media_assets
      WHERE post_id = ${postId}::uuid
      ORDER BY created_at ASC
    `;

    const cleanContent = stripVibeHtml(post.content || '');
    console.log(`\n` + `═`.repeat(75));
    console.log(`${c.bold}${c.brightCyan}📝 MODIFICATION DU POST [${postId}]${c.reset}`);
    console.log(`═`.repeat(75));
    console.log(`  ${c.dim}Auteur :${c.reset} ${c.bold}@${post.username || post.author_id}${c.reset} (${post.email || 'Email inconnu'})`);
    console.log(`  ${c.dim}Créé le :${c.reset} ${new Date(post.created_at).toLocaleString('fr-FR')}  |  ${c.dim}Mis à jour :${c.reset} ${post.updated_at ? new Date(post.updated_at).toLocaleString('fr-FR') : '-'}`);
    console.log(`  ${c.dim}Statut :${c.reset} ${post.status === 'scheduled' ? `${c.brightYellow}⏳ Programmé (pour le ${new Date(post.scheduled_at).toLocaleString('fr-FR')})${c.reset}` : `${c.brightGreen}⚡ Publié${c.reset}`}`);
    console.log(`  ${c.dim}Visibilité :${c.reset} [${post.visibility}]  |  ${c.dim}Format :${c.reset} [${post.format}]`);
    console.log(`  ${c.dim}Options :${c.reset} ${post.is_pinned ? '📌 Épinglé' : '⚪ Non épinglé'}  |  ${post.ai_generated ? '🤖 Généré avec IA' : '⚪ Humain'}`);
    console.log(`  ${c.dim}Engagement :${c.reset} ❤️ ${post.likes_count || 0}  |  🔁 ${post.reposts_count || 0}  |  💬 ${post.replies_count || 0}  |  👁️ ${post.views_count || 0}  |  🔖 ${post.bookmarks_count || 0}`);
    
    if (mediaRows.length > 0) {
      console.log(`  ${c.dim}Médias joints (${mediaRows.length}) :${c.reset}`);
      mediaRows.forEach((m: any, i: number) => {
        console.log(`    ${c.dim}[${i + 1}]${c.reset} ${m.url} ${c.dim}(${m.media_type})${c.reset}`);
      });
    } else {
      console.log(`  ${c.dim}Médias joints :${c.reset} (aucun)`);
    }

    console.log(`\n  ${c.bold}CONTENU ACTUEL :${c.reset}`);
    console.log(`  ┌` + `─`.repeat(70) + `┐`);
    cleanContent.split('\n').slice(0, 15).forEach((line: string) => {
      console.log(`  │ ${line.padEnd(68).substring(0, 68)} │`);
    });
    if (cleanContent.split('\n').length > 15) {
      console.log(`  │ ${c.dim}… (${cleanContent.split('\n').length - 15} lignes supplémentaires)${c.reset}`.padEnd(76) + `│`);
    }
    console.log(`  └` + `─`.repeat(70) + `┘`);

    console.log(`\n${c.bold}ACTIONS DISPONIBLES SUR CE POST :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} ✏️  Modifier le contenu du post (texte brut ou HTML)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} 👁️  Modifier la visibilité (Public / Abonnés / Cercle / Privé)`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 🚦 Modifier le statut & la date de programmation (Publié / Programmé / Brouillon)`);
    console.log(`  ${c.brightCyan}[4]${c.reset} 📌 Basculer Épinglé / Non épinglé (Actuel : ${post.is_pinned ? '📌 Épinglé' : '⚪ Non épinglé'})`);
    console.log(`  ${c.brightCyan}[5]${c.reset} 🤖 Basculer le badge « Créé avec l'IA » (Actuel : ${post.ai_generated ? '🤖 Oui' : '⚪ Non'})`);
    console.log(`  ${c.brightCyan}[6]${c.reset} 🖼️  Gérer les médias joints (Ajouter, Remplacer, Supprimer)`);
    console.log(`  ${c.brightCyan}[7]${c.reset} 📈 Modifier les statistiques (Likes, Reposts, Réponses, Vues, Signets)`);
    console.log(`  ${c.brightRed}[8]${c.reset} 🗑️  Supprimer définitivement cette publication`);
    console.log(`  ${c.white}[0]${c.reset} ↩️  Retour à la liste des posts`);

    const choice = (await rl.question(`\n  ${c.brightYellow}➔ Choix [0-8] : ${c.reset}`)).trim();

    if (choice === '0') break;

    switch (choice) {
      case '1': {
        console.log(`\n${c.bold}Mode de saisie du nouveau contenu :${c.reset}`);
        console.log(`  [1] Ligne unique rapide`);
        console.log(`  [2] Multi-lignes (terminer par 'FIN' sur une ligne seule)`);
        const subMode = (await rl.question(`  ➔ Choix [1-2] (défaut 1) : `)).trim() || '1';
        let newContent = "";
        if (subMode === '2') {
          console.log(`  ${c.dim}Saisissez votre contenu. Tapez 'FIN' pour valider.${c.reset}`);
          const lines: string[] = [];
          while (true) {
            const l = await rl.question(`  │ `);
            if (l.trim() === 'FIN') break;
            lines.push(l);
          }
          newContent = lines.join('\n').trim();
        } else {
          newContent = (await rl.question(`  ➔ Nouveau contenu : `)).trim();
        }
        if (!newContent) {
          console.log(`${c.yellow}⚠️ Contenu vide. Modification annulée.${c.reset}`);
          break;
        }
        const format = newContent.startsWith('<') ? 'article' : post.format || 'micro_text';
        await sql`
          UPDATE posts
          SET content = ${newContent},
              format = ${format},
              updated_at = NOW()
          WHERE id = ${postId}::uuid
        `;
        console.log(`  ${c.brightGreen}✔ Contenu du post mis à jour avec succès !${c.reset}`);
        break;
      }
      case '2': {
        console.log(`\n${c.bold}Choisir la visibilité :${c.reset}`);
        console.log(`  [1] 🌍 Public (public)`);
        console.log(`  [2] 👥 Abonnés uniquement (followers)`);
        console.log(`  [3] 🔒 Cercle Privé (circle)`);
        console.log(`  [4] ⚪ Privé (private)`);
        const vChoice = (await rl.question(`  ➔ Choix [1-4] : `)).trim();
        const visMap: Record<string, string> = { '1': 'public', '2': 'followers', '3': 'circle', '4': 'private' };
        const newVis = visMap[vChoice];
        if (!newVis) {
          console.log(`${c.yellow}⚠️ Choix invalide.${c.reset}`);
          break;
        }
        await sql`
          UPDATE posts
          SET visibility = ${newVis},
              updated_at = NOW()
          WHERE id = ${postId}::uuid
        `;
        console.log(`  ${c.brightGreen}✔ Visibilité changée en "${newVis}".${c.reset}`);
        break;
      }
      case '3': {
        console.log(`\n${c.bold}Modifier le statut :${c.reset}`);
        console.log(`  [1] ⚡ Publié immédiatement (published)`);
        console.log(`  [2] ⏳ Programmé à une date future (scheduled)`);
        console.log(`  [3] 📝 Brouillon (draft)`);
        const sChoice = (await rl.question(`  ➔ Choix [1-3] : `)).trim();
        if (sChoice === '1') {
          await sql`
            UPDATE posts
            SET status = 'published',
                scheduled_at = NULL,
                published_at = COALESCE(published_at, NOW()),
                updated_at = NOW()
            WHERE id = ${postId}::uuid
          `;
          console.log(`  ${c.brightGreen}✔ Statut changé à "published" (immédiat).${c.reset}`);
        } else if (sChoice === '2') {
          const dateStr = (await rl.question(`  ➔ Date/heure de publication (ex: 2026-09-15 18:30 ou +2j) : `)).trim();
          const targetDate = parseDateInput(dateStr, true);
          if (!targetDate) {
            console.log(`${c.red}❌ Format de date invalide.${c.reset}`);
            break;
          }
          await sql`
            UPDATE posts
            SET status = 'scheduled',
                scheduled_at = ${targetDate.toISOString()},
                updated_at = NOW()
            WHERE id = ${postId}::uuid
          `;
          console.log(`  ${c.brightGreen}✔ Publication programmée pour le ${targetDate.toLocaleString('fr-FR')}.${c.reset}`);
        } else if (sChoice === '3') {
          await sql`
            UPDATE posts
            SET status = 'draft',
                updated_at = NOW()
            WHERE id = ${postId}::uuid
          `;
          console.log(`  ${c.brightGreen}✔ Statut changé en brouillon (draft).${c.reset}`);
        }
        break;
      }
      case '4': {
        const newPinned = !post.is_pinned;
        await sql`
          UPDATE posts
          SET is_pinned = ${newPinned},
              updated_at = NOW()
          WHERE id = ${postId}::uuid
        `;
        console.log(`  ${c.brightGreen}✔ Statut d'épinglage : ${newPinned ? '📌 Épinglé' : '⚪ Désépinglé'}.${c.reset}`);
        break;
      }
      case '5': {
        const newAi = !post.ai_generated;
        await sql`
          UPDATE posts
          SET ai_generated = ${newAi},
              updated_at = NOW()
          WHERE id = ${postId}::uuid
        `;
        console.log(`  ${c.brightGreen}✔ Badge IA : ${newAi ? '🤖 Activé (Généré par IA)' : '⚪ Désactivé (Humain)'}.${c.reset}`);
        break;
      }
      case '6': {
        console.log(`\n${c.bold}Gestion des médias joints :${c.reset}`);
        console.log(`  [1] ➕ Ajouter des médias`);
        console.log(`  [2] 🔄 Remplacer tous les médias`);
        console.log(`  [3] 🗑️  Supprimer tous les médias`);
        const mChoice = (await rl.question(`  ➔ Choix [1-3] : `)).trim();
        if (mChoice === '1') {
          const urlsInput = (await rl.question(`  ➔ URLs des médias à ajouter (séparées par des virgules) : `)).trim();
          const urls = urlsInput.split(',').map(u => u.trim()).filter(Boolean);
          for (const u of urls) {
            const mType = inferVibeMediaType(u);
            await sql`
              INSERT INTO media_assets (owner_id, post_id, url, media_type)
              VALUES (${post.author_id}, ${postId}::uuid, ${u}, ${mType})
            `;
          }
          console.log(`  ${c.brightGreen}✔ ${urls.length} média(s) ajouté(s).${c.reset}`);
        } else if (mChoice === '2') {
          const urlsInput = (await rl.question(`  ➔ Nouvelles URLs de médias (séparées par des virgules) : `)).trim();
          const urls = urlsInput.split(',').map(u => u.trim()).filter(Boolean);
          await sql`DELETE FROM media_assets WHERE post_id = ${postId}::uuid`;
          for (const u of urls) {
            const mType = inferVibeMediaType(u);
            await sql`
              INSERT INTO media_assets (owner_id, post_id, url, media_type)
              VALUES (${post.author_id}, ${postId}::uuid, ${u}, ${mType})
            `;
          }
          console.log(`  ${c.brightGreen}✔ Médias remplacés (${urls.length} média(s)).${c.reset}`);
        } else if (mChoice === '3') {
          const conf = (await rl.question(`  ⚠️ Supprimer tous les médias joints de ce post ? (o/N) : `)).trim().toLowerCase();
          if (['o', 'oui', 'y'].includes(conf)) {
            await sql`DELETE FROM media_assets WHERE post_id = ${postId}::uuid`;
            console.log(`  ${c.brightGreen}✔ Tous les médias ont été supprimés.${c.reset}`);
          }
        }
        break;
      }
      case '7': {
        console.log(`\n${c.bold}Modifier les statistiques (laisser vide pour conserver) :${c.reset}`);
        const likesInput = (await rl.question(`  ➔ Likes (actuel: ${post.likes_count || 0}) : `)).trim();
        const repostsInput = (await rl.question(`  ➔ Reposts (actuel: ${post.reposts_count || 0}) : `)).trim();
        const repliesInput = (await rl.question(`  ➔ Réponses (actuel: ${post.replies_count || 0}) : `)).trim();
        const viewsInput = (await rl.question(`  ➔ Vues (actuel: ${post.views_count || 0}) : `)).trim();
        const bookmarksInput = (await rl.question(`  ➔ Signets (actuel: ${post.bookmarks_count || 0}) : `)).trim();

        const newLikes = likesInput !== "" ? Math.max(0, parseInt(likesInput, 10) || 0) : post.likes_count;
        const newReposts = repostsInput !== "" ? Math.max(0, parseInt(repostsInput, 10) || 0) : post.reposts_count;
        const newReplies = repliesInput !== "" ? Math.max(0, parseInt(repliesInput, 10) || 0) : post.replies_count;
        const newViews = viewsInput !== "" ? Math.max(0, parseInt(viewsInput, 10) || 0) : post.views_count;
        const newBookmarks = bookmarksInput !== "" ? Math.max(0, parseInt(bookmarksInput, 10) || 0) : post.bookmarks_count;

        await sql`
          UPDATE posts
          SET likes_count = ${newLikes},
              reposts_count = ${newReposts},
              replies_count = ${newReplies},
              views_count = ${newViews},
              bookmarks_count = ${newBookmarks},
              updated_at = NOW()
          WHERE id = ${postId}::uuid
        `;
        console.log(`  ${c.brightGreen}✔ Statistiques d'engagement mises à jour !${c.reset}`);
        break;
      }
      case '8': {
        const confirmDel = (await rl.question(`  ${c.brightRed}⚠️ Confirmer la suppression DÉFINITIVE de cette publication ? (o/N) : ${c.reset}`)).trim().toLowerCase();
        if (!['o', 'oui', 'y'].includes(confirmDel)) {
          console.log(`${c.dim}Suppression annulée.${c.reset}`);
          break;
        }
        await sql`DELETE FROM media_assets WHERE post_id = ${postId}::uuid`;
        await sql`DELETE FROM bookmarks WHERE post_id = ${postId}::uuid`;
        await sql`DELETE FROM post_interactions WHERE post_id = ${postId}::uuid`;
        await sql`DELETE FROM notifications WHERE post_id = ${postId}::uuid`;
        await sql`DELETE FROM posts WHERE id = ${postId}::uuid`;
        await sql`UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE user_id = ${post.author_id}`;
        console.log(`\n${c.brightGreen}🗑️ Publication ${postId} supprimée définitivement avec succès !${c.reset}\n`);
        return;
      }
    }
  }
}

export async function handleManagePosts(rl: readline.Interface, prefilteredAuthor?: TargetUser | any) {
  let author: any = prefilteredAuthor || null;
  let statusFilter: 'all' | 'published' | 'scheduled' | 'pinned' = 'all';
  let keywordFilter = "";

  while (true) {
    const authorId = author ? Number(author.id) : null;
    let query;
    if (authorId) {
      query = await sql`
        SELECT p.id, p.author_id, p.content, p.format, p.visibility, p.status, p.scheduled_at,
               p.is_pinned, p.ai_generated, p.likes_count, p.reposts_count, p.replies_count,
               p.views_count, p.bookmarks_count, p.created_at, p.updated_at, p.published_at,
               u.username, u.email,
               (SELECT COUNT(*)::int FROM media_assets m WHERE m.post_id = p.id) as media_count
        FROM posts p
        LEFT JOIN users u ON u.id = p.author_id
        WHERE p.author_id = ${authorId}
        ORDER BY COALESCE(p.created_at, p.published_at, NOW()) DESC
        LIMIT 60
      `;
    } else {
      query = await sql`
        SELECT p.id, p.author_id, p.content, p.format, p.visibility, p.status, p.scheduled_at,
               p.is_pinned, p.ai_generated, p.likes_count, p.reposts_count, p.replies_count,
               p.views_count, p.bookmarks_count, p.created_at, p.updated_at, p.published_at,
               u.username, u.email,
               (SELECT COUNT(*)::int FROM media_assets m WHERE m.post_id = p.id) as media_count
        FROM posts p
        LEFT JOIN users u ON u.id = p.author_id
        ORDER BY COALESCE(p.created_at, p.published_at, NOW()) DESC
        LIMIT 60
      `;
    }

    let posts = query as any[];

    if (statusFilter === 'published') {
      posts = posts.filter(p => (p.status || 'published') === 'published');
    } else if (statusFilter === 'scheduled') {
      posts = posts.filter(p => p.status === 'scheduled');
    } else if (statusFilter === 'pinned') {
      posts = posts.filter(p => Boolean(p.is_pinned));
    }

    if (keywordFilter.trim()) {
      const kw = keywordFilter.toLowerCase();
      posts = posts.filter(p =>
        (p.content || '').toLowerCase().includes(kw) ||
        (p.username || '').toLowerCase().includes(kw) ||
        String(p.id).toLowerCase().includes(kw)
      );
    }

    const scopeLabel = author ? `@${author.username} (ID: ${author.id})` : 'Toute la plateforme';
    console.log(`\n${c.bgPurple}${c.bold}${c.brightWhite} 📰 GESTIONNAIRE DES POSTS / VIBES 📰 ${c.reset}`);
    console.log(`  ${c.dim}Périmètre :${c.reset} ${c.bold}${scopeLabel}${c.reset}  |  ${c.dim}Filtre statut :${c.reset} [${statusFilter}]  |  ${c.dim}Recherche :${c.reset} ${keywordFilter ? `"${keywordFilter}"` : '(aucune)'}`);
    console.log(`  ${c.dim}Publications trouvées : ${posts.length}${c.reset}\n`);

    if (posts.length === 0) {
      console.log(`  ${c.brightYellow}⚠️  Aucune publication trouvée avec les critères actuels.${c.reset}`);
    } else {
      console.log("─".repeat(110));
      console.log(` #  | ${c.bold}${"DATE".padEnd(16)}${c.reset} | ${c.bold}${"AUTEUR".padEnd(16)}${c.reset} | ${c.bold}${"STATUT / AUDIENCE".padEnd(20)}${c.reset} | ${c.bold}${"STATS".padEnd(22)}${c.reset} | ${c.bold}EXTRAIT DU CONTENU${c.reset}`);
      console.log("─".repeat(110));

      posts.forEach((p, idx) => {
        const dateStr = p.created_at
          ? new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '-';
        const authorStr = `@${p.username || p.author_id}`.padEnd(16).substring(0, 16);
        const statusBadge = p.status === 'scheduled' ? '⏳ Prog' : '⚡ Pub';
        const visBadge = (p.visibility || 'public').substring(0, 4);
        const pinBadge = p.is_pinned ? '📌' : '  ';
        const aiBadge = p.ai_generated ? '🤖' : '  ';
        const mediaBadge = Number(p.media_count) > 0 ? `🖼️${p.media_count}` : '';
        const tag = `${statusBadge} [${visBadge}] ${pinBadge}${aiBadge} ${mediaBadge}`.padEnd(20);
        const statsStr = `❤️${p.likes_count || 0} 🔁${p.reposts_count || 0} 💬${p.replies_count || 0} 👁️${p.views_count || 0}`.padEnd(22);
        const cleanContent = stripVibeHtml(p.content || '').replace(/\r?\n/g, ' ');
        const snippet = cleanContent.length > 35 ? cleanContent.substring(0, 35) + '…' : cleanContent;

        console.log(` ${String(idx + 1).padStart(2)} | ${dateStr.padEnd(16)} | ${authorStr} | ${tag} | ${statsStr} | ${c.dim}${snippet}${c.reset}`);
      });
      console.log("─".repeat(110));
    }

    console.log(`\n${c.bold}OPTIONS DISPONIBLES :${c.reset}`);
    console.log(`  ${c.brightCyan}[1-${posts.length}]${c.reset} ✏️  Sélectionner un post pour le modifier / supprimer / épingler`);
    console.log(`  ${c.brightYellow}[S]${c.reset} 🔍 Rechercher un post (mot-clé ou ID)`);
    console.log(`  ${c.brightYellow}[F]${c.reset} 🚦 Changer le filtre statut (Tous, Publiés, Programmés, Épinglés)`);
    if (!author) {
      console.log(`  ${c.brightCyan}[U]${c.reset} 👤 Filtrer par un utilisateur spécifique`);
    } else {
      console.log(`  ${c.brightCyan}[U]${c.reset} 🌍 Réinitialiser et voir tous les posts (Tous les utilisateurs)`);
    }
    console.log(`  ${c.brightGreen}[P]${c.reset} 🚀 Publier une nouvelle Vibe (Assistant de publication)`);
    console.log(`  ${c.white}[0]${c.reset} ↩️  Retour`);

    const ans = (await rl.question(`\n  ${c.brightYellow}➔ Choix [0-${posts.length}], [S], [F], [U], [P] : ${c.reset}`)).trim();

    if (ans === '0' || ans.toLowerCase() === 'retour' || ans.toLowerCase() === 'exit') {
      break;
    }

    if (ans.toLowerCase() === 's') {
      keywordFilter = (await rl.question(`  ➔ Mot-clé ou terme de recherche (vide pour effacer) : `)).trim();
      continue;
    }

    if (ans.toLowerCase() === 'f') {
      console.log(`\n  [1] Tous les posts`);
      console.log(`  [2] Uniquement publiés (⚡ published)`);
      console.log(`  [3] Uniquement programmés (⏳ scheduled)`);
      console.log(`  [4] Uniquement épinglés (📌 is_pinned)`);
      const fc = (await rl.question(`  ➔ Choix filtre [1-4] : `)).trim();
      if (fc === '2') statusFilter = 'published';
      else if (fc === '3') statusFilter = 'scheduled';
      else if (fc === '4') statusFilter = 'pinned';
      else statusFilter = 'all';
      continue;
    }

    if (ans.toLowerCase() === 'u') {
      if (author) {
        author = null;
        console.log(`  ${c.brightGreen}✔ Filtre utilisateur retiré (affichage global).${c.reset}`);
      } else {
        const sel = await promptSelectUser(rl);
        if (sel) author = sel;
      }
      continue;
    }

    if (ans.toLowerCase() === 'p') {
      await runVibePublisher();
      continue;
    }

    const n = parseInt(ans, 10);
    if (!isNaN(n) && n >= 1 && n <= posts.length) {
      const selectedPost = posts[n - 1];
      await handleEditSinglePost(rl, selectedPost.id);
    } else {
      console.log(`❌ Option invalide.`);
    }
  }
}

export async function runPostManagerCli() {
  const rl = readline.createInterface({ input, output });
  try {
    await handleManagePosts(rl);
  } finally {
    rl.close();
  }
}

export async function runCustomerAccountManager() {
  await initCustomersTable();
  await initAccountAuditTable();
  const rl = readline.createInterface({ input, output });

  console.log("\n=======================================================");
  console.log("👥  GESTIONNAIRE DES COMPTES & PROFILS CLIENTS mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log("\n--- MENU DES COMPTES & PROFILS CLIENTS ---");
    console.log("  1. 📋 Lister tous les comptes clients");
    console.log("  2. ✏️  Modifier un profil client (Nom, Bio, Tier, Avatar, Compteurs...)");
    console.log("  3. 🔵 Basculer la coche Vérifiée d'un profil (Badge Vérifié)");
    console.log("  4. 📰 Gérer & modifier les posts / Vibes d'un compte");
    console.log("  5. 🚫 Bloquer / Débloquer un compte");
    console.log("  6. 🗑️  Supprimer un compte client");
    console.log("  7. 🖼️  Modifier l'image d'avatar d'un profil");
    console.log("  0. ↩️  Retour / Quitter");

    const choice = (await rl.question("\n👉 Entrez votre choix [0-7] : ")).trim();

    switch (choice) {
      case '1':
        await handleListCustomers();
        break;
      case '2':
        await handleEditCustomerProfile(rl);
        break;
      case '3':
        await handleToggleVerifiedBadge(rl);
        break;
      case '4': {
        const customer = await pickCustomer(rl, "SÉLECTION DU CLIENT POUR GÉRER SES POSTS");
        if (customer) {
          await handleManagePosts(rl, { id: String(customer.id), username: customer.username, email: customer.email });
        }
        break;
      }
      case '5':
        await handleToggleBlockCustomer(rl);
        break;
      case '6': 
        await handleDeleteCustomer(rl);
        break;
      case '7':
        await handleEditCustomerAvatar(rl);
        break;
      case '0': 
      case 'exit': 
      case 'quit': 
        running = false;
        break;
      default:
        console.log("⚠️ Option invalide.");
    }
  }

  rl.close();
}

// ─────────────────────────────────────────────
// 7. GESTIONNAIRE DE NOTIFICATIONS ACTUALITÉS
// ─────────────────────────────────────────────
async function ensureNotificationTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "userId" text NOT NULL,
        "type" varchar NOT NULL,
        "title" text NOT NULL,
        "body" text,
        "link" text,
        "isRead" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead")`;
    await sql`
      CREATE TABLE IF NOT EXISTS "user_notification_prefs" (
        "userId" text PRIMARY KEY NOT NULL,
        "enabled" boolean DEFAULT false NOT NULL,
        "aiResponse" boolean DEFAULT true NOT NULL,
        "projectCreated" boolean DEFAULT true NOT NULL,
        "mcpCreated" boolean DEFAULT true NOT NULL,
        "mcpAccessRequest" boolean DEFAULT true NOT NULL,
        "news" boolean DEFAULT true NOT NULL,
        "regenerateMode" varchar DEFAULT 'truncate' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `;
  } catch (e: any) {
    console.error("Erreur création tables notifications", e.message);
  }
}

export type NotificationKind = 'news' | 'system' | 'promo' | 'maintenance';

const NOTIFICATION_KINDS: Record<NotificationKind, { label: string; icon: string }> = {
  news: { label: "Actualités produit", icon: "📰" },
  system: { label: "Information système", icon: "⚙️" },
  promo: { label: "Offre promotionnelle", icon: "🎁" },
  maintenance: { label: "Maintenance programmée", icon: "🚧" },
};

export async function sendNewsNotificationToEligibleUsers(
  title: string,
  body: string | null,
  link: string | null,
  options: { kind?: NotificationKind; targetAllUsers?: boolean } = {}
) {
  await ensureNotificationTables();
  const kind: NotificationKind = options.kind && options.kind in NOTIFICATION_KINDS ? options.kind : 'news';
  const kindInfo = NOTIFICATION_KINDS[kind];

  let targets: { userId: string }[];
  if (options.targetAllUsers) {
    targets = (await sql`SELECT id::text AS "userId" FROM users`) as unknown as { userId: string }[];
  } else {
    targets = (await sql`
      SELECT "userId" FROM "user_notification_prefs"
      WHERE "enabled" = true AND "news" = true
    `) as unknown as { userId: string }[];
  }

  if (targets.length === 0) {
    console.log(`  ${c.yellow}⚠ Aucun utilisateur cible${options.targetAllUsers ? '' : ' (enabled=true & news=true)'}.${c.reset}`);
    return { sent: 0, eligible: 0 };
  }
  console.log(`  ${c.cyan}➔ Envoi de la notification ${kindInfo.icon} [${kindInfo.label}] à ${targets.length} utilisateur(s)...${c.reset}`);
  let sent = 0;
  for (const u of targets) {
    try {
      await sql`
        INSERT INTO "Notification" ("userId", "type", "title", "body", "link")
        VALUES (${u.userId}, ${kind}, ${title}, ${body}, ${link})
      `;
      sent++;
    } catch (err: any) {
      console.error(`  ${c.red}✖ Erreur pour ${u.userId}: ${err.message}${c.reset}`);
    }
  }
  console.log(`  ${c.brightGreen}✔ ${sent} notification(s) "${kindInfo.label}" créée(s) en BDD !${c.reset}`);
  return { sent, eligible: targets.length };
}

async function handleSendNewsInteractive(rl: readline.Interface) {
  console.log(`\n${c.bold}--- 📢 DIFFUSION D'UNE NOTIFICATION IN-APP mAI ---${c.reset}`);

  console.log(`\n${c.bold}1. Type de notification :${c.reset}`);
  const kindKeys: NotificationKind[] = ['news', 'system', 'promo', 'maintenance'];
  kindKeys.forEach((k, i) => {
    console.log(`  ${c.brightCyan}[${i + 1}]${c.reset} ${NOTIFICATION_KINDS[k].icon} ${NOTIFICATION_KINDS[k].label} ${c.dim}(${k})${c.reset}`);
  });
  const kindChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-4] (défaut 1) : ${c.reset}`)).trim() || '1';
  const kind = kindKeys[parseInt(kindChoice, 10) - 1] || 'news';
  const kindInfo = NOTIFICATION_KINDS[kind];

  console.log(`\n${c.bold}2. Destinataires :${c.reset}`);
  console.log(`  ${c.brightCyan}[1]${c.reset} 🎯 Utilisateurs ayant activé Notifications > Actualités (recommandé)`);
  console.log(`  ${c.brightCyan}[2]${c.reset} 🌐 Tous les comptes de la plateforme (ignore les préférences)`);
  const targetChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

  console.log(`\n${c.bold}3. Contenu :${c.reset}`);
  const title = (await rl.question("  👉 Titre de la notification (ex: Nouveautés mAI - Septembre 2026) : ")).trim();
  if (!title) {
    console.log("❌ Titre requis.");
    return;
  }
  const body = (await rl.question("  👉 Corps (facultatif, max 500c) : ")).trim();
  const link = (await rl.question("  👉 Lien (facultatif, ex: /settings ou https://mai.val.run) : ")).trim();

  console.log(`\n${c.dim}┌────────────────────────────────────────────────────────────────┐${c.reset}`);
  console.log(`${c.dim}│${c.reset} ${c.bold}🔔 APERÇU${c.reset} ${c.dim}— ${kindInfo.icon} ${kindInfo.label}${targetChoice === '2' ? ' • Tous les comptes' : ' • Abonnés notifiés'}${c.reset}`);
  console.log(`${c.dim}│${c.reset} ${c.bold}${kindInfo.icon} ${title}${c.reset}`);
  if (body) console.log(`${c.dim}│${c.reset} ${c.dim}${body.length > 100 ? body.slice(0, 100) + '…' : body}${c.reset}`);
  if (link) console.log(`${c.dim}│${c.reset} ${c.brightCyan}${link}${c.reset}`);
  console.log(`${c.dim}└────────────────────────────────────────────────────────────────┘${c.reset}`);

  const confirm = (await rl.question(`\n  ${c.brightYellow}➔ Confirmer l'envoi ? (o/N) : ${c.reset}`)).trim().toLowerCase();
  if (confirm !== "o" && confirm !== "oui" && confirm !== "y" && confirm !== "yes") {
    console.log("Annulé.");
    return;
  }
  await sendNewsNotificationToEligibleUsers(title, body || null, link || null, {
    kind,
    targetAllUsers: targetChoice === '2',
  });
}

async function handleListRecentNotifications(rl: readline.Interface) {
  console.log(`\n${c.bold}--- 📋 NOTIFICATIONS RÉCENTES ---${c.reset}`);
  const limitIn = (await rl.question("👉 Nombre à afficher (défaut 10) : ")).trim();
  const limit = Math.min(Math.max(parseInt(limitIn, 10) || 10, 1), 50);
  try {
    const rows = await sql`SELECT "id", "userId", "type", "title", "isRead", "createdAt" FROM "Notification" ORDER BY "createdAt" DESC LIMIT ${limit}`;
    if (rows.length === 0) {
      console.log(`${c.dim}Aucune notification en BDD.${c.reset}`);
      return;
    }
    console.log("\n" + "─".repeat(110));
    console.log(`| ${"type".padEnd(18)} | ${"title".padEnd(30)} | ${"userId".padEnd(20)} | ${"lu".padEnd(4)} | ${"date".padEnd(20)} |`);
    console.log("─".repeat(110));
    for (const r of rows as any[]) {
      const t = String(r.type).padEnd(18);
      const ttl = String(r.title).slice(0, 30).padEnd(30);
      const uid = String(r.userId).slice(0, 20).padEnd(20);
      const lu = (r.isRead ? "oui" : "non").padEnd(4);
      const d = new Date(r.createdAt).toLocaleString("fr-FR").padEnd(20);
      console.log(`| ${t} | ${ttl} | ${uid} | ${lu} | ${d} |`);
    }
    console.log("─".repeat(110) + "\n");
  } catch (e: any) {
    console.error("Erreur listing", e.message);
  }
}

export async function runNotificationManager() {
  await ensureNotificationTables();
  const rl = readline.createInterface({ input, output });
  console.log("\n=======================================================");
  console.log("🔔  GESTIONNAIRE NOTIFICATIONS & ACTUALITÉS mAI");
  console.log("=======================================================");
  let running = true;
  while (running) {
    console.log("\n--- MENU NOTIFICATIONS ---");
    console.log("  1. 📢 Envoyer une notification Actualités (broadcast)");
    console.log("  2. 📋 Lister les notifications récentes");
    console.log("  3. 🗑️ Purger les notifications lues (>30j)");
    console.log("  0. ↩️ Retour / Quitter");
    const choice = (await rl.question("\n👉 Votre choix [0-3] : ")).trim();
    switch (choice) {
      case "1":
        await handleSendNewsInteractive(rl);
        break;
      case "2":
        await handleListRecentNotifications(rl);
        break;
      case "3": {
        const confirm = (await rl.question("⚠️ Supprimer les notifications lues de plus de 30 jours ? (o/N) : ")).trim().toLowerCase();
        if (confirm === "o" || confirm === "oui" || confirm === "y") {
          const res = await sql`DELETE FROM "Notification" WHERE "isRead" = true AND "createdAt" < NOW() - INTERVAL '30 days' RETURNING "id"`;
          console.log(`${c.brightGreen}✔ ${res.length} notifications purgées.${c.reset}`);
        } else console.log("Annulé.");
        break;
      }
      case "0":
      case "exit":
      case "quit":
        running = false;
        break;
      default:
        console.log("⚠️ Option invalide.");
    }
  }
  rl.close();
}

// ─────────────────────────────────────────────
// 8. PUBLICATION D'UNE VIBE (POST AU NOM D'UN UTILISATEUR)
// Réplique côté console le comportement de l'API (vibe-posts.ts) :
// insertion dans posts + media_assets, compteur profiles.posts_count,
// notifications mention / post (abonnés) / mai_system (auteur).
// ─────────────────────────────────────────────

/** Colonnes 0.8.0 requises par la publication (idempotent — cf. ensurePostColumns). */
let vibePostColumnsReady = false;
async function ensureVibePostColumns() {
  if (vibePostColumnsReady) return;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published'`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
  vibePostColumnsReady = true;
}

/** Version texte brut d'un contenu riche (extraits de notification — cf. vibe-posts.ts). */
function stripVibeHtml(text: string): string {
  if (!text || !text.includes("<")) return text || "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Inférence du type MIME d'un média joint d'après l'extension (cf. vibe-posts.ts). */
function inferVibeMediaType(url: string, fallback = "image/jpeg"): string {
  try {
    const cleanUrl = url.split("?")[0].split("#")[0];
    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "png": return "image/png";
      case "webp": return "image/webp";
      case "gif": return "image/gif";
      case "svg": return "image/svg+xml";
      case "jpg":
      case "jpeg": return "image/jpeg";
      case "mp4": return "video/mp4";
      case "webm": return "video/webm";
      case "mov": return "video/quicktime";
      case "mp3": return "audio/mpeg";
      case "wav": return "audio/wav";
      case "ogg": return "audio/ogg";
      default: return fallback;
    }
  } catch {
    return fallback;
  }
}

/** Blocage croisé : aucune notification ne traverse un blocage (cf. isBlockEitherWay). */
async function isVibeBlocked(a: number, b: number): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT 1 FROM blocked_users
      WHERE (user_id = ${a} AND blocked_user_id = ${b}) OR (user_id = ${b} AND blocked_user_id = ${a})
      LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false; // table absente : ne pas empêcher la publication
  }
}

export interface VibePublicationResult {
  ok: boolean;
  status: 'published' | 'scheduled';
  postId?: string;
  mentionsNotified: number;
  subscribersNotified: number;
  authorNotified: boolean;
  error?: string;
}

/**
 * Publie une Vibe au nom d'un utilisateur directement en base, en répliquant
 * les effets de l'API : médias joints, compteur de posts, notifications de
 * mentions et aux abonnés post_subscriptions, puis confirmation à l'auteur
 * (publication réussie, programmée ou échouée) avec extrait du contenu.
 */
export async function publishVibeAsUser(params: {
  authorId: number;
  authorUsername: string;
  content: string;
  format?: string;
  visibility?: string;
  aiGenerated?: boolean;
  mediaUrls?: string[];
  scheduledAt?: Date | null;
  notifyAuthor?: boolean;
  notifySubscribers?: boolean;
}): Promise<VibePublicationResult> {
  const {
    authorId,
    authorUsername,
    content,
    format = 'micro_text',
    visibility = 'public',
    aiGenerated = false,
    mediaUrls = [],
    scheduledAt = null,
    notifyAuthor = true,
    notifySubscribers = true,
  } = params;

  const result: VibePublicationResult = {
    ok: false,
    status: scheduledAt ? 'scheduled' : 'published',
    mentionsNotified: 0,
    subscribersNotified: 0,
    authorNotified: false,
  };

  const plain = stripVibeHtml(content);
  const snippet = plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;

  // Notification d'échec à l'auteur (le contenu est rappelé dans le message)
  const notifyAuthorFailure = async (reason: string) => {
    if (!notifyAuthor) return;
    try {
      await sql`
        INSERT INTO notifications (recipient_id, actor_id, type, message)
        VALUES (${authorId}, ${authorId}, 'mai_system', ${`❌ Votre vibe n'a pas pu être publiée par la console mAI (${reason}). Contenu : « ${snippet} »`})
      `;
      result.authorNotified = true;
    } catch { /* la base est injoignable : rien de plus à faire */ }
  };

  if (!content || !content.trim()) {
    result.error = 'Le contenu est obligatoire.';
    await notifyAuthorFailure(result.error);
    return result;
  }
  if (content.length > 50_000) {
    result.error = 'La publication est trop longue (50 000 caractères maximum).';
    await notifyAuthorFailure(result.error);
    return result;
  }
  if (scheduledAt && (isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
    result.error = "Date de programmation invalide ou passée.";
    await notifyAuthorFailure(result.error);
    return result;
  }

  await ensureVibePostColumns();

  let post: any = null;
  try {
    const postStatus = scheduledAt ? 'scheduled' : 'published';
    const inserted = await sql`
      INSERT INTO posts (author_id, content, format, visibility, toxicity_score, created_via, ai_generated, status, scheduled_at)
      VALUES (${authorId}, ${content.trim()}, ${format}, ${visibility}, 0, 'admin_console', ${aiGenerated}, ${postStatus}, ${scheduledAt ? scheduledAt.toISOString() : null})
      RETURNING *
    `;
    post = inserted[0];
    result.postId = String(post.id);

    // Médias joints (URLs externes, type MIME déduit de l'extension)
    for (const rawUrl of mediaUrls) {
      const url = String(rawUrl || '').trim();
      if (!url) continue;
      await sql`
        INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text)
        VALUES (${authorId}, ${post.id}::uuid, ${url}, ${inferVibeMediaType(url)}, 0, '')
      `.catch(() => {});
    }

    // Compteur de publications du profil (seulement si publication immédiate)
    if (!scheduledAt) {
      await sql`UPDATE profiles SET posts_count = posts_count + 1 WHERE user_id = ${authorId}`.catch(() => {});
    }

    result.ok = true;
  } catch (err: any) {
    result.error = err?.message || String(err);
    await notifyAuthorFailure(result.error || 'erreur inconnue');
    return result;
  }

  // Notifications déclenchées à la publication réelle — une vibe programmée
  // sera notifiée par publishDuePosts à son échéance (comportement API).
  if (!scheduledAt) {
    // 1. Mentions @username dans le contenu
    try {
      const mentionMatches = Array.from(new Set(plain.match(/@([a-zA-Z0-9_]{1,30})/g) || []))
        .map((m) => m.slice(1).toLowerCase());
      for (const username of mentionMatches) {
        if (username === String(authorUsername || '').toLowerCase()) continue;
        const rows = await sql`SELECT id FROM users WHERE LOWER(username) = ${username} AND id <> ${authorId} LIMIT 1`;
        if (rows.length === 0) continue;
        const targetId = Number(rows[0].id);
        if (await isVibeBlocked(authorId, targetId)) continue;
        await sql`
          INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
          VALUES (${targetId}, ${authorId}, 'mention', ${post.id}::uuid, ${`vous a mentionné dans une publication : « ${snippet} »`})
        `.catch(() => {});
        result.mentionsNotified++;
      }
    } catch { /* best-effort, comme l'API */ }

    // 2. Abonnés aux publications du compte (post_subscriptions)
    if (notifySubscribers) {
      try {
        const subscribers = await sql`
          SELECT ps.subscriber_id FROM post_subscriptions ps
          WHERE ps.author_id = ${authorId} AND ps.subscriber_id <> ${authorId}
        `;
        for (const s of subscribers) {
          const targetId = Number(s.subscriber_id);
          if (await isVibeBlocked(authorId, targetId)) continue;
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
            VALUES (${targetId}, ${authorId}, 'post', ${post.id}::uuid, ${`a publié une nouvelle Vibe : « ${snippet} »`})
          `.catch(() => {});
          result.subscribersNotified++;
        }
      } catch { /* best-effort, comme l'API */ }
    }
  }

  // 3. Confirmation à l'auteur : vibe bien publiée (ou programmée)
  if (notifyAuthor) {
    try {
      const when = scheduledAt ? ` pour le ${scheduledAt.toLocaleString('fr-FR')}` : '';
      await sql`
        INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
        VALUES (${authorId}, ${authorId}, 'mai_system', ${post.id}::uuid, ${`✅ Votre vibe a été publiée par la console d'administration mAI${when} : « ${snippet} »`})
      `;
      result.authorNotified = true;
    } catch { /* best-effort */ }
  }

  return result;
}

/** Récapitulatif console du résultat d'une publication de Vibe. */
function printVibeOutcome(outcome: VibePublicationResult | null) {
  if (!outcome) {
    console.log(`\n${c.dim}Publication de Vibe annulée (aucune donnée reçue de l'éditeur).${c.reset}\n`);
    return;
  }
  if (!outcome.ok) {
    console.log(`\n${c.brightRed}✖ Échec de la publication : ${outcome.error || 'erreur inconnue'}${c.reset}`);
    console.log(`  ${outcome.authorNotified ? c.green + '✔' : c.red + '✖'} Notification d'échec ${outcome.authorNotified ? 'envoyée' : 'NON envoyée'} à l'auteur (type mai_system).${c.reset}\n`);
    return;
  }

  const statusLabel = outcome.status === 'scheduled'
    ? `${c.yellow}⏳ PROGRAMMÉE${c.reset}`
    : `${c.brightGreen}⚡ PUBLIÉE${c.reset}`;
  console.log(`\n${c.brightGreen}${c.bold}🎉 VIBE ${outcome.status === 'scheduled' ? 'PROGRAMMÉE' : 'PUBLIÉE'} AVEC SUCCÈS !${c.reset}`);
  console.log(`  ${c.bold}Statut${c.reset}        : ${statusLabel}`);
  console.log(`  ${c.bold}ID du post${c.reset}    : ${c.brightCyan}${outcome.postId}${c.reset}`);
  console.log(`  ${c.bold}Notifications :${c.reset}`);
  console.log(`    ${outcome.authorNotified ? c.brightGreen + '✔' : c.brightRed + '✖'} Auteur prévenu du bon déroulement (type mai_system, contenu inclus)`);
  console.log(`    ${c.brightCyan}➔${c.reset} ${outcome.subscribersNotified} abonné(s) aux posts notifié(s) (type post)`);
  console.log(`    ${c.brightCyan}➔${c.reset} ${outcome.mentionsNotified} mention(s) notifiée(s) (type mention)`);
  console.log("");
}

// ─────────────────────────────────────────────
// Éditeur visuel de Vibe (HTML servi en local, même principe que la newsletter)
// ─────────────────────────────────────────────
const VIBE_EDITOR_PORT = 3334;

const VIBE_EDITOR_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Éditeur de Vibe — mAI</title>
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
  <style>
    :root { --bg-dark:#080c14; --bg-card:#0f172a; --border-color:#1e293b; --primary:#7c3aed; --text-main:#f1f5f9; --text-muted:#94a3b8; }
    body { margin:0; padding:0; background-color:var(--bg-dark); font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:var(--text-main); display:flex; flex-direction:column; height:100vh; overflow:hidden; }
    header { background:linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%); padding:16px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); }
    header h1 { margin:0; font-size:20px; font-weight:800; display:flex; align-items:center; gap:10px; }
    header img { height:32px; }
    .badge { background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.35); font-size:11px; font-weight:800; padding:4px 10px; border-radius:100px; letter-spacing:0.5px; text-transform:uppercase; }
    .author-chip { background:rgba(59,130,246,0.12); color:#93c5fd; border:1px solid rgba(59,130,246,0.35); font-size:12px; font-weight:700; padding:6px 14px; border-radius:100px; margin-right:8px; }
    .main-container { display:flex; flex:1; overflow:hidden; }
    .editor-pane { width:50%; padding:24px; display:flex; flex-direction:column; gap:16px; overflow-y:auto; border-right:1px solid var(--border-color); background-color:#0b111e; }
    .preview-pane { width:50%; background-color:var(--bg-dark); display:flex; flex-direction:column; overflow:hidden; }
    .preview-header { padding:12px 24px; background-color:#0b111e; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center; }
    .preview-frame-container { flex:1; padding:20px; overflow-y:auto; display:flex; justify-content:center; align-items:flex-start; }
    iframe { width:100%; max-width:560px; height:640px; border:1px solid var(--border-color); border-radius:16px; background:var(--bg-dark); box-shadow:0 20px 25px -5px rgba(0,0,0,0.5); }
    .form-group { display:flex; flex-direction:column; gap:6px; }
    label { font-size:13px; font-weight:600; color:var(--text-muted); }
    input, select, textarea { background-color:var(--bg-dark); border:1px solid var(--border-color); border-radius:8px; padding:10px 12px; color:var(--text-main); font-family:inherit; font-size:14px; outline:none; transition:border-color 0.2s; }
    input:focus, select:focus, textarea:focus { border-color:var(--primary); }
    textarea#mediaUrls { min-height:68px; resize:vertical; font-family:'Consolas', 'Courier New', monospace; font-size:13px; }
    .checkbox-row { display:flex; flex-direction:column; gap:10px; background-color:var(--bg-dark); border:1px solid var(--border-color); border-radius:8px; padding:12px; }
    .checkbox-row div { display:flex; align-items:center; gap:10px; }
    .checkbox-row input[type="checkbox"] { width:18px; height:18px; accent-color:var(--primary); cursor:pointer; }
    .checkbox-row label { margin:0; cursor:pointer; color:var(--text-main); font-weight:500; }
    .ql-container { background-color:var(--bg-dark); border:1px solid var(--border-color) !important; border-bottom-left-radius:8px; border-bottom-right-radius:8px; font-family:inherit; font-size:14px; color:var(--text-main); height:220px; }
    .ql-toolbar { background-color:#0f172a; border:1px solid var(--border-color) !important; border-top-left-radius:8px; border-top-right-radius:8px; }
    .ql-snow .ql-stroke { stroke:var(--text-muted) !important; }
    .ql-snow .ql-fill { fill:var(--text-muted) !important; }
    .ql-snow .ql-picker { color:var(--text-muted) !important; }
    .row { display:flex; gap:16px; }
    .row .form-group { flex:1; }
    .actions { margin-top:10px; padding:16px; background-color:#0f172a; border:1px solid var(--border-color); border-radius:12px; display:flex; flex-direction:column; gap:12px; }
    .btn-row { display:flex; gap:12px; }
    .btn { padding:12px 20px; border-radius:8px; font-weight:700; cursor:pointer; border:none; transition:all 0.2s; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px; flex:1; }
    .btn-primary { background:linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color:white; box-shadow:0 4px 12px rgba(124,58,237,0.3); }
    .btn-primary:hover { opacity:0.95; transform:translateY(-1px); }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
    .btn-danger { background-color:#1e293b; color:#f87171; border:1px solid rgba(239,68,68,0.35); max-width:160px; }
    .btn-danger:hover { background-color:rgba(239,68,68,0.12); }
    .hint { font-size:12px; color:var(--text-muted); font-weight:400; }
    #toast { position:fixed; bottom:24px; right:24px; padding:16px 24px; border-radius:8px; background-color:#10b981; color:white; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); transform:translateY(100px); opacity:0; transition:all 0.3s cubic-bezier(0.16,1,0.3,1); z-index:1000; max-width:420px; }
    #toast.show { transform:translateY(0); opacity:1; }
    #toast.error { background-color:#ef4444; }
  </style>
</head>
<body>
  <header>
    <h1>
      <img src="https://upload.fs.fr/azq3C6GLea.png" alt="mAI Logo">
      <span>mAI Vibe Studio</span>
    </h1>
    <div>
      <span class="author-chip">👤 __AUTHOR_NAME__</span>
      <span class="badge">Mode Administration</span>
    </div>
  </header>

  <div class="main-container">
    <div class="editor-pane">
      <div class="form-group">
        <label>Contenu de la Vibe <span class="hint">(texte riche — les mentions @username sont détectées)</span></label>
        <div id="toolbar">
          <span class="ql-formats">
            <select class="ql-header">
              <option selected></option>
              <option value="2">Sous-titre</option>
              <option value="3">Section</option>
            </select>
          </span>
          <span class="ql-formats">
            <button class="ql-bold"></button>
            <button class="ql-italic"></button>
            <button class="ql-underline"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-link"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered"></button>
            <button class="ql-list" value="bullet"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-clean"></button>
          </span>
        </div>
        <div id="editor"></div>
      </div>

      <div class="row">
        <div class="form-group">
          <label for="visibility">Audience de la publication</label>
          <select id="visibility">
            <option value="public" selected>🌍 Public (tout le monde)</option>
            <option value="followers">👥 Abonnés uniquement</option>
            <option value="circle">🔒 Cercle Privé</option>
            <option value="private">⚪ Privé (soi seul)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="scheduledAt">Publication programmée (optionnel)</label>
          <input type="datetime-local" id="scheduledAt">
          <span class="hint">Laisser vide pour publier immédiatement.</span>
        </div>
      </div>

      <div class="form-group">
        <label for="mediaUrls">Médias joints — URLs, une par ligne <span class="hint">(images, vidéos, audio — optionnel)</span></label>
        <textarea id="mediaUrls" placeholder="https://exemple.com/image.jpg&#10;https://exemple.com/video.mp4"></textarea>
      </div>

      <div class="checkbox-row">
        <div><input type="checkbox" id="aiGenerated"><label for="aiGenerated">✨ Marquer comme « Créé avec l'IA »</label></div>
        <div><input type="checkbox" id="notifyAuthor" checked><label for="notifyAuthor">🔔 Notifier l'auteur (publication réussie / programmée / échouée, contenu inclus)</label></div>
        <div><input type="checkbox" id="notifySubscribers" checked><label for="notifySubscribers">📣 Notifier les abonnés aux publications du compte</label></div>
      </div>

      <div class="actions">
        <label>Actions de publication</label>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-publish">🚀 Publier la Vibe</button>
        </div>
        <div style="text-align:center; margin-top:4px;">
          <button class="btn btn-danger" id="btn-quit" style="margin:0 auto;">↩ Quitter sans publier</button>
        </div>
      </div>
    </div>

    <div class="preview-pane">
      <div class="preview-header">
        <span>Aperçu en temps réel (fil Vibe)</span>
        <span style="font-size:11px; color:var(--text-muted);">Rendu approximatif de l'application</span>
      </div>
      <div class="preview-frame-container">
        <iframe id="preview-iframe"></iframe>
      </div>
    </div>
  </div>

  <div id="toast">Publication effectuée avec succès !</div>

  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
  <script>
    var AUTHOR_NAME = __AUTHOR_JSON__;

    var quill = new Quill('#editor', {
      modules: { toolbar: '#toolbar' },
      theme: 'snow',
      placeholder: 'Quoi de neuf ? Écrivez une Vibe pour ' + AUTHOR_NAME + '…'
    });

    var previewIframe = document.getElementById('preview-iframe');
    var visibilitySelect = document.getElementById('visibility');
    var scheduledAtInput = document.getElementById('scheduledAt');
    var mediaUrlsInput = document.getElementById('mediaUrls');
    var aiGeneratedInput = document.getElementById('aiGenerated');
    var notifyAuthorInput = document.getElementById('notifyAuthor');
    var notifySubscribersInput = document.getElementById('notifySubscribers');

    var VISIBILITY_LABELS = {
      public: '🌍 Public',
      followers: '👥 Abonnés uniquement',
      circle: '🔒 Cercle Privé',
      private: '⚪ Privé'
    };

    function escapeHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Rendu des mentions @username, proche de l'application
    function renderContent(html) {
      return html.replace(/@([a-zA-Z0-9_]{1,30})/g, '<span style="color:#a78bfa;font-weight:600;">@$1</span>');
    }

    function buildMediaSection() {
      var urls = mediaUrlsInput.value.split('\\n').map(function (u) { return u.trim(); }).filter(Boolean);
      if (urls.length === 0) return '';
      var parts = [];
      for (var i = 0; i < urls.length; i++) {
        var isVideo = /\\.(mp4|webm|mov)(\\?.*)?$/i.test(urls[i]);
        if (isVideo) {
          parts.push('<video src="' + escapeHtml(urls[i]) + '" controls style="width:100%; border-radius:14px; border:1px solid #1e293b; max-height:340px;"></video>');
        } else {
          parts.push('<img src="' + escapeHtml(urls[i]) + '" style="width:100%; border-radius:14px; border:1px solid #1e293b; max-height:340px; object-fit:cover;" />');
        }
      }
      return '<div style="margin-top:12px; display:grid; gap:8px;">' + parts.join('') + '</div>';
    }

    // Aperçu sous forme de carte de post Vibe
    function getPreviewHtml() {
      var content = quill.root.innerHTML;
      var hasText = quill.getText().trim().length > 0;
      var visibility = visibilitySelect.value;
      var scheduledAt = scheduledAtInput.value;
      var isAi = aiGeneratedInput.checked;
      var initial = (AUTHOR_NAME || '?').charAt(0).toUpperCase();

      var scheduleBanner = '';
      if (scheduledAt) {
        var d = new Date(scheduledAt);
        var label = isNaN(d.getTime()) ? escapeHtml(scheduledAt) : d.toLocaleString('fr-FR');
        scheduleBanner = '<div style="margin:0 16px 12px 16px; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:10px; padding:10px 14px; font-size:12px; color:#93c5fd;">⏱ Publication programmée pour le <strong>' + label + '</strong></div>';
      }

      var html = '';
      html += '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background-color:#080c14;font-family:-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;color:#f1f5f9;}</style></head><body>';
      html += '<div style="max-width:560px; margin:0 auto; background:#0f172a; border:1px solid #1e293b; border-radius:20px; overflow:hidden;">';
      html += '<div style="padding:16px 16px 0 16px; display:flex; align-items:center; gap:12px;">';
      html += '<div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; color:white; flex-shrink:0;">' + initial + '</div>';
      html += '<div style="flex:1; min-width:0;"><div style="font-weight:700; font-size:15px;">' + escapeHtml(AUTHOR_NAME) + '</div><div style="color:#94a3b8; font-size:13px;">@' + escapeHtml(AUTHOR_NAME.toLowerCase()) + ' · à l\\'instant</div></div>';
      html += '<span style="background:rgba(148,163,184,0.12); color:#94a3b8; border:1px solid #334155; font-size:10px; font-weight:800; padding:3px 10px; border-radius:100px; letter-spacing:0.5px; text-transform:uppercase; flex-shrink:0;">' + (VISIBILITY_LABELS[visibility] || escapeHtml(visibility)) + '</span>';
      html += '</div>';
      html += scheduleBanner;
      html += '<div style="padding:12px 16px 4px 16px; font-size:15px; line-height:1.6; word-wrap:break-word;">';
      html += hasText ? renderContent(content) : '<span style="color:#475569; font-style:italic;">Votre contenu apparaîtra ici…</span>';
      html += '</div>';
      html += buildMediaSection();
      if (isAi) {
        html += '<div style="margin:10px 16px 0 16px;"><span style="display:inline-block; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.35); font-size:10px; font-weight:800; padding:3px 10px; border-radius:100px; letter-spacing:0.5px; text-transform:uppercase;">✨ Créé avec l\\'IA</span></div>';
      }
      html += '<div style="padding:14px 16px; margin-top:8px; border-top:1px solid #1e293b; display:flex; gap:32px; color:#94a3b8; font-size:13px;"><span>♡ 0</span><span>🔁 0</span><span>💬 0</span><span>🔖 0</span></div>';
      html += '</div></body></html>';
      return html;
    }

    function updatePreview() {
      var doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
      doc.open();
      doc.write(getPreviewHtml());
      doc.close();
    }

    visibilitySelect.addEventListener('input', updatePreview);
    scheduledAtInput.addEventListener('input', updatePreview);
    mediaUrlsInput.addEventListener('input', updatePreview);
    aiGeneratedInput.addEventListener('input', updatePreview);
    quill.on('text-change', updatePreview);
    updatePreview();

    function showToast(message, isError) {
      var toast = document.getElementById('toast');
      toast.innerText = message;
      toast.className = 'show';
      if (isError) toast.classList.add('error');
      setTimeout(function () { toast.className = ''; }, 6000);
    }

    document.getElementById('btn-publish').addEventListener('click', function () {
      if (!quill.getText().trim()) {
        showToast('Le contenu de la Vibe est obligatoire.', true);
        return;
      }
      var scheduledAt = scheduledAtInput.value ? new Date(scheduledAtInput.value) : null;
      if (scheduledAt && (isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
        showToast('La date de programmation doit être dans le futur.', true);
        return;
      }
      var btn = document.getElementById('btn-publish');
      btn.disabled = true;
      btn.innerText = '⏳ Publication en cours…';
      fetch('/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: quill.root.innerHTML,
          visibility: visibilitySelect.value,
          ai_generated: aiGeneratedInput.checked,
          media_urls: mediaUrlsInput.value.split('\\n').map(function (u) { return u.trim(); }).filter(Boolean),
          scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
          notify_author: notifyAuthorInput.checked,
          notify_subscribers: notifySubscribersInput.checked
        })
      }).then(function (r) { return r.json(); }).then(function (result) {
        if (result.success) {
          showToast(result.message || 'Vibe publiée avec succès !');
          setTimeout(function () {
            document.body.innerHTML = '<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; color:var(--text-muted); gap:14px; text-align:center;"><span style="font-size:52px;">🎉</span><div style="font-weight:700; font-size:22px;">Vibe publiée avec succès !</div><div style="font-size:14px;">La console d\\'administration a terminé. Vous pouvez fermer cet onglet.</div></div>';
          }, 2000);
        } else {
          showToast(result.error || 'Une erreur est survenue.', true);
          btn.disabled = false;
          btn.innerText = '🚀 Publier la Vibe';
        }
      }).catch(function () {
        showToast('Erreur de connexion avec le serveur local.', true);
        btn.disabled = false;
        btn.innerText = '🚀 Publier la Vibe';
      });
    });

    document.getElementById('btn-quit').addEventListener('click', function () {
      if (confirm('Voulez-vous fermer l\\'éditeur de Vibe sans publier ?')) {
        fetch('/quit', { method: 'POST' }).then(function () {
          window.close();
          document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-size:24px; color:var(--text-muted);">L\\'éditeur de Vibe a été fermé. Vous pouvez fermer cet onglet.</div>';
        });
      }
    });
  </script>
</body>
</html>`;

/** Ouvre une URL dans le navigateur par défaut (Windows / macOS / Linux). */
function openInBrowser(url: string) {
  const platform = process.platform;
  const command = platform === 'win32'
    ? `start "" "${url}"`
    : platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(command, (err) => {
    if (err) console.log(`  ${c.yellow}ℹ Ouvrez manuellement : ${url}${c.reset}`);
  });
}

/**
 * Serveur HTTP local pour l'éditeur visuel de Vibe (port 3334) :
 * GET /            → éditeur HTML (injecte le nom de l'auteur)
 * POST /publish    → publie la Vibe puis referme le serveur
 * POST /quit       → abandonne la publication
 */
export async function runVibeVisualEditor(author: TargetUser): Promise<VibePublicationResult | null> {
  let outcome: VibePublicationResult | null = null;
  const authorJson = JSON.stringify(author.username);
  const authorEscaped = author.username
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || (req.url || '').startsWith('/?'))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        VIBE_EDITOR_HTML
          .split('__AUTHOR_NAME__').join(authorEscaped)
          .split('__AUTHOR_JSON__').join(authorJson)
      );
      return;
    }
    if (req.method === 'POST' && req.url === '/publish') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const scheduledAt = payload.scheduled_at ? new Date(payload.scheduled_at) : null;
          outcome = await publishVibeAsUser({
            authorId: Number(author.id),
            authorUsername: author.username,
            content: String(payload.content || ''),
            format: 'article',
            visibility: String(payload.visibility || 'public'),
            aiGenerated: Boolean(payload.ai_generated),
            mediaUrls: Array.isArray(payload.media_urls) ? payload.media_urls.map(String) : [],
            scheduledAt,
            notifyAuthor: payload.notify_author !== false,
            notifySubscribers: payload.notify_subscribers !== false,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          if (outcome.ok) {
            const msg = outcome.status === 'scheduled'
              ? "Vibe programmée avec succès ! L'auteur sera notifié à l'échéance."
              : 'Vibe publiée avec succès !';
            res.end(JSON.stringify({ success: true, message: msg }));
            // Publication terminée : refermer le serveur et rendre la main au CLI
            setTimeout(() => server.close(() => {}), 800);
          } else {
            res.end(JSON.stringify({ success: false, error: outcome.error || 'Échec de la publication.' }));
          }
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e?.message || 'Requête invalide.' }));
        }
      });
      return;
    }
    if (req.method === 'POST' && req.url === '/quit') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      console.log(`\n${c.dim}[VIBE STUDIO] Éditeur fermé sans publication.${c.reset}`);
      setTimeout(() => server.close(() => {}), 300);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Non trouvé');
  });

  await new Promise<void>((resolve) => {
    server.listen(VIBE_EDITOR_PORT, () => {
      console.log(`\n${c.brightGreen}✔ Éditeur visuel de Vibe démarré sur http://localhost:${VIBE_EDITOR_PORT}/${c.reset}`);
      openInBrowser(`http://localhost:${VIBE_EDITOR_PORT}/`);
      resolve();
    });
  });

  console.log(`  ${c.dim}⏳ En attente de la publication depuis le navigateur (Ctrl+C pour forcer l'arrêt)…${c.reset}`);
  await new Promise<void>((resolve) => server.on('close', () => resolve()));

  return outcome;
}

// ─────────────────────────────────────────────
// Assistant interactif de publication d'une Vibe
// ─────────────────────────────────────────────
export async function runVibePublisher() {
  console.log(`\n${c.bgPurple}${c.bold}${c.brightWhite} 📝 PUBLICATION D'UNE VIBE (AU NOM D'UN UTILISATEUR) 📝 ${c.reset}\n`);

  const rl = readline.createInterface({ input, output });

  try {
    // 1. Choix de l'auteur
    const author = await promptSelectUser(rl);
    if (!author) {
      console.log(`\n${c.dim}Publication annulée (aucun utilisateur sélectionné).${c.reset}\n`);
      return;
    }

    // 2. Mode d'édition
    console.log(`\n${c.bold}2. Mode de rédaction :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 🌐 Éditeur visuel (Navigateur Web) ${c.brightGreen}[Recommandé]${c.reset}`);
    console.log(`  ${c.brightCyan}[2]${c.reset} ⌨️  Saisie dans le terminal (texte brut ou HTML)`);
    const modeChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';

    if (modeChoice === '1') {
      rl.close();
      const outcome = await runVibeVisualEditor(author);
      printVibeOutcome(outcome);
      return;
    }

    // ───── Mode terminal ─────
    console.log(`\n${c.bold}3. Audience de la publication :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 🌍 Public (défaut)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} 👥 Abonnés uniquement`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 🔒 Cercle Privé`);
    console.log(`  ${c.brightCyan}[4]${c.reset} ⚪ Privé (soi seul)`);
    const visChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-4] (défaut 1) : ${c.reset}`)).trim() || '1';
    const visibility = visChoice === '2' ? 'followers' : visChoice === '3' ? 'circle' : visChoice === '4' ? 'private' : 'public';

    const aiAns = (await rl.question(`  ${c.brightYellow}➔ Marquer « Créé avec l'IA » ? (o/N) : ${c.reset}`)).trim().toLowerCase();
    const aiGenerated = aiAns === 'o' || aiAns === 'oui' || aiAns === 'y';

    const mediaInput = (await rl.question(`  ${c.brightYellow}➔ Médias joints — URLs séparées par des virgules (vide = aucun) : ${c.reset}`)).trim();
    const mediaUrls = mediaInput ? mediaInput.split(',').map((u) => u.trim()).filter(Boolean) : [];

    console.log(`\n${c.bold}4. Timing de publication :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} ⚡ Immédiate (défaut)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} ⏳ Programmée (à une date précise)`);
    const timeChoice = (await rl.question(`  ${c.brightYellow}➔ Choix [1-2] (défaut 1) : ${c.reset}`)).trim() || '1';
    let scheduledAt: Date | null = null;
    if (timeChoice === '2') {
      const dateStr = (await rl.question(`  ${c.brightYellow}➔ Date de publication (ex: 2026-09-15 18:30, ou +2j) : ${c.reset}`)).trim();
      scheduledAt = parseDateInput(dateStr, true);
      if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
        console.log(`${c.brightRed}✖ Date de programmation invalide ou passée. Publication annulée.${c.reset}`);
        return;
      }
      console.log(`  ${c.brightGreen}✔ Publication programmée pour le ${scheduledAt.toLocaleString('fr-FR')}${c.reset}`);
    }

    console.log(`\n${c.bold}5. Contenu de la Vibe :${c.reset}`);
    console.log(`  ${c.dim}Tapez ou collez le contenu (HTML accepté). Terminez par 'FIN' sur une ligne seule.${c.reset}`);
    const lines: string[] = [];
    let lineNum = 1;
    while (true) {
      const line = await rl.question(`  ${c.dim}${String(lineNum).padStart(3)}│${c.reset} `);
      if (line.trim() === 'FIN') break;
      lines.push(line);
      lineNum++;
    }
    const content = lines.join('\n').trim();
    if (!content) {
      console.log(`${c.brightRed}✖ Le contenu est obligatoire. Publication annulée.${c.reset}`);
      return;
    }
    // Contenu collé en HTML → format article, sinon micro_text (comme l'app)
    const format = content.startsWith('<') ? 'article' : 'micro_text';

    console.log(`\n${c.bold}6. Notifications :${c.reset}`);
    const authorNotifAns = (await rl.question(`  ${c.brightYellow}➔ Notifier l'auteur du résultat (réussie / programmée / échouée) ? (O/n) : ${c.reset}`)).trim().toLowerCase();
    const notifyAuthor = !(authorNotifAns === 'n' || authorNotifAns === 'non');
    const subsNotifAns = (await rl.question(`  ${c.brightYellow}➔ Notifier les abonnés aux publications du compte ? (O/n) : ${c.reset}`)).trim().toLowerCase();
    const notifySubscribers = !(subsNotifAns === 'n' || subsNotifAns === 'non');

    // 7. Récapitulatif & confirmation
    console.log(`\n${c.bold}══════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bold}  RÉCAPITULATIF DE LA PUBLICATION :${c.reset}`);
    console.log(`  - Auteur          : ${author.username} (${author.email})`);
    console.log(`  - Audience        : ${visibility}`);
    console.log(`  - Timing          : ${scheduledAt ? `⏳ Programmée le ${scheduledAt.toLocaleString('fr-FR')}` : '⚡ Immédiate'}`);
    console.log(`  - Médias          : ${mediaUrls.length > 0 ? `${mediaUrls.length} URL(s)` : 'aucun'}`);
    console.log(`  - Badge IA        : ${aiGenerated ? 'oui' : 'non'}`);
    console.log(`  - Format          : ${format}`);
    console.log(`  - Notif. auteur   : ${notifyAuthor ? '✉️ oui (type mai_system)' : 'non'}`);
    console.log(`  - Notif. abonnés  : ${notifySubscribers ? '📣 oui (type post)' : 'non'}`);
    console.log(`  - Extrait         : ${c.dim}${stripVibeHtml(content).slice(0, 70)}${stripVibeHtml(content).length > 70 ? '…' : ''}${c.reset}`);
    console.log(`${c.bold}══════════════════════════════════════════════════════════════════${c.reset}\n`);

    const confirm = (await rl.question(`  ${c.brightYellow}➔ Confirmer la publication de cette Vibe ? (o/n) : ${c.reset}`)).trim().toLowerCase();
    if (confirm !== 'o' && confirm !== 'oui' && confirm !== 'y') {
      console.log(`\n${c.dim}Publication annulée.${c.reset}\n`);
      return;
    }

    console.log(`\n${c.cyan}⏳ Publication en cours…${c.reset}`);
    const outcome = await publishVibeAsUser({
      authorId: Number(author.id),
      authorUsername: author.username,
      content,
      format,
      visibility,
      aiGenerated,
      mediaUrls,
      scheduledAt,
      notifyAuthor,
      notifySubscribers,
    });
    printVibeOutcome(outcome);
  } finally {
    rl.close();
  }
}

// ─────────────────────────────────────────────
// MENU PRINCIPAL DE LA SUITE ADMINISTRATIVE
// ─────────────────────────────────────────────
export async function runAdminCli() {
  await initPendingResetsTable().catch(() => {});
  await initQuotaBoostsTable().catch(() => {});
  await initCustomersTable().catch(() => {});
  // Support des flags en ligne de commande pour exécution non interactive / crons
  const args = process.argv.slice(2);
  const noEmail = args.includes('--no-email') || args.includes('--no-notify');
  if (args.includes('--reset-api')) {
    await resetApiUsage(!noEmail);
    process.exit(0);
  }
  if (args.includes('--reset-mai')) {
    await resetMaiUsage(!noEmail);
    process.exit(0);
  }
  if (args.includes('--reset-images')) {
    await resetImageUsage(!noEmail);
    process.exit(0);
  }
  if (args.includes('--reset-audio')) {
    await resetAudioUsage(!noEmail);
    process.exit(0);
  }
  if (args.includes('--reset-all')) {
    await resetAllUsage(!noEmail);
    process.exit(0);
  }
  if (args.includes('--boost-quota')) {
    const rl = readline.createInterface({ input, output });
    let preselectedUser: string | undefined = undefined;
    const userArgIdx = args.indexOf('--user');
    if (userArgIdx !== -1 && args[userArgIdx + 1]) {
      preselectedUser = args[userArgIdx + 1];
    }
    await runQuotaBoostWizard(rl, preselectedUser);
    rl.close();
    process.exit(0);
  }
  if (args.includes('--codes')) {
    await runSubscriptionCodeManager();
    process.exit(0);
  }
  if (args.includes('--customers')) {
    await runCustomerAccountManager();
    process.exit(0);
  }
  if (args.includes('--edit-profile')) {
    const rl = readline.createInterface({ input, output });
    await handleEditCustomerProfile(rl);
    rl.close();
    process.exit(0);
  }
  if (args.includes('--verify-user')) {
    const rl = readline.createInterface({ input, output });
    await handleToggleVerifiedBadge(rl);
    rl.close();
    process.exit(0);
  }
  if (args.includes('--posts') || args.includes('--manage-posts') || args.includes('--edit-post')) {
    const rl = readline.createInterface({ input, output });
    await handleManagePosts(rl);
    rl.close();
    process.exit(0);
  }
  if (args.includes('--vibe') || args.includes('--publish-vibe')) {
    await runVibePublisher();
    process.exit(0);
  }
  if (args.includes('--newsletter')) {
    await runNewsletterStudio();
    process.exit(0);
  }
  if (args.includes('--notify-news')) {
    const idx = args.indexOf('--notify-news');
    const title = args[idx + 1];
    const body = args[idx + 2] || null;
    const link = args[idx + 3] || null;
    if (!title) {
      console.error("Usage: --notify-news \"Titre\" [\"Body\"] [\"Link\"]");
      process.exit(1);
    }
    await sendNewsNotificationToEligibleUsers(title, body, link);
    process.exit(0);
  }
  if (args.includes('--notifications')) {
    await runNotificationManager();
    process.exit(0);
  }

  console.log("");
  console.log(`${c.bgPurple}${c.bold}${c.brightWhite}  ╔══════════════════════════════════════════════════════════════════════╗  ${c.reset}`);
  console.log(`${c.bgPurple}${c.bold}${c.brightWhite}  ║             🛠️  mAI — CONSOLE D'ADMINISTRATION & MAINTENANCE         ║  ${c.reset}`);
  console.log(`${c.bgPurple}${c.bold}${c.brightWhite}  ╚══════════════════════════════════════════════════════════════════════╝  ${c.reset}`);
  console.log("");

  let rl = readline.createInterface({ input, output });
  let running = true;

  while (running) {
    console.log(`\n${c.bold}ACTIONS DISPONIBLES :${c.reset}`);
    console.log(`  ${c.brightCyan}[1]${c.reset} 🔄 Réinitialiser les quotas d'usage API (mprojects_api_keys)`);
    console.log(`  ${c.brightCyan}[2]${c.reset} 🔄 Réinitialiser les quotas d'usage mAI (weekly_usage)`);
    console.log(`  ${c.brightCyan}[3]${c.reset} 🔄 Réinitialiser les quotas journaliers d'Images`);
    console.log(`  ${c.brightCyan}[4]${c.reset} 🔄 Réinitialiser les quotas de synthèse vocale Audio (weekly_speech_usage)`);
    console.log(`  ${c.brightGreen}[5]${c.reset} ⚡ ${c.bold}Réinitialiser TOUS les quotas en 1 clic (API + mAI + Images + Audio)${c.reset}`);
    console.log(`  ${c.brightYellow}[6]${c.reset} 📈 ${c.bold}Augmenter temporairement un quota (Boost jusqu'à une date ou période)${c.reset}`);
    console.log(`  ${c.brightMagenta}[7]${c.reset} 🎟️  Gérer les codes d'abonnement (Créer, Lister, Activer, Modifier)`);
    console.log(`  ${c.brightYellow}[8]${c.reset} 📧 Lancer le Studio de Newsletter (Éditeur HTML & CLI)`);
    console.log(`  ${c.brightWhite}[9]${c.reset} 👥 Gérer les comptes & profils clients (Lister, Modifier profil, Coche vérifiée, Bloquer, Supprimer)`);
    console.log(`  ${c.brightCyan}[10]${c.reset} 🔔 Gérer les Notifications & Actualités (Broadcast)`);
    console.log(`  ${c.brightGreen}[11]${c.reset} 📝 ${c.bold}Publier une Vibe pour un utilisateur (Éditeur web & CLI)${c.reset}`);
    console.log(`  ${c.brightYellow}[12]${c.reset} 📰 ${c.bold}Gérer & modifier les posts / Vibes (Lister, Modifier texte/statut/médias/stats, Supprimer)${c.reset}`);
    console.log(`  ${c.brightWhite}[13]${c.reset} 👥 Modifier le nombre d'abonnés d'un utilisateur Vibe`);
    console.log(`  ${c.white}[0]${c.reset} 🚪 Quitter`);
    console.log("");

    const choice = (await rl.question(`  ${c.brightYellow}➔ Votre choix [0-13] : ${c.reset}`)).trim();

    switch (choice) {
      case '1':
        await runResetWizard(rl, 'api');
        break;
      case '2':
        await runResetWizard(rl, 'mai');
        break;
      case '3':
        await runResetWizard(rl, 'images');
        break;
      case '4':
        await runResetWizard(rl, 'audio');
        break;
      case '5':
        await runResetWizard(rl, 'all');
        break;
      case '6':
        await runQuotaBoostManager(rl);
        break;
      case '7':
        rl.close();
        await runSubscriptionCodeManager();
        rl = readline.createInterface({ input, output });
        break;
      case '8':
        rl.close();
        await runNewsletterStudio();
        rl = readline.createInterface({ input, output });
        break;
      case '9':
        rl.close();
        await runCustomerAccountManager();
        rl = readline.createInterface({ input, output });
        break;
      case '10':
        rl.close();
        await runNotificationManager();
        rl = readline.createInterface({ input, output });
        break;
      case '11':
        rl.close();
        await runVibePublisher();
        rl = readline.createInterface({ input, output });
        break;
      case '12':
        rl.close();
        await runPostManagerCli();
        rl = readline.createInterface({ input, output });
        break;
      case '13':
        await handleEditVibeUserFollowers(rl);
        break;
      case '0':
      case 'exit':
      case 'quit':
        running = false;
        console.log(`\n${c.dim}👋 Fermeture de la console d'administration.${c.reset}\n`);
        break;
      default:
        console.log("⚠️ Choix invalide.");
    }
  }

  rl.close();
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('admin.ts')) {
  runAdminCli().catch((err) => {
    if (err?.code === 'ERR_READLINE_ACTION' || err?.message?.includes('closed') || err?.code === 'EPIPE') {
      process.exit(0);
    }
    console.error("❌ Erreur fatale :", err?.message || err);
    process.exit(1);
  });
}
