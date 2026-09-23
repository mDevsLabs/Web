import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose";
export function jwtDecode(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
} | null {
  try {
    const payload = decodeJwt(token) as Record<string, unknown>;
    const header = decodeProtectedHeader(token) as Record<string, unknown>;
    return { header, payload };
  } catch {
    return null;
  }
}

// Vérification HMAC HS256/384/512 via jose.
export async function jwtVerifyHmac(
  token: string,
  secret: string
): Promise<{
  error?: string;
  payload?: Record<string, unknown>;
  valid?: boolean;
}> {
  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      algorithms: ["HS256", "HS384", "HS512"],
    });
    return { payload: payload as Record<string, unknown>, valid: true };
  } catch (e: any) {
    return { error: e?.message || "Signature ou format invalide." };
  }
}
