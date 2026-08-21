"use server";

import { MAI_API_URL } from "@/lib/constants";
import { setMaiSessionToken, removeMaiSessionToken } from "@/lib/auth/session";

export type AuthResponse = {
  success: boolean;
  status?: string;
  email?: string;
  tier?: string;
  error?: string;
};

// 1. Demande de connexion (Envoi de l'OTP)
export async function loginAction(
  formData: FormData
): Promise<AuthResponse> {
  const identifier = String(formData.get("identifier") || formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!identifier || !password) {
    return { success: false, error: "Veuillez renseigner tous les champs." };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || "Identifiants invalides." };
    }

    return {
      success: true,
      status: data.status || "verification_required",
      email: data.email || identifier,
    };
  } catch (err: any) {
    console.error("Erreur loginAction:", err);
    return { success: false, error: "Impossible de joindre le serveur d'authentification." };
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
    return { success: false, error: "E-mail et code requis." };
  }

  try {
    // 1ère tentative avec email exact
    const res = await fetch(`${MAI_API_URL}/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      await setMaiSessionToken(data.token);
      return { success: true, tier: data.tier };
    }

    // 2ème tentative en minuscules si différent
    if (cleanEmail !== cleanEmail.toLowerCase()) {
      const lowerRes = await fetch(`${MAI_API_URL}/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail.toLowerCase(), code: cleanCode }),
      });
      const lowerData = await lowerRes.json();
      if (lowerRes.ok && lowerData.token) {
        await setMaiSessionToken(lowerData.token);
        return { success: true, tier: lowerData.tier };
      }
    }

    return { success: false, error: data.error || "Code invalide ou expiré." };
  } catch (err: any) {
    console.error("Erreur verifyLoginAction:", err);
    return { success: false, error: "Erreur serveur lors de la vérification du code." };
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
    return { success: false, error: "Tous les champs sont requis." };
  }

  if (password.length < 6) {
    return { success: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || "Erreur lors de l'inscription." };
    }

    return {
      success: true,
      status: data.status || "verification_required",
      email,
    };
  } catch (err: any) {
    console.error("Erreur registerAction:", err);
    return { success: false, error: "Impossible de joindre le serveur d'authentification." };
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
    return { success: false, error: "Champs manquants." };
  }

  try {
    const res = await fetch(`${MAI_API_URL}/verify-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, code: code.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      return { success: false, error: data.error || "Code invalide ou expiré." };
    }

    await setMaiSessionToken(data.token);
    return { success: true, tier: data.tier };
  } catch (err: any) {
    console.error("Erreur verifyRegisterAction:", err);
    return { success: false, error: "Erreur serveur lors de la finalisation de l'inscription." };
  }
}

// 5. Renvoi du code de vérification
export async function resendCodeAction(
  email: string,
  action: "login" | "register" | "verify_new_email" | "delete_account"
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${MAI_API_URL}/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || "Erreur lors du renvoi du code." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erreur resendCodeAction:", err);
    return { success: false, error: "Impossible de renvoyer le code." };
  }
}

// 6. Déconnexion
export async function logoutAction() {
  await removeMaiSessionToken();
}
