import bcrypt from "npm:bcryptjs";
import type { Hono } from "npm:hono@4";
import {
  BCRYPT_ROUNDS,
  blacklistToken,
  clientIp,
  extractToken,
  generateVerificationCode,
  getDb,
  getEnv,
  parseUserAgent,
  rateLimit,
  signToken,
  sqlite,
  verifyToken,
  verifyVerificationCode,
} from "./config.ts";
import { sendVerificationEmail } from "./email.ts";
import { createRegisterMulti } from "./vibe-common.ts";

export function registerAuthRoutes(app: Hono) {
  const registerMulti = createRegisterMulti(app);

  const OTP_WINDOW_MS = 10 * 60_000;
  const OTP_ATTEMPT_LIMIT = 5;
  const OTP_TARGET_ATTEMPT_LIMIT = 10;
  const OTP_IP_ATTEMPT_LIMIT = 50;
  const OTP_RESEND_LIMIT = 3;
  const OTP_TARGET_RESEND_LIMIT = 5;
  const OTP_IP_RESEND_LIMIT = 20;
  const OTP_ISSUE_TARGET_LIMIT = 5;
  const OTP_ISSUE_IP_LIMIT = 30;
  const OTP_ACTIONS = new Set(["register", "login", "verify_new_email", "delete_account"]);
  const OTP_RATE_LIMIT_MESSAGE = "Trop de tentatives. Réessayez plus tard.";

  function otpTarget(value: unknown): string {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 160);
  }

  function allowOtpAttempt(c: any, scope: string, target: unknown): boolean {
    const ip = clientIp(c);
    const normalizedTarget = otpTarget(target) || "unknown";
    return (
      rateLimit(`otp:attempt:${scope}:${ip}:${normalizedTarget}`, OTP_ATTEMPT_LIMIT, OTP_WINDOW_MS) &&
      rateLimit(`otp:attempt-target:${scope}:${normalizedTarget}`, OTP_TARGET_ATTEMPT_LIMIT, OTP_WINDOW_MS) &&
      rateLimit(`otp:attempt-ip:${scope}:${ip}`, OTP_IP_ATTEMPT_LIMIT, OTP_WINDOW_MS)
    );
  }

  function allowOtpResend(c: any, action: string, target: unknown): boolean {
    const ip = clientIp(c);
    const normalizedTarget = otpTarget(target) || "unknown";
    return (
      rateLimit(`otp:resend:${action}:${ip}:${normalizedTarget}`, OTP_RESEND_LIMIT, OTP_WINDOW_MS) &&
      rateLimit(`otp:resend-target:${action}:${normalizedTarget}`, OTP_TARGET_RESEND_LIMIT, OTP_WINDOW_MS) &&
      rateLimit(`otp:resend-ip:${ip}`, OTP_IP_RESEND_LIMIT, OTP_WINDOW_MS)
    );
  }

  function allowOtpIssue(c: any, action: string, target: unknown): boolean {
    const ip = clientIp(c);
    const normalizedTarget = otpTarget(target) || "unknown";
    return (
      rateLimit(`otp:issue-target:${action}:${normalizedTarget}`, OTP_ISSUE_TARGET_LIMIT, OTP_WINDOW_MS) &&
      rateLimit(`otp:issue-ip:${action}:${ip}`, OTP_ISSUE_IP_LIMIT, OTP_WINDOW_MS)
    );
  }

  function logAuthServerError(scope: string): void {
    // Ne jamais renvoyer le message d'une exception SQL/JWT au client. Le
    // message détaillé reste dans les logs d'exécution de l'hôte, hors réponse.
    console.error(`[Auth] ${scope}`);
  }

  function maskApiKey(value: unknown): string {
    const key = String(value || "");
    if (key.length <= 8) return "********";
    return `${key.slice(0, 4)}…${key.slice(-4)}`;
  }

  // GET /register info endpoint (évite 404 lors des tests au navigateur)
  registerMulti("get", ["/register", "/v1/register", "/api/register", "/api/vibe/register"], (c) => {
    return c.json({
      service: "mAI Vibe Auth",
      endpoint: "/register",
      method: "POST",
      description: "Pour créer un compte, envoyez une requête HTTP POST avec { email, username, password } en JSON.",
    });
  });

  // POST /register
  registerMulti("post", ["/register", "/v1/register", "/api/register", "/api/vibe/register"], async (c) => {
    try {
      // Anti-abus : 5 inscriptions / IP / 15 min
      if (!rateLimit(`register:${clientIp(c)}`, 5, 15 * 60_000)) {
        return c.json({ error: "Trop de tentatives. Réessayez plus tard." }, 429);
      }
      const { email, username, password } = await c.req.json();
      if (!email || !username || !password) {
        return c.json({ error: "Champs manquants." }, 400);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanUsername = String(username).trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9_]{2,30}$/.test(cleanUsername)) {
        return c.json(
          { error: "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _)." },
          400
        );
      }

      const sql = getDb();
      const existing =
        await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} OR LOWER(username) = ${cleanUsername} LIMIT 1`;
      if (existing.length > 0) {
        return c.json({ error: "Email ou nom d'utilisateur déjà pris." }, 400);
      }

      if (!allowOtpIssue(c, "register", cleanEmail)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }
      const code = await generateVerificationCode(cleanEmail, "register");
      await sendVerificationEmail(cleanEmail, code, "register");

      return c.json({ email: cleanEmail, status: "verification_required", success: true });
    } catch {
      logAuthServerError("Register Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /verify-register
  registerMulti("post", ["/verify-register", "/v1/verify-register", "/api/verify-register", "/api/vibe/verify-register"], async (c) => {
    try {
      const { email, username, password, code } = await c.req.json();
      if (!email || !username || !password || !code) {
        return c.json({ error: "Champs manquants." }, 400);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanUsername = String(username).trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9_]{2,30}$/.test(cleanUsername)) {
        return c.json(
          { error: "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _)." },
          400
        );
      }

      if (!allowOtpAttempt(c, "register", cleanEmail)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }

      const isValid = await verifyVerificationCode(cleanEmail, code, "register");
      if (!isValid) {
        return c.json({ error: "Code invalide ou expiré." }, 400);
      }

      const sql = getDb();
      const existing =
        await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} OR LOWER(username) = ${cleanUsername} LIMIT 1`;
      if (existing.length > 0) {
        return c.json({ error: "Email ou nom d'utilisateur déjà pris." }, 400);
      }

      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const result = await sql`
        INSERT INTO users (email, username, password_hash, tier)
        VALUES (${cleanEmail}, ${cleanUsername}, ${hash}, 'Free')
        RETURNING id, tier
      `;

      const user = result[0];
      const token = await signToken({ sub: user.id, tier: user.tier });

      const userAgent = c.req.header("user-agent") || "";
      const ip = clientIp(c);
      const { os, device_model, device_version, device_name } =
        parseUserAgent(userAgent);

      try {
        await sql`
          INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name)
          VALUES (${user.id}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name})
        `;
      } catch {
        console.error("[Auth] device registration failed");
      }

      return c.json({ success: true, tier: user.tier, token });
    } catch {
      logAuthServerError("Verify Register Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // GET /login info endpoint (évite 404 lors des tests au navigateur)
  registerMulti("get", ["/login", "/v1/login", "/api/login", "/api/vibe/login"], (c) => {
    return c.json({
      service: "mAI Vibe Auth",
      endpoint: "/login",
      method: "POST",
      description: "Pour vous connecter, envoyez une requête HTTP POST avec { identifier, password } en JSON.",
    });
  });

  // POST /login
  registerMulti("post", ["/login", "/v1/login", "/api/login", "/api/vibe/login"], async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Requête JSON invalide (vérifiez les guillemets double de votre payload)." }, 400);
    }
    try {
      // Anti brute-force : 10 tentatives / IP / 5 min
      if (!rateLimit(`login:${clientIp(c)}`, 10, 5 * 60_000)) {
        return c.json({ error: "Trop de tentatives. Réessayez plus tard." }, 429);
      }
      const { email, password, identifier } = body;
      const loginId = (identifier || email || "").trim();
      if (!loginId || !password) {
        return c.json({ error: "Champs manquants." }, 400);
      }

      const cleanId = loginId.toLowerCase();
      const cleanUser = cleanId.replace(/^@/, "");

      const sql = getDb();
      const users =
        await sql`
          SELECT id, email, username, password_hash, tier, is_blocked 
          FROM users 
          WHERE LOWER(email) = ${cleanId} 
             OR LOWER(username) = ${cleanUser} 
             OR phone = ${loginId} 
          LIMIT 1
        `;
      if (users.length === 0) {
        return c.json({ 
          error: "Aucun compte n'a été trouvé avec cet identifiant ou cet e-mail. Avez-vous créé votre compte ?", 
          accountNotFound: true 
        }, 401);
      }

      const user = users[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return c.json({ 
          error: "Mot de passe incorrect pour ce compte. Veuillez vérifier votre saisie.", 
          invalidPassword: true 
        }, 401);
      }

      // Compte bloqué par un administrateur : refus explicite (403)
      if (user.is_blocked) {
        return c.json(
          { error: "Votre compte a été bloqué par un administrateur. Contactez le support pour demander sa réactivation.", blocked: true },
          403
        );
      }

      // Paramètre administrateur : ce compte exige-t-il un code de vérification à chaque connexion ?
      // (colonne users.require_login_verification — script SQL tmp/016_require_login_verification.sql ;
      //  défaut TRUE si la colonne est absente ou NULL)
      let requiresOtp = true;
      try {
        const flags = await sql`
          SELECT COALESCE(require_login_verification, TRUE) AS flag
          FROM users
          WHERE id = ${user.id}
          LIMIT 1
        `;
        requiresOtp = flags[0]?.flag !== false;
      } catch {
        // Colonne non migrée : comportement par défaut conservé (code exigé)
      }

      if (!requiresOtp) {
        // Connexion directe sans code de vérification (paramètre désactivé par un administrateur)
        const token = await signToken({ sub: user.id, tier: user.tier });
        return c.json({ success: true, tier: user.tier, token });
      }

      if (!allowOtpIssue(c, "login", user.email)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }
      const code = await generateVerificationCode(user.email, "login");
      await sendVerificationEmail(user.email, code, "login");

      return c.json({
        email: user.email,
        status: "verification_required",
        success: true,
      });
    } catch {
      logAuthServerError("Login Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /verify-login
  registerMulti("post", ["/verify-login", "/v1/verify-login", "/api/verify-login", "/api/vibe/verify-login"], async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Requête JSON invalide (vérifiez les guillemets de votre payload)." }, 400);
    }
    
    try {
      const { email, code, identifier } = body;
      const loginId = (email || identifier || "").trim();
      if (!loginId || !code) {
        return c.json({ error: "Champs manquants." }, 400);
      }

      const cleanId = loginId.toLowerCase();
      const cleanUser = cleanId.replace(/^@/, "");
      if (!allowOtpAttempt(c, "login", cleanUser)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }

      const sql = getDb();
      const users =
        await sql`
          SELECT id, tier, is_blocked, email, username 
          FROM users 
          WHERE LOWER(email) = ${cleanId} 
             OR LOWER(username) = ${cleanUser} 
          LIMIT 1
        `;
      if (users.length === 0) {
        return c.json({ error: "Utilisateur introuvable." }, 404);
      }

      const user = users[0];

      const isValid = await verifyVerificationCode(user.email, code, "login");
      if (!isValid) {
        return c.json({ error: "Code invalide ou expiré." }, 400);
      }

      // Compte bloqué par un administrateur : refus explicite (403)
      if (user.is_blocked) {
        return c.json(
          { error: "Votre compte a été bloqué par un administrateur. Contactez le support pour demander sa réactivation.", blocked: true },
          403
        );
      }

      const token = await signToken({ sub: user.id, tier: user.tier });

      const userAgent = c.req.header("user-agent") || "";
      const ip = clientIp(c);
      const { os, device_model, device_version, device_name } =
        parseUserAgent(userAgent);

      let locationStr = "Lieu inconnu";
      let countryStr = "Pays inconnu";
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch(`https://ip-api.com/json/${ip}`, {
          headers: { "User-Agent": "mAI/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "success") {
            locationStr = `${geoData.city}, ${geoData.country}`;
            countryStr = geoData.country;
          }
        }
      } catch (e) {
        console.error("[Auth] geolocation lookup failed");
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
          const knownDevice = pastDevices.some(
            (d: any) => d.device_name === device_name
          );
          const knownLocation = pastDevices.some(
            (d: any) => d.location && d.location.includes(countryStr)
          );
          if (knownDevice && knownLocation) {
            isNewDeviceOrLocation = false;
          }
        } else {
          // Première connexion jamais (donc nouvelle par defaut, ou pas besoin d'alerte? on envoie quand meme)
          isNewDeviceOrLocation = true;
        }
      } catch {
        console.error("[Auth] device history lookup failed");
      }

      try {
        await sql`
          INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name, location)
          VALUES (${user.id}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name}, ${locationStr})
        `;
      } catch {
        console.error("[Auth] device registration failed");
      }

      if (isNewDeviceOrLocation) {
        // On n'attend pas l'envoi de l'email
        sendVerificationEmail(user.email, "", "new_login", {
          device: device_name,
          location: locationStr,
        }).catch(() => console.error("[Auth] new-login notification failed"));
      }

      return c.json({ success: true, tier: user.tier, token });
    } catch {
      logAuthServerError("Verify Login Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /resend-code
  registerMulti("post", ["/resend-code", "/v1/resend-code", "/api/resend-code", "/api/vibe/resend-code"], async (c) => {
    try {
      const body = await c.req.json();
      const cleanEmail = otpTarget(body?.email);
      const action = String(body?.action || "").trim().toLowerCase();
      if (!cleanEmail || !action) {
        return c.json({ error: "Champs manquants." }, 400);
      }
      if (!OTP_ACTIONS.has(action)) {
        return c.json({ error: "Type de vérification non pris en charge." }, 400);
      }
      if (!allowOtpResend(c, action, cleanEmail)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }

      // Vérifier le cooldown d'une minute, en plus des limites en mémoire.
      const result = await sqlite.execute({
        args: [cleanEmail, action],
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

      const code = await generateVerificationCode(cleanEmail, action);
      await sendVerificationEmail(cleanEmail, code, action);

      return c.json({ success: true });
    } catch {
      logAuthServerError("Resend Code Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /logout — la suppression locale du token côté frontend ne suffit pas :
  // le token doit aussi être révoqué dans les deux backends de blacklist.
  const handleLogout = async (c: any) => {
    const token = extractToken(c.req.raw);
    if (!token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    try {
      // Vérifie la signature avant d'ajouter une entrée de blacklist, sans
      // exposer le détail jose/JWT au client.
      await verifyToken(token);
    } catch {
      return c.json({ error: "Jeton invalide." }, 401);
    }

    try {
      const blacklisted = await blacklistToken(token);
      if (!blacklisted) {
        return c.json({ error: "Déconnexion impossible." }, 503);
      }

      // Le nettoyage de la liste des appareils est best-effort : la révocation
      // du jeton est déjà effective et doit réussir même si cette table est
      // momentanément indisponible.
      try {
        const sql = getDb();
        await sql`DELETE FROM connected_devices WHERE token = ${token}`;
      } catch {
        // Le nettoyage de la table est best-effort.
      }

      return c.json({ success: true });
    } catch {
      logAuthServerError("Logout Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/logout", "/v1/logout", "/api/logout", "/api/vibe/logout", "/vibe/logout", "/api/v1/logout"],
    handleLogout
  );

  // POST /verify-code
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
      const sql = getDb();

      let newTier: string | null = null;
      let dbCodeId: number | null = null;

      // 1. Recherche dans la table subscription_codes de la base de données
      try {
        const codeRows = await sql`
          SELECT id, code, tier, max_uses, uses_count, is_active, expires_at 
          FROM subscription_codes 
          WHERE UPPER(code) = UPPER(${inputCode}) 
          LIMIT 1
        `;

        if (codeRows.length > 0) {
          const row = codeRows[0];

          if (!row.is_active) {
            return c.json(
              { error: "Ce code d'abonnement est désactivé." },
              400
            );
          }

          if (row.expires_at && new Date(row.expires_at) < new Date()) {
            return c.json({ error: "Ce code d'abonnement a expiré." }, 400);
          }

          if (
            row.max_uses > 0 &&
            Number(row.uses_count) >= Number(row.max_uses)
          ) {
            return c.json(
              { error: "Ce code a atteint son quota maximal d'utilisations." },
              400
            );
          }

          // Vérifier si l'utilisateur a déjà activé ce code spécifique
          try {
            const redemptions = await sql`
              SELECT id FROM subscription_code_redemptions 
              WHERE code_id = ${row.id} AND user_id = ${userId}::text 
              LIMIT 1
            `;
            if (redemptions.length > 0) {
              return c.json(
                {
                  error: "Vous avez déjà débloqué votre forfait avec ce code.",
                },
                400
              );
            }
          } catch (_redErr) {
            // Ignorer si la table de redemptions n'est pas encore créée
          }

          newTier = row.tier;
          dbCodeId = row.id;
        }
      } catch {
        console.warn("[Auth] subscription code table unavailable");
      }

      // 2. Fallback vers les variables d'environnement si non trouvé en base
      if (!newTier) {
        const upgradeCodes: Record<string, string> = {};

        const plusCode =
          getEnv("MAI_PLUS_CODE") || getEnv("PLUS_CODE");
        if (plusCode) {
          upgradeCodes[plusCode.trim().toUpperCase()] = "Plus";
        }

        const proCode =
          getEnv("MAI_PRO_CODE") || getEnv("PRO_CODE");
        if (proCode) {
          upgradeCodes[proCode.trim().toUpperCase()] = "Pro";
        }

        const maxCode =
          getEnv("MAI_MAX_CODE") || getEnv("MAX_CODE");
        if (maxCode) {
          upgradeCodes[maxCode.trim().toUpperCase()] = "Max";
        }

        newTier = upgradeCodes[inputCode] || null;
      }

      if (!newTier) {
        console.warn("[Auth] invalid subscription code submitted");
        return c.json({ error: "Code invalide ou expiré." }, 400);
      }

      // 3. Mise à jour de l'utilisateur et de ses clés API
      await sql`UPDATE users SET tier = ${newTier} WHERE id::text = ${userId}::text`;
      await sql`UPDATE mprojects_api_keys SET plan = ${newTier} WHERE user_id = ${userId}::text`;

      // 4. Incrémentation du compteur et log de l'utilisation en base
      if (dbCodeId) {
        try {
          await sql`
            UPDATE subscription_codes 
            SET uses_count = uses_count + 1,
                is_active = CASE WHEN max_uses > 0 AND (uses_count + 1) >= max_uses THEN FALSE ELSE is_active END
            WHERE id = ${dbCodeId}
          `;
          await sql`
            INSERT INTO subscription_code_redemptions (code_id, user_id)
            VALUES (${dbCodeId}, ${userId}::text)
          `;
        } catch {
          console.error("[Auth] subscription usage update failed");
        }
      }

      // 5. Envoi d'un e-mail de remerciements pour la souscription
      try {
        const userRows =
          await sql`SELECT email, username FROM users WHERE id::text = ${userId}::text LIMIT 1`;
        if (userRows.length > 0 && userRows[0].email) {
          await sendVerificationEmail(
            userRows[0].email,
            "",
            "subscription_unlocked",
            {
              tier: newTier,
              username: userRows[0].username,
            }
          );
        }
      } catch {
        console.error("[Auth] subscription confirmation email failed");
      }

      // 6. Nouveau token JWT avec le tier débloqué
      const newToken = await signToken({ sub: userId, tier: newTier });

      return c.json({
        message: `Merci d'avoir souscrit au forfait ${newTier} !`,
        success: true,
        tier: newTier,
        token: newToken,
      });
    } catch {
      logAuthServerError("Verify-Code Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /update-profile
  app.post("/update-profile", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const payload = await verifyToken(token);
      const userId = payload.sub as string;

      const body = await c.req.json();
      const {
        username,
        email,
        phone,
        password,
        currentPassword,
        newsletter,
        notify_limits,
        auto_logout_minutes,
      } = body;
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
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
        if (!/^[a-z0-9_]{2,30}$/.test(cleanUsername)) {
          return c.json(
            { error: "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _)." },
            400
          );
        }
        const existing =
          await sql`SELECT id FROM users WHERE LOWER(username) = ${cleanUsername} AND id::text != ${userId}::text LIMIT 1`;
        if (existing.length > 0) {
          return c.json({ error: "Ce nom d'utilisateur est déjà pris par un autre compte." }, 400);
        }
        await sql`UPDATE users SET username = ${cleanUsername} WHERE id::text = ${userId}::text`;
      }

      if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const existing =
          await sql`SELECT id FROM users WHERE email = ${cleanEmail} AND id::text != ${userId}::text LIMIT 1`;
        if (existing.length > 0) {
          return c.json(
            { error: "Cette adresse e-mail est déjà utilisée." },
            400
          );
        }
        if (cleanEmail !== currentUser[0].email) {
          if (!allowOtpIssue(c, "verify_new_email", cleanEmail)) {
            return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
          }
          // Send OTP instead of updating directly
          const code = await generateVerificationCode(
            cleanEmail,
            "verify_new_email"
          );
          await sendVerificationEmail(cleanEmail, code, "verify_new_email");
          return c.json({
            email: cleanEmail,
            status: "email_verification_required",
            success: true,
          });
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

      if (auto_logout_minutes !== undefined) {
        const mins = Number.parseInt(auto_logout_minutes, 10);
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

  // POST /verify-new-email
  app.post("/verify-new-email", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) {
        return c.json({ error: "Non authentifié." }, 401);
      }
      const payload = await verifyToken(token);
      const userId = payload.sub as string;

      const { email, code } = await c.req.json();
      if (!email || !code) {
        return c.json({ error: "Champs manquants." }, 400);
      }
      const cleanEmail = otpTarget(email);
      if (!cleanEmail) {
        return c.json({ error: "Champs manquants." }, 400);
      }
      if (!allowOtpAttempt(c, "verify_new_email", cleanEmail)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }

      const isValid = await verifyVerificationCode(
        cleanEmail,
        code,
        "verify_new_email"
      );
      if (!isValid) {
        return c.json({ error: "Code invalide ou expiré." }, 400);
      }

      const sql = getDb();
      await sql`UPDATE users SET email = ${cleanEmail} WHERE id::text = ${userId}::text`;

      return c.json({ email: cleanEmail, success: true });
    } catch {
      logAuthServerError("verify-new-email Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /request-delete-account
  app.post("/request-delete-account", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) {
        return c.json({ error: "Non authentifié." }, 401);
      }
      const payload = await verifyToken(token);
      const userId = payload.sub as string;

      const sql = getDb();
      const currentUser =
        await sql`SELECT email FROM users WHERE id::text = ${userId}::text LIMIT 1`;
      if (!currentUser || currentUser.length === 0) {
        return c.json({ error: "Utilisateur introuvable." }, 404);
      }

      const email = String(currentUser[0].email || "").trim().toLowerCase();
      if (!email || !allowOtpIssue(c, "delete_account", email)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }
      const code = await generateVerificationCode(email, "delete_account");
      await sendVerificationEmail(email, code, "delete_account");

      return c.json({ email, success: true });
    } catch {
      logAuthServerError("request-delete-account Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // POST /confirm-delete-account
  app.post("/confirm-delete-account", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) {
        return c.json({ error: "Non authentifié." }, 401);
      }
      const payload = await verifyToken(token);
      const userId = payload.sub as string;

      const { password, code, confirmationText } = await c.req.json();
      if (!password || !code || confirmationText !== "SUPPRIMER LE COMPTE") {
        return c.json(
          { error: "Informations de confirmation invalides." },
          400
        );
      }

      const sql = getDb();
      const currentUser =
        await sql`SELECT email, password_hash FROM users WHERE id::text = ${userId}::text LIMIT 1`;
      if (!currentUser || currentUser.length === 0) {
        return c.json({ error: "Utilisateur introuvable." }, 404);
      }

      const passMatch = await bcrypt.compare(
        password,
        currentUser[0].password_hash
      );
      if (!passMatch) {
        return c.json({ error: "Mot de passe incorrect." }, 400);
      }

      const email = String(currentUser[0].email || "").trim().toLowerCase();
      if (!allowOtpAttempt(c, "delete_account", email)) {
        return c.json({ error: OTP_RATE_LIMIT_MESSAGE }, 429);
      }
      const isValid = await verifyVerificationCode(
        email,
        code,
        "delete_account"
      );
      if (!isValid) {
        return c.json({ error: "Code invalide ou expiré." }, 400);
      }

      // Révoquer le token avant de supprimer le compte. Si aucune source de
      // blacklist n'est disponible, on ne supprime pas le compte par accident.
      if (!(await blacklistToken(token))) {
        throw new Error("Token blacklist unavailable");
      }

      // Suppression (ou anonymisation)
      await sql`DELETE FROM users WHERE id::text = ${userId}::text`;
      await sql`DELETE FROM connected_devices WHERE user_id::text = ${userId}::text`.catch(() => {});

      return c.json({ success: true });
    } catch {
      logAuthServerError("confirm-delete-account Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });

  // GET /api-keys
  app.get("/api-keys", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      let userId = (c as any).get("userId");

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = (payload.sub as string) || userId;
        } catch {
          // Un JWT invalide laisse le contexte middleware décider de l'accès.
        }
      }

      const sql = getDb();

      // Résolution du user_id réel via mprojects_api_keys si clé API transmise
      if (token) {
        try {
          const keyRows = await sql`
            SELECT k.user_id, u.tier, u.email, u.username
            FROM mprojects_api_keys k
            LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
            WHERE k.api_key = ${token}::text
            LIMIT 1
          `;
          if (keyRows.length > 0) {
            userId = keyRows[0].user_id;
          }
        } catch {
          // La table de clés peut être indisponible; le userId existant suffit.
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const [uRows, keyRows] = await Promise.all([
        sql`SELECT tier FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`,
        sql`
          SELECT k.*, u.tier as user_tier
          FROM mprojects_api_keys k
          LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
          WHERE (
            k.user_id = ${userId}::text 
            OR k.user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
            OR k.user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
            OR k.user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          )
          ORDER BY k.created_at DESC
        `.catch(() => []),
      ]);

      const userTier = uRows[0]?.tier || "Free";
      const validTiers = ["free", "plus", "pro", "max"];

      const keys = keyRows.map((k: any) => {
        const rawPlan = String(k.plan || "").trim();
        const planLower = rawPlan.toLowerCase();
        const isPlanTier = validTiers.includes(planLower);

        // Nom personnalisé de la clé
        const keyName = k.name || (isPlanTier ? `Clé ${rawPlan}` : rawPlan) || "Clé API Principale";
        // Le forfait est strictement le forfait d'abonnement du compte (free, plus, pro, max)
        const effectivePlan = k.user_tier || userTier || (isPlanTier ? rawPlan : "Plus");

        return {
          api_key: maskApiKey(k.api_key),
          name: keyName,
          plan: effectivePlan,
          request_count: Number(k.request_count || 0),
          created_at: k.created_at,
          last_used_at: k.last_used_at,
        };
      });

      return c.json({ keys, success: true });
    } catch {
      logAuthServerError("API Keys Error");
      return c.json({ error: "Erreur serveur." }, 500);
    }
  });
}
