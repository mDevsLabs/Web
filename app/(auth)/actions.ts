"use server";

import { removeMaiSessionToken, setMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export type AuthResponse = {
  success: boolean;
  status?: string;
  email?: string;
  tier?: string;
  error?: string;
};

// 1. Demande de connexion (Envoi de l'OTP)
export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const identifier = String(
    formData.get("identifier") || formData.get("email") || ""
  ).trim();
  const password = String(formData.get("password") || "");

  if (!identifier || !password) {
    return { error: "Veuillez renseigner tous les champs.", success: false };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/login`, {
      body: JSON.stringify({ identifier, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: data.error || "Identifiants invalides.", success: false };
    }

    return {
      email: data.email || identifier,
      status: data.status || "verification_required",
      success: true,
    };
  } catch (err: any) {
    console.error("Erreur loginAction:", err);
    return {
      error: "Impossible de joindre le serveur d'authentification.",
      success: false,
    };
  }
}

// 2. Vérification du code OTP de connexion
export async function verifyLoginAction(
  email: string,
  code: string
): Promise<AuthResponse> {
  const cleanEmail = email ? email.trim() : "";
  const cleanCode = code ? code.trim() : "";

  if (!cleanEmail || !cleanCode) {
    return { error: "E-mail et code requis.", success: false };
  }

  try {
    // 1ère tentative avec email exact
    const res = await fetch(`${MAI_API_URL}/verify-login`, {
      body: JSON.stringify({ code: cleanCode, email: cleanEmail }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (res.ok && data.token) {
      await setMaiSessionToken(data.token);
      return { success: true, tier: data.tier };
    }

    // 2ème tentative en minuscules si différent
    if (cleanEmail !== cleanEmail.toLowerCase()) {
      const lowerRes = await fetch(`${MAI_API_URL}/verify-login`, {
        body: JSON.stringify({
          code: cleanCode,
          email: cleanEmail.toLowerCase(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const lowerData = await lowerRes.json();
      if (lowerRes.ok && lowerData.token) {
        await setMaiSessionToken(lowerData.token);
        return { success: true, tier: lowerData.tier };
      }
    }

    return { error: data.error || "Code invalide ou expiré.", success: false };
  } catch (err: any) {
    console.error("Erreur verifyLoginAction:", err);
    return {
      error: "Erreur serveur lors de la vérification du code.",
      success: false,
    };
  }
}

// 3. Demande d'inscription (Envoi de l'OTP)
export async function registerAction(
  formData: FormData
): Promise<AuthResponse> {
  const email = String(formData.get("email") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !username || !password) {
    return { error: "Tous les champs sont requis.", success: false };
  }

  if (password.length < 6) {
    return {
      error: "Le mot de passe doit faire au moins 6 caractères.",
      success: false,
    };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/register`, {
      body: JSON.stringify({ email, password, username }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        error: data.error || "Erreur lors de l'inscription.",
        success: false,
      };
    }

    return {
      email,
      status: data.status || "verification_required",
      success: true,
    };
  } catch (err: any) {
    console.error("Erreur registerAction:", err);
    return {
      error: "Impossible de joindre le serveur d'authentification.",
      success: false,
    };
  }
}

// 4. Vérification du code OTP d'inscription
export async function verifyRegisterAction(
  email: string,
  username: string,
  password: string,
  code: string
): Promise<AuthResponse> {
  if (!email || !username || !password || !code) {
    return { error: "Champs manquants.", success: false };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/verify-register`, {
      body: JSON.stringify({ code: code.trim(), email, password, username }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      return {
        error: data.error || "Code invalide ou expiré.",
        success: false,
      };
    }

    await setMaiSessionToken(data.token);
    return { success: true, tier: data.tier };
  } catch (err: any) {
    console.error("Erreur verifyRegisterAction:", err);
    return {
      error: "Erreur serveur lors de la finalisation de l'inscription.",
      success: false,
    };
  }
}

// 5. Renvoi du code de vérification
export async function resendCodeAction(
  email: string,
  action: "login" | "register" | "verify_new_email" | "delete_account"
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${MAI_API_URL}/resend-code`, {
      body: JSON.stringify({ action, email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        error: data.error || "Erreur lors du renvoi du code.",
        success: false,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erreur resendCodeAction:", err);
    return { error: "Impossible de renvoyer le code.", success: false };
  }
}

// 6. Déconnexion
export async function logoutAction() {
  await removeMaiSessionToken();
}
