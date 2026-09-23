import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { PHOTO_STATUS } from "@/lib/ai/tools/account-status";
import {
  updateProfilePicture,
  updateProfilePictureInput,
} from "@/lib/ai/tools/update-profile-picture";

const BLOB_URL =
  "https://xxx.public.blob.vercel-storage.com/uploads/photo-A1b2C3.png";

function sourceHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

async function runTool(input: {
  imageUrl?: string;
  source: "attachment" | "remote";
}) {
  const { execute } = updateProfilePicture();
  return (await execute(input, {
    abortSignal: new AbortController().signal,
    context: {},
    messages: [],
    toolCallId: "test-call",
  })) as {
    status: string;
    error?: string;
    preview?: { sourceHash: string };
  };
}

describe("updateProfilePictureInput (schéma Zod strict)", () => {
  it("accepte une pièce jointe ou une URL distante", () => {
    expect(
      updateProfilePictureInput.safeParse({
        imageUrl: BLOB_URL,
        source: "attachment",
      }).success
    ).toBe(true);
    expect(
      updateProfilePictureInput.safeParse({
        imageUrl: "https://example.com/a.png",
        source: "remote",
      }).success
    ).toBe(true);
  });

  it("exige source et borne imageUrl/reason", () => {
    expect(updateProfilePictureInput.safeParse({}).success).toBe(false);
    expect(
      updateProfilePictureInput.safeParse({ source: "ghost" }).success
    ).toBe(false);
    expect(
      updateProfilePictureInput.safeParse({
        imageUrl: `https://a.b/${"x".repeat(2100)}`,
        source: "remote",
      }).success
    ).toBe(false);
  });
});

describe("updateProfilePicture — pièce jointe", () => {
  it("produit une carte awaiting_user ancrée sur la source exacte (hash)", async () => {
    const output = await runTool({ imageUrl: BLOB_URL, source: "attachment" });
    expect(output.status).toBe(PHOTO_STATUS.AWAITING);
    expect(output.preview?.sourceHash).toBe(sourceHash(BLOB_URL));
  });

  it("refuse une pièce jointe hors stockage d'upload (ressource implicite)", async () => {
    const output = await runTool({
      imageUrl: "https://evil.example.com/uploads/steal.png",
      source: "attachment",
    });
    expect(output.status).toBe(PHOTO_STATUS.INVALID);
  });

  it("refuse une pièce jointe sans URL", async () => {
    const output = await runTool({ source: "attachment" });
    expect(output.status).toBe(PHOTO_STATUS.INVALID);
  });
});

describe("updateProfilePicture — URL distante", () => {
  it("produit awaiting_user pour une URL HTTPS publique", async () => {
    const url = "https://example.com/avatar.png";
    const output = await runTool({ imageUrl: url, source: "remote" });
    expect(output.status).toBe(PHOTO_STATUS.AWAITING);
    expect(output.preview?.sourceHash).toBe(sourceHash(url));
  });

  it("refuse HTTP et hôtes privés avant toute confirmation", async () => {
    const http = await runTool({
      imageUrl: "http://example.com/a.png",
      source: "remote",
    });
    expect(http.status).toBe(PHOTO_STATUS.INVALID);

    const localhost = await runTool({
      imageUrl: "https://localhost/a.png",
      source: "remote",
    });
    expect(localhost.status).toBe(PHOTO_STATUS.INVALID);

    const ip = await runTool({
      imageUrl: "https://169.254.169.254/latest/meta-data",
      source: "remote",
    });
    expect(ip.status).toBe(PHOTO_STATUS.INVALID);
  });

  it("refuse une source distante sans URL", async () => {
    const output = await runTool({ source: "remote" });
    expect(output.status).toBe(PHOTO_STATUS.INVALID);
  });
});
