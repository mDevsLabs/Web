import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { checkPasswordPolicy } from "@/auth-password-policy";
import { decideResend, normalizeResendAction } from "@/auth-resend-policy";
import {
  generateVerificationCode,
  regenerateVerificationCode,
  verifyVerificationCode,
} from "@/lib/auth/verification";
import { dbReady, getRawClient } from "@/lib/db/queries/connection";
import { sendVerificationEmail } from "@/lib/site/email";

export type AuthActionResult =
  | {
      success: true;
      email?: string;
      status?: string;
      token?: string;
      tier?: string;
    }
  | { success: false; error: string; code?: string };

function getJwtSecret(): Uint8Array {
  const secret = process.env.MAI_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("MAI_JWT_SECRET manquant.");
  }
  return new TextEncoder().encode(secret);
}

export async function signUserToken(
  payload: Record<string, unknown>
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export function parseUserAgent(ua: string) {
  const uaLower = (ua || "").toLowerCase();
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
  } else if (
    uaLower.includes("windows nt 10.0") ||
    uaLower.includes("windows 11") ||
    uaLower.includes("windows 10")
  ) {
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
  } else if (uaLower.includes("firefox")) {
    model = "Firefox";
    const m = ua.match(/Firefox\/(\d+(\.\d+)?)/);
    if (m) version = m[1];
  } else if (uaLower.includes("chrome") && !uaLower.includes("edg")) {
    model = "Chrome";
    const m = ua.match(/Chrome\/(\d+(\.\d+)?)/);
    if (m) version = m[1];
  } else if (uaLower.includes("edg")) {
    model = "Edge";
    const m = ua.match(/Edg\/(\d+(\.\d+)?)/);
    if (m) version = m[1];
  } else if (uaLower.includes("safari") && !uaLower.includes("chrome")) {
    model = "Safari";
    const m = ua.match(/Version\/(\d+(\.\d+)?)/);
    if (m) version = m[1];
  }

  return {
    device_model: model,
    device_name: `${osVersion} · ${model}`,
    device_version: version,
    os,
  };
}

export async function recordConnectedDevice(params: {
  ip: string;
  token: string;
  userAgent: string;
  userId: string;
}): Promise<void> {
  try {
    await dbReady();
    const sql = getRawClient();
    if (!sql) return;

    const existing = await sql`
      SELECT id FROM connected_devices WHERE token = ${params.token} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      const { os, device_model, device_version, device_name } = parseUserAgent(
        params.userAgent || ""
      );
      await sql`
        INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name, last_active)
        VALUES (${params.userId}::text, ${params.token}, ${os}, ${device_model}, ${device_version}, ${params.ip || "Inconnue"}, ${device_name}, NOW())
      `.catch(() => {});
    } else {
      await sql`
        UPDATE connected_devices SET last_active = NOW() WHERE token = ${params.token}
      `.catch(() => {});
    }
  } catch (err) {
    console.warn("[server-auth] Erreur enregistrement connected_device:", err);
  }
}

/**
 * 1. Connexion : validation des identifiants et envoi du code OTP
 */
export async function loginUser(params: {
  identifier: string;
  password?: string;
}): Promise<AuthActionResult> {
  const cleanIdentifier = (params.identifier || "").trim().toLowerCase();
  const password = params.password || "";

  if (!cleanIdentifier || !password) {
    return {
      code: "invalid_credentials",
      error: "Identifiant et mot de passe requis.",
      success: false,
    };
  }

  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return {
      code: "service_unavailable",
      error: "Base de données indisponible.",
      success: false,
    };
  }

  const rows = await sql<
    {
      email: string;
      id: string;
      is_blocked?: boolean;
      password?: string;
      tier?: string;
      username: string;
    }[]
  >`
    SELECT id::text, email, username, password, tier, is_blocked
    FROM users
    WHERE LOWER(email) = ${cleanIdentifier} OR LOWER(username) = ${cleanIdentifier}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      code: "invalid_credentials",
      error: "Identifiants invalides.",
      success: false,
    };
  }

  const user = rows[0];
  if (user.is_blocked) {
    return {
      code: "account_blocked",
      error: "Ce compte a été suspendu.",
      success: false,
    };
  }

  const validPassword = await bcrypt.compare(password, user.password || "");
  if (!validPassword) {
    return {
      code: "invalid_credentials",
      error: "Identifiants invalides.",
      success: false,
    };
  }

  const code = await generateVerificationCode(user.email, "login");
  await sendVerificationEmail(user.email, code, "login");

  return {
    email: user.email,
    status: "verification_required",
    success: true,
  };
}

/**
 * 2. Validation OTP Connexion et émission du jeton de session JWT
 */
export async function verifyLoginUser(params: {
  code: string;
  email: string;
  ip?: string;
  userAgent?: string;
}): Promise<AuthActionResult> {
  const cleanEmail = (params.email || "").trim().toLowerCase();
  const cleanCode = (params.code || "").trim();

  if (!cleanEmail || !cleanCode) {
    return {
      code: "invalid_request",
      error: "E-mail et code requis.",
      success: false,
    };
  }

  const isValid = await verifyVerificationCode(cleanEmail, cleanCode, "login");
  if (!isValid) {
    return {
      code: "invalid_code",
      error: "Code invalide ou expiré.",
      success: false,
    };
  }

  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return {
      code: "service_unavailable",
      error: "Base de données indisponible.",
      success: false,
    };
  }

  const rows = await sql<
    {
      avatar_url?: string;
      email: string;
      id: string;
      is_blocked?: boolean;
      phone?: string;
      tier?: string;
      username: string;
    }[]
  >`
    SELECT id::text, email, username, tier, phone, avatar_url, is_blocked
    FROM users
    WHERE LOWER(email) = ${cleanEmail}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      code: "user_not_found",
      error: "Compte introuvable.",
      success: false,
    };
  }

  const user = rows[0];
  if (user.is_blocked) {
    return {
      code: "account_blocked",
      error: "Ce compte a été suspendu.",
      success: false,
    };
  }

  const tier = user.tier || "Free";
  const token = await signUserToken({
    avatarUrl: user.avatar_url || null,
    email: user.email,
    id: user.id,
    phone: user.phone || "",
    sub: user.id,
    tier,
    username: user.username,
  });

  await recordConnectedDevice({
    ip: params.ip || "Inconnue",
    token,
    userAgent: params.userAgent || "",
    userId: user.id,
  });

  return {
    success: true,
    tier,
    token,
  };
}

/**
 * 3. Inscription : contrôle des champs et envoi de l'OTP
 */
export async function registerUser(params: {
  email: string;
  password?: string;
  username: string;
}): Promise<AuthActionResult> {
  const cleanEmail = (params.email || "").trim().toLowerCase();
  const cleanUsername = (params.username || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const password = params.password || "";

  if (!cleanEmail || !cleanUsername || !password) {
    return {
      code: "invalid_request",
      error: "Tous les champs sont requis.",
      success: false,
    };
  }

  const passwordError = checkPasswordPolicy(password);
  if (passwordError) {
    return {
      code: "invalid_password",
      error: passwordError,
      success: false,
    };
  }

  if (!PROFILE_USERNAME_PATTERN.test(cleanUsername)) {
    return {
      code: "invalid_username",
      error:
        "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).",
      success: false,
    };
  }

  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return {
      code: "service_unavailable",
      error: "Base de données indisponible.",
      success: false,
    };
  }

  const existing = await sql`
    SELECT id FROM users
    WHERE LOWER(email) = ${cleanEmail} OR LOWER(username) = ${cleanUsername}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return {
      code: "already_exists",
      error: "Email ou nom d'utilisateur déjà pris.",
      success: false,
    };
  }

  const code = await generateVerificationCode(cleanEmail, "register");
  await sendVerificationEmail(cleanEmail, code, "register");

  return {
    email: cleanEmail,
    status: "verification_required",
    success: true,
  };
}

/**
 * 4. Validation OTP Inscription, création du compte et émission du JWT
 */
export async function verifyRegisterUser(params: {
  code: string;
  email: string;
  ip?: string;
  password?: string;
  userAgent?: string;
  username: string;
}): Promise<AuthActionResult> {
  const cleanEmail = (params.email || "").trim().toLowerCase();
  const cleanUsername = (params.username || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const cleanCode = (params.code || "").trim();
  const password = params.password || "";

  if (!cleanEmail || !cleanUsername || !cleanCode || !password) {
    return {
      code: "invalid_request",
      error: "Champs manquants.",
      success: false,
    };
  }

  const passwordError = checkPasswordPolicy(password);
  if (passwordError) {
    return {
      code: "invalid_password",
      error: passwordError,
      success: false,
    };
  }

  const isValid = await verifyVerificationCode(
    cleanEmail,
    cleanCode,
    "register"
  );
  if (!isValid) {
    return {
      code: "invalid_code",
      error: "Code invalide ou expiré.",
      success: false,
    };
  }

  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return {
      code: "service_unavailable",
      error: "Base de données indisponible.",
      success: false,
    };
  }

  // Vérifier à nouveau la disponibilité avant l'insertion
  const conflict = await sql`
    SELECT id FROM users
    WHERE LOWER(email) = ${cleanEmail} OR LOWER(username) = ${cleanUsername}
    LIMIT 1
  `;
  if (conflict.length > 0) {
    return {
      code: "already_exists",
      error: "Email ou nom d'utilisateur déjà pris.",
      success: false,
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const inserted = await sql<{ id: string }[]>`
    INSERT INTO users (email, username, password, tier, created_at, updated_at)
    VALUES (${cleanEmail}, ${cleanUsername}, ${hashedPassword}, 'Free', NOW(), NOW())
    RETURNING id::text
  `;

  const newUserId = inserted[0]?.id;
  if (!newUserId) {
    return {
      code: "database_error",
      error: "Impossible de créer le compte.",
      success: false,
    };
  }

  const token = await signUserToken({
    avatarUrl: null,
    email: cleanEmail,
    id: newUserId,
    phone: "",
    sub: newUserId,
    tier: "Free",
    username: cleanUsername,
  });

  await recordConnectedDevice({
    ip: params.ip || "Inconnue",
    token,
    userAgent: params.userAgent || "",
    userId: newUserId,
  });

  return {
    success: true,
    tier: "Free",
    token,
  };
}

/**
 * 5. Renvoi d'un code OTP existant
 */
export async function resendVerificationCodeUser(params: {
  action: string;
  email: string;
}): Promise<AuthActionResult> {
  const cleanEmail = (params.email || "").trim().toLowerCase();
  const normalizedAction = normalizeResendAction(params.action);

  if (!cleanEmail || !normalizedAction) {
    return {
      code: "invalid_request",
      error: "E-mail ou action invalide.",
      success: false,
    };
  }

  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return {
      code: "service_unavailable",
      error: "Base de données indisponible.",
      success: false,
    };
  }

  const pending = await sql<{ attempts: number; expires_at: Date }[]>`
    SELECT attempts, expires_at FROM verification_codes
    WHERE email = ${cleanEmail} AND action = ${normalizedAction}
    LIMIT 1
  `;

  const row = pending[0];
  const decision = decideResend(
    row
      ? {
          attempts: Number(row.attempts || 0),
          expiresAt: new Date(row.expires_at).getTime(),
        }
      : null,
    5
  );

  if (!decision.allowed) {
    if (decision.reason === "too_many_attempts") {
      return {
        code: "too_many_attempts",
        error: "Trop de tentatives. Recommencez la demande.",
        success: false,
      };
    }
    return {
      code: "no_pending_request",
      error: "Aucune demande en cours ou délai expiré. Recommencez la demande.",
      success: false,
    };
  }

  // Anti-spam 1 minute
  if (row) {
    const expiresAt = new Date(row.expires_at).getTime();
    const diffMinutes = (expiresAt - Date.now()) / 60_000;
    if (diffMinutes > 9) {
      return {
        code: "rate_limited",
        error: "Veuillez patienter 1 minute avant de renvoyer un code.",
        success: false,
      };
    }
  }

  const regen = await regenerateVerificationCode(cleanEmail, normalizedAction);
  if (!regen) {
    return {
      code: "no_pending_request",
      error: "Demande expirée. Recommencez.",
      success: false,
    };
  }

  await sendVerificationEmail(cleanEmail, regen.code, normalizedAction);
  return { success: true };
}

const PROFILE_USERNAME_PATTERN = /^[a-z0-9_]{2,30}$/;
const PROFILE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEADING_AT_PATTERN = /^@/;
const NEW_EMAIL_ACTION = "verify_new_email";

/**
 * Met à jour le profil de l'utilisateur directement dans Neon.
 *
 * Toutes les validations passent AVANT la moindre écriture, puis un seul
 * UPDATE est émis : une validation tardive en échec ne laisse plus un profil
 * à moitié modifié. Un changement d'e-mail n'est jamais appliqué ici : il passe
 * par un code envoyé à la nouvelle adresse (cf. `confirmUserEmailChange`).
 */
export async function updateUserProfile(params: {
  userId: string;
  body: {
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    currentPassword?: string;
    newsletter?: boolean;
    notify_limits?: boolean;
    auto_logout_minutes?: number;
  };
}): Promise<AuthActionResult> {
  await dbReady();
  const sql = getRawClient();
  if (!sql) return { error: "Base de données indisponible.", success: false };

  const {
    username,
    email,
    phone,
    password,
    currentPassword,
    newsletter,
    notify_limits: notifyLimits,
    auto_logout_minutes: autoLogoutMinutes,
  } = params.body;

  if (!currentPassword) {
    return {
      error:
        "Le mot de passe actuel est obligatoire pour modifier vos informations.",
      success: false,
    };
  }

  const currentUser = await sql<
    { email: string | null; password_hash: string | null }[]
  >`
    SELECT email, password_hash FROM users WHERE id::text = ${params.userId}::text LIMIT 1
  `;
  if (currentUser.length === 0) {
    return { error: "Utilisateur introuvable.", success: false };
  }

  // Un compte sans mot de passe local (hash NULL) faisait planter bcrypt.
  const storedHash = currentUser[0].password_hash;
  const passMatch = storedHash
    ? await bcrypt.compare(currentPassword, storedHash)
    : false;
  if (!passMatch) {
    return { error: "Le mot de passe actuel est incorrect.", success: false };
  }

  // Valeurs validées, écrites en une seule fois en fin de fonction.
  let cleanUsername: string | null = null;
  let pendingEmail: string | null = null;
  let newHash: string | null = null;
  const phoneProvided = phone !== undefined;
  const cleanPhone = phone?.trim() || null;
  if (cleanPhone && cleanPhone.length > 50) {
    return { error: "Numéro de téléphone invalide.", success: false };
  }

  if (username?.trim()) {
    cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(LEADING_AT_PATTERN, "");
    if (!PROFILE_USERNAME_PATTERN.test(cleanUsername)) {
      return {
        error:
          "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).",
        success: false,
      };
    }
    const existing = await sql`
      SELECT id FROM users WHERE LOWER(username) = ${cleanUsername} AND id::text != ${params.userId}::text LIMIT 1
    `;
    if (existing.length > 0) {
      return {
        error: "Ce nom d'utilisateur est déjà pris par un autre compte.",
        success: false,
      };
    }
  }

  if (email?.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} AND id::text != ${params.userId}::text LIMIT 1
    `;
    if (existing.length > 0) {
      return {
        error: "Cette adresse email est déjà utilisée par un autre compte.",
        success: false,
      };
    }
    // Jamais appliqué ici : la nouvelle adresse doit d'abord être vérifiée.
    const currentEmail = (currentUser[0].email || "").trim().toLowerCase();
    if (cleanEmail !== currentEmail) {
      if (cleanEmail.length > 320 || !PROFILE_EMAIL_PATTERN.test(cleanEmail)) {
        return { error: "Adresse email invalide.", success: false };
      }
      pendingEmail = cleanEmail;
    }
  }

  if (phone !== undefined) {
    if (cleanPhone) {
      const existing = await sql`
 SELECT id FROM users WHERE phone = ${cleanPhone} AND id::text != ${params.userId}::text LIMIT 1
      `;
      if (existing.length > 0) {
        return {
          error: "Ce numéro de téléphone est déjà utilisé par un autre compte.",
          success: false,
        };
      }
    }
  }

  if (password?.trim()) {
    const policyError = checkPasswordPolicy(password);
    if (policyError) {
      return {
        error: policyError,
        success: false,
      };
    }
    newHash = await bcrypt.hash(password, 10);
  }

  await sql`
    UPDATE users SET
      username = COALESCE(${cleanUsername}::text, username),
      phone = CASE WHEN ${phoneProvided}::boolean THEN ${cleanPhone}::varchar ELSE phone END,
      newsletter = COALESCE(${newsletter ?? null}::boolean, newsletter),
      notify_limits = COALESCE(${notifyLimits ?? null}::boolean, notify_limits),
      password_hash = COALESCE(${newHash}::text, password_hash)
    WHERE id::text = ${params.userId}::text
  `;

  if (autoLogoutMinutes !== undefined) {
    // Colonne absente du DDL de réparation : écriture tolérante, isolée du
    // reste pour qu'un schéma ancien ne fasse pas échouer tout le profil.
    await sql`
      UPDATE users SET auto_logout_minutes = ${autoLogoutMinutes} WHERE id::text = ${params.userId}::text
    `.catch((err: unknown) => {
      console.warn(
        "[auth] auto_logout_minutes non enregistré:",
        err instanceof Error ? err.message : err
      );
    });
  }

  if (pendingEmail) {
    try {
      const code = await generateVerificationCode(
        pendingEmail,
        NEW_EMAIL_ACTION
      );
      await sendVerificationEmail(pendingEmail, code, NEW_EMAIL_ACTION);
    } catch (err) {
      console.warn(
        "[auth] envoi du code de changement d'e-mail impossible:",
        err instanceof Error ? err.message : err
      );
      return {
        error:
          "Profil enregistré, mais le code de vérification de la nouvelle adresse n'a pas pu être envoyé. Réessayez.",
        success: false,
      };
    }
    return {
      email: pendingEmail,
      status: "email_verification_required",
      success: true,
    };
  }

  return { success: true };
}

/**
 * Applique un changement d'e-mail une fois validé le code reçu sur la nouvelle
 * adresse. Le code est consommé de façon atomique, puis l'unicité est
 * recontrôlée : l'adresse a pu être prise entre la demande et la confirmation.
 */
export async function confirmUserEmailChange(params: {
  code: string;
  email: string;
  userId: string;
}): Promise<AuthActionResult> {
  await dbReady();
  const sql = getRawClient();
  if (!sql) {
    return { error: "Base de données indisponible.", success: false };
  }

  const cleanEmail = params.email.trim().toLowerCase();
  if (!(cleanEmail && PROFILE_EMAIL_PATTERN.test(cleanEmail))) {
    return { error: "Adresse email invalide.", success: false };
  }

  const accepted = await verifyVerificationCode(
    cleanEmail,
    params.code,
    NEW_EMAIL_ACTION
  );
  if (!accepted) {
    return {
      code: "invalid_code",
      error: "Code de vérification invalide ou expiré.",
      success: false,
    };
  }

  const existing = await sql`
    SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} AND id::text != ${params.userId}::text LIMIT 1
  `;
  if (existing.length > 0) {
    return {
      error: "Cette adresse email est déjà utilisée par un autre compte.",
      success: false,
    };
  }

  const updated = await sql<{ id: string }[]>`
    UPDATE users SET email = ${cleanEmail} WHERE id::text = ${params.userId}::text RETURNING id::text AS id
  `;
  if (updated.length === 0) {
    return { error: "Utilisateur introuvable.", success: false };
  }

  return { email: cleanEmail, success: true };
}

/**
 * Définit l'URL de l'avatar d'un utilisateur dans Neon.
 */
export async function setUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<boolean> {
  await dbReady();
  const sql = getRawClient();
  if (!sql) return false;

  try {
    await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id::text = ${userId}::text`;
    return true;
  } catch {
    return false;
  }
}
