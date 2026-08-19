/**
 * mAI CLI — Val Town HTTP Proxy & Auth Backend
 * URL : https://mai.val.run/
 */

import { sqlite } from "https://esm.town/v/std/sqlite";
import { neon } from "npm:@neondatabase/serverless";
import bcrypt from "npm:bcryptjs";
import { cors } from "npm:hono/cors";
import { Hono } from "npm:hono@4";
import { jwtVerify, SignJWT } from "npm:jose";
import nodemailer from "npm:nodemailer";

// ─────────────────────────────────────────────
// Config & Données
// ─────────────────────────────────────────────
const JWT_EXPIRY = "14d";
const BCRYPT_ROUNDS = 12;

// Limites de tokens hebdomadaires (Input + Output)
const TIER_LIMITS: Record<string, number> = {
  Free: 2_000_000,
  Max: 20_000_000,
  Plus: 5_000_000,
  Pro: 10_000_000,
};

const TIER_REQUEST_LIMITS: Record<string, number> = {
  Free: 500,
  Max: 5000,
  Plus: 1000,
  Pro: 2000,
};

// Limites de stockage Cloud par tier (en bytes)
const STORAGE_LIMITS_BYTES: Record<string, number> = {
  Free: 500 * 1024 * 1024,           // 500 MB
  Max: 100 * 1024 * 1024 * 1024,     // 100 GB
  Plus: 5 * 1024 * 1024 * 1024,      // 5 GB
  Pro: 20 * 1024 * 1024 * 1024,      // 20 GB
};

function getDb() {
  const url = Deno.env.get("DATABASE_URL");
  if (!url) {
    throw new Error("DATABASE_URL not set");
  }
  return neon(url);
}

function getJwtSecret(): Uint8Array {
  const secret = Deno.env.get("MAI_JWT_SECRET");
  if (!secret) {
    throw new Error("MAI_JWT_SECRET not set");
  }
  return new TextEncoder().encode(secret);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

async function verifyToken(token: string): Promise<Record<string, unknown>> {
  const result = await sqlite.execute({
    args: [token],
    sql: "SELECT 1 FROM token_blacklist WHERE token = ?",
  });
  if (result.rows.length > 0) {
    throw new Error("Token révoqué.");
  }
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as Record<string, unknown>;
}

function extractToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7);
}

function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  let os = "linux";
  let osVersion = "Linux";

  if (uaLower.includes("iphone")) {
    os = "apple";
    osVersion = "iPhone (iOS)";
  } else if (uaLower.includes("ipad")) {
    os = "apple";
    osVersion = "iPad (iPadOS)";
  } else if (uaLower.includes("mac os") || uaLower.includes("macintosh")) {
    os = "apple";
    osVersion = "macOS";
  } else if (uaLower.includes("windows nt 10.0") || uaLower.includes("windows 11") || uaLower.includes("windows 10")) {
    os = "microsoft";
    osVersion = "Windows 10/11";
  } else if (uaLower.includes("win")) {
    os = "microsoft";
    osVersion = "Windows";
  } else if (uaLower.includes("android")) {
    os = "google";
    osVersion = "Android";
  } else if (uaLower.includes("ubuntu")) {
    os = "linux";
    osVersion = "Ubuntu Linux";
  } else if (uaLower.includes("debian")) {
    os = "linux";
    osVersion = "Debian Linux";
  } else if (uaLower.includes("fedora")) {
    os = "linux";
    osVersion = "Fedora Linux";
  }

  let model = "Navigateur Web";
  let version = "";

  if (uaLower.includes("mai-cli") || uaLower.includes("mai cli")) {
    model = "mAI CLI";
    version = "Terminal";
  } else if (uaLower.includes("pulse-extension") || uaLower.includes("pulse")) {
    model = "Pulse Extension";
    version = "Extension";
  } else if (uaLower.includes("edg/")) {
    model = "Microsoft Edge";
    const match = ua.match(/Edg\/([0-9.]+)/i);
    if (match) version = `v${match[1].split('.')[0]}`;
  } else if (uaLower.includes("opr/") || uaLower.includes("opera/")) {
    model = "Opera";
    const match = ua.match(/(?:OPR|Opera)\/([0-9.]+)/i);
    if (match) version = `v${match[1].split('.')[0]}`;
  } else if (uaLower.includes("chrome/")) {
    model = "Google Chrome";
    const match = ua.match(/Chrome\/([0-9.]+)/i);
    if (match) version = `v${match[1].split('.')[0]}`;
  } else if (uaLower.includes("firefox/")) {
    model = "Mozilla Firefox";
    const match = ua.match(/Firefox\/([0-9.]+)/i);
    if (match) version = `v${match[1].split('.')[0]}`;
  } else if (uaLower.includes("safari/") && !uaLower.includes("chrome")) {
    model = "Apple Safari";
    const match = ua.match(/Version\/([0-9.]+)/i);
    if (match) version = `v${match[1].split('.')[0]}`;
  }

  const fullVersion = version ? `${osVersion} • ${version}` : osVersion;
  const osLabel = os === "apple" ? "Apple" : os === "microsoft" ? "Windows" : os === "google" ? "Google" : "Linux";
  const deviceName = `${model} (${osLabel})`;

  return { os, device_model: model, device_version: fullVersion, device_name: deviceName };
}

function getWeekData() {
  const now = new Date();
  const day = now.getUTCDay() || 7;

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (day - 1));
  weekStart.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(weekStart);
  nextReset.setUTCDate(weekStart.getUTCDate() + 7);

  return {
    nextResetIso: nextReset.toISOString(),
    weekStartStr: weekStart.toISOString().split("T")[0],
  };
}

// ─────────────────────────────────────────────
// E-mails & Vérification (SQLite + Resend)
// ─────────────────────────────────────────────
async function initSQLite() {
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT,
      code TEXT,
      action TEXT,
      expires_at DATETIME,
      PRIMARY KEY (email, action)
    );
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
// Init DB en background
initSQLite().catch(console.error);

async function generateVerificationCode(
  email: string,
  action: string
): Promise<string> {
  const isDeletion = action === "delete_account";
  const length = isDeletion ? 8 : 6;
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const code = Math.floor(min + Math.random() * (max - min)).toString();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString(); // 10 minutes

  await sqlite.execute({
    args: [email, code, action, expiresAt],
    sql: "INSERT OR REPLACE INTO verification_codes (email, code, action, expires_at) VALUES (?, ?, ?, ?)",
  });

  return code;
}

async function verifyVerificationCode(
  email: string,
  code: string,
  action: string
): Promise<boolean> {
  const result = await sqlite.execute({
    args: [email, action],
    sql: "SELECT code, expires_at FROM verification_codes WHERE email = ? AND action = ?",
  });

  if (result.rows.length === 0) {
    return false;
  }

  const storedCode = result.rows[0][0] as string;
  const expiresAt = new Date(result.rows[0][1] as string);

  if (expiresAt < new Date()) {
    await sqlite.execute({
      args: [email, action],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ?",
    });
    return false;
  }

  if (storedCode === code) {
    await sqlite.execute({
      args: [email, action],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ?",
    });
    return true;
  }

  return false;
}

async function sendVerificationEmail(
  email: string,
  code: string,
  action: string,
  extraInfo?: any
) {
  console.log(`🔑 [CODE/ALERT] (${action}) pour ${email} : ${code || 'Aucun (Alerte)'}`);

  let subject = "Notification - mAI";
  let title = "Notification";
  let textContent = "";
  let showCode = !!code;

  switch(action) {
    case "register":
      subject = "Vérifiez votre adresse e-mail - mAI";
      title = "Vérification d'inscription";
      textContent = "Voici votre code de vérification à 6 chiffres pour votre compte <strong>mAI</strong> :";
      break;
    case "login":
      subject = "Code de vérification de connexion - mAI";
      title = "Vérification de connexion";
      textContent = "Voici votre code de vérification à 6 chiffres pour votre compte <strong>mAI</strong> :";
      break;
    case "verify_new_email":
      subject = "Vérification de votre nouvelle adresse e-mail - mAI";
      title = "Changement d'e-mail";
      textContent = "Voici le code de vérification pour confirmer votre nouvelle adresse e-mail :";
      break;
    case "delete_account":
      subject = "Code de suppression de compte - mAI";
      title = "Suppression du compte";
      textContent = "Vous avez demandé la suppression de votre compte. Voici votre code à 8 chiffres :";
      break;
    case "new_login":
      subject = "Nouvelle connexion détectée - mAI";
      title = "Alerte de sécurité";
      showCode = false;
      const device = extraInfo?.device || 'Appareil inconnu';
      const location = extraInfo?.location || 'Lieu inconnu';
      textContent = `Une nouvelle connexion à votre compte <strong>mAI</strong> a été détectée depuis :<br><br>
        <strong>Appareil :</strong> ${device}<br>
        <strong>Localisation :</strong> ${location}<br><br>
        Si vous êtes à l'origine de cette connexion, aucune action n'est requise. Sinon, modifiez immédiatement votre mot de passe et déconnectez cet appareil.`;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#090d16; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f8fafc;">
      <div style="max-width:560px; margin:40px auto; background:#111827; border:1px solid #1f293d; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        
        <!-- Header & Logo -->
        <div style="background:linear-gradient(135deg, #1e1b4b 0%, #31104b 100%); padding:32px 24px; text-align:center; border-bottom:1px solid #2e1065;">
          <img src="https://upload.fs.fr/azq3C6GLea.png" alt="mAI Logo" style="height:48px; width:auto; max-width:180px; object-fit:contain; display:inline-block;" />
          <h1 style="color:#ffffff; font-size:20px; font-weight:700; margin:16px 0 0 0; letter-spacing:-0.5px;">${title}</h1>
        </div>

        <!-- Body Content -->
        <div style="padding:32px 28px; line-height:1.6; font-size:15px; color:#cbd5e1;">
          <p style="margin-top:0;">Bonjour,</p>
          <p>${textContent}</p>
          
          ${showCode ? `
          <!-- Styled Code Container -->
          <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:24px; text-align:center; margin:28px 0;">
            <div style="font-size:34px; font-weight:800; letter-spacing:8px; color:#a855f7; font-family:Consolas, Monaco, monospace; margin-bottom:12px; user-select:all;">
              ${code}
            </div>
            <p style="font-size:12px; color:#94a3b8; margin:0;">Code unique • Expire dans 10 minutes</p>
          </div>
          ` : ''}

          <p style="font-size:13px; color:#94a3b8; margin-top:28px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez l'ignorer ou sécuriser votre compte.</p>
        </div>

        <!-- Footer -->
        <div style="background-color:#0b0f19; padding:20px 24px; text-align:center; border-top:1px solid #1e293b; font-size:12px; color:#64748b;">
          <p style="margin:0 0 6px 0;">© 2026 mAI — Plateforme d'Intelligence Artificielle & APIs</p>
          <p style="margin:0;">Cet e-mail automatique a été envoyé de manière sécurisée.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  // 1. Gmail SMTP via Nodemailer
  const gmailUser = Deno.env.get("GMAIL_USER") || "tusseaumathias85@gmail.com";
  const gmailAppPass = Deno.env.get("GMAIL_APP_PASSWORD");

  if (gmailAppPass) {
    try {
      const transporter = nodemailer.createTransport({
        auth: {
          pass: gmailAppPass,
          user: gmailUser,
        },
        service: "gmail",
      });

      await transporter.sendMail({
        from: `"mAI" <${gmailUser}>`,
        html,
        subject,
        to: email,
      });

      console.log(`✉️ E-mail envoyé avec succès via Gmail SMTP à ${email}`);
      return;
    } catch (err: any) {
      console.error("❌ Erreur d'envoi Gmail SMTP :", err?.message || err);
    }
  }

  // 2. Resend Fallback
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          from: "mAI <onboarding@resend.dev>",
          html,
          subject,
          to: email,
        }),
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      if (res.ok) {
      }
    } catch (_e) {
      // ignore
    }
  }
}

// ─────────────────────────────────────────────
// App Hono
// ─────────────────────────────────────────────
const app = new Hono();

app.use(
  "*",
  cors({
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-api-key",
      "X-User-Id",
      "X-API-Key",
      "*",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Type", "Authorization", "x-user-id"],
    maxAge: 86_400,
    origin: "*",
  })
);

// ─────────────────────────────────────────────
// ROUTE PAR DÉFAUT (Pour éviter le 404 en preview)
// ─────────────────────────────────────────────
app.get("/", (c) => c.text("mAI Backend is running!"));

// ─────────────────────────────────────────────
// AUTHENTIFICATION
// ─────────────────────────────────────────────
app.post("/register", async (c) => {
  try {
    const { email, username, password } = await c.req.json();
    if (!email || !username || !password) {
      return c.json({ error: "Champs manquants." }, 400);
    }

    const sql = getDb();
    const existing =
      await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
    if (existing.length > 0) {
      return c.json({ error: "Email ou nom d'utilisateur déjà pris." }, 400);
    }

    const code = await generateVerificationCode(email, "register");
    await sendVerificationEmail(email, code, "register");

    return c.json({ email, status: "verification_required", success: true });
  } catch (err: any) {
    console.error("Register Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/verify-register", async (c) => {
  try {
    const { email, username, password, code } = await c.req.json();
    if (!email || !username || !password || !code) {
      return c.json({ error: "Champs manquants." }, 400);
    }

    const isValid = await verifyVerificationCode(email, code, "register");
    if (!isValid) {
      return c.json({ error: "Code invalide ou expiré." }, 400);
    }

    const sql = getDb();
    const existing =
      await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
    if (existing.length > 0) {
      return c.json({ error: "Email ou nom d'utilisateur déjà pris." }, 400);
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await sql`
      INSERT INTO users (email, username, password_hash, tier)
      VALUES (${email}, ${username}, ${hash}, 'Free')
      RETURNING id, tier
    `;

    const user = result[0];
    const token = await signToken({ sub: user.id, tier: user.tier });

    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "Inconnue";
    const { os, device_model, device_version, device_name } = parseUserAgent(userAgent);

    try {
      await sql`
        INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name)
        VALUES (${user.id}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name})
      `;
    } catch (dbErr) {
      console.error("Erreur insertion device:", dbErr);
    }

    return c.json({ success: true, tier: user.tier, token });
  } catch (err: any) {
    console.error("Verify Register Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/login", async (c) => {
  try {
    const { email, password, identifier } = await c.req.json();
    const loginId = (identifier || email || "").trim();
    if (!loginId || !password) {
      return c.json({ error: "Champs manquants." }, 400);
    }

    const sql = getDb();
    const users =
      await sql`SELECT id, email, password_hash, tier FROM users WHERE email = ${loginId} OR username = ${loginId} OR phone = ${loginId} LIMIT 1`;
    if (users.length === 0) {
      return c.json({ error: "Identifiants invalides." }, 401);
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return c.json({ error: "Identifiants invalides." }, 401);
    }

    const code = await generateVerificationCode(user.email, "login");
    await sendVerificationEmail(user.email, code, "login");

    return c.json({
      email: user.email,
      status: "verification_required",
      success: true,
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/verify-login", async (c) => {
  try {
    const { email, code } = await c.req.json();
    if (!email || !code) {
      return c.json({ error: "Champs manquants." }, 400);
    }

    const isValid = await verifyVerificationCode(email, code, "login");
    if (!isValid) {
      return c.json({ error: "Code invalide ou expiré." }, 400);
    }

    const sql = getDb();
    const users =
      await sql`SELECT id, tier FROM users WHERE email = ${email} LIMIT 1`;
    if (users.length === 0) {
      return c.json({ error: "Utilisateur introuvable." }, 404);
    }

    const user = users[0];
    const token = await signToken({ sub: user.id, tier: user.tier });

    const userAgent = c.req.header("user-agent") || "";
    // Pour les tests en dev, on utilise une IP par défaut
    let ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "";
    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      ip = "8.8.8.8"; // IP Google par défaut pour ne pas planter l'API
    } else {
      // Extraire la première IP si on a une liste
      ip = ip.split(',')[0].trim();
    }
    const { os, device_model, device_version, device_name } = parseUserAgent(userAgent);

    let locationStr = "Lieu inconnu";
    let countryStr = "Pays inconnu";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          locationStr = `${geoData.city}, ${geoData.country}`;
          countryStr = geoData.country;
        }
      }
    } catch (e) {
      console.error("Erreur de géolocalisation:", e);
    }

    // Vérifier si c'est un nouvel appareil ou un nouveau pays
    let isNewDeviceOrLocation = true;
    try {
      const pastDevices = await sql`
        SELECT device_name, location FROM connected_devices 
        WHERE user_id = ${user.id}::text
      `;
      if (pastDevices.length > 0) {
        // C'est pas sa toute première connexion
        const knownDevice = pastDevices.some(d => d.device_name === device_name);
        const knownLocation = pastDevices.some(d => d.location && d.location.includes(countryStr));
        if (knownDevice && knownLocation) {
          isNewDeviceOrLocation = false;
        }
      } else {
        // Première connexion jamais (donc nouvelle par defaut, ou pas besoin d'alerte? on envoie quand meme)
        isNewDeviceOrLocation = true;
      }
    } catch (e) {
      console.error(e);
    }

    try {
      await sql`
        INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name, location)
        VALUES (${user.id}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name}, ${locationStr})
      `;
    } catch (dbErr) {
      console.error("Erreur insertion device:", dbErr);
    }

    if (isNewDeviceOrLocation) {
      // On n'attend pas l'envoi de l'email
      sendVerificationEmail(email, "", "new_login", { device: device_name, location: locationStr }).catch(console.error);
    }

    return c.json({ success: true, tier: user.tier, token });
  } catch (err: any) {
    console.error("Verify Login Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/resend-code", async (c) => {
  try {
    const { email, action } = await c.req.json();
    if (!email || !action) {
      return c.json({ error: "Champs manquants." }, 400);
    }

    // Vérifier le rate-limit (1 minute)
    const result = await sqlite.execute({
      args: [email, action],
      sql: "SELECT expires_at FROM verification_codes WHERE email = ? AND action = ?",
    });

    if (result.rows.length > 0) {
      const expiresAt = new Date(result.rows[0][0] as string);
      const now = new Date();
      // Si la date d'expiration est > maintenant + 9 minutes, ça veut dire qu'il a été généré il y a moins d'1 minute.
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / 60_000;
      if (diffMinutes > 9) {
        return c.json(
          { error: "Veuillez patienter 1 minute avant de renvoyer un code." },
          429
        );
      }
    }

    const code = await generateVerificationCode(email, action);
    await sendVerificationEmail(email, code, action);

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Resend Code Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/verify-code", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = String(payload.sub);

    const body = await c.req.json();
    const rawCode = body?.code;
    if (!rawCode) {
      return c.json({ error: "Code requis." }, 400);
    }

    const inputCode = String(rawCode).trim().toUpperCase();

    // Les codes sont définis dans les variables d'environnement de Val Town
    const upgradeCodes: Record<string, string> = {};

    const plusCode = Deno.env.get("MAI_PLUS_CODE") || Deno.env.get("PLUS_CODE");
    if (plusCode) {
      upgradeCodes[plusCode.trim().toUpperCase()] = "Plus";
    }

    const proCode = Deno.env.get("MAI_PRO_CODE") || Deno.env.get("PRO_CODE");
    if (proCode) {
      upgradeCodes[proCode.trim().toUpperCase()] = "Pro";
    }

    const maxCode = Deno.env.get("MAI_MAX_CODE") || Deno.env.get("MAX_CODE");
    if (maxCode) {
      upgradeCodes[maxCode.trim().toUpperCase()] = "Max";
    }

    const newTier = upgradeCodes[inputCode];

    if (!newTier) {
      console.log(
        `[Verify-Code] Code soumis: "${inputCode}", Codes reconnus en ENV:`,
        Object.keys(upgradeCodes)
      );
      return c.json({ error: "Code invalide ou expiré." }, 400);
    }

    const sql = getDb();
    await sql`UPDATE users SET tier = ${newTier} WHERE id::text = ${userId}::text`;
    await sql`UPDATE mprojects_api_keys SET plan = ${newTier} WHERE user_id = ${userId}::text`;

    // On regénère le token pour inclure le nouveau tier
    const newToken = await signToken({ sub: userId, tier: newTier });

    return c.json({ success: true, tier: newTier, token: newToken });
  } catch (err: any) {
    console.error("Verify-Code error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/update-profile", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const {
      username,
      email,
      phone,
      password,
      currentPassword,
      newsletter,
      notify_limits,
    } = await c.req.json();
    const sql = getDb();

    // Vérification obligatoire du mot de passe actuel
    if (!currentPassword) {
      return c.json(
        {
          error:
            "Le mot de passe actuel est obligatoire pour modifier vos informations.",
        },
        400
      );
    }

    const currentUser =
      await sql`SELECT email, password_hash FROM users WHERE id::text = ${userId}::text LIMIT 1`;
    if (!currentUser || currentUser.length === 0) {
      return c.json({ error: "Utilisateur introuvable." }, 404);
    }

    const passMatch = await bcrypt.compare(
      currentPassword,
      currentUser[0].password_hash
    );
    if (!passMatch) {
      return c.json({ error: "Le mot de passe actuel est incorrect." }, 400);
    }

    if (username && username.trim()) {
      const cleanUsername = username.trim();
      const existing =
        await sql`SELECT id FROM users WHERE username = ${cleanUsername} AND id::text != ${userId}::text LIMIT 1`;
      if (existing.length > 0) {
        return c.json({ error: "Ce nom d'utilisateur est déjà pris." }, 400);
      }
      await sql`UPDATE users SET username = ${cleanUsername} WHERE id::text = ${userId}::text`;
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim();
      const existing =
        await sql`SELECT id FROM users WHERE email = ${cleanEmail} AND id::text != ${userId}::text LIMIT 1`;
      if (existing.length > 0) {
        return c.json(
          { error: "Cette adresse e-mail est déjà utilisée." },
          400
        );
      }
      if (cleanEmail !== currentUser[0].email) {
        // Send OTP instead of updating directly
        const code = await generateVerificationCode(cleanEmail, "verify_new_email");
        await sendVerificationEmail(cleanEmail, code, "verify_new_email");
        return c.json({ status: "email_verification_required", email: cleanEmail, success: true });
      }
    }

    if (phone !== undefined) {
      const cleanPhone = phone ? phone.trim() : null;
      if (cleanPhone) {
        const existing =
          await sql`SELECT id FROM users WHERE phone = ${cleanPhone} AND id::text != ${userId}::text LIMIT 1`;
        if (existing.length > 0) {
          return c.json(
            {
              error:
                "Ce numéro de téléphone est déjà associé à un autre compte.",
            },
            400
          );
        }
      }
      await sql`UPDATE users SET phone = ${cleanPhone} WHERE id::text = ${userId}::text`;
    }

    if (newsletter !== undefined) {
      await sql`UPDATE users SET newsletter = ${Boolean(newsletter)} WHERE id::text = ${userId}::text`;
    }

    if (notify_limits !== undefined) {
      await sql`UPDATE users SET notify_limits = ${Boolean(notify_limits)} WHERE id::text = ${userId}::text`;
    }

    const { auto_logout_minutes } = await c.req.json();
    if (auto_logout_minutes !== undefined) {
      const mins = parseInt(auto_logout_minutes, 10);
      if (!isNaN(mins)) {
        await sql`UPDATE users SET auto_logout_minutes = ${mins} WHERE id::text = ${userId}::text`;
      }
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return c.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères." },
          400
        );
      }
      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id::text = ${userId}::text`;
    }

    const updatedUser =
      await sql`SELECT username, email, phone, tier, newsletter, notify_limits FROM users WHERE id::text = ${userId}::text LIMIT 1`;
    const user = updatedUser[0];

    return c.json({
      email: user?.email,
      newsletter: user?.newsletter,
      notify_limits: user?.notify_limits,
      phone: user?.phone,
      success: true,
      tier: user?.tier,
      username: user?.username,
    });
  } catch {
    return c.json({ error: "Erreur lors de la mise à jour du profil." }, 500);
  }
});

app.post("/verify-new-email", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);
    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const { email, code } = await c.req.json();
    if (!email || !code) return c.json({ error: "Champs manquants." }, 400);

    const isValid = await verifyVerificationCode(email, code, "verify_new_email");
    if (!isValid) return c.json({ error: "Code invalide ou expiré." }, 400);

    const sql = getDb();
    await sql`UPDATE users SET email = ${email.trim()} WHERE id::text = ${userId}::text`;

    return c.json({ success: true, email: email.trim() });
  } catch (err: any) {
    console.error("verify-new-email Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/request-delete-account", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);
    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const sql = getDb();
    const currentUser = await sql`SELECT email FROM users WHERE id::text = ${userId}::text LIMIT 1`;
    if (!currentUser || currentUser.length === 0) return c.json({ error: "Utilisateur introuvable." }, 404);

    const email = currentUser[0].email;
    const code = await generateVerificationCode(email, "delete_account");
    await sendVerificationEmail(email, code, "delete_account");

    return c.json({ success: true, email });
  } catch (err: any) {
    console.error("request-delete-account Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/confirm-delete-account", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);
    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const { password, code, confirmationText } = await c.req.json();
    if (!password || !code || confirmationText !== "SUPPRIMER LE COMPTE") {
      return c.json({ error: "Informations de confirmation invalides." }, 400);
    }

    const sql = getDb();
    const currentUser = await sql`SELECT email, password_hash FROM users WHERE id::text = ${userId}::text LIMIT 1`;
    if (!currentUser || currentUser.length === 0) return c.json({ error: "Utilisateur introuvable." }, 404);

    const passMatch = await bcrypt.compare(password, currentUser[0].password_hash);
    if (!passMatch) return c.json({ error: "Mot de passe incorrect." }, 400);

    const email = currentUser[0].email;
    const isValid = await verifyVerificationCode(email, code, "delete_account");
    if (!isValid) return c.json({ error: "Code invalide ou expiré." }, 400);

    // Suppression (ou anonymisation)
    await sql`DELETE FROM users WHERE id::text = ${userId}::text`;
    
    // Révoquer le token pour déconnecter immédiatement
    await sqlite.execute({
      args: [token],
      sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
    });

    return c.json({ success: true });
  } catch (err: any) {
    console.error("confirm-delete-account Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

// ─────────────────────────────────────────────
// CATALOGUE & USAGE
// ─────────────────────────────────────────────

app.post("/upload-avatar", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const body = await c.req.parseBody();
    const file = body["avatar"];

    if (!(file instanceof File)) {
      return c.json({ error: "Fichier invalide ou non fourni." }, 400);
    }

    const { AwsClient } = await import("npm:aws4fetch");

    const s3Client = new AwsClient({
      accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID") || "",
      region: Deno.env.get("S3_REGION") || "auto",
      secretAccessKey: Deno.env.get("S3_SECRET_ACCESS_KEY") || "",
      service: "s3",
    });

    const endpoint = Deno.env.get("S3_ENDPOINT") || "";
    const bucket = Deno.env.get("S3_BUCKET") || "";

    const ext = file.name.split(".").pop();
    const filename = `avatars/${userId}-${Date.now()}.${ext}`;

    let url = endpoint;
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const uploadUrl = `${url}/${bucket}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await s3Client.fetch(uploadUrl, {
      body: arrayBuffer,
      headers: {
        "Content-Type": file.type,
      },
      method: "PUT",
    });

    if (!uploadRes.ok) {
      console.error("Erreur S3:", await uploadRes.text());
      return c.json({ error: "Erreur lors de l'upload de l'image." }, 500);
    }

    const publicBase = Deno.env.get("S3_PUBLIC_URL") || `${url}/${bucket}`;
    const publicUrl = `${publicBase}/${filename}`;

    const sql = getDb();
    await sql`UPDATE users SET avatar_url = ${publicUrl} WHERE id = ${userId}`;

    return c.json({ avatarUrl: publicUrl, success: true });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: "Erreur serveur lors de l'upload." }, 500);
  }
});

app.post("/upload-file", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      return c.json({ error: "Fichier invalide ou non fourni." }, 400);
    }

    const { AwsClient } = await import("npm:aws4fetch");

    const s3Client = new AwsClient({
      accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID") || "",
      region: Deno.env.get("S3_REGION") || "auto",
      secretAccessKey: Deno.env.get("S3_SECRET_ACCESS_KEY") || "",
      service: "s3",
    });

    const endpoint = Deno.env.get("S3_ENDPOINT") || "";
    const bucket = Deno.env.get("S3_BUCKET") || "";

    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `uploads/${Date.now()}-${cleanFilename}`;

    let url = endpoint;
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const uploadUrl = `${url}/${bucket}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await s3Client.fetch(uploadUrl, {
      body: arrayBuffer,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      method: "PUT",
    });

    if (!uploadRes.ok) {
      console.error("Erreur S3:", await uploadRes.text());
      return c.json({ error: "Erreur lors de l'upload vers S3." }, 500);
    }

    const publicBase = Deno.env.get("S3_PUBLIC_URL") || `${url}/${bucket}`;
    const publicUrl = `${publicBase}/${filename}`;

    return c.json({
      contentType: file.type || "application/octet-stream",
      pathname: filename,
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("Upload File S3 Error:", err);
    return c.json({ error: "Erreur serveur lors de l'upload S3." }, 500);
  }
});

// ─────────────────────────────────────────────
// mAI CLOUD — STOCKAGE R2 PAR UTILISATEUR
// ─────────────────────────────────────────────

// Helper : retourne le client S3/R2 (réutilise les variables S3_* existantes)
async function buildR2Client() {
  const { AwsClient } = await import("npm:aws4fetch");
  return new AwsClient({
    accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID") || "",
    region: Deno.env.get("S3_REGION") || "auto",
    secretAccessKey: Deno.env.get("S3_SECRET_ACCESS_KEY") || "",
    service: "s3",
  });
}

function getR2Endpoint(): string {
  const endpoint = Deno.env.get("S3_ENDPOINT") || "";
  return endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
}

function getR2Bucket(): string {
  return Deno.env.get("S3_BUCKET") || "";
}

function getR2PublicBase(): string {
  const pub = Deno.env.get("S3_PUBLIC_URL");
  if (pub) return pub.endsWith("/") ? pub.slice(0, -1) : pub;
  return `${getR2Endpoint()}/${getR2Bucket()}`;
}

// GET /cloud/storage — Consommation actuelle de stockage
app.get("/cloud/storage", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);

    const payload = await verifyToken(token);
    const userId = payload.sub as string;
    const sql = getDb();

    const [userRes, usageRes] = await Promise.all([
      sql`SELECT tier FROM users WHERE id::text = ${userId}::text LIMIT 1`,
      sql`SELECT bytes_used, files_count FROM cloud_storage_usage WHERE user_id = ${userId}::text LIMIT 1`,
    ]);

    const tier = userRes[0]?.tier || "Free";
    const bytesUsed = Number(usageRes[0]?.bytes_used || 0);
    const filesCount = Number(usageRes[0]?.files_count || 0);
    const bytesLimit = STORAGE_LIMITS_BYTES[tier] || STORAGE_LIMITS_BYTES["Free"];
    const percentUsed = bytesLimit > 0 ? Math.min(100, (bytesUsed / bytesLimit) * 100) : 0;

    return c.json({
      bytes_limit: bytesLimit,
      bytes_used: bytesUsed,
      files_count: filesCount,
      over_limit: bytesUsed >= bytesLimit,
      percent_used: Math.round(percentUsed * 100) / 100,
      tier,
    });
  } catch (err: any) {
    console.error("Cloud Storage Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

// GET /cloud/files — Liste des fichiers de l'utilisateur
app.get("/cloud/files", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);

    const payload = await verifyToken(token);
    const userId = payload.sub as string;
    const sql = getDb();

    const files = await sql`
      SELECT id, filename, original_name, url, size_bytes, mime_type, uploaded_at
      FROM cloud_files
      WHERE user_id = ${userId}::text
      ORDER BY uploaded_at DESC
      LIMIT 200
    `;

    return c.json({ files, success: true });
  } catch (err: any) {
    console.error("Cloud Files Error:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

// POST /cloud/upload — Upload d'un fichier vers R2 + mise à jour quota
app.post("/cloud/upload", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);

    const payload = await verifyToken(token);
    const userId = payload.sub as string;
    const sql = getDb();

    // Lire le fichier
    const body = await c.req.parseBody();
    const file = body["file"];
    if (!(file instanceof File)) {
      return c.json({ error: "Fichier invalide ou non fourni." }, 400);
    }

    const fileSize = file.size;
    if (fileSize === 0) {
      return c.json({ error: "Le fichier est vide." }, 400);
    }

    // Vérifier le quota AVANT d'uploader
    const [userRes, usageRes] = await Promise.all([
      sql`SELECT tier FROM users WHERE id::text = ${userId}::text LIMIT 1`,
      sql`SELECT bytes_used FROM cloud_storage_usage WHERE user_id = ${userId}::text LIMIT 1`,
    ]);

    const tier = userRes[0]?.tier || "Free";
    const bytesUsed = Number(usageRes[0]?.bytes_used || 0);
    const bytesLimit = STORAGE_LIMITS_BYTES[tier] || STORAGE_LIMITS_BYTES["Free"];

    if (bytesUsed + fileSize > bytesLimit) {
      const limitMB = Math.round(bytesLimit / (1024 * 1024));
      const usedMB = Math.round(bytesUsed / (1024 * 1024));
      return c.json({
        bytes_limit: bytesLimit,
        bytes_used: bytesUsed,
        error: `Quota de stockage dépassé. Vous utilisez ${usedMB} MB sur ${limitMB} MB (tier ${tier}).`,
        over_limit: true,
      }, 413);
    }

    // Générer une clé R2 unique
    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const uniqueId = crypto.randomUUID();
    const r2Key = `cloud/${userId}/${uniqueId}.${ext}`;
    const cleanOriginal = file.name;
    const cleanFilename = `${uniqueId}.${ext}`;

    // Uploader vers R2
    const r2Client = await buildR2Client();
    const uploadUrl = `${getR2Endpoint()}/${getR2Bucket()}/${r2Key}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await r2Client.fetch(uploadUrl, {
      body: arrayBuffer,
      headers: { "Content-Type": file.type || "application/octet-stream" },
      method: "PUT",
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("R2 Upload Error:", errText);
      return c.json({ error: "Erreur lors de l'upload vers R2." }, 500);
    }

    const publicUrl = `${getR2PublicBase()}/${r2Key}`;
    const mimeType = file.type || "application/octet-stream";

    // Insérer dans cloud_files
    const inserted = await sql`
      INSERT INTO cloud_files (user_id, filename, original_name, r2_key, url, size_bytes, mime_type)
      VALUES (${userId}::text, ${cleanFilename}, ${cleanOriginal}, ${r2Key}, ${publicUrl}, ${fileSize}, ${mimeType})
      RETURNING id, filename, original_name, url, size_bytes, mime_type, uploaded_at
    `;

    // Upsert cloud_storage_usage
    await sql`
      INSERT INTO cloud_storage_usage (user_id, bytes_used, files_count, updated_at)
      VALUES (${userId}::text, ${fileSize}, 1, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        bytes_used   = cloud_storage_usage.bytes_used + ${fileSize},
        files_count  = cloud_storage_usage.files_count + 1,
        updated_at   = NOW()
    `;

    const newBytesUsed = bytesUsed + fileSize;
    const percentUsed = Math.round((newBytesUsed / bytesLimit) * 10000) / 100;

    return c.json({
      file: inserted[0],
      percent_used: percentUsed,
      storage: {
        bytes_limit: bytesLimit,
        bytes_used: newBytesUsed,
        over_limit: newBytesUsed >= bytesLimit,
        percent_used: percentUsed,
        tier,
      },
      success: true,
    });
  } catch (err: any) {
    console.error("Cloud Upload Error:", err);
    return c.json({ error: "Erreur serveur lors de l'upload Cloud." }, 500);
  }
});

// DELETE /cloud/files/:id — Suppression définitive d'un fichier
app.delete("/cloud/files/:id", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return c.json({ error: "Non authentifié." }, 401);

    const payload = await verifyToken(token);
    const userId = payload.sub as string;
    const fileId = c.req.param("id");
    const sql = getDb();

    // Récupérer le fichier (vérification propriété)
    const fileRes = await sql`
      SELECT id, r2_key, size_bytes
      FROM cloud_files
      WHERE id = ${fileId}::uuid AND user_id = ${userId}::text
      LIMIT 1
    `;

    if (fileRes.length === 0) {
      return c.json({ error: "Fichier introuvable ou accès refusé." }, 404);
    }

    const { r2_key, size_bytes } = fileRes[0];

    // Supprimer de R2
    const r2Client = await buildR2Client();
    const deleteUrl = `${getR2Endpoint()}/${getR2Bucket()}/${r2_key}`;
    try {
      await r2Client.fetch(deleteUrl, { method: "DELETE" });
    } catch (r2Err) {
      console.error("R2 Delete Error (continuing anyway):", r2Err);
    }

    // Supprimer de la base de données
    await sql`DELETE FROM cloud_files WHERE id = ${fileId}::uuid AND user_id = ${userId}::text`;

    // Décrémenter cloud_storage_usage
    await sql`
      UPDATE cloud_storage_usage
      SET
        bytes_used  = GREATEST(0, bytes_used - ${size_bytes}),
        files_count = GREATEST(0, files_count - 1),
        updated_at  = NOW()
      WHERE user_id = ${userId}::text
    `;

    return c.json({ id: fileId, success: true });
  } catch (err: any) {
    console.error("Cloud Delete Error:", err);
    return c.json({ error: "Erreur serveur lors de la suppression." }, 500);
  }
});

app.get("/usage", async (c) => {

  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;
    const { weekStartStr, nextResetIso } = getWeekData();

    const sql = getDb();
    const [usageResult, userResult] = await Promise.all([
      sql`SELECT tokens_used FROM weekly_usage WHERE user_id = ${userId} AND week_start = ${weekStartStr}`,
      sql`SELECT tier, email, username, phone, avatar_url FROM users WHERE id = ${userId} LIMIT 1`,
    ]);

    const user = userResult[0];
    const tokensUsed = usageResult[0]?.tokens_used || 0;
    const limit = TIER_LIMITS[user?.tier] || TIER_LIMITS["Free"];

    return c.json({
      avatarUrl: user?.avatar_url,
      email: user?.email,
      limit,
      phone: user?.phone,
      resetAt: nextResetIso,
      tier: user?.tier || "Free",
      tokensUsed,
      username: user?.username,
      weekStart: weekStartStr,
    });
  } catch {
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.post("/log-usage", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const { tokensUsed = 0 } = await c.req.json();
    const { weekStartStr } = getWeekData();

    const sql = getDb();
    const userRes =
      await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
    const tier = userRes.length > 0 ? userRes[0].tier : "Free";
    const limit = TIER_LIMITS[tier] || TIER_LIMITS["Free"];

    const usageResult = await sql`
      SELECT tokens_used FROM weekly_usage
      WHERE user_id = ${userId} AND week_start = ${weekStartStr}
      LIMIT 1
    `;
    const currentUsage = usageResult[0]?.tokens_used || 0;

    if (currentUsage + tokensUsed > limit) {
      return c.json(
        { error: "Limite atteinte.", limit, used: currentUsage },
        429
      );
    }

    await sql`
      INSERT INTO weekly_usage (user_id, week_start, tokens_used)
      VALUES (${userId}, ${weekStartStr}, ${tokensUsed})
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${tokensUsed}
    `;

    return c.json({
      limit,
      success: true,
      weeklyUsed: currentUsage + tokensUsed,
    });
  } catch {
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

// ─────────────────────────────────────────────
// PROXY : CHAT COMPLETIONS
// ─────────────────────────────────────────────
app.post("/chat/completions", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    // Vérification des limites avant d'autoriser la requête
    const sql = getDb();
    const userRes =
      await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
    const tier = userRes.length > 0 ? userRes[0].tier : "Free";
    const limit = TIER_LIMITS[tier] || TIER_LIMITS["Free"];

    const { weekStartStr } = getWeekData();
    const usageResult = await sql`
      SELECT tokens_used FROM weekly_usage
      WHERE user_id = ${userId} AND week_start = ${weekStartStr}
      LIMIT 1
    `;
    const currentUsage = usageResult[0]?.tokens_used || 0;

    if (currentUsage >= limit) {
      return c.json({ error: "Votre limite hebdomadaire est épuisée." }, 429);
    }

    // Le corps de la requête du CLI
    const body = await c.req.json();
    
    const keyRows = await sql`
      SELECT api_key FROM mprojects_api_keys WHERE user_id = ${userId}::text LIMIT 1
    `;
    const apiKey = keyRows.length > 0 ? keyRows[0].api_key : Deno.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      return c.json({ error: "Clé fournisseur manquante." }, 500);
    }

    try {
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${userId}::text, ${weekStartStr}, 1)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
      `;
    } catch(e) {}

    // Redirection de la requête vers OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.val.run",
          "X-Title": "mAI CLI",
        },
        method: "POST",
      }
    );

    // Retourne le stream ou la réponse directement au CLI
    return new Response(response.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
      status: response.status,
    });
  } catch {
    return c.json({ error: "Erreur serveur proxy." }, 500);
  }
});

// ─────────────────────────────────────────────
// API PUBLIQUE (mProjects avec Clés API)
// ─────────────────────────────────────────────

// Middleware /v1/* pour Auth & Logging
app.use("/v1/*", async (c, next) => {
  const path = c.req.path;
  const isPublicRoute =
    path === "/v1/models" || path === "/v1/mai/models" || path === "/v1/status";

  const authHeader = c.req.header("Authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const reqUserId = c.req.header("x-user-id");
  const startTime = Date.now();

  const systemMaiApiKey = Deno.env.get("MAI_API_KEY");

  let userPlan = "Free";
  let currentUserId: string | null = null;
  const currentApiKey: string | null = apiKey;

  // 1. Clé système MAI_API_KEY (accès complet aux modèles Plus/Max)
  if (systemMaiApiKey && apiKey === systemMaiApiKey) {
    userPlan = "Plus";
    currentUserId = "system-mai";
  }
  // 2. Clé API utilisateur enregistrée
  else if (apiKey) {
    const sql = getDb();
    const prefixCandidate = apiKey.substring(0, 11);
    const rows = await sql`
      SELECT k.*, u.tier as user_tier
      FROM mprojects_api_keys k
      LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
      WHERE k.api_key = ${apiKey}::text 
         OR k.api_key = ${prefixCandidate}::text
         OR ${apiKey}::text LIKE (k.api_key || '%')
         OR k.api_key LIKE (${prefixCandidate} || '%')
      LIMIT 1
    `;

    const isJwtRoute = path.startsWith("/v1/devices");

  if (rows.length > 0) {
      const apiKeyData = rows[0];
      userPlan = apiKeyData.user_tier || apiKeyData.plan || "Free";
      currentUserId = apiKeyData.user_id;
    } else if (isJwtRoute && apiKey) {
      // Routes de compte : accepter un token JWT de session (pas une API Key)
      try {
        const blacklisted = await sqlite.execute({ args: [apiKey], sql: "SELECT 1 FROM token_blacklist WHERE token = ?" });
        if (blacklisted.rows.length > 0) {
          return c.json({ error: "Token révoqué." }, 401);
        }
        const { payload } = await jwtVerify(apiKey, getJwtSecret());
        currentUserId = String(payload.sub);
        userPlan = String(payload.tier || "Free");
      } catch (_jwtErr) {
        return c.json({ error: "Invalid API Key." }, 403);
      }
    } else if (!isPublicRoute) {
      return c.json({ error: "Invalid API Key." }, 403);
    }
  }

  // 3. En-tête x-user-id (requêtes web app / internes) : prévaut pour le forfait du compte
  if (reqUserId && reqUserId !== "system-mai") {
    try {
      const sql = getDb();
      const uRows = await sql`
        SELECT tier FROM users 
        WHERE id::text = ${reqUserId}::text OR username = ${reqUserId}::text OR email = ${reqUserId}::text 
        LIMIT 1
      `;
      if (uRows.length > 0 && uRows[0].tier) {
        userPlan = uRows[0].tier;
      }
      currentUserId = reqUserId;
    } catch (_err) {}
  }

  // 4. Aucun identifiant et route privée
  if (!apiKey && !reqUserId && !isPublicRoute) {
    return c.json({ error: "Service Unavailable. API Key missing." }, 401);
  }

  // Enregistrer le plan et les infos de contexte
  c.set("userPlan", userPlan);
  c.set("userId", currentUserId);
  c.set("apiKey", currentApiKey);

  // Vérification des quotas pour les clés API enregistrées
  if (apiKey && currentUserId && currentUserId !== "system-mai") {
    const limit = TIER_REQUEST_LIMITS[userPlan] || 1000;
    const sql = getDb();

    // Réinitialisation mensuelle automatique si le mois a changé
    await sql`
      UPDATE mprojects_api_keys
      SET request_count = 0
      WHERE user_id = ${currentUserId}::text
        AND last_used_at IS NOT NULL
        AND last_used_at < DATE_TRUNC('month', NOW())
    `;

    // Calculer l'usage global pour l'utilisateur
    const countRows = await sql`
      SELECT SUM(request_count) as total_requests
      FROM mprojects_api_keys
      WHERE user_id = ${currentUserId}::text
    `;
    const globalRequestCount = countRows[0]?.total_requests || 0;

    if (globalRequestCount >= limit) {
      if (isPublicRoute) {
        await next();
        return;
      }
      return c.json({ error: "Quota exceeded for your account." }, 429);
    }
  }

  await next();

  if (isPublicRoute) {
    return; // Ne pas logger les requêtes vers les routes publiques
  }

  const latency = Date.now() - startTime;
  const status = c.res.status;
  const endpoint = c.req.path;
  const method = c.req.method;

  // Logging & Mise à jour quota (uniquement pour les clés API utilisateur réelles)
  const isJwtRoute = path.startsWith("/v1/devices");
  if (!isJwtRoute && apiKey && apiKey !== systemMaiApiKey) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms)
        VALUES (${apiKey}::text, ${endpoint}::text, ${method}::text, ${status}::integer, ${latency}::integer)
      `;

      await sql`
        UPDATE mprojects_api_keys
        SET request_count = request_count + 1, last_used_at = NOW()
        WHERE api_key = ${apiKey}::text
      `;
    } catch (err) {
      console.error("Erreur logging API:", err);
    }
  }
});

app.get("/v1/models", async (c) => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) {
      throw new Error("OpenRouter fetch error");
    }
    const json = await res.json();
    const rawModels: any[] = json.data || [];

    const filtered = rawModels
      .filter((m) => m && m.id && !m.id.startsWith("openrouter/"))
      .filter((m) => {
        const modality = m.architecture?.modality || "";
        const outputModalities = m.architecture?.output_modalities || [];
        return (
          outputModalities.includes("text") ||
          modality.endsWith("text") ||
          modality.includes("->text")
        );
      })
      .map((m) => ({
        created: m.created || Math.floor(Date.now() / 1000),
        id: m.id,
        maxContext: m.context_length || 128_000,
        maxOutput: m.top_provider?.max_completion_tokens || 4096,
        object: "model",
        owned_by: m.id.split("/")[0] || "openrouter",
      }));

    return c.json({ data: filtered, object: "list" });
  } catch (_err) {
    const fallback = [
      {
        created: 0,
        id: "google/gemini-2.5-flash:free",
        object: "model",
        owned_by: "google",
      },
      {
        created: 0,
        id: "meta-llama/llama-3.3-70b-instruct:free",
        object: "model",
        owned_by: "meta-llama",
      },
      {
        created: 0,
        id: "qwen/qwen-2.5-coder-32b-instruct:free",
        object: "model",
        owned_by: "qwen",
      },
      {
        created: 0,
        id: "deepseek/deepseek-r1:free",
        object: "model",
        owned_by: "deepseek",
      },
    ];
    return c.json({ data: fallback, object: "list" });
  }
});

app.get("/v1/mai/models", async (c) => {
  const maiModelsList = [
    {
      created: Math.floor(Date.now() / 1000),
      id: "mDevsLabs/mAI-1.2-Light",
      object: "model",
      owned_by: "mDevsLabs",
    },
    {
      created: Math.floor(Date.now() / 1000),
      id: "mDevsLabs/mAI-1.2-Apex",
      object: "model",
      owned_by: "mDevsLabs",
    },
    {
      created: Math.floor(Date.now() / 1000),
      id: "mDevsLabs/mAI-1.2-Opal",
      object: "model",
      owned_by: "mDevsLabs",
    },
  ];
  return c.json({ data: maiModelsList, object: "list" });
});

app.get("/v1/status", async (c) => {
  try {
    const res = await fetch("https://mai.instatus.com/summary.json");
    const data = await res.json();
    return c.json(data);
  } catch {
    return c.json({ error: "Failed to fetch status" }, 500);
  }
});

app.post("/v1/chat/completions", async (c) => {
  try {
    const userPlan = c.get("userPlan");
    const body = await c.req.json();
    const modelRequested = body.model;

    const planStr = String(userPlan || "Free")
      .toLowerCase()
      .trim();
    const isPaidPlan = ["plus", "pro", "max"].includes(planStr);
    const isFreePlan = !isPaidPlan;

    const modelStr = String(modelRequested || "").toLowerCase();
    const isFreeModel = modelStr.includes("free");

    if (isFreePlan && !isFreeModel) {
      return c.json(
        {
          error: {
            code: "model_access_denied",
            message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles contenant 'free'.`,
            param: "model",
            type: "permission_error",
          },
        },
        403
      );
    }

    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const sql = getDb();
    const { weekStartStr } = getWeekData();
    const usageResult = await sql`
      SELECT tokens_used FROM weekly_usage
      WHERE user_id = ${userId}::text AND week_start = ${weekStartStr}
      LIMIT 1
    `;
    const currentUsage = usageResult[0]?.tokens_used || 0;
    const limit = TIER_LIMITS[String(userPlan || "Free")] || TIER_LIMITS["Free"];

    if (currentUsage >= limit) {
      return c.json({ error: "Votre limite hebdomadaire est épuisée. Quota atteint." }, 429);
    }

    const keyRows = await sql`
      SELECT api_key FROM mprojects_api_keys WHERE user_id = ${userId}::text LIMIT 1
    `;
    const apiKey = keyRows.length > 0 ? keyRows[0].api_key : Deno.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      return c.json({ error: "Clé fournisseur manquante." }, 500);
    }

    try {
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${userId}::text, ${weekStartStr}, 1)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
      `;
    } catch(e) {}

    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.val.run",
          "X-Title": "mAI Public API",
        },
        method: "POST",
      }
    );

    return new Response(openRouterRes.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          openRouterRes.headers.get("Content-Type") || "application/json",
      },
      status: openRouterRes.status,
    });
  } catch {
    return c.json({ error: "Failed to process chat completion." }, 500);
  }
});
// Proxy Anthropic SDK
app.post("/v1/messages", async (c) => {
  try {
    const userPlan = c.get("userPlan");
    const body = await c.req.json();
    const modelRequested = body.model;

    const planStr = String(userPlan || "Free")
      .toLowerCase()
      .trim();
    const isFreePlan = planStr === "free" || planStr === "gratuit";
    const isFreeModel = Boolean(
      modelRequested && modelRequested.includes(":free")
    );

    if (isFreePlan && !isFreeModel) {
      return c.json(
        {
          error: {
            code: "model_access_denied",
            message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (Free) autorise uniquement les modèles gratuits dont l'ID contient ':free' tel que 'poolside/laguna-xs-2.1:free'.`,
            param: "model",
            type: "permission_error",
          },
        },
        403
      );
    }

    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const sql = getDb();
    const { weekStartStr } = getWeekData();
    const usageResult = await sql`
      SELECT tokens_used FROM weekly_usage
      WHERE user_id = ${userId}::text AND week_start = ${weekStartStr}
      LIMIT 1
    `;
    const currentUsage = usageResult[0]?.tokens_used || 0;
    const limit = TIER_LIMITS[String(userPlan || "Free")] || TIER_LIMITS["Free"];

    if (currentUsage >= limit) {
      return c.json({ error: "Votre limite hebdomadaire est épuisée. Quota atteint." }, 429);
    }

    const keyRows = await sql`
      SELECT api_key FROM mprojects_api_keys WHERE user_id = ${userId}::text LIMIT 1
    `;
    const apiKey = keyRows.length > 0 ? keyRows[0].api_key : Deno.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      return c.json({ error: "Clé fournisseur manquante." }, 500);
    }

    try {
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${userId}::text, ${weekStartStr}, 1)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
      `;
    } catch(e) {}

    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.val.run",
          "X-Title": "mAI Public API",
        },
        method: "POST",
      }
    );

    return new Response(openRouterRes.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          openRouterRes.headers.get("Content-Type") || "application/json",
      },
      status: openRouterRes.status,
    });
  } catch {
    return c.json({ error: "Failed to process Anthropic request." }, 500);
  }
});

// Proxy Google SDK
app.post("/v1beta/models/:model:generateContent", async (c) => {
  try {
    const userPlan = c.get("userPlan");
    const body = await c.req.json().catch(() => ({}));
    const modelRequested = c.req.param("model");

    const planStr = String(userPlan || "Free")
      .toLowerCase()
      .trim();
    const isFreePlan = planStr === "free" || planStr === "gratuit";
    const isFreeModel = Boolean(
      modelRequested && modelRequested.includes(":free")
    );

    if (isFreePlan && !isFreeModel) {
      return c.json(
        {
          error: {
            code: "model_access_denied",
            message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (Free) autorise uniquement les modèles gratuits dont l'ID contient ':free' tel que 'poolside/laguna-xs-2.1:free'.`,
            param: "model",
            type: "permission_error",
          },
        },
        403
      );
    }

    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const sql = getDb();
    const { weekStartStr } = getWeekData();
    const usageResult = await sql`
      SELECT tokens_used FROM weekly_usage
      WHERE user_id = ${userId}::text AND week_start = ${weekStartStr}
      LIMIT 1
    `;
    const currentUsage = usageResult[0]?.tokens_used || 0;
    const limit = TIER_LIMITS[String(userPlan || "Free")] || TIER_LIMITS["Free"];

    if (currentUsage >= limit) {
      return c.json({ error: "Votre limite hebdomadaire est épuisée. Quota atteint." }, 429);
    }

    const keyRows = await sql`
      SELECT api_key FROM mprojects_api_keys WHERE user_id = ${userId}::text LIMIT 1
    `;
    const apiKey = keyRows.length > 0 ? keyRows[0].api_key : Deno.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      return c.json({ error: "Clé fournisseur manquante." }, 500);
    }

    try {
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${userId}::text, ${weekStartStr}, 1)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
      `;
    } catch(e) {}

    // Google payload is different, we send it to OpenRouter's endpoint.
    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.val.run",
          "X-Title": "mAI Public API",
        },
        method: "POST",
      }
    );

    return new Response(openRouterRes.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          openRouterRes.headers.get("Content-Type") || "application/json",
      },
      status: openRouterRes.status,
    });
  } catch {
    return c.json({ error: "Failed to process Google request." }, 500);
  }
});

// NOUVELLES ROUTES PROJETS
app.get("/v1/projects", async (c) => {
  const staticProjects = [
    {
      category: "Web Application",
      created_at: "2026-08-01T00:00:00.000Z",
      description:
        "Application d'IA en ligne web directement et simplement pour discuter avec l'IA mAI.",
      features: ["Chat Web", "Interface fluide", "Streaming en direct"],
      id: "proj_web",
      is_public: true,
      label: "Alpha",
      name: "Web",
      project_id: "web",
      repository: "https://github.com/mDevsLabs/Web",
      status: "alpha",
      version: "0.1.0",
    },
    {
      category: "Extensions",
      created_at: "2026-08-05T00:00:00.000Z",
      description:
        "Ensemble d'extensions pour diverses applications pour discuter avec mAI directement (navigateur, VS Code...).",
      features: ["Extension navigateur", "Extension VS Code", "Accès contextuel"],
      id: "proj_pulse",
      is_public: true,
      label: "Bêta",
      name: "Pulse",
      project_id: "pulse",
      repository: "https://github.com/mDevsLabs/Pulse",
      status: "beta",
      version: "0.2.0",
    },
    {
      category: "Developer Tools",
      created_at: "2026-08-10T00:00:00.000Z",
      description:
        "Discussions et séances de codage dans le terminal CLI via mAI.",
      features: [
        "Terminal interactif",
        "Génération de code",
        "Workflows développeur",
      ],
      id: "proj_cli",
      is_public: true,
      label: "Bêta",
      name: "CLI",
      project_id: "cli",
      repository: "https://github.com/mDevsLabs/CLI",
      status: "beta",
      version: "0.5.0",
    },
    {
      category: "Productivity",
      created_at: "2026-08-12T00:00:00.000Z",
      description:
        "Création de documents et présentations avec mAI.",
      features: ["Génération de documents", "Présentations interactives", "Export multi-format"],
      id: "proj_office",
      is_public: true,
      label: "Bêta",
      name: "Office",
      project_id: "office",
      repository: "https://github.com/mDevsLabs/Office",
      status: "beta",
      version: "0.1.0",
    },
    {
      category: "Cloud & Storage",
      created_at: "2026-08-15T00:00:00.000Z",
      description:
        "Stockage cloud de documents et intégration d'mAI pour des résumés.",
      features: ["Stockage sécurisé", "Résumés automatiques", "Indexation de documents"],
      id: "proj_cloud",
      is_public: true,
      label: "Réflexion",
      name: "Cloud",
      project_id: "cloud",
      repository: "",
      status: "conception",
      version: "0.0.1",
    },
    {
      category: "Search Engine",
      created_at: "2026-02-01T00:00:00.000Z",
      description:
        "Moteur de recherche sémantique et d'indexation vectorielle ultra-rapide.",
      features: ["Indexation hybride", "Recherche locale"],
      id: "proj_msearch",
      is_public: true,
      label: "Archivé",
      name: "mSearch",
      project_id: "msearch",
      repository: "https://github.com/mDevsLabs/mSearch",
      status: "archived",
      version: "1.0.3",
    },
    {
      category: "API Gateway",
      created_at: "2026-03-01T00:00:00.000Z",
      description:
        "Hub universel d'agrégation et de routage intelligent d'API et modèles LLM.",
      features: ["Load balancing", "Multi-fournisseurs"],
      id: "proj_openprovider",
      is_public: true,
      label: "Archivé",
      name: "OpenProvider",
      project_id: "openprovider",
      repository: "https://github.com/mDevsLabs/OpenProvider",
      status: "archived",
      version: "0.5.0",
    },
    {
      category: "Games",
      created_at: "2026-03-15T00:00:00.000Z",
      description: "Jeu vidéo du style Block Blast",
      features: ["Video game", "Assembler"],
      id: "proj_snob",
      is_public: true,
      label: "Archivé",
      name: "Snob",
      project_id: "snob",
      repository: "https://github.com/mDevsLabs/Snob",
      status: "archived",
      version: "1.0.1",
    },
    {
      category: "AI Suite",
      created_at: "2026-01-15T00:00:00.000Z",
      description:
        "Ancienne interface web de mAI.",
      features: ["Chat Completions", "Embeddings"],
      id: "proj_mai_legacy",
      is_public: true,
      label: "Archivé",
      name: "mAI Web (Legacy)",
      project_id: "mai",
      repository: "https://github.com/mDevsLabs/mAI",
      status: "archived",
      version: "2.4.0",
    },
  ];

  try {
    const sql = getDb();
    const userId = c.get("userId");
    const dbProjects =
      await sql`SELECT * FROM mprojects_projects WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`;
    return c.json({ data: [...staticProjects, ...dbProjects], object: "list" });
  } catch (_err) {
    return c.json({ data: staticProjects, object: "list" });
  }
});

app.post("/v1/projects", async (c) => {
  const sql = getDb();
  const userId = c.get("userId");
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ error: "Le nom du projet est obligatoire." }, 400);
  }

  const projectId = "proj-" + Math.random().toString(36).substr(2, 9);

  await sql`
    INSERT INTO mprojects_projects (user_id, project_id, name, description, is_public)
    VALUES (${userId}, ${projectId}, ${body.name}, ${body.description || ""}, ${body.isPublic || false})
  `;

  return c.json({ name: body.name, project_id: projectId, success: true });
});

app.get("/v1/projects/:id", async (c) => {
  const projectId = c.req.param("id").toLowerCase();

  const staticProjects: Record<string, any> = {
    web: {
      category: "Web Application",
      created_at: "2026-08-01T00:00:00.000Z",
      description:
        "Application d'IA en ligne web directement et simplement pour discuter avec l'IA mAI.",
      is_public: true,
      label: "Alpha",
      name: "Web",
      project_id: "web",
      repository: "https://github.com/mDevsLabs/Web",
      status: "alpha",
    },
    pulse: {
      category: "Extensions",
      created_at: "2026-08-05T00:00:00.000Z",
      description:
        "Ensemble d'extensions pour diverses applications pour discuter avec mAI directement (navigateur, VS Code...).",
      is_public: true,
      label: "Bêta",
      name: "Pulse",
      project_id: "pulse",
      repository: "https://github.com/mDevsLabs/Pulse",
      status: "beta",
    },
    cli: {
      category: "Developer Tools",
      created_at: "2026-08-10T00:00:00.000Z",
      description:
        "Discussions et séances de codage dans le terminal CLI via mAI.",
      is_public: true,
      label: "Bêta",
      name: "CLI",
      project_id: "cli",
      repository: "https://github.com/mDevsLabs/CLI",
      status: "beta",
    },
    office: {
      category: "Productivity",
      created_at: "2026-08-12T00:00:00.000Z",
      description:
        "Création de documents et présentations avec mAI.",
      is_public: true,
      label: "Bêta",
      name: "Office",
      project_id: "office",
      repository: "https://github.com/mDevsLabs/Office",
      status: "beta",
    },
    cloud: {
      category: "Cloud & Storage",
      created_at: "2026-08-15T00:00:00.000Z",
      description:
        "Stockage cloud de documents et intégration d'mAI pour des résumés.",
      is_public: true,
      label: "Réflexion",
      name: "Cloud",
      project_id: "cloud",
      repository: "",
      status: "conception",
    },
    mai: {
      category: "AI Suite",
      created_at: "2026-01-15T00:00:00.000Z",
      description:
        "Ancienne interface web de mAI.",
      is_public: true,
      label: "Archivé",
      name: "mAI Web (Legacy)",
      project_id: "mai",
      repository: "https://github.com/mDevsLabs/mAI",
      status: "archived",
    },
    maicli: {
      category: "CLI Tool",
      created_at: "2026-02-10T00:00:00.000Z",
      description:
        "Interface en ligne de commande professionnelle pour l'écosystème mAI.",
      is_public: true,
      label: "Archivé",
      name: "mAI CLI (Legacy)",
      project_id: "maicli",
      repository: "https://github.com/mDevsLabs/mAI-CLI",
      status: "archived",
    },
    msearch: {
      category: "Search Engine",
      created_at: "2026-02-01T00:00:00.000Z",
      description:
        "Moteur de recherche sémantique et d'indexation vectorielle.",
      is_public: true,
      label: "Archivé",
      name: "mSearch",
      project_id: "msearch",
      repository: "https://github.com/mDevsLabs/mSearch",
      status: "archived",
    },
    openprovider: {
      category: "API Gateway",
      created_at: "2026-03-01T00:00:00.000Z",
      description:
        "Hub universel d'agrégation et de routage d'API et modèles LLM.",
      is_public: true,
      label: "Archivé",
      name: "OpenProvider",
      project_id: "openprovider",
      repository: "https://github.com/mDevsLabs/OpenProvider",
      status: "archived",
    },
    snob: {
      category: "Games",
      created_at: "2026-03-15T00:00:00.000Z",
      description:
        "Jeu vidéo du style Block Blast.",
      is_public: true,
      label: "Archivé",
      name: "Snob",
      project_id: "snob",
      repository: "https://github.com/mDevsLabs/Snob",
      status: "archived",
    },
  };

  if (staticProjects[projectId]) {
    return c.json({ project: staticProjects[projectId] });
  }

  const sql = getDb();
  const userId = c.get("userId");
  const projects = await sql`
    SELECT * FROM mprojects_projects 
    WHERE (user_id = ${userId} OR is_public = TRUE) AND LOWER(project_id) = ${projectId} 
    LIMIT 1
  `;

  if (projects.length === 0) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ project: projects[0] });
});

app.put("/v1/projects/:id", async (c) => {
  const sql = getDb();
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const body = await c.req.json();

  const existing =
    await sql`SELECT id FROM mprojects_projects WHERE user_id = ${userId} AND project_id = ${projectId} LIMIT 1`;
  if (existing.length === 0) {
    return c.json({ error: "Projet non trouvé ou non autorisé." }, 404);
  }

  const name = body.name;
  const description = body.description;
  const isPublic = body.isPublic;

  await sql`
    UPDATE mprojects_projects
    SET name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        is_public = COALESCE(${isPublic}, is_public),
        updated_at = NOW()
    WHERE user_id = ${userId} AND project_id = ${projectId}
  `;

  return c.json({
    message: "Projet mis à jour.",
    project_id: projectId,
    success: true,
  });
});

app.delete("/v1/projects/:id", async (c) => {
  const sql = getDb();
  const userId = c.get("userId");
  const projectId = c.req.param("id");

  const result = await sql`
    DELETE FROM mprojects_projects 
    WHERE user_id = ${userId} AND project_id = ${projectId}
    RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: "Projet non trouvé ou déjà supprimé." }, 404);
  }

  return c.json({ message: "Projet supprimé avec succès.", success: true });
});

app.get("/v1/projects/:id/stats", async (c) => {
  const sql = getDb();
  const userId = c.get("userId");
  const projectId = c.req.param("id");

  const projects =
    await sql`SELECT id, name, created_at FROM mprojects_projects WHERE user_id = ${userId} AND project_id = ${projectId} LIMIT 1`;
  if (projects.length === 0) {
    return c.json({ error: "Projet non trouvé." }, 404);
  }

  return c.json({
    active_deployments: 1,
    name: projects[0].name,
    project_id: projectId,
    requests_count: Math.floor(Math.random() * 500) + 12,
    status: "healthy",
    uptime_percentage: 99.98,
  });
});

app.get("/api-keys", async (c) => {
  try {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const sql = getDb();
    const keys = await sql`
      SELECT api_key, plan, request_count, created_at, last_used_at 
      FROM mprojects_api_keys 
      WHERE user_id = ${userId}::text
    `;
    
    return c.json({ success: true, keys });
  } catch (err: any) {
    console.error("Erreur API Keys:", err);
    return c.json({ error: "Erreur serveur." }, 500);
  }
});

app.get("/v1/devices", async (c) => {
  const userId = c.get("userId");
  const token = extractToken(c.req.raw);
  const sql = getDb();

  const existing = await sql`SELECT id FROM connected_devices WHERE token = ${token}`;
  if (existing.length === 0) {
    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "Inconnue";
    const { os, device_model, device_version, device_name } = parseUserAgent(userAgent);
    try {
      await sql`
        INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name)
        VALUES (${userId}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name})
      `;
    } catch (err) {
      console.error("Auto-insert device error:", err);
    }
  } else {
    try {
      await sql`UPDATE connected_devices SET last_active = NOW() WHERE token = ${token}`;
    } catch (err) {}
  }

  const rawDevices = await sql`
    SELECT id, token, os, device_model, device_version, ip_address, device_name, last_active, created_at 
    FROM connected_devices 
    WHERE user_id = ${userId}::text 
    ORDER BY last_active DESC
  `;

  const devices = rawDevices.map((d: any) => ({
    id: d.id,
    os: d.os,
    device_model: d.device_model,
    device_version: d.device_version || "",
    ip_address: d.ip_address,
    device_name: d.device_name,
    last_active: d.last_active,
    created_at: d.created_at,
    is_current: d.token === token,
  }));

  return c.json({ success: true, devices });
});

app.delete("/v1/devices/others", async (c) => {
  const userId = c.get("userId");
  const token = extractToken(c.req.raw);
  const sql = getDb();

  const otherDevices = await sql`
    SELECT token FROM connected_devices 
    WHERE user_id = ${userId}::text AND token != ${token}
  `;

  for (const row of otherDevices) {
    if (row.token) {
      try {
        await sqlite.execute({
          args: [row.token],
          sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
        });
      } catch (_e) {}
    }
  }

  await sql`
    DELETE FROM connected_devices 
    WHERE user_id = ${userId}::text AND token != ${token}
  `;

  return c.json({ success: true, message: "Tous les autres appareils ont été déconnectés." });
});

app.delete("/v1/devices/all", async (c) => {
  const userId = c.get("userId");
  const sql = getDb();

  const allDevices = await sql`
    SELECT token FROM connected_devices 
    WHERE user_id = ${userId}::text
  `;

  for (const row of allDevices) {
    if (row.token) {
      try {
        await sqlite.execute({
          args: [row.token],
          sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
        });
      } catch (_e) {}
    }
  }

  await sql`
    DELETE FROM connected_devices 
    WHERE user_id = ${userId}::text
  `;

  return c.json({ success: true, message: "Tous les appareils ont été déconnectés." });
});

app.put("/v1/devices/:id", async (c) => {
  const userId = c.get("userId");
  const deviceId = c.req.param("id");
  const { device_name } = await c.req.json();
  const sql = getDb();
  await sql`UPDATE connected_devices SET device_name = ${device_name} WHERE id = ${deviceId} AND user_id = ${userId}::text`;
  return c.json({ success: true });
});

app.delete("/v1/devices/:id", async (c) => {
  const userId = c.get("userId");
  const deviceId = c.req.param("id");
  const sql = getDb();
  
  const devices = await sql`SELECT token FROM connected_devices WHERE id = ${deviceId} AND user_id = ${userId}::text LIMIT 1`;
  if (devices.length > 0) {
    const token = devices[0].token;
    if (token) {
      await sqlite.execute({
        args: [token],
        sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
      });
    }
    await sql`DELETE FROM connected_devices WHERE id = ${deviceId}`;
  }
  return c.json({ success: true });
});

export default app.fetch;
