import { describe, expect, it } from "vitest";
import { postRequestBodySchema } from "@/app/(chat)/api/chat/schema";

// Non-régression du bug « 400 silencieux en mode Chat » : le schéma doit
// accepter exactement ce que le composer envoie (message long, id non-UUID,
// FileUIPart v7) et rejeter de façon explicite les payloads réellement
// invalides. Toute régression ici reproduit le bug côté client.

const baseBody = {
  selectedChatModel: "google/gemini-2.5-flash",
  selectedVisibilityType: "private" as const,
};

describe("postRequestBodySchema — tolérances alignées sur /api/agent", () => {
  it("accepte un message de plus de 2000 caractères", () => {
    const longText = "x".repeat(5000);
    const result = postRequestBodySchema.safeParse({
      ...baseBody,
      id: "123e4567-e89b-42d3-a456-426614174000",
      message: {
        id: "223e4567-e89b-42d3-a456-426614174000",
        parts: [{ text: longText, type: "text" }],
        role: "user",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepte un id de conversation non-UUID (ex. nanoid)", () => {
    const result = postRequestBodySchema.safeParse({
      ...baseBody,
      id: "V6dK1_2xYz3aBcDeFgHi",
    });
    expect(result.success).toBe(true);
  });

  it("accepte une pièce jointe au format AI SDK v7 (filename)", () => {
    const result = postRequestBodySchema.safeParse({
      ...baseBody,
      id: "123e4567-e89b-42d3-a456-426614174000",
      message: {
        id: "223e4567-e89b-42d3-a456-426614174000",
        parts: [
          {
            mediaType: "image/png",
            filename: "capture.png",
            type: "file",
            url: "https://example.com/capture.png",
          },
        ],
        role: "user",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepte les anciens envois avec `name` sur la pièce jointe", () => {
    const result = postRequestBodySchema.safeParse({
      ...baseBody,
      id: "123e4567-e89b-42d3-a456-426614174000",
      message: {
        id: "223e4567-e89b-42d3-a456-426614174000",
        parts: [
          {
            mediaType: "text/plain",
            name: "notes.txt",
            type: "file",
            url: "https://example.com/notes.txt",
          },
        ],
        role: "user",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejette toujours un body vide de modèle (selectedChatModel manquant)", () => {
    const result = postRequestBodySchema.safeParse({
      id: "123e4567-e89b-42d3-a456-426614174000",
      selectedVisibilityType: "private",
    });
    expect(result.success).toBe(false);
  });
});
