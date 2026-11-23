import { describe, expect, it } from "vitest";
import {
  ALLOWED_AUDIO_FORMATS,
  AUDIO_FORMAT_MIME,
  audioFormatFromMime,
  buildAudioDataUrl,
  normalizeAudioMimeType,
  parseRequestedAudioFormat,
  resolveAudioMimeType,
} from "@/lib/audio/format";

describe("format audio et déduction MIME (BUG-002)", () => {
  it("accepte les formats autorisés et retombe sur mp3 par défaut si omis", () => {
    expect(parseRequestedAudioFormat(undefined)).toBe("mp3");
    expect(parseRequestedAudioFormat(null)).toBe("mp3");
    expect(parseRequestedAudioFormat("")).toBe("mp3");
    for (const fmt of ALLOWED_AUDIO_FORMATS) {
      expect(parseRequestedAudioFormat(fmt)).toBe(fmt);
      expect(parseRequestedAudioFormat(` ${fmt.toUpperCase()} `)).toBe(fmt);
    }
  });

  it("rejette les formats inconnus ou non textuels", () => {
    expect(parseRequestedAudioFormat("exe")).toBeNull();
    expect(parseRequestedAudioFormat("video/mp4")).toBeNull();
    expect(parseRequestedAudioFormat(123)).toBeNull();
  });

  it("normalise les alias MIME retournés par les fournisseurs", () => {
    expect(normalizeAudioMimeType("audio/mp3")).toBe("audio/mpeg");
    expect(normalizeAudioMimeType("audio/x-wav; charset=binary")).toBe(
      "audio/wav"
    );
    expect(normalizeAudioMimeType("audio/x-flac")).toBe("audio/flac");
    expect(normalizeAudioMimeType("audio/ogg; codecs=opus", "opus")).toBe(
      "audio/opus"
    );
    expect(normalizeAudioMimeType("application/json")).toBeNull();
  });

  it("déduit le MIME exact depuis l'en-tête fournisseur puis le JSON puis le format demandé", () => {
    expect(
      resolveAudioMimeType({
        requestedFormat: "wav",
        upstreamContentType: "audio/wav",
      })
    ).toBe("audio/wav");

    expect(
      resolveAudioMimeType({
        requestedFormat: "flac",
        upstreamContentType: "application/octet-stream",
      })
    ).toBe(AUDIO_FORMAT_MIME.flac);

    expect(
      resolveAudioMimeType({
        jsonFormat: "opus",
        requestedFormat: "mp3",
      })
    ).toBe("audio/opus");

    expect(
      resolveAudioMimeType({
        jsonMimeType: "audio/x-wav",
        requestedFormat: "mp3",
      })
    ).toBe("audio/wav");
  });

  it("conserve la correspondance entre MIME reçu et format retourné", () => {
    expect(audioFormatFromMime("audio/wav", "mp3")).toBe("wav");
    expect(audioFormatFromMime("audio/flac", "mp3")).toBe("flac");
    expect(audioFormatFromMime("audio/opus", "mp3")).toBe("opus");
    expect(audioFormatFromMime("audio/mpeg", "wav")).toBe("mp3");
  });

  it("encapsule en data URL avec le bon MIME sans double préfixe", () => {
    expect(buildAudioDataUrl("QUJD", "audio/wav")).toBe(
      "data:audio/wav;base64,QUJD"
    );
    expect(buildAudioDataUrl("data:audio/opus;base64,QUJD", "audio/mpeg")).toBe(
      "data:audio/opus;base64,QUJD"
    );
  });
});
