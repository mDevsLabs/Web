import { decodeJwt } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateChatPinResetCode,
  hashChatPin,
  hashChatPinResetCode,
  verifyChatPin,
} from "@/lib/chat/pin-hash";
import { isValidChatPin, sanitizeChatPinInput } from "@/lib/chat/pin-rules";
import {
  createChatUnlockToken,
  verifyChatUnlockToken,
} from "@/lib/chat/unlock-token";

const CHAT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "user-test";
const PIN_UPDATED_AT = 1_793_200_000_000;

describe("règles de PIN", () => {
  it("accepte uniquement 4 à 6 chiffres", () => {
    expect(isValidChatPin("1234")).toBe(true);
    expect(isValidChatPin("12345")).toBe(true);
    expect(isValidChatPin("123456")).toBe(true);
    expect(isValidChatPin("123")).toBe(false);
    expect(isValidChatPin("1234567")).toBe(false);
    expect(isValidChatPin("12a4")).toBe(false);
    expect(isValidChatPin("")).toBe(false);
    expect(isValidChatPin(null)).toBe(false);
  });

  it("nettoie la saisie sans dépasser 6 chiffres", () => {
    expect(sanitizeChatPinInput("12a3 4-5")).toBe("12345");
    expect(sanitizeChatPinInput("1234567")).toBe("123456");
  });
});

describe("hachage SHA-256 du PIN", () => {
  it("produit 64 caractères hexadécimaux déterministes", () => {
    const first = hashChatPin("1234");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(hashChatPin("1234")).toBe(first);
    expect(hashChatPin("1235")).not.toBe(first);
  });

  it("vérifie le PIN sans accepter une valeur voisine", () => {
    const hash = hashChatPin("123456");
    expect(verifyChatPin("123456", hash)).toBe(true);
    expect(verifyChatPin("123457", hash)).toBe(false);
    expect(verifyChatPin("", hash)).toBe(false);
  });
});

describe("code de réinitialisation", () => {
  it("génère toujours six chiffres", () => {
    for (let index = 0; index < 25; index += 1) {
      expect(generateChatPinResetCode()).toMatch(/^\d{6}$/);
    }
  });

  it("sépare les conversations dans le hash", () => {
    const otherChatId = "22222222-2222-4222-8222-222222222222";
    const first = hashChatPinResetCode({ chatId: CHAT_ID, code: "123456" });
    const second = hashChatPinResetCode({
      chatId: otherChatId,
      code: "123456",
    });
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
  });
});

describe("jeton de déverrouillage", () => {
  let originalSecret: string | undefined;
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.MAI_JWT_SECRET;
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.MAI_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MAI_JWT_SECRET;
    } else {
      process.env.MAI_JWT_SECRET = originalSecret;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it("signe et vérifie un jeton lié au chat, à l'utilisateur et à la version du PIN", async () => {
    const token = await createChatUnlockToken({
      chatId: CHAT_ID,
      pinUpdatedAt: PIN_UPDATED_AT,
      userId: USER_ID,
    });
    expect(token).toBeTruthy();

    expect(
      await verifyChatUnlockToken({
        chatId: CHAT_ID,
        pinUpdatedAt: PIN_UPDATED_AT,
        token,
        userId: USER_ID,
      })
    ).toBe(true);

    expect(
      await verifyChatUnlockToken({
        chatId: CHAT_ID,
        pinUpdatedAt: PIN_UPDATED_AT + 1,
        token,
        userId: USER_ID,
      })
    ).toBe(false);

    expect(
      await verifyChatUnlockToken({
        chatId: CHAT_ID,
        pinUpdatedAt: PIN_UPDATED_AT,
        token,
        userId: "other-user",
      })
    ).toBe(false);
  });

  it("ne peut pas être rejoué comme jeton de session", async () => {
    const token = await createChatUnlockToken({
      chatId: CHAT_ID,
      pinUpdatedAt: PIN_UPDATED_AT,
      userId: USER_ID,
    });
    const payload = decodeJwt(token as string);
    // Le vérificateur de session exige `email` ou `sub` : le jeton de
    // déverrouillage n'en porte aucun des deux.
    expect(payload.sub).toBeUndefined();
    expect(payload.email).toBeUndefined();
    expect(payload.uid).toBe(USER_ID);
    expect(payload.aud).toBe("mai-chat-unlock");
  });

  it("échoue fermé sans secret configuré", async () => {
    delete process.env.MAI_JWT_SECRET;
    delete process.env.JWT_SECRET;

    const token = await createChatUnlockToken({
      chatId: CHAT_ID,
      pinUpdatedAt: PIN_UPDATED_AT,
      userId: USER_ID,
    });
    expect(token).toBeNull();
    expect(
      await verifyChatUnlockToken({
        chatId: CHAT_ID,
        pinUpdatedAt: PIN_UPDATED_AT,
        token: "un-jeton-quelconque",
        userId: USER_ID,
      })
    ).toBe(false);
  });
});
