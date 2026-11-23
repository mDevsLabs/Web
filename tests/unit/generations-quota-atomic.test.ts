import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  confirmImageMock,
  recordSpeechMock,
  releaseImageMock,
  releaseSpeechMock,
  reserveImageMock,
  reserveSpeechMock,
} = vi.hoisted(() => ({
  confirmImageMock: vi.fn(async () => undefined),
  recordSpeechMock: vi.fn(async () => ({ id: 1 })),
  releaseImageMock: vi.fn(async () => undefined),
  releaseSpeechMock: vi.fn(async () => undefined),
  reserveImageMock: vi.fn(async () => ({
    limit: 5,
    ok: true as const,
    reservationId: "res-img-1",
    used: 1,
  })),
  reserveSpeechMock: vi.fn(async () => ({
    limit: 10_000,
    ok: true as const,
    used: 10,
    weekStart: "2026-11-23",
  })),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: async () => ({
    user: {
      email: "eleve@test.local",
      id: "user-1",
      tier: "Free",
      username: "eleve",
    },
    userId: "user-1",
  }),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  enforceApiRateLimit: async () => null,
}));

vi.mock("@/lib/db/queries/generations", () => ({
  confirmImageGenerationReservation: confirmImageMock,
  estimateSpeechTokens: (text: string) =>
    Math.max(1, Math.ceil(text.trim().length / 3.5)),
  recordSpeechGeneration: recordSpeechMock,
  releaseImageGenerationReservation: releaseImageMock,
  releaseWeeklySpeechQuota: releaseSpeechMock,
  reserveDailyImageQuota: reserveImageMock,
  reserveWeeklySpeechQuota: reserveSpeechMock,
}));

import { POST as postAudio } from "@/app/(chat)/api/audio/generations/route";
import { POST as postImage } from "@/app/(chat)/api/images/generations/route";

describe("Quotas atomiques et MIME audio (BUG-001, BUG-002, BUG-003)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.COMET_API_KEY = "test-comet-key";
    confirmImageMock.mockClear();
    recordSpeechMock.mockClear();
    releaseImageMock.mockClear();
    releaseSpeechMock.mockClear();
    reserveImageMock.mockClear();
    reserveSpeechMock.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("réserve le quota audio avant l'appel externe et encapsule le vrai MIME (WAV)", async () => {
    const callOrder: string[] = [];
    reserveSpeechMock.mockImplementationOnce(async () => {
      callOrder.push("reserve");
      return {
        limit: 10_000,
        ok: true as const,
        used: 3,
        weekStart: "2026-11-23",
      };
    });
    globalThis.fetch = vi.fn(async () => {
      callOrder.push("fetch");
      return new Response(new Uint8Array([0x52, 0x49, 0x46, 0x46]), {
        headers: { "content-type": "audio/wav" },
        status: 200,
      });
    }) as typeof fetch;

    const req = new NextRequest("https://test.local/api/audio/generations", {
      body: JSON.stringify({
        input: "Bonjour",
        response_format: "wav",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const res = await postAudio(req);
    expect(res.status).toBe(200);
    expect(callOrder).toEqual(["reserve", "fetch"]);
    expect(releaseSpeechMock).not.toHaveBeenCalled();

    const data = (await res.json()) as {
      audio_url: string;
      format: string;
      mime_type: string;
    };
    expect(data.mime_type).toBe("audio/wav");
    expect(data.format).toBe("wav");
    expect(data.audio_url.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("libère la réservation audio si le fournisseur échoue", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("upstream error", { status: 502 })
    ) as typeof fetch;

    const req = new NextRequest("https://test.local/api/audio/generations", {
      body: JSON.stringify({ input: "Bonjour", response_format: "opus" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const res = await postAudio(req);
    expect(res.status).toBe(502);
    expect(reserveSpeechMock).toHaveBeenCalledTimes(1);
    expect(releaseSpeechMock).toHaveBeenCalledTimes(1);
  });

  it("refuse un format audio inconnu sans réserver de quota", async () => {
    const req = new NextRequest("https://test.local/api/audio/generations", {
      body: JSON.stringify({ input: "Bonjour", response_format: "exe" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const res = await postAudio(req);
    expect(res.status).toBe(400);
    expect(reserveSpeechMock).not.toHaveBeenCalled();
  });

  it("réserve le quota image avant CometAPI, confirme en succès et libère en échec", async () => {
    const callOrder: string[] = [];
    reserveImageMock.mockImplementationOnce(async () => {
      callOrder.push("reserve");
      return {
        limit: 5,
        ok: true as const,
        reservationId: "res-img-42",
        used: 1,
      };
    });
    globalThis.fetch = vi.fn(async () => {
      callOrder.push("fetch");
      return new Response(
        JSON.stringify({ data: [{ url: "https://cdn.test/img.png" }] }),
        { headers: { "content-type": "application/json" }, status: 200 }
      );
    }) as typeof fetch;

    const okReq = new NextRequest("https://test.local/api/images/generations", {
      body: JSON.stringify({ prompt: "Un chat bleu" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const okRes = await postImage(okReq);
    expect(okRes.status).toBe(200);
    expect(callOrder).toEqual(["reserve", "fetch"]);
    expect(confirmImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ reservationId: "res-img-42", userId: "user-1" })
    );
    expect(releaseImageMock).not.toHaveBeenCalled();

    globalThis.fetch = vi.fn(
      async () => new Response("upstream failure", { status: 503 })
    ) as typeof fetch;
    const failReq = new NextRequest(
      "https://test.local/api/images/generations",
      {
        body: JSON.stringify({ prompt: "Un chat rouge" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }
    );
    const failRes = await postImage(failReq);
    expect(failRes.status).toBe(502);
    expect(releaseImageMock).toHaveBeenCalledWith({
      reservationId: "res-img-1",
      userId: "user-1",
    });
  });
});
