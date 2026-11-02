import crypto from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { neon } from "@neondatabase/serverless";
import { articleBoutique, type ShopKind } from "../lib/quizzly/shop.ts";
import { runNewsletterStudio, sendEmail } from "./admin-email.ts";
import { runFormManager } from "./admin-forms.ts";
import { createConflictResolver, runModelManager } from "./admin-models.ts";
import { loadLocalEnv } from "./cli-env.ts";
import { updateModels } from "./updateModels.ts";

// ─────────────────────────────────────────────
// Chargement automatique des variables d'environnement
// ─────────────────────────────────────────────
loadLocalEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(
    "❌ Erreur : DATABASE_URL est introuvable dans votre environnement ou vos fichiers .env."
  );
  process.exit(1);
}

const sql = neon<false, false>(dbUrl);

// ─────────────────────────────────────────────
// Styles & Palette ANSI CLI
// ─────────────────────────────────────────────
const c = {
  bgBlue: "\x1b[44m",
  bgDark: "\x1b[48;5;236m",
  bgGreen: "\x1b[42m",
  bgPurple: "\x1b[48;5;55m",
  bold: "\x1b[1m",
  brightCyan: "\x1b[96m",
  brightGreen: "\x1b[92m",
  brightMagenta: "\x1b[95m",
  brightRed: "\x1b[91m",
  brightWhite: "\x1b[97m",
  brightYellow: "\x1b[93m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  italic: "\x1b[3m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  underline: "\x1b[4m",
  white: "\x1b[37m",
  yellow: "\x1b[33m",
};

// ─────────────────────────────────────────────
// Utilitaires de navigation, raccourcis et affichage
// ─────────────────────────────────────────────
function isBackOrCancel(val: string): boolean {
  const v = val.trim().toLowerCase();
  return (
    v === "0" ||
    v === "r" ||
    v === "b" ||
    v === "back" ||
    v === "retour" ||
    v === "q" ||
    v === "quit" ||
    v === "exit" ||
    v === "annuler" ||
    v === "cancel"
  );
}

function isYes(val: string): boolean {
  const v = val.trim().toLowerCase();
  return (
    v === "o" ||
    v === "oui" ||
    v === "y" ||
    v === "yes" ||
    v === "1" ||
    v === "true"
  );
}

async function waitEnter(
  rl: readline.Interface,
  message = "Appuyez sur Entrée pour continuer..."
): Promise<void> {
  await rl.question(`\n${c.dim}⌨️  ${message}${c.reset}`);
}

function badgeTier(tier?: string | null): string {
  const t = (tier || "Free").trim().toLowerCase();
  if (t === "max") return `${c.brightMagenta}👑 Max${c.reset}`;
  if (t === "pro") return `${c.brightCyan}💎 Pro${c.reset}`;
  if (t === "plus") return `${c.brightYellow}⭐ Plus${c.reset}`;
  return `${c.dim}🌱 Free${c.reset}`;
}

function badgeStatus(active: boolean): string {
  return active
    ? `${c.brightGreen}🟢 Actif${c.reset}`
    : `${c.brightRed}🔴 Inactif${c.reset}`;
}

function badgeBlocked(blocked: boolean): string {
  return blocked
    ? `${c.brightRed}⛔ Bloqué${c.reset}`
    : `${c.brightGreen}🟢 Actif${c.reset}`;
}

// ─────────────────────────────────────────────
// Template d'E-mail de Réinitialisation de Quotas
// ─────────────────────────────────────────────
function buildQuotaEmailHtml(
  title: string,
  username: string,
  messageText: string,
  badgeLabel: string
) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#080c14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f1f5f9;">
      <div style="max-width:560px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);">

        <!-- Header & Logo -->
        <div style="background:linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #0f172a 100%); padding:36px 24px 28px 24px; text-align:center; border-bottom:1px solid #2e1065;">
          <img src="https://upload.fs.fr/azq3C6GLea.png" alt="mAI Logo" style="height:44px; width:auto; max-width:180px; object-fit:contain; display:inline-block;" />
          <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:16px 0 0 0; letter-spacing:-0.5px;">${title}</h1>
        </div>

        <!-- Body Content -->
        <div style="padding:32px 28px; line-height:1.7; font-size:15px; color:#cbd5e1;">
          <p style="margin-top:0; font-size:16px; font-weight:600; color:#ffffff;">Bonjour <strong>${username}</strong>,</p>
          <p>${messageText}</p>

          <div style="background:linear-gradient(180deg, #131d31 0%, #0c1322 100%); border:1px solid #334155; border-radius:16px; padding:22px; text-align:center; margin:26px 0;">
            <span style="display:inline-block; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.35); font-weight:800; font-size:13px; padding:6px 18px; border-radius:100px; text-transform:uppercase; letter-spacing:0.5px;">
              ${badgeLabel}
            </span>
            <p style="font-size:13px; color:#94a3b8; margin:12px 0 0 0;">L'intégralité de vos crédits, tokens et clés d'API sont à nouveau disponibles.</p>
          </div>

          <p style="font-size:12px; color:#64748b; margin-top:24px;">Cet e-mail automatique vous est adressé car les notifications de gestion de quotas sont activées sur votre profil mAI.</p>
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

// ─────────────────────────────────────────────
// 1. RÉINITIALISATION DES USAGES API
// ─────────────────────────────────────────────
export async function resetApiUsage(notifyUsers = true) {
  console.log(
    `\n${c.cyan}🔑 Réinitialisation des usages des clés d'API (mprojects_api_keys)...${c.reset}`
  );
  await sql`UPDATE mprojects_api_keys SET request_count = 0`;
  console.log(
    `${c.brightGreen}✅ Succès : Tous les compteurs de requêtes d'API ont été remis à 0 !${c.reset}`
  );

  if (!notifyUsers) {
    return;
  }

  const users =
    (await sql`SELECT email, username FROM users WHERE notify_limits = TRUE`) as unknown as {
      email: string;
      username: string;
    }[];
  if (users.length === 0) {
    console.log(
      ` ${c.dim}ℹ️  Aucun utilisateur inscrit aux notifications de limites.${c.reset}`
    );
    return;
  }

  console.log(
    ` ${c.brightYellow}📧 Envoi des e-mails de notification à ${users.length} utilisateur(s)...${c.reset}`
  );
  let success = 0;
  for (const user of users) {
    const html = buildQuotaEmailHtml(
      "Réinitialisation de vos quotas d'API",
      user.username,
      "Vos quotas de requêtes d'API mAI ont été réinitialisés pour la nouvelle période.",
      "Quotas d'API réinitialisés à 100%"
    );

    try {
      const sent = await sendEmail({
        html,
        subject: "Vos quotas API mAI ont été réinitialisés",
        to: user.email,
      });
      if (sent) {
        success++;
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.error(
        ` ${c.red}✖️  Erreur d'envoi pour ${user.email}: ${err?.message || err}${c.reset}`
      );
    }
  }

  console.log(
    ` ${c.brightGreen}✉️  ${success} notification(s) e-mail envoyée(s) avec succès !${c.reset}`
  );
}

// ─────────────────────────────────────────────
// 2. RÉINITIALISATION DES USAGES mAI (TOKENS HEBDOMADAIRES)
// ─────────────────────────────────────────────
export async function resetMaiUsage(notifyUsers = true) {
  console.log(
    `\n${c.cyan}🧠 Réinitialisation des tokens hebdomadaires mAI (weekly_usage)...${c.reset}`
  );
  await sql`UPDATE weekly_usage SET tokens_used = 0`;
  console.log(
    `${c.brightGreen}✅ Succès : Tous les compteurs de tokens mAI ont été remis à 0 !${c.reset}`
  );

  if (!notifyUsers) {
    return;
  }

  const users =
    (await sql`SELECT email, username FROM users WHERE notify_limits = TRUE`) as unknown as {
      email: string;
      username: string;
    }[];
  if (users.length === 0) {
    console.log(
      ` ${c.dim}ℹ️  Aucun utilisateur inscrit aux notifications de limites.${c.reset}`
    );
    return;
  }

  console.log(
    ` ${c.brightYellow}📧 Envoi des e-mails de notification à ${users.length} utilisateur(s)...${c.reset}`
  );
  let success = 0;
  for (const user of users) {
    const html = buildQuotaEmailHtml(
      "Réinitialisation de vos quotas mAI",
      user.username,
      "Vos quotas de tokens hebdomadaires pour les modèles mAI ont été réinitialisés.",
      "Quotas mAI réinitialisés à 100%"
    );

    try {
      const sent = await sendEmail({
        html,
        subject: "Vos quotas mAI ont été réinitialisés",
        to: user.email,
      });
      if (sent) {
        success++;
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.error(
        ` ${c.red}✖️  Erreur d'envoi pour ${user.email}: ${err?.message || err}${c.reset}`
      );
    }
  }

  console.log(
    ` ${c.brightGreen}✉️  ${success} notification(s) e-mail envoyée(s) avec succès !${c.reset}`
  );
}

// ─────────────────────────────────────────────
// 3. RÉINITIALISATION DES USAGES IMAGES
// ─────────────────────────────────────────────
export async function resetImageUsage() {
  console.log(
    `\n${c.cyan}🖼️  Réinitialisation des quotas journaliers de génération d'images...${c.reset}`
  );
  await sql`UPDATE mprojects_daily_image_usage SET images_generated = 0, updated_at = NOW() WHERE usage_date = CURRENT_DATE`;
  console.log(
    `${c.brightGreen}✅ Succès : Les quotas journaliers d'images ont été réinitialisés pour aujourd'hui !${c.reset}`
  );
}

// ─────────────────────────────────────────────
// 3b. RÉINITIALISATION DES USAGES AUDIO
// ─────────────────────────────────────────────
export async function resetAudioUsage(notifyUsers = true) {
  console.log(
    `\n${c.cyan}🎙️  Réinitialisation des quotas audio (weekly_speech_usage)...${c.reset}`
  );
  await sql`UPDATE weekly_speech_usage SET tokens_used = 0, requests_count = 0`;
  console.log(
    `${c.brightGreen}✅ Succès : Tous les compteurs de quotas audio ont été remis à 0 !${c.reset}`
  );

  if (!notifyUsers) {
    return;
  }

  const users =
    (await sql`SELECT email, username FROM users WHERE notify_limits = TRUE`) as unknown as {
      email: string;
      username: string;
    }[];
  if (users.length === 0) {
    console.log(
      ` ${c.dim}ℹ️  Aucun utilisateur inscrit aux notifications de limites.${c.reset}`
    );
    return;
  }

  console.log(
    ` ${c.brightYellow}📧 Envoi des e-mails de notification à ${users.length} utilisateur(s)...${c.reset}`
  );
  let success = 0;
  for (const user of users) {
    const html = buildQuotaEmailHtml(
      "Réinitialisation de vos quotas Audio",
      user.username,
      "Vos quotas de synthèse vocale et d'audio mAI ont été réinitialisés pour la nouvelle période.",
      "Quotas Audio réinitialisés à 100%"
    );

    try {
      const sent = await sendEmail({
        html,
        subject: "Vos quotas Audio mAI ont été réinitialisés",
        to: user.email,
      });
      if (sent) {
        success++;
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.error(
        ` ${c.red}✖️  Erreur d'envoi pour ${user.email}: ${err?.message || err}${c.reset}`
      );
    }
  }

  console.log(
    ` ${c.brightGreen}✉️  ${success} notification(s) e-mail envoyée(s) avec succès !${c.reset}`
  );
}

// ─────────────────────────────────────────────
// 4. RÉINITIALISATION GLOBALE (API + mAI + IMAGES + AUDIO)
// ─────────────────────────────────────────────
export async function resetAllUsage(
  notifyUsers = true,
  rl?: readline.Interface
) {
  if (rl) {
    console.log(
      `\n${c.brightYellow}⚠️  ATTENTION : RÉINITIALISATION GLOBALE DE TOUS LES QUOTAS ⚡${c.reset}`
    );
    console.log(
      `${c.dim}Cette action va remettre à 0 l'ensemble des compteurs (API, mAI, Images, Audio) pour tous les utilisateurs.${c.reset}`
    );
    const confirm = (
      await rl.question(
        ` ${c.bold}❓ Êtes-vous certain de vouloir exécuter cette réinitialisation ? (o/N) : ${c.reset}`
      )
    ).trim();

    if (!isYes(confirm)) {
      console.log(`\n${c.dim}↩️  Réinitialisation globale annulée.${c.reset}\n`);
      return;
    }
  }

  console.log(
    `\n${c.bgPurple}${c.bold}${c.brightWhite} ⚡ RÉINITIALISATION GLOBALE DE TOUS LES QUOTAS (API + mAI + IMAGES + AUDIO) ⚡ ${c.reset}`
  );
  await resetApiUsage(false);
  await resetMaiUsage(false);
  await resetImageUsage();
  await resetAudioUsage(false);

  if (notifyUsers) {
    const users =
      (await sql`SELECT email, username FROM users WHERE notify_limits = TRUE`) as unknown as {
        email: string;
        username: string;
      }[];
    if (users.length > 0) {
      console.log(
        `\n ${c.brightYellow}📧 Envoi d'une notification globale unifiée à ${users.length} utilisateur(s)...${c.reset}`
      );
      let success = 0;
      for (const user of users) {
        const html = buildQuotaEmailHtml(
          "Réinitialisation globale de vos quotas mAI",
          user.username,
          "L'ensemble de vos quotas de requêtes API, de tokens mAI, de génération d'images et de synthèse vocale/audio ont été réinitialisés à 100%.",
          "Tous les quotas réinitialisés à 100%"
        );

        try {
          const sent = await sendEmail({
            html,
            subject: "Tous vos quotas mAI ont été réinitialisés",
            to: user.email,
          });
          if (sent) {
            success++;
          }
          await new Promise((r) => setTimeout(r, 100));
        } catch (err: any) {
          console.error(
            ` ${c.red}✖️  Erreur pour ${user.email}: ${err?.message || err}${c.reset}`
          );
        }
      }
      console.log(
        ` ${c.brightGreen}✉️  ${success} e-mail(s) de réinitialisation globale envoyé(s) !${c.reset}`
      );
    }
  }

  console.log(
    `\n${c.brightGreen}${c.bold}✨ Tous les quotas ont été remis à zéro avec succès ! 🎉${c.reset}\n`
  );
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
  const randomChars = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()
    .slice(0, 6);
  return `MAI-${tier.toUpperCase()}-${randomChars}`;
}

function renderCodesTable(codes: any[]) {
  if (codes.length === 0) {
    console.log(
      `\n${c.brightYellow}ℹ️  Aucun code d'abonnement trouvé en base de données.${c.reset}\n`
    );
    return;
  }

  const activeCount = codes.filter((c) => c.is_active).length;
  console.log(
    `\n${c.bold}📊 Total : ${codes.length} code(s) (🟢 ${activeCount} actif(s), 🔴 ${codes.length - activeCount} inactif(s))${c.reset}`
  );
  console.log(`${"═".repeat(102)}`);
  console.log(
    `║ ${"ID".padEnd(4)} ║ ${"CODE".padEnd(24)} ║ ${"FORFAIT".padEnd(10)} ║ ${"USAGES".padEnd(
      12
    )} ║ ${"STATUT".padEnd(12)} ║ ${"EXPIRATION".padEnd(20)} ║`
  );
  console.log("═".repeat(102));

  for (const item of codes) {
    const id = String(item.id).padEnd(4);
    const code = String(item.code).padEnd(24);
    const tier = (
      item.tier === "Max"
        ? "👑 Max"
        : item.tier === "Pro"
          ? "💎 Pro"
          : "⭐ Plus"
    ).padEnd(10);

    const isExhausted = item.uses_count >= item.max_uses;
    const uses =
      `${item.uses_count}/${item.max_uses}${isExhausted ? " ⚠️" : ""}`.padEnd(
        12
      );
    const status = (item.is_active ? "🟢 Actif" : "🔴 Inactif").padEnd(12);
    const exp = item.expires_at
      ? new Date(item.expires_at).toLocaleDateString("fr-FR")
      : "♾️  Illimitée";
    const expiration = exp.padEnd(20);

    console.log(
      `║ ${id} ║ ${code} ║ ${tier} ║ ${uses} ║ ${status} ║ ${expiration} ║`
    );
  }
  console.log(`${"═".repeat(102)}\n`);
}

async function handleCreateCode(rl: readline.Interface) {
  console.log(
    `\n${c.bold}➕ CRÉATION D'UN NOUVEAU CODE D'ABONNEMENT${c.reset}`
  );
  console.log(
    `${c.dim}(💡 Tapez 'r' à tout moment pour annuler et revenir)${c.reset}\n`
  );

  console.log("⭐ Choisissez le forfait à débloquer :");
  console.log("  [1] ⭐ Plus");
  console.log("  [2] 💎 Pro (défaut)");
  console.log("  [3] 👑 Max");
  const tierChoice = (
    await rl.question(" 👉 Votre choix [1-3] (défaut: 2 - Pro) : ")
  ).trim();

  if (isBackOrCancel(tierChoice)) {
    console.log(`\n${c.dim}↩️  Création de code annulée.${c.reset}`);
    return;
  }

  let tier: "Plus" | "Pro" | "Max" = "Pro";
  if (tierChoice === "1") {
    tier = "Plus";
  } else if (tierChoice === "3") {
    tier = "Max";
  }

  console.log("\n🪄 Mode de génération du code :");
  console.log(`  [1] 🤖 Automatique (ex: MAI-${tier.toUpperCase()}-XXXXXX)`);
  console.log("  [2] ✍️  Saisie manuelle personnalisée");
  const modeChoice = (
    await rl.question(" 👉 Votre choix [1-2] (défaut: 1) : ")
  ).trim();

  if (isBackOrCancel(modeChoice)) {
    console.log(`\n${c.dim}↩️  Création de code annulée.${c.reset}`);
    return;
  }

  let finalCode = "";
  if (modeChoice === "2") {
    while (!finalCode) {
      const custom = (
        await rl.question(
          " 🔤 Entrez votre code personnalisé (min 3 caractères) : "
        )
      )
        .trim()
        .toUpperCase();

      if (isBackOrCancel(custom)) {
        console.log(`\n${c.dim}↩️  Création de code annulée.${c.reset}`);
        return;
      }

      if (custom.length >= 3) {
        finalCode = custom;
      } else {
        console.log(" ⚠️  Le code doit comporter au moins 3 caractères.");
      }
    }
  } else {
    finalCode = generateRandomCode(tier);
  }

  const usesInput = (
    await rl.question(" 📊 Nombre maximal d'utilisations (défaut: 1) : ")
  ).trim();

  if (isBackOrCancel(usesInput)) {
    console.log(`\n${c.dim}↩️  Création de code annulée.${c.reset}`);
    return;
  }

  const maxUses =
    Number.parseInt(usesInput, 10) > 0 ? Number.parseInt(usesInput, 10) : 1;

  const daysInput = (
    await rl.question(
      " ⏳ Durée de validité en jours (laisser vide pour illimité) : "
    )
  ).trim();

  if (isBackOrCancel(daysInput)) {
    console.log(`\n${c.dim}↩️  Création de code annulée.${c.reset}`);
    return;
  }

  const expiresInDays =
    Number.parseInt(daysInput, 10) > 0 ? Number.parseInt(daysInput, 10) : null;

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
    console.log(
      `\n${c.brightGreen}${c.bold}✨ CODE D'ABONNEMENT CRÉÉ ET ENREGISTRÉ AVEC SUCCÈS ! 🎉${c.reset}`
    );
    console.log(
      `  🏷️  Code         : ${c.brightGreen}${c.bold}${item.code}${c.reset}`
    );
    console.log(`  ⭐ Forfait      : ${badgeTier(item.tier)}`);
    console.log(`  📊 Utilisations : 0 / ${item.max_uses}`);
    console.log(
      `  ⏳ Expiration   : ${
        item.expires_at
          ? new Date(item.expires_at).toLocaleString("fr-FR")
          : "♾️  Illimitée"
      }\n`
    );
  } catch (err: any) {
    console.error("❌ Erreur lors de la création :", err.message || err);
  }
}

async function handleListCodes() {
  console.log(`\n${c.bold}📋 LISTE DES CODES D'ABONNEMENT mAI${c.reset}`);
  const codes =
    await sql`SELECT * FROM subscription_codes ORDER BY created_at DESC;`;
  renderCodesTable(codes);
}

async function handleToggleCode(rl: readline.Interface) {
  console.log(
    `\n${c.bold}🔄 ACTIVER / DÉSACTIVER UN CODE D'ABONNEMENT${c.reset}`
  );
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);
  const search = (
    await rl.question(" 🔍 Entrez le Code ou l'ID à basculer : ")
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Action annulée.${c.reset}`);
    return;
  }

  const found = await sql`
    SELECT * FROM subscription_codes
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log(` ${c.red}✖️  Aucun code correspondant trouvé.${c.reset}`);
    return;
  }

  const current = found[0];
  const newStatus = !current.is_active;

  await sql`
    UPDATE subscription_codes
    SET is_active = ${newStatus}
    WHERE id = ${current.id};
  `;

  console.log(
    `\n${c.brightGreen}✅ Statut du code ${c.bold}${current.code}${c.reset} mis à jour : ${
      newStatus ? "🟢 ACTIF" : "🔴 INACTIF"
    }\n`
  );
}

async function handleEditCode(rl: readline.Interface) {
  console.log(`\n${c.bold}✏️  MODIFIER UN CODE D'ABONNEMENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);
  const search = (
    await rl.question(" 🔍 Entrez le Code ou l'ID à modifier : ")
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  const found = await sql`
    SELECT * FROM subscription_codes
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log(` ${c.red}✖️  Aucun code trouvé.${c.reset}`);
    return;
  }

  const current = found[0];
  console.log(
    `\n🏷️  Code actuel : ${c.brightGreen}${current.code}${c.reset} (Forfait: ${current.tier}, Max: ${current.max_uses}, Statut: ${current.is_active ? "Actif" : "Inactif"})`
  );

  // 1. Modifier le libellé du code
  const codeInput = (
    await rl.question(
      ` 🔤 Nouveau code (laisser vide pour conserver '${current.code}') : `
    )
  ).trim();
  if (isBackOrCancel(codeInput)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }
  const newCode = codeInput ? codeInput.toUpperCase() : current.code;

  // 2. Modifier le forfait
  console.log(
    `\n⭐ Modifier le forfait (actuel: ${current.tier}, laisser vide pour conserver) :`
  );
  console.log("  [1] ⭐ Plus | [2] 💎 Pro | [3] 👑 Max");
  const tierInput = (await rl.question(" 👉 Choix [1-3] : ")).trim();
  if (isBackOrCancel(tierInput)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  let newTier = current.tier;
  if (tierInput === "1") newTier = "Plus";
  if (tierInput === "2") newTier = "Pro";
  if (tierInput === "3") newTier = "Max";

  // 3. Modifier le quota max
  const usesInput = (
    await rl.question(
      ` 📊 Nouveau quota maximal (actuel: ${current.max_uses}, vide pour conserver) : `
    )
  ).trim();
  if (isBackOrCancel(usesInput)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  const newMaxUses =
    Number.parseInt(usesInput, 10) > 0
      ? Number.parseInt(usesInput, 10)
      : current.max_uses;

  // 4. Modifier le statut actif
  const statusInput = (
    await rl.question(
      ` 🟢 Rendre actif ? (o/n, actuel: ${current.is_active ? "Oui" : "Non"}, vide pour conserver) : `
    )
  )
    .trim()
    .toLowerCase();
  if (isBackOrCancel(statusInput)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  let newActive = current.is_active;
  if (statusInput === "o" || statusInput === "oui" || statusInput === "y") {
    newActive = true;
  } else if (statusInput === "n" || statusInput === "non") {
    newActive = false;
  }

  // 5. Expiration
  console.log(
    ` ⏳ Expiration actuelle : ${current.expires_at ? new Date(current.expires_at).toLocaleString("fr-FR") : "Illimitée"}`
  );
  const expInput = (
    await rl.question(
      " ⏳ Nouvelle validité en jours ('0' pour illimitée, vide pour conserver) : "
    )
  ).trim();
  if (isBackOrCancel(expInput)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  let newExpiresAt = current.expires_at;
  if (expInput === "0") {
    newExpiresAt = null;
  } else if (Number.parseInt(expInput, 10) > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Number.parseInt(expInput, 10));
    newExpiresAt = d;
  }

  // Récapitulatif et confirmation
  console.log(`\n${c.bold}📝 RÉCAPITULATIF DES MODIFICATIONS :${c.reset}`);
  console.log(`  • Code     : ${newCode}`);
  console.log(`  • Forfait  : ${badgeTier(newTier)}`);
  console.log(`  • Max uses : ${newMaxUses}`);
  console.log(`  • Statut   : ${badgeStatus(newActive)}`);
  console.log(
    `  • Expire   : ${newExpiresAt ? new Date(newExpiresAt).toLocaleDateString("fr-FR") : "♾️  Illimitée"}`
  );

  const confirm = (
    await rl.question("\n❓ Confirmer la mise à jour ? (O/n) : ")
  ).trim();

  if (confirm && !isYes(confirm)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}\n`);
    return;
  }

  await sql`
    UPDATE subscription_codes
    SET code = ${newCode},
        tier = ${newTier},
        max_uses = ${newMaxUses},
        is_active = ${newActive},
        expires_at = ${newExpiresAt}
    WHERE id = ${current.id};
  `;

  console.log(
    `\n${c.brightGreen}✅ Code ${c.bold}${newCode}${c.reset} mis à jour avec succès !\n`
  );
}

async function handleDeleteCode(rl: readline.Interface) {
  console.log(`\n${c.bold}🗑️  SUPPRESSION D'UN CODE D'ABONNEMENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);
  const search = (
    await rl.question(" 🔍 Entrez le Code ou l'ID du code à supprimer : ")
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}`);
    return;
  }

  const found = await sql`
    SELECT * FROM subscription_codes
    WHERE code ILIKE ${search} OR id::text = ${search}
    LIMIT 1;
  `;

  if (found.length === 0) {
    console.log(` ${c.red}✖️  Aucun code trouvé.${c.reset}`);
    return;
  }

  const current = found[0];
  const confirm = (
    await rl.question(
      ` ⚠️  Êtes-vous sûr de vouloir supprimer définitivement le code "${current.code}" ? (o/N) : `
    )
  )
    .trim()
    .toLowerCase();

  if (isYes(confirm)) {
    await sql`DELETE FROM subscription_codes WHERE id = ${current.id};`;
    console.log(
      `\n${c.brightGreen}🗑️  Le code ${current.code} a été supprimé définitivement.${c.reset}\n`
    );
  } else {
    console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}\n`);
  }
}

export async function runSubscriptionCodeManager(
  parentRl?: readline.Interface
) {
  await initSubscriptionTables();
  const rl = parentRl ?? readline.createInterface({ input, output });

  console.log("\n=======================================================");
  console.log(" 🏷️  GESTIONNAIRE INTERACTIF DES CODES D'ABONNEMENT mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log(`\n${c.bold}--- MENU DES CODES D'ABONNEMENT ---${c.reset}`);
    console.log(
      "  [1] ➕ Créer un nouveau code d'abonnement      (raccourci: 'c' ou '+')"
    );
    console.log(
      "  [2] 📋 Lister tous les codes (actifs/inactifs) (raccourci: 'l')"
    );
    console.log(
      "  [3] 🔄 Activer / Désactiver un code           (raccourci: 't' ou 'a')"
    );
    console.log(
      "  [4] ✏️  Modifier un code existant             (raccourci: 'm' ou 'e')"
    );
    console.log(
      "  [5] 🗑️  Supprimer un code                     (raccourci: 'd' ou 'del')"
    );
    console.log(
      "  [0] ↩️  Retour au menu principal              (raccourci: 'r', 'q', 'exit')"
    );

    const rawChoice = (
      await rl.question(`\n ${c.brightYellow}👉 Votre choix [0-5] : ${c.reset}`)
    ).trim();
    const choice = rawChoice.toLowerCase();

    if (choice === "1" || choice === "c" || choice === "+") {
      await handleCreateCode(rl);
    } else if (choice === "2" || choice === "l") {
      await handleListCodes();
    } else if (choice === "3" || choice === "t" || choice === "a") {
      await handleToggleCode(rl);
    } else if (choice === "4" || choice === "m" || choice === "e") {
      await handleEditCode(rl);
    } else if (choice === "5" || choice === "d" || choice === "del") {
      await handleDeleteCode(rl);
    } else if (choice === "0" || isBackOrCancel(choice)) {
      running = false;
      console.log(`\n${c.dim}↩️  Retour au menu principal.${c.reset}`);
    } else {
      console.log(` ${c.red}⚠️  Option invalide.${c.reset}`);
    }
  }

  if (!parentRl) {
    rl.close();
  }
}

// ─────────────────────────────────────────────
// 6. GESTION DES COMPTES CLIENTS
// ─────────────────────────────────────────────
export async function initCustomersTable() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;`;
  } catch (err: any) {
    console.error(
      "ℹ️  Note lors de la vérification de la colonne is_blocked dans users:",
      err.message || err
    );
  }
}

function renderCustomersTable(customers: any[]) {
  if (customers.length === 0) {
    console.log(
      `\n${c.brightYellow}ℹ️  Aucun compte client trouvé.${c.reset}\n`
    );
    return;
  }

  const blockedCount = customers.filter((u) => u.is_blocked).length;
  console.log(
    `\n${c.bold}📊 ${customers.length} client(s) affiché(s) (🟢 ${customers.length - blockedCount} actif(s), ⛔ ${blockedCount} bloqué(s))${c.reset}`
  );
  console.log(`${"═".repeat(116)}`);
  console.log(
    `║ ${"ID/UUID".padEnd(36)} ║ ${"PSEUDO".padEnd(20)} ║ ${"EMAIL".padEnd(25)} ║ ${"FORFAIT".padEnd(
      10
    )} ║ ${"STATUT".padEnd(12)} ║`
  );
  console.log("═".repeat(116));

  for (const user of customers) {
    const id = String(user.id || "").padEnd(36);
    const username = String(user.username || "").padEnd(20);
    const email = String(user.email || "").padEnd(25);
    const tier = (
      user.tier === "Max"
        ? "👑 Max"
        : user.tier === "Pro"
          ? "💎 Pro"
          : user.tier === "Plus"
            ? "⭐ Plus"
            : "🌱 Free"
    ).padEnd(10);
    const status = (user.is_blocked ? "⛔ Bloqué" : "🟢 Actif").padEnd(12);

    console.log(`║ ${id} ║ ${username} ║ ${email} ║ ${tier} ║ ${status} ║`);
  }
  console.log(`${"═".repeat(116)}\n`);
}

async function handleListCustomers(rl: readline.Interface) {
  console.log(`\n${c.bold}📋 LISTE DES COMPTES CLIENTS mAI${c.reset}`);
  const limitInput = (
    await rl.question(
      " 🔢 Nombre maximal de clients à afficher (défaut: 50) : "
    )
  ).trim();

  const limit =
    Number.parseInt(limitInput, 10) > 0 ? Number.parseInt(limitInput, 10) : 50;

  try {
    const customers = await sql`
      SELECT id, username, email, tier, is_blocked
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;
    renderCustomersTable(customers);
  } catch (err: any) {
    console.error(
      "❌ Erreur lors de la récupération des clients :",
      err.message || err
    );
  }
}

async function handleSearchCustomer(rl: readline.Interface) {
  console.log(`\n${c.bold}🔍 RECHERCHE DE CLIENTS${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);

  const query = (
    await rl.question(" 🔎 Entrez un mot-clé (pseudo, email ou UUID) : ")
  ).trim();

  if (!query || isBackOrCancel(query)) {
    console.log(`\n${c.dim}↩️  Recherche annulée.${c.reset}`);
    return;
  }

  try {
    const term = `%${query}%`;
    const results = await sql`
      SELECT id, username, email, tier, is_blocked
      FROM users
      WHERE email ILIKE ${term} OR username ILIKE ${term} OR id::text ILIKE ${term}
      ORDER BY created_at DESC
      LIMIT 25;
    `;

    if (results.length === 0) {
      console.log(
        `\n${c.brightYellow}ℹ️  Aucun client trouvé pour « ${query} ».${c.reset}\n`
      );
      return;
    }

    renderCustomersTable(results);
  } catch (err: any) {
    console.error("❌ Erreur lors de la recherche :", err.message || err);
  }
}

async function handleViewCustomerDetails(rl: readline.Interface) {
  console.log(`\n${c.bold}👤 FICHE DÉTAILLÉE D'UN COMPTE CLIENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);

  const search = (
    await rl.question(" 🔎 Entrez le Pseudo, Email ou UUID du client : ")
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Consultation annulée.${c.reset}`);
    return;
  }

  try {
    const users = await sql`
      SELECT id, username, email, tier, is_blocked, notify_limits, created_at
      FROM users
      WHERE email ILIKE ${search} OR username ILIKE ${search} OR id::text = ${search}
      LIMIT 1;
    `;

    if (users.length === 0) {
      console.log(` ${c.red}✖️  Client introuvable.${c.reset}`);
      return;
    }

    const u = users[0];

    // Récupération des statistiques annexes
    const [devicesCount] = (await sql`
      SELECT COUNT(*)::int AS count FROM connected_devices WHERE user_id = ${u.id}::text;
    `) as any[];

    const [keysCount] = (await sql`
      SELECT COUNT(*)::int AS count FROM mprojects_api_keys
      WHERE user_id = ${u.id}::text OR user_id = ${u.username} OR user_id = ${u.email};
    `) as any[];

    const [weeklyTokens] = (await sql`
      SELECT tokens_used FROM weekly_usage WHERE user_id = ${u.id}::text LIMIT 1;
    `) as any[];

    const [weeklyAudio] = (await sql`
      SELECT tokens_used, requests_count FROM weekly_speech_usage WHERE user_id = ${u.id}::text LIMIT 1;
    `) as any[];

    console.log(`\n${"═".repeat(68)}`);
    console.log(
      `║ ${c.bold}👤 FICHE PROFIL CLIENT : ${u.username} (${u.email})${c.reset}`
    );
    console.log("═".repeat(68));
    console.log(`  🆔 Identifiant UUID : ${u.id}`);
    console.log(`  ⭐ Forfait actuel   : ${badgeTier(u.tier)}`);
    console.log(`  🛡️  Statut du compte : ${badgeBlocked(u.is_blocked)}`);
    console.log(
      `  🔔 Notif de Quota   : ${u.notify_limits ? "🟢 Activées" : "⚪ Désactivées"}`
    );
    console.log(
      `  📱 Sessions actives : ${devicesCount?.count ?? 0} appareil(s) connecté(s)`
    );
    console.log(
      `  🔑 Clés d'API       : ${keysCount?.count ?? 0} clé(s) générée(s)`
    );
    console.log(
      `  🧠 Tokens mAI hebdo : ${weeklyTokens?.tokens_used ?? 0} tokens utilisés`
    );
    console.log(
      `  🎙️  Quotas audio     : ${weeklyAudio?.tokens_used ?? 0} tokens (${weeklyAudio?.requests_count ?? 0} requête(s))`
    );
    console.log(
      `  📅 Date de création : ${
        u.created_at
          ? new Date(u.created_at).toLocaleString("fr-FR")
          : "Non renseignée"
      }`
    );
    console.log(`${"═".repeat(68)}\n`);
  } catch (err: any) {
    console.error(
      "❌ Erreur lors de la lecture de la fiche :",
      err.message || err
    );
  }
}

async function handleEditCustomerTier(rl: readline.Interface) {
  console.log(`\n${c.bold}⭐ MODIFIER LE FORFAIT (TIER) D'UN CLIENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);

  const search = (
    await rl.question(" 🔎 Entrez le Pseudo, Email ou UUID du client : ")
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
    return;
  }

  try {
    const users = await sql`
      SELECT id, username, email, tier FROM users
      WHERE email ILIKE ${search} OR username ILIKE ${search} OR id::text = ${search}
      LIMIT 1;
    `;

    if (users.length === 0) {
      console.log(` ${c.red}✖️  Client introuvable.${c.reset}`);
      return;
    }

    const u = users[0];
    console.log(
      `\n👤 Client : ${c.bold}${u.username}${c.reset} (${u.email}) — Forfait actuel : ${badgeTier(u.tier)}`
    );

    console.log("\n⭐ Choisissez le nouveau forfait :");
    console.log("  [0] 🌱 Free");
    console.log("  [1] ⭐ Plus");
    console.log("  [2] 💎 Pro");
    console.log("  [3] 👑 Max");
    const tierChoice = (await rl.question(" 👉 Votre choix [0-3] : ")).trim();

    if (isBackOrCancel(tierChoice)) {
      console.log(`\n${c.dim}↩️  Modification annulée.${c.reset}`);
      return;
    }

    let newTier = u.tier;
    if (tierChoice === "0") newTier = "Free";
    else if (tierChoice === "1") newTier = "Plus";
    else if (tierChoice === "2") newTier = "Pro";
    else if (tierChoice === "3") newTier = "Max";
    else {
      console.log(` ${c.red}⚠️  Choix invalide.${c.reset}`);
      return;
    }

    await sql`
      UPDATE users
      SET tier = ${newTier}
      WHERE id = ${u.id};
    `;

    console.log(
      `\n${c.brightGreen}✅ Le forfait de ${c.bold}${u.username}${c.reset} a été mis à jour avec succès vers : ${badgeTier(newTier)} ! 🎉\n`
    );
  } catch (err: any) {
    console.error(
      "❌ Erreur lors de la modification du forfait :",
      err.message || err
    );
  }
}

async function handleToggleBlockCustomer(rl: readline.Interface) {
  console.log(`\n${c.bold}🔒 BLOQUER / DÉBLOQUER UN COMPTE CLIENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);
  const search = (
    await rl.question(
      " 🔎 Entrez l'E-mail, le Pseudo ou l'UUID du client à bloquer/débloquer : "
    )
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Action annulée.${c.reset}`);
    return;
  }

  try {
    const found = await sql`
      SELECT id, username, email, is_blocked FROM users
      WHERE email ILIKE ${search} OR username ILIKE ${search} OR id::text = ${search}
      LIMIT 1;
    `;

    if (found.length === 0) {
      console.log(
        ` ${c.red}✖️  Aucun compte client correspondant trouvé.${c.reset}`
      );
      return;
    }

    const current = found[0];
    const newStatus = !current.is_blocked;

    if (newStatus) {
      const confirm = (
        await rl.question(
          ` ⚠️  Confirmer le ${c.bold}BLOCAGE${c.reset} de ${current.username} ? Toutes ses sessions actives seront détruites. (o/N) : `
        )
      ).trim();

      if (!isYes(confirm)) {
        console.log(`\n${c.dim}↩️  Blocage annulé.${c.reset}`);
        return;
      }
    }

    await sql`
      UPDATE users
      SET is_blocked = ${newStatus}
      WHERE id = ${current.id};
    `;

    if (newStatus) {
      await sql`
        DELETE FROM connected_devices
        WHERE user_id = ${current.id}::text;
      `;
      console.log(
        `\n${c.brightGreen}✅ Le client ${c.bold}${current.username}${c.reset} (${current.email}) a été ${c.bold}⛔ BLOQUÉ${c.reset} et toutes ses sessions actives ont été révoquées.\n`
      );
    } else {
      console.log(
        `\n${c.brightGreen}✅ Le client ${c.bold}${current.username}${c.reset} (${current.email}) a été ${c.bold}🟢 DÉBLOQUÉ${c.reset}.\n`
      );
    }
  } catch (err: any) {
    console.error(
      "❌ Erreur lors de la modification du statut :",
      err.message || err
    );
  }
}

async function handleDeleteCustomer(rl: readline.Interface) {
  console.log(`\n${c.bold}🗑️  SUPPRESSION D'UN COMPTE CLIENT${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}`);
  const search = (
    await rl.question(
      " 🔎 Entrez l'E-mail, le Pseudo ou l'UUID du client à supprimer : "
    )
  ).trim();

  if (!search || isBackOrCancel(search)) {
    console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}`);
    return;
  }

  try {
    const found = await sql`
      SELECT id, username, email FROM users
      WHERE email ILIKE ${search} OR username ILIKE ${search} OR id::text = ${search}
      LIMIT 1;
    `;

    if (found.length === 0) {
      console.log(
        ` ${c.red}✖️  Aucun compte client correspondant trouvé.${c.reset}`
      );
      return;
    }

    const current = found[0];
    console.log(
      `\n${c.brightRed}${c.bold}🚨 ATTENTION : ACTION DESTRUCTIVE ET IRRÉVERSIBLE !${c.reset}`
    );
    console.log(
      `Vous allez supprimer le compte de : ${current.username} (${current.email})`
    );
    console.log("Seront supprimés : clés API, appareils, quotas et profil.");

    const confirm = (
      await rl.question(
        `\n❓ Tapez 'OUI' pour confirmer la suppression définitive : `
      )
    )
      .trim()
      .toUpperCase();

    if (confirm === "OUI" || confirm === "O" || confirm === "YES") {
      await sql`DELETE FROM connected_devices WHERE user_id = ${current.id}::text;`;
      await sql`DELETE FROM mprojects_api_keys WHERE user_id = ${current.id}::text OR user_id = ${current.username} OR user_id = ${current.email};`;
      await sql`DELETE FROM weekly_usage WHERE user_id = ${current.id}::text;`;
      await sql`DELETE FROM weekly_speech_usage WHERE user_id = ${current.id}::text;`;
      await sql`DELETE FROM users WHERE id = ${current.id};`;

      console.log(
        `\n${c.brightGreen}🗑️  Le compte de ${current.username} (${current.email}) a été supprimé définitivement.${c.reset}\n`
      );
    } else {
      console.log(`\n${c.dim}↩️  Suppression annulée.${c.reset}\n`);
    }
  } catch (err: any) {
    console.error("❌ Erreur lors de la suppression :", err.message || err);
  }
}

export async function runCustomerAccountManager(parentRl?: readline.Interface) {
  await initCustomersTable();
  const rl = parentRl ?? readline.createInterface({ input, output });

  console.log("\n=======================================================");
  console.log(" 👥 GESTIONNAIRE INTERACTIF DES COMPTES CLIENTS mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log(`\n${c.bold}--- MENU DES COMPTES CLIENTS ---${c.reset}`);
    console.log(
      "  [1] 📋 Lister les comptes clients                (raccourci: 'l')"
    );
    console.log(
      "  [2] 🔍 Rechercher un client                      (raccourci: 's')"
    );
    console.log(
      "  [3] 👤 Consulter la fiche complète d'un client   (raccourci: 'v' ou 'f')"
    );
    console.log(
      "  [4] ⭐ Modifier le forfait (Tier) d'un client    (raccourci: 'm' ou 't')"
    );
    console.log(
      "  [5] 🔒 Bloquer / Débloquer un compte             (raccourci: 'b')"
    );
    console.log(
      "  [6] 🗑️  Supprimer un compte client               (raccourci: 'd' ou 'del')"
    );
    console.log(
      "  [0] ↩️  Retour au menu principal                 (raccourci: 'r', 'q', 'exit')"
    );

    const rawChoice = (
      await rl.question(`\n ${c.brightYellow}👉 Votre choix [0-6] : ${c.reset}`)
    ).trim();
    const choice = rawChoice.toLowerCase();

    if (choice === "1" || choice === "l") {
      await handleListCustomers(rl);
    } else if (choice === "2" || choice === "s") {
      await handleSearchCustomer(rl);
    } else if (choice === "3" || choice === "v" || choice === "f") {
      await handleViewCustomerDetails(rl);
    } else if (choice === "4" || choice === "m" || choice === "t") {
      await handleEditCustomerTier(rl);
    } else if (choice === "5" || choice === "b") {
      await handleToggleBlockCustomer(rl);
    } else if (choice === "6" || choice === "d" || choice === "del") {
      await handleDeleteCustomer(rl);
    } else if (choice === "0" || isBackOrCancel(choice)) {
      running = false;
      console.log(`\n${c.dim}↩️  Retour au menu principal.${c.reset}`);
    } else {
      console.log(` ${c.red}⚠️  Option invalide.${c.reset}`);
    }
  }

  if (!parentRl) {
    rl.close();
  }
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
    console.error("❌ Erreur création tables notifications :", e.message);
  }
}

export async function sendNewsNotificationToEligibleUsers(
  title: string,
  body: string | null,
  link: string | null
) {
  await ensureNotificationTables();
  const eligible = (await sql`
    SELECT "userId" FROM "user_notification_prefs"
    WHERE "enabled" = true AND "news" = true
  `) as unknown as { userId: string }[];

  if (eligible.length === 0) {
    console.log(
      ` ${c.yellow}⚠️  Aucun utilisateur éligible (enabled=true & news=true).${c.reset}`
    );
    return { eligible: 0, sent: 0 };
  }

  console.log(
    ` ${c.cyan}📢 Envoi à ${eligible.length} utilisateur(s) éligible(s)...${c.reset}`
  );
  let sent = 0;
  for (let i = 0; i < eligible.length; i += 500) {
    const chunk = eligible.slice(i, i + 500);
    for (const u of chunk) {
      try {
        await sql`
          INSERT INTO "Notification" ("userId", "type", "title", "body", "link")
          VALUES (${u.userId}, 'news', ${title}, ${body}, ${link})
        `;
        sent++;
      } catch (err: any) {
        console.error(
          ` ${c.red}✖️  Erreur pour ${u.userId}: ${err.message}${c.reset}`
        );
      }
    }
  }
  console.log(
    ` ${c.brightGreen}✅ ${sent} notification(s) "Actualités" créée(s) en BDD !${c.reset}`
  );
  return { eligible: eligible.length, sent };
}

async function handleSendNewsInteractive(rl: readline.Interface) {
  console.log(
    `\n${c.bold}📢 ENVOI D'UNE NOTIFICATION D'ACTUALITÉS mAI${c.reset}`
  );
  console.log(
    `${c.dim}Cette notification sera enregistrée en BDD pour chaque utilisateur ayant activé Notifications > Actualités.${c.reset}`
  );
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}\n`);

  const title = (
    await rl.question(
      " 🏷️  Titre de la notification (ex: Nouveautés mAI - Été 2026) : "
    )
  ).trim();

  if (!title || isBackOrCancel(title)) {
    console.log(`\n${c.dim}↩️  Envoi annulé.${c.reset}`);
    return;
  }

  const body = (
    await rl.question(" 📝 Message / Corps (facultatif, max 500c) : ")
  ).trim();
  if (isBackOrCancel(body)) {
    console.log(`\n${c.dim}↩️  Envoi annulé.${c.reset}`);
    return;
  }

  const link = (
    await rl.question(
      " 🔗 Lien de redirection (facultatif, ex: /settings ou https://mai.val.run) : "
    )
  ).trim();
  if (isBackOrCancel(link)) {
    console.log(`\n${c.dim}↩️  Envoi annulé.${c.reset}`);
    return;
  }

  console.log(`\n${c.bold}📢 APERÇU DE LA NOTIFICATION :${c.reset}`);
  console.log(`  • Titre   : ${title}`);
  console.log(`  • Corps   : ${body || "(vide)"}`);
  console.log(`  • Lien    : ${link || "(aucun)"}`);

  const confirm = (
    await rl.question(`\n❓ Confirmer l'envoi de cette notification ? (o/N) : `)
  ).trim();

  if (!isYes(confirm)) {
    console.log(`\n${c.dim}↩️  Envoi annulé.${c.reset}`);
    return;
  }

  await sendNewsNotificationToEligibleUsers(title, body || null, link || null);
}

async function handleListRecentNotifications(rl: readline.Interface) {
  console.log(`\n${c.bold}📋 NOTIFICATIONS RÉCENTES EN BDD${c.reset}`);
  const limitIn = (
    await rl.question(" 🔢 Nombre à afficher (défaut: 10) : ")
  ).trim();
  const limit = Math.min(Math.max(Number.parseInt(limitIn, 10) || 10, 1), 50);

  try {
    const rows =
      await sql`SELECT "id", "userId", "type", "title", "isRead", "createdAt" FROM "Notification" ORDER BY "createdAt" DESC LIMIT ${limit}`;
    if (rows.length === 0) {
      console.log(`\n${c.dim}ℹ️  Aucune notification en BDD.${c.reset}\n`);
      return;
    }
    console.log(`\n${"─".repeat(110)}`);
    console.log(
      `| ${"TYPE".padEnd(16)} | ${"TITRE".padEnd(30)} | ${"DESTINATAIRE".padEnd(20)} | ${"LU".padEnd(
        10
      )} | ${"DATE".padEnd(20)} |`
    );
    console.log("─".repeat(110));
    for (const r of rows as any[]) {
      const t = String(r.type).padEnd(16);
      const ttl = String(r.title).slice(0, 30).padEnd(30);
      const uid = String(r.userId).slice(0, 20).padEnd(20);
      const lu = (r.isRead ? "✅ Lu" : "📬 Non lu").padEnd(10);
      const d = new Date(r.createdAt).toLocaleString("fr-FR").padEnd(20);
      console.log(`| ${t} | ${ttl} | ${uid} | ${lu} | ${d} |`);
    }
    console.log(`${"─".repeat(110)}\n`);
  } catch (e: any) {
    console.error("❌ Erreur lors de la lecture :", e.message);
  }
}

export async function runNotificationManager(parentRl?: readline.Interface) {
  await ensureNotificationTables();
  const rl = parentRl ?? readline.createInterface({ input, output });

  console.log("\n=======================================================");
  console.log(" 🔔 GESTIONNAIRE NOTIFICATIONS & ACTUALITÉS mAI");
  console.log("=======================================================");

  let running = true;
  while (running) {
    console.log(`\n${c.bold}--- MENU NOTIFICATIONS ---${c.reset}`);
    console.log(
      "  [1] 📢 Envoyer une notification Actualités Broadcast (raccourci: 'e')"
    );
    console.log(
      "  [2] 📋 Lister les notifications récentes            (raccourci: 'l')"
    );
    console.log(
      "  [3] 🧹 Purger les notifications lues (>30j)          (raccourci: 'p')"
    );
    console.log(
      "  [0] ↩️  Retour au menu principal                     (raccourci: 'r', 'q', 'exit')"
    );

    const rawChoice = (
      await rl.question(`\n ${c.brightYellow}👉 Votre choix [0-3] : ${c.reset}`)
    ).trim();
    const choice = rawChoice.toLowerCase();

    if (choice === "1" || choice === "e") {
      await handleSendNewsInteractive(rl);
    } else if (choice === "2" || choice === "l") {
      await handleListRecentNotifications(rl);
    } else if (choice === "3" || choice === "p") {
      const confirm = (
        await rl.question(
          " ⚠️  Supprimer les notifications lues de plus de 30 jours ? (o/N) : "
        )
      ).trim();
      if (isYes(confirm)) {
        const res =
          await sql`DELETE FROM "Notification" WHERE "isRead" = true AND "createdAt" < NOW() - INTERVAL '30 days' RETURNING "id"`;
        console.log(
          `\n${c.brightGreen}✅ ${res.length} notifications purgées avec succès !${c.reset}\n`
        );
      } else {
        console.log(`\n${c.dim}↩️  Purge annulée.${c.reset}`);
      }
    } else if (choice === "0" || isBackOrCancel(choice)) {
      running = false;
      console.log(`\n${c.dim}↩️  Retour au menu principal.${c.reset}`);
    } else {
      console.log(` ${c.red}⚠️  Option invalide.${c.reset}`);
    }
  }

  if (!parentRl) {
    rl.close();
  }
}

// ─────────────────────────────────────────────
// 8. QUIZZLY : BOUTIQUE ET CRÉDIT (ADMINISTRATION)
// ─────────────────────────────────────────────
const QUIZZLY_KINDS: readonly { label: string; value: ShopKind }[] = [
  { label: "Cadre cosmétique (avatar)", value: "frame" },
  { label: "Booster d'XP", value: "boost" },
  { label: "Recharge de cœurs", value: "hearts" },
  { label: "Gel de série", value: "freeze" },
  { label: "Bouclier de ligue", value: "shield" },
  { label: "Offre du jour", value: "daily" },
];

function slugQuizzly(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function listerArticlesQuizzly() {
  const articles = (await sql`
    SELECT "id", "label", "description", "kind", "price"
    FROM "QuizzlyShopItem"
    ORDER BY "createdAt" DESC
  `) as unknown as {
    description: string;
    id: string;
    kind: string;
    label: string;
    price: number;
  }[];

  if (articles.length === 0) {
    console.log(
      `\n ${c.dim}ℹ️  Aucun article personnalisé dans "QuizzlyShopItem".${c.reset}`
    );
    return;
  }

  console.log(
    `\n${c.bold}📋 ${articles.length} article(s) personnalisé(s)${c.reset}`
  );
  for (const article of articles) {
    console.log(
      ` ${c.brightCyan}•${c.reset} ${article.label} (${article.id}) — ${article.kind}, 💎 ${article.price} gemmes`
    );
    console.log(`   ${c.dim}${article.description}${c.reset}`);
  }
}

async function ajouterArticleQuizzly(rl: readline.Interface) {
  console.log(`\n${c.bold}🎁 NOUVEL ARTICLE OU OFFRE QUIZZLY${c.reset}`);
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}\n`);

  const label = (await rl.question(" 🏷️  Nom : ")).trim();
  if (isBackOrCancel(label)) {
    console.log(`\n${c.dim}↩️  Ajout annulé.${c.reset}`);
    return;
  }
  if (label.length < 2 || label.length > 60) {
    console.log(
      ` ${c.red}✖️  Le nom doit contenir entre 2 et 60 caractères.${c.reset}`
    );
    return;
  }

  const description = (await rl.question(" 📝 Description : ")).trim();
  if (isBackOrCancel(description)) {
    console.log(`\n${c.dim}↩️  Ajout annulé.${c.reset}`);
    return;
  }
  if (description.length < 3 || description.length > 300) {
    console.log(
      ` ${c.red}✖️  La description doit contenir entre 3 et 300 caractères.${c.reset}`
    );
    return;
  }

  console.log(`\n ${c.bold}📦 Catégorie :${c.reset}`);
  QUIZZLY_KINDS.forEach((kind, index) => {
    console.log(`   ${c.brightCyan}[${index + 1}]${c.reset} ${kind.label}`);
  });
  const choixKind = (
    await rl.question(" 👉 Catégorie [1-6] (défaut: 1 - cadre) : ")
  ).trim();

  if (isBackOrCancel(choixKind)) {
    console.log(`\n${c.dim}↩️  Ajout annulé.${c.reset}`);
    return;
  }

  const indexKind = choixKind ? Number(choixKind) - 1 : 0;
  const kind = QUIZZLY_KINDS[indexKind]?.value;
  if (!kind) {
    console.log(` ${c.red}✖️  Catégorie invalide.${c.reset}`);
    return;
  }

  const prixSaisi = (
    await rl.question(" 💎 Prix en gemmes (défaut: 100) : ")
  ).trim();

  if (isBackOrCancel(prixSaisi)) {
    console.log(`\n${c.dim}↩️  Ajout annulé.${c.reset}`);
    return;
  }

  const price = prixSaisi ? Number(prixSaisi) : 100;
  if (!Number.isInteger(price) || price < 0 || price > 50_000) {
    console.log(
      ` ${c.red}✖️  Le prix doit être un entier entre 0 et 50 000 gemmes.${c.reset}`
    );
    return;
  }

  const idSaisi = (
    await rl.question(" 🆔 Identifiant (laisser vide pour dériver du nom) : ")
  ).trim();

  if (isBackOrCancel(idSaisi)) {
    console.log(`\n${c.dim}↩️  Ajout annulé.${c.reset}`);
    return;
  }

  const id = slugQuizzly(idSaisi || label);
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) {
    console.log(
      ` ${c.red}✖️  Identifiant invalide : 2 à 40 caractères, minuscules, chiffres et tirets.${c.reset}`
    );
    return;
  }
  if (articleBoutique(id)) {
    console.log(
      ` ${c.red}✖️  L'identifiant « ${id} » appartient déjà au catalogue de base.${c.reset}`
    );
    return;
  }

  const existant = (await sql`
    SELECT 1 FROM "QuizzlyShopItem" WHERE "id" = ${id} LIMIT 1
  `) as unknown as unknown[];
  if (existant.length > 0) {
    console.log(
      ` ${c.red}✖️  L'article « ${id} » existe déjà ; choisissez un autre identifiant.${c.reset}`
    );
    return;
  }

  await sql`
    INSERT INTO "QuizzlyShopItem" ("id", "label", "description", "kind", "price")
    VALUES (${id}, ${label}, ${description}, ${kind}, ${price})
  `;
  console.log(
    `\n ${c.brightGreen}✅ Article « ${label} » ajouté à la boutique avec succès (${price} gemmes) ! 🎉${c.reset}\n`
  );
}

async function runQuizzlyShopManager(rl: readline.Interface) {
  console.log(`\n${c.brightMagenta}🛍️  BOUTIQUE QUIZZLY${c.reset}`);
  console.log(
    `  ${c.brightCyan}[1]${c.reset} ➕ Ajouter un article ou une offre (raccourci: 'c' ou '+')`
  );
  console.log(
    `  ${c.brightCyan}[2]${c.reset} 📋 Lister les articles            (raccourci: 'l')`
  );
  console.log(
    `  ${c.white}[0]${c.reset} ↩️  Retour                         (raccourci: 'r', 'q')`
  );

  const choix = (
    await rl.question(`\n ${c.brightYellow}👉 Votre choix [0-2] : ${c.reset}`)
  )
    .trim()
    .toLowerCase();

  if (choix === "1" || choix === "c" || choix === "+") {
    await ajouterArticleQuizzly(rl);
  } else if (choix === "2" || choix === "l") {
    await listerArticlesQuizzly();
  } else if (choix === "0" || isBackOrCancel(choix)) {
    console.log(`\n${c.dim}↩️  Retour au menu.${c.reset}`);
  } else {
    console.log(` ${c.red}⚠️  Choix invalide.${c.reset}`);
  }
}

async function crediterQuizzly(
  cible: string,
  gems: number,
  xp: number
): Promise<boolean> {
  const lignes = (await sql`
    SELECT id, username, email
    FROM users
    WHERE id::text = ${cible} OR username = ${cible} OR email = ${cible}
    LIMIT 1
  `) as unknown as { email: string; id: string; username: string }[];

  if (lignes.length === 0) {
    console.log(` ${c.red}✖️  Utilisateur « ${cible} » introuvable.${c.reset}`);
    return false;
  }

  const compte = lignes[0];
  await sql`
    INSERT INTO "QuizzlyProfile" ("userId")
    VALUES (${compte.id})
    ON CONFLICT ("userId") DO NOTHING
  `;

  const [maj] = (await sql`
    UPDATE "QuizzlyProfile"
    SET "gems" = GREATEST(0, "gems" + ${gems}),
        "xp" = GREATEST(0, "xp" + ${xp}),
        "updatedAt" = NOW()
    WHERE "userId" = ${compte.id}
    RETURNING "gems", "xp"
  `) as unknown as { gems: number; xp: number }[];

  console.log(
    ` ${c.brightGreen}✅ ${gems} gemme(s) 💎 et ${xp} XP ⚡ crédités à ${compte.username || compte.email} !${c.reset}`
  );
  console.log(
    ` ${c.dim}Nouveau solde : ${maj?.gems ?? 0} gemmes, ${maj?.xp ?? 0} XP.${c.reset}`
  );
  return true;
}

async function runQuizzlyCreditManager(rl: readline.Interface) {
  console.log(
    `\n${c.brightMagenta}⚡ CRÉDITER DES GEMMES ET DE L'XP (QUIZZLY)${c.reset}`
  );
  console.log(`${c.dim}(💡 Tapez 'r' pour annuler)${c.reset}\n`);

  const cible = (await rl.question(" 👤 Pseudo, e-mail ou UUID : ")).trim();
  if (!cible || isBackOrCancel(cible)) {
    console.log(`\n${c.dim}↩️  Action annulée.${c.reset}`);
    return;
  }

  const gemsSaisi = (
    await rl.question(" 💎 Gemmes à créditer (défaut: 0) : ")
  ).trim();
  if (isBackOrCancel(gemsSaisi)) {
    console.log(`\n${c.dim}↩️  Action annulée.${c.reset}`);
    return;
  }

  const xpSaisi = (
    await rl.question(" ⚡ XP à créditer (défaut: 0) : ")
  ).trim();
  if (isBackOrCancel(xpSaisi)) {
    console.log(`\n${c.dim}↩️  Action annulée.${c.reset}`);
    return;
  }

  const gems = gemsSaisi ? Number(gemsSaisi) : 0;
  const xp = xpSaisi ? Number(xpSaisi) : 0;

  if (
    !Number.isInteger(gems) ||
    !Number.isInteger(xp) ||
    gems < 0 ||
    xp < 0 ||
    (gems === 0 && xp === 0)
  ) {
    console.log(
      ` ${c.red}✖️  Indiquez un montant entier positif de gemmes ou d'XP.${c.reset}`
    );
    return;
  }

  const confirm = (
    await rl.question(
      ` ❓ Confirmer le crédit de ${gems} gemmes et ${xp} XP à "${cible}" ? (o/N) : `
    )
  ).trim();

  if (!isYes(confirm)) {
    console.log(`\n${c.dim}↩️  Crédit annulé.${c.reset}`);
    return;
  }

  await crediterQuizzly(cible, gems, xp);
}

// ─────────────────────────────────────────────
// 9. SYNCHRONISATION DU CATALOGUE DES MODÈLES
// ─────────────────────────────────────────────
async function runModelScheduleNow(rl?: readline.Interface) {
  console.log(
    `\n${c.cyan}🔄 Exécution manuelle de la synchronisation des modèles (OpenRouter & CometAPI)...${c.reset}`
  );
  if (!rl) {
    console.log(
      ` ${c.dim}ℹ️  Mode automatique : les conflits conserveront la version de la base de données.${c.reset}`
    );
  }
  const result = await updateModels(
    sql,
    rl ? { resolveConflict: createConflictResolver(rl) } : {}
  );
  if (result.skipped) {
    console.log(
      ` ${c.brightYellow}ℹ️  Une synchronisation plus récente a été conservée ; aucun changement appliqué.${c.reset}`
    );
  } else {
    console.log(
      ` ${c.brightGreen}✅ Catalogue rafraîchi : ${result.upserted} modèle(s) synchronisé(s), ${result.retired} archivé(s).${c.reset}`
    );
    if ("chatCount" in result) {
      console.log(
        `   📊 Répartition : ${result.chatCount} Chat, ${result.audioCount} Audio, ${result.imageCount} Image.`
      );
      console.log(
        `   🏢 Fournisseurs : ${result.openrouterCount} OpenRouter, ${result.cometCount} CometAPI.`
      );
    }
    if ("conflicts" in result && result.conflicts) {
      const summary = [
        `base de données: ${result.conflictsKeptInDatabase}`,
        `amont: ${result.conflictsTakenFromUpstream}`,
      ];
      if ("conflictsDeleted" in result && result.conflictsDeleted) {
        summary.push(`supprimé(s): ${result.conflictsDeleted}`);
      }
      console.log(
        `   ⚠️  Conflits : ${result.conflicts} (${summary.join(", ")}).`
      );
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// 10. MENU PRINCIPAL & DISPATCHER CLI
// ─────────────────────────────────────────────
export async function runAdminCli() {
  // Support des flags en ligne de commande pour exécution non interactive / crons
  const args = process.argv.slice(2);
  if (args.includes("--update-models") || args.includes("--models-cron")) {
    await runModelScheduleNow();
    return;
  }
  if (args.includes("--models")) {
    const rl = readline.createInterface({ input, output });
    try {
      await runModelManager(sql, rl);
    } finally {
      rl.close();
    }
    return;
  }
  if (args.includes("--reset-api")) {
    await resetApiUsage(true);
    process.exit(0);
  }
  if (args.includes("--reset-mai")) {
    await resetMaiUsage(true);
    process.exit(0);
  }
  if (args.includes("--reset-images")) {
    await resetImageUsage();
    process.exit(0);
  }
  if (args.includes("--reset-audio")) {
    await resetAudioUsage(true);
    process.exit(0);
  }
  if (args.includes("--reset-all")) {
    await resetAllUsage(true);
    process.exit(0);
  }
  if (args.includes("--codes")) {
    await runSubscriptionCodeManager();
    process.exit(0);
  }
  if (args.includes("--customers")) {
    await runCustomerAccountManager();
    process.exit(0);
  }
  if (args.includes("--newsletter")) {
    await runNewsletterStudio();
    process.exit(0);
  }
  if (args.includes("--notify-news")) {
    const idx = args.indexOf("--notify-news");
    const title = args[idx + 1];
    const body = args[idx + 2] || null;
    const link = args[idx + 3] || null;
    if (!title) {
      console.error('❌ Usage : --notify-news "Titre" ["Body"] ["Link"]');
      process.exit(1);
    }
    await sendNewsNotificationToEligibleUsers(title, body, link);
    process.exit(0);
  }
  if (args.includes("--notifications")) {
    await runNotificationManager();
    process.exit(0);
  }
  if (args.includes("--forms")) {
    const rl = readline.createInterface({ input, output });
    try {
      await runFormManager(sql, rl);
    } finally {
      rl.close();
    }
    process.exit(0);
  }
  if (args.includes("--quizzly-shop")) {
    const rl = readline.createInterface({ input, output });
    try {
      await runQuizzlyShopManager(rl);
    } finally {
      rl.close();
    }
    process.exit(0);
  }
  if (args.includes("--quizzly-credit")) {
    const idx = args.indexOf("--quizzly-credit");
    const cible = args[idx + 1] ?? "";
    const gems = Number(args[idx + 2] ?? 0);
    const xp = Number(args[idx + 3] ?? 0);
    if (
      !cible ||
      !Number.isInteger(gems) ||
      !Number.isInteger(xp) ||
      gems < 0 ||
      xp < 0 ||
      (gems === 0 && xp === 0)
    ) {
      console.error(
        '❌ Usage : --quizzly-credit "<pseudo|email|id>" <gemmes> <xp>'
      );
      process.exit(1);
    }
    const ok = await crediterQuizzly(cible, gems, xp);
    process.exit(ok ? 0 : 1);
  }

  // ─────────────────────────────────────────────
  // Console interactive principale
  // ─────────────────────────────────────────────
  const rl = readline.createInterface({ input, output });
  let running = true;

  while (running) {
    console.log("");
    console.log(
      `${c.bgPurple}${c.bold}${c.brightWhite} ╔══════════════════════════════════════════════════════════════════════╗ ${c.reset}`
    );
    console.log(
      `${c.bgPurple}${c.bold}${c.brightWhite} ║  🤖 mAI — CONSOLE D'ADMINISTRATION & DE MAINTENANCE CENTRALE 🚀     ║ ${c.reset}`
    );
    console.log(
      `${c.bgPurple}${c.bold}${c.brightWhite} ║  Plateforme d'IA Souveraine • Gestion des Quotas, Accès & Modèles    ║ ${c.reset}`
    );
    console.log(
      `${c.bgPurple}${c.bold}${c.brightWhite} ╚══════════════════════════════════════════════════════════════════════╝ ${c.reset}`
    );

    console.log(`\n${c.bold}⚡ GESTION DES QUOTAS & CONSOMMATIONS :${c.reset}`);
    console.log(
      `  ${c.brightCyan}[1]${c.reset}  🔑 Réinitialiser les quotas d'usage API (mprojects_api_keys)    ${c.dim}(raccourci: 'api')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[2]${c.reset}  🧠 Réinitialiser les tokens mAI (weekly_usage)                  ${c.dim}(raccourci: 'mai')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[3]${c.reset}  🖼️  Réinitialiser les quotas journaliers d'Images                ${c.dim}(raccourci: 'img')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[4]${c.reset}  🎙️  Réinitialiser les quotas audio vocale (weekly_speech_usage)  ${c.dim}(raccourci: 'audio')${c.reset}`
    );
    console.log(
      `  ${c.brightGreen}[5]${c.reset}  ${c.bold}⚡ Réinitialiser TOUS les quotas en 1 clic (API+mAI+Img+Audio) ${c.dim}(raccourci: 'all')${c.reset}`
    );

    console.log(`\n${c.bold}👥 UTILISATEURS, ACCÈS & ABONNEMENTS :${c.reset}`);
    console.log(
      `  ${c.brightMagenta}[6]${c.reset}  🏷️  Gérer les codes d'abonnement (Créer, Lister, Modifier)        ${c.dim}(raccourci: 'codes')${c.reset}`
    );
    console.log(
      `  ${c.brightWhite}[7]${c.reset}  👥 Gérer les comptes clients (Fiche, Forfait, Bloquer, Suppr)   ${c.dim}(raccourci: 'users')${c.reset}`
    );

    console.log(`\n${c.bold}📢 COMMUNICATION & MARKETING :${c.reset}`);
    console.log(
      `  ${c.brightYellow}[8]${c.reset}  📰 Lancer le Studio de Newsletter (Éditeur HTML & Campagnes)    ${c.dim}(raccourci: 'news')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[9]${c.reset}  🔔 Gérer les Notifications & Actualités In-App (Broadcast)      ${c.dim}(raccourci: 'notif')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[10]${c.reset} 📋 Gérer les formulaires & sondages (Création, Stats, QR)       ${c.dim}(raccourci: 'forms')${c.reset}`
    );

    console.log(
      `\n${c.bold}🤖 MODÈLES D'INTELLIGENCE ARTIFICIELLE :${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[11]${c.reset} 🤖 Gestionnaire des modèles (OpenRouter & CometAPI)              ${c.dim}(raccourci: 'models')${c.reset}`
    );
    console.log(
      `  ${c.brightCyan}[12]${c.reset} 🔄 Synchroniser le catalogue des modèles (Cron manuel)           ${c.dim}(raccourci: 'sync')${c.reset}`
    );

    console.log(`\n${c.bold}🎮 MODULES SPÉCIAUX & GAMIFICATION :${c.reset}`);
    console.log(
      `  ${c.brightMagenta}[13]${c.reset} 🎁 Boutique Quizzly (Articles, Cosmétiques & Boosters)          ${c.dim}(raccourci: 'shop')${c.reset}`
    );
    console.log(
      `  ${c.brightYellow}[14]${c.reset} 💎 Créditer des gemmes et de l'XP (Quizzly)                     ${c.dim}(raccourci: 'credit')${c.reset}`
    );

    console.log(`\n${c.bold}🚪 NAVIGATION :${c.reset}`);
    console.log(
      `  ${c.white}[0]${c.reset}  🚪 Quitter la console d'administration                           ${c.dim}(raccourci: 'q', 'exit')${c.reset}`
    );

    const rawChoice = (
      await rl.question(
        `\n ${c.brightYellow}👉 Votre choix [0-14] ou raccourci : ${c.reset}`
      )
    ).trim();
    const choice = rawChoice.toLowerCase();

    if (choice === "1" || choice === "api" || choice === "reset-api") {
      await resetApiUsage(true);
      await waitEnter(rl);
    } else if (
      choice === "2" ||
      choice === "mai" ||
      choice === "tokens" ||
      choice === "weekly"
    ) {
      await resetMaiUsage(true);
      await waitEnter(rl);
    } else if (
      choice === "3" ||
      choice === "img" ||
      choice === "image" ||
      choice === "images"
    ) {
      await resetImageUsage();
      await waitEnter(rl);
    } else if (
      choice === "4" ||
      choice === "audio" ||
      choice === "speech" ||
      choice === "voix"
    ) {
      await resetAudioUsage(true);
      await waitEnter(rl);
    } else if (
      choice === "5" ||
      choice === "all" ||
      choice === "tout" ||
      choice === "reset-all"
    ) {
      await resetAllUsage(true, rl);
      await waitEnter(rl);
    } else if (
      choice === "6" ||
      choice === "codes" ||
      choice === "code" ||
      choice === "abonnement"
    ) {
      await runSubscriptionCodeManager(rl);
    } else if (
      choice === "7" ||
      choice === "users" ||
      choice === "clients" ||
      choice === "comptes" ||
      choice === "customers"
    ) {
      await runCustomerAccountManager(rl);
    } else if (
      choice === "8" ||
      choice === "news" ||
      choice === "newsletter" ||
      choice === "mail"
    ) {
      await runNewsletterStudio();
      await waitEnter(rl);
    } else if (
      choice === "9" ||
      choice === "notif" ||
      choice === "notifications" ||
      choice === "broadcast"
    ) {
      await runNotificationManager(rl);
    } else if (
      choice === "10" ||
      choice === "forms" ||
      choice === "form" ||
      choice === "sondages"
    ) {
      try {
        await runFormManager(sql, rl);
      } catch (error) {
        console.error(
          "❌ Erreur gestionnaire de formulaires :",
          error instanceof Error ? error.message : error
        );
      }
      await waitEnter(rl);
    } else if (
      choice === "11" ||
      choice === "models" ||
      choice === "modeles" ||
      choice === "catalogue"
    ) {
      try {
        await runModelManager(sql, rl);
      } catch (error) {
        console.error(
          "❌ Catalogue indisponible. Appliquez la migration et lancez --update-models.",
          error
        );
      }
      await waitEnter(rl);
    } else if (
      choice === "12" ||
      choice === "sync" ||
      choice === "cron" ||
      choice === "update-models"
    ) {
      try {
        await runModelScheduleNow(rl);
      } catch (error) {
        console.error(
          "❌ Échec du cron de synchronisation des modèles :",
          error instanceof Error ? error.message : error
        );
      }
      await waitEnter(rl);
    } else if (
      choice === "13" ||
      choice === "shop" ||
      choice === "boutique" ||
      choice === "quizzly"
    ) {
      try {
        await runQuizzlyShopManager(rl);
      } catch (error) {
        console.error(
          "❌ Erreur boutique Quizzly :",
          error instanceof Error ? error.message : error
        );
      }
      await waitEnter(rl);
    } else if (
      choice === "14" ||
      choice === "credit" ||
      choice === "gemmes" ||
      choice === "xp"
    ) {
      try {
        await runQuizzlyCreditManager(rl);
      } catch (error) {
        console.error(
          "❌ Erreur crédit Quizzly :",
          error instanceof Error ? error.message : error
        );
      }
      await waitEnter(rl);
    } else if (choice === "0" || isBackOrCancel(choice)) {
      running = false;
      console.log(
        `\n${c.dim}👋 Fermeture de la console d'administration mAI. À bientôt !${c.reset}\n`
      );
    } else {
      console.log(` ${c.red}⚠️  Choix invalide : « ${rawChoice} ».${c.reset}`);
    }
  }

  rl.close();
}

// Exécution si appelé directement
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("admin.ts")
) {
  runAdminCli().catch((err) => {
    console.error("❌ Erreur fatale :", err?.message || err);
    process.exit(1);
  });
}
