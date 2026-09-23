"use server";

import { extractApiErrorMessage } from "@/lib/api/client-error";
import type { ApiErrorCode } from "@/lib/api/error-codes";
import { DEFAULT_MESSAGES_FR } from "@/lib/api/error-messages";
import {
  type AuthGuardFailure,
  guardAuthAction,
} from "@/lib/auth/actions-guard";
import { removeMaiSessionToken, setMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export type AuthResponse = {
  success: boolean;
  status?: string;
  email?: string;
  tier?: string;
  error?: string;
  code?: ApiErrorCode;
  retryAfterSeconds?: number;
};

function formatRetryDelay(seconds: number): string {
  if (seconds >= 120) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minutes`;
  }
  if (seconds >= 60) {
    return "1 minute";
  }
  return `${Math.max(1, seconds)} secondes`;
}

function guardFailureToResponse(failure: AuthGuardFailure): AuthResponse {
  const message =
    failure.code === "rate_limited" && failure.retryAfterSeconds
      ? `Trop de tentatives. Veuillez réessayer dans ${formatRetryDelay(
          failure.retryAfterSeconds
        )}.`
      : DEFAULT_MESSAGES_FR[failure.code];
  return {
    code: failure.code,
    error: message,
    retryAfterSeconds: failure.retryAfterSeconds,
    success: false,
  };
}

// 1. Demande de connexion (Envoi de l'OTP)
export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const identifier = String(
    formData.get("identifier") || formData.get("email") || ""
  ).trim();
  const password = String(formData.get("password") || "");
  const acceptedTerms = formData.get("acceptedTerms");

  if (acceptedTerms !== "true") {
    return {
      code: "invalid_request",
      error:
        "Vous devez accepter les conditions d'utilisation pour vous connecter.",
      success: false,
    };
  }

  if (!identifier || !password) {
    return {
      code: "invalid_request",
      error: "Veuillez renseigner tous les champs.",
      success: false,
    };
  }

  const guardFailure = await guardAuthAction({
    action: "login",
    identifier,
  });
  if (guardFailure) {
    return guardFailureToResponse(guardFailure);
  }

  try {
    const res = await fetch(`${MAI_API_URL}/login`, {
      body: JSON.stringify({ identifier, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        code: "invalid_credentials",
        error: extractApiErrorMessage(data) || "Identifiants invalides.",
        success: false,
      };
    }

    return {
      email: data.email || identifier,
      status: data.status || "verification_required",
      success: true,
    };
  } catch (err) {
    console.error("Erreur loginAction:", err);
    return {
      code: "service_unavailable",
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
    return {
      code: "invalid_request",
      error: "E-mail et code requis.",
      success: false,
    };
  }

  const guardFailure = await guardAuthAction({
    action: "verify_login",
    identifier: cleanEmail,
  });
  if (guardFailure) {
    return guardFailureToResponse(guardFailure);
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

    return {
      code: "invalid_credentials",
      error: extractApiErrorMessage(data) || "Code invalide ou expiré.",
      success: false,
    };
  } catch (err) {
    console.error("Erreur verifyLoginAction:", err);
    return {
      code: "service_unavailable",
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
  const acceptedTerms = formData.get("acceptedTerms");

  if (acceptedTerms !== "true") {
    return {
      code: "invalid_request",
      error:
        "Vous devez accepter les conditions d'utilisation pour vous inscrire.",
      success: false,
    };
  }

  if (!email || !username || !password) {
    return {
      code: "invalid_request",
      error: "Tous les champs sont requis.",
      success: false,
    };
  }

  if (password.length < 6) {
    return {
      code: "invalid_request",
      error: "Le mot de passe doit faire au moins 6 caractères.",
      success: false,
    };
  }

  const guardFailure = await guardAuthAction({
    action: "register",
    identifier: email,
  });
  if (guardFailure) {
    return guardFailureToResponse(guardFailure);
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
        code: "invalid_request",
        error: extractApiErrorMessage(data) || "Erreur lors de l'inscription.",
        success: false,
      };
    }

    return {
      email,
      status: data.status || "verification_required",
      success: true,
    };
  } catch (err) {
    console.error("Erreur registerAction:", err);
    return {
      code: "service_unavailable",
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
    return {
      code: "invalid_request",
      error: "Champs manquants.",
      success: false,
    };
  }

  const guardFailure = await guardAuthAction({
    action: "verify_register",
    identifier: email,
  });
  if (guardFailure) {
    return guardFailureToResponse(guardFailure);
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
        code: "invalid_credentials",
        error: extractApiErrorMessage(data) || "Code invalide ou expiré.",
        success: false,
      };
    }

    await setMaiSessionToken(data.token);
    return { success: true, tier: data.tier };
  } catch (err) {
    console.error("Erreur verifyRegisterAction:", err);
    return {
      code: "service_unavailable",
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
  const guardFailure = await guardAuthAction({
    action: "resend_code",
    identifier: email,
  });
  if (guardFailure) {
    return guardFailureToResponse(guardFailure);
  }

  try {
    const res = await fetch(`${MAI_API_URL}/resend-code`, {
      body: JSON.stringify({ action, email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        code: "invalid_request",
        error: extractApiErrorMessage(data) || "Erreur lors du renvoi du code.",
        success: false,
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Erreur resendCodeAction:", err);
    return {
      code: "service_unavailable",
      error: "Impossible de renvoyer le code.",
      success: false,
    };
  }
}

// 6. Déconnexion
export async function logoutAction() {
  await removeMaiSessionToken();
}
