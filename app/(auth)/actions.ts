"use server";

import { headers } from "next/headers";
// Schéma de mot de passe PARTAGÉ avec le backend Hono (auth.ts) : les deux
// parcours appliquent les mêmes bornes et ne peuvent pas diverger.
import { checkPasswordPolicy } from "@/auth-password-policy";
import type { ApiErrorCode } from "@/lib/api/error-codes";
import { DEFAULT_MESSAGES_FR } from "@/lib/api/error-messages";
import {
  type AuthGuardFailure,
  getClientIp,
  guardAuthAction,
} from "@/lib/auth/actions-guard";
import {
  loginUser,
  registerUser,
  resendVerificationCodeUser,
  verifyLoginUser,
  verifyRegisterUser,
} from "@/lib/auth/server-auth";
import { removeMaiSessionToken, setMaiSessionToken } from "@/lib/auth/session";

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
    const result = await loginUser({ identifier, password });
    if (!result.success) {
      return {
        code: (result.code as ApiErrorCode) || "invalid_credentials",
        error: result.error || "Identifiants invalides.",
        success: false,
      };
    }

    return {
      email: result.email || identifier,
      status: result.status || "verification_required",
      success: true,
    };
  } catch (err) {
    console.error("Erreur loginAction:", err);
    return {
      code: "service_unavailable",
      error: "Impossible d'effectuer la connexion.",
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
    const ip = await getClientIp();
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") || "";

    const result = await verifyLoginUser({
      code: cleanCode,
      email: cleanEmail,
      ip,
      userAgent,
    });

    if (!result.success) {
      return {
        code: (result.code as ApiErrorCode) || "invalid_credentials",
        error: result.error || "Code invalide ou expiré.",
        success: false,
      };
    }

    if (result.token) {
      await setMaiSessionToken(result.token);
    }

    return { success: true, tier: result.tier };
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

  const passwordError = checkPasswordPolicy(password);
  if (passwordError) {
    return {
      code: "invalid_request",
      error: passwordError,
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
    const result = await registerUser({ email, password, username });
    if (!result.success) {
      return {
        code: (result.code as ApiErrorCode) || "invalid_request",
        error: result.error || "Erreur lors de l'inscription.",
        success: false,
      };
    }

    return {
      email,
      status: result.status || "verification_required",
      success: true,
    };
  } catch (err) {
    console.error("Erreur registerAction:", err);
    return {
      code: "service_unavailable",
      error: "Impossible d'effectuer l'inscription.",
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

  // Second contrôle, comme côté Hono : ce payload est indépendant de celui
  // envoyé à /register.
  const passwordError = checkPasswordPolicy(password);
  if (passwordError) {
    return {
      code: "invalid_request",
      error: passwordError,
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
    const ip = await getClientIp();
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") || "";

    const result = await verifyRegisterUser({
      code: code.trim(),
      email,
      ip,
      password,
      userAgent,
      username,
    });

    if (!result.success) {
      return {
        code: (result.code as ApiErrorCode) || "invalid_credentials",
        error: result.error || "Code invalide ou expiré.",
        success: false,
      };
    }

    if (result.token) {
      await setMaiSessionToken(result.token);
    }
    return { success: true, tier: result.tier };
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
    const result = await resendVerificationCodeUser({ action, email });
    if (!result.success) {
      return {
        code: (result.code as ApiErrorCode) || "invalid_request",
        error: result.error || "Erreur lors du renvoi du code.",
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
