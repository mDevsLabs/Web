/**
 * Formats audio et types MIME de synthèse vocale (BUG-002).
 *
 * Module pur (client-safe) : valide `response_format` et déduit le type MIME
 * exact réellement renvoyé par le fournisseur afin de ne plus encapsuler du
 * WAV, FLAC ou Opus en `audio/mp3`.
 */

export const ALLOWED_AUDIO_FORMATS = [
  "mp3",
  "wav",
  "flac",
  "opus",
  "aac",
  "pcm",
] as const;

export type AudioResponseFormat = (typeof ALLOWED_AUDIO_FORMATS)[number];

export const AUDIO_FORMAT_MIME: Record<AudioResponseFormat, string> = {
  aac: "audio/aac",
  flac: "audio/flac",
  mp3: "audio/mpeg",
  opus: "audio/opus",
  pcm: "audio/pcm",
  wav: "audio/wav",
};

const MIME_ALIASES: Record<string, string> = {
  "audio/l16": "audio/pcm",
  "audio/mp3": "audio/mpeg",
  "audio/mp4": "audio/aac",
  "audio/mpeg": "audio/mpeg",
  "audio/mpeg3": "audio/mpeg",
  "audio/vnd.wave": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-aac": "audio/aac",
  "audio/x-flac": "audio/flac",
  "audio/x-mpeg-3": "audio/mpeg",
  "audio/x-pcm": "audio/pcm",
  "audio/x-wav": "audio/wav",
};

const MIME_TO_FORMAT: Record<string, AudioResponseFormat> = {
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/mpeg": "mp3",
  "audio/ogg": "opus",
  "audio/opus": "opus",
  "audio/pcm": "pcm",
  "audio/wav": "wav",
};

export function parseRequestedAudioFormat(
  raw: unknown
): AudioResponseFormat | null {
  if (raw === undefined || raw === null) {
    return "mp3";
  }
  if (typeof raw !== "string") {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return "mp3";
  }
  return (ALLOWED_AUDIO_FORMATS as readonly string[]).includes(normalized)
    ? (normalized as AudioResponseFormat)
    : null;
}

export function normalizeAudioMimeType(
  rawMime: string | null | undefined,
  requestedFormat?: AudioResponseFormat
): string | null {
  if (!rawMime || typeof rawMime !== "string") {
    return null;
  }
  const base = rawMime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!base.startsWith("audio/")) {
    return null;
  }
  if (base === "audio/ogg") {
    return requestedFormat === "opus" ? "audio/opus" : "audio/ogg";
  }
  return MIME_ALIASES[base] ?? base;
}

export function resolveAudioMimeType(params: {
  jsonFormat?: unknown;
  jsonMimeType?: unknown;
  requestedFormat: AudioResponseFormat;
  upstreamContentType?: string | null;
}): string {
  const fromHeader = normalizeAudioMimeType(
    params.upstreamContentType,
    params.requestedFormat
  );
  if (fromHeader) {
    return fromHeader;
  }

  if (typeof params.jsonMimeType === "string") {
    const fromJsonMime = normalizeAudioMimeType(
      params.jsonMimeType,
      params.requestedFormat
    );
    if (fromJsonMime) {
      return fromJsonMime;
    }
  }

  const fromJsonFormat = parseRequestedAudioFormat(params.jsonFormat);
  if (params.jsonFormat !== undefined && fromJsonFormat) {
    return AUDIO_FORMAT_MIME[fromJsonFormat];
  }

  return AUDIO_FORMAT_MIME[params.requestedFormat];
}

export function audioFormatFromMime(
  mimeType: string,
  fallback: AudioResponseFormat
): AudioResponseFormat {
  const normalized = normalizeAudioMimeType(mimeType, fallback);
  if (normalized && normalized in MIME_TO_FORMAT) {
    return MIME_TO_FORMAT[normalized];
  }
  return fallback;
}

export function buildAudioDataUrl(
  base64OrDataUrl: string,
  mimeType: string
): string {
  const trimmed = base64OrDataUrl.trim();
  if (/^data:audio\/[a-z0-9.+-]+;base64,/i.test(trimmed)) {
    return trimmed;
  }
  return `data:${mimeType};base64,${trimmed}`;
}
