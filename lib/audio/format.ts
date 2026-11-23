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

export function isPcmMimeType(mimeType: string): boolean {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return base === "audio/pcm" || base === "audio/l16" || base === "audio/x-pcm";
}

export function parsePcmAudioParams(contentType: string | null | undefined): {
  channels: number;
  sampleRate: number;
} {
  let sampleRate = 24_000;
  let channels = 1;
  if (!contentType) {
    return { channels, sampleRate };
  }
  const rateMatch = contentType.match(/;\s*rate=(\d+)/i);
  if (rateMatch) {
    const parsedRate = Number.parseInt(rateMatch[1], 10);
    if (Number.isFinite(parsedRate) && parsedRate >= 8000 && parsedRate <= 192_000) {
      sampleRate = parsedRate;
    }
  }
  const channelsMatch = contentType.match(/;\s*channels=(\d+)/i);
  if (channelsMatch) {
    const parsedChannels = Number.parseInt(channelsMatch[1], 10);
    if (Number.isFinite(parsedChannels) && parsedChannels >= 1 && parsedChannels <= 8) {
      channels = parsedChannels;
    }
  }
  return { channels, sampleRate };
}

function hasRiffWaveHeader(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  );
}

/**
 * Encapsule un flux PCM 16-bit little-endian dans un conteneur RIFF/WAVE
 * afin que les lecteurs HTML `<audio>` puissent lire directement les modèles
 * OpenRouter qui n'émettent que du `pcm` (ex. HeyGen, Gemini TTS).
 */
export function wrapPcm16AsWav(
  pcmBytes: Uint8Array,
  options?: { channels?: number; sampleRate?: number }
): Uint8Array {
  if (hasRiffWaveHeader(pcmBytes)) {
    return pcmBytes;
  }
  const channels = options?.channels ?? 1;
  const sampleRate = options?.sampleRate ?? 24_000;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBytes.byteLength;
  const wav = new Uint8Array(44 + dataSize);
  const view = new DataView(wav.buffer);

  // En-tête RIFF
  wav.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  wav.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // Sous-bloc fmt
  wav.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // taille PCM = 16
  view.setUint16(20, 1, true); // format 1 = PCM linéaire
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // Sous-bloc data
  wav.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataSize, true);
  wav.set(pcmBytes, 44);

  return wav;
}

/**
 * Normalise un buffer audio binaire issu d'OpenRouter : si le retour est du PCM
 * brut, ajoute l'en-tête WAV et met à jour le type MIME vers `audio/wav`.
 */
export function normalizePlayableAudioBinary(params: {
  bytes: Uint8Array;
  requestedFormat: AudioResponseFormat;
  upstreamContentType?: string | null;
}): {
  bytes: Uint8Array;
  format: AudioResponseFormat;
  mimeType: string;
} {
  const mimeType = resolveAudioMimeType({
    requestedFormat: params.requestedFormat,
    upstreamContentType: params.upstreamContentType,
  });

  if (
    isPcmMimeType(mimeType) ||
    (!params.upstreamContentType?.includes("audio/") &&
      params.requestedFormat === "pcm" &&
      !hasRiffWaveHeader(params.bytes))
  ) {
    const pcmParams = parsePcmAudioParams(params.upstreamContentType);
    const wavBytes = wrapPcm16AsWav(params.bytes, pcmParams);
    return {
      bytes: wavBytes,
      format: "wav",
      mimeType: "audio/wav",
    };
  }

  return {
    bytes: params.bytes,
    format: audioFormatFromMime(mimeType, params.requestedFormat),
    mimeType,
  };
}
