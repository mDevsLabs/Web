import { describe, expect, it } from "vitest";
import {
  buildCometImageCatalog,
  buildSpeechCatalog,
  parseOpenRouterSpeechCapabilities,
  resolveCometImageRequestModel,
  resolveSpeechGenerationParams,
} from "@/lib/ai/catalog/media-models-pure";
import {
  normalizePlayableAudioBinary,
  parsePcmAudioParams,
  wrapPcm16AsWav,
} from "@/lib/audio/format";
import type { StoredModel } from "@/openrouter-models";

function makeStoredModel(
  id: string,
  overrides: Partial<StoredModel> = {}
): StoredModel {
  return {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_750_000_000,
    description: "",
    fournisseur: "cometapi",
    id,
    is_available: true,
    isActive: true,
    max_output_tokens: 1,
    model_number: 1,
    name: id.split("/").slice(1).join("/"),
    overrides: {},
    pricing: {},
    provider: id.split("/")[0] || "cometapi",
    reasoning: null,
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: {},
    ...overrides,
  };
}

describe("Catalogue images CometAPI (ordre alphabétique & isolation fournisseur)", () => {
  const mixedModels: StoredModel[] = [
    makeStoredModel("black-forest-labs/flux-pro"),
    makeStoredModel("google/gemini-2.5-flash-image", {
      architecture: {
        input_modalities: ["text", "image"],
        modality: "text+image->text+image",
        output_modalities: ["image", "text"],
      },
      fournisseur: "openrouter",
      name: "Nano Banana",
    }),
    makeStoredModel("black-forest-labs/flux-schnell", { is_available: false }),
    makeStoredModel("black-forest-labs/flux-1.1-pro"),
    makeStoredModel("black-forest-labs/flux-dev"),
    makeStoredModel("black-forest-labs/flux-2-dev", { isActive: false }),
  ];

  it("n'expose que les modèles cometapi actifs/disponibles triés alphabétiquement", () => {
    const catalog = buildCometImageCatalog(mixedModels);
    expect(catalog.map((m) => m.id)).toEqual([
      "black-forest-labs/flux-1.1-pro",
      "black-forest-labs/flux-dev",
      "black-forest-labs/flux-pro",
    ]);
  });

  it("retombe sur le premier modèle alphabétique si omis ou obsolète, mais refuse les modèles hors CometAPI", () => {
    const catalog = buildCometImageCatalog(mixedModels);

    const defaulted = resolveCometImageRequestModel({
      models: catalog,
      requestedModel: undefined,
    });
    expect(defaulted.ok).toBe(true);
    if (defaulted.ok) {
      expect(defaulted.model.id).toBe("black-forest-labs/flux-1.1-pro");
    }

    const legacy = resolveCometImageRequestModel({
      models: catalog,
      requestedModel: "black-forest-labs/flux-schnell",
    });
    expect(legacy.ok).toBe(true);
    if (legacy.ok) {
      expect(legacy.model.id).toBe("black-forest-labs/flux-1.1-pro");
    }

    const openrouterImage = resolveCometImageRequestModel({
      models: catalog,
      requestedModel: "google/gemini-2.5-flash-image",
    });
    expect(openrouterImage.ok).toBe(false);
    if (!openrouterImage.ok) {
      expect(openrouterImage.status).toBe(404);
    }
  });
});

describe("Catalogue TTS, filtrage :free et adaptation des paramètres", () => {
  const speechModels: StoredModel[] = [
    makeStoredModel("deepgram/flux-tts", {
      architecture: { modality: "text->speech", output_modalities: ["speech"] },
      fournisseur: "openrouter",
      name: "Deepgram: Flux TTS",
      type: "audio",
      upstream: { supported_voices: ["flux-alexis-en", "flux-bree-en"] },
    }),
    makeStoredModel("heygen/heygen-voice-1-turbo:free", {
      architecture: { modality: "text->speech", output_modalities: ["speech"] },
      fournisseur: "openrouter",
      name: "HeyGen: HeyGen Voice Turbo (free)",
      type: "audio",
      upstream: { supported_voices: ["nadine", "bram"] },
    }),
    makeStoredModel("fish-audio/s2.1-pro-free:free", {
      architecture: { modality: "text->speech", output_modalities: ["speech"] },
      fournisseur: "openrouter",
      name: "Fish Audio: S2.1 Pro Free (free)",
      type: "audio",
      upstream: { supported_voices: null },
    }),
  ];

  const paramSpecs = parseOpenRouterSpeechCapabilities([
    {
      id: "heygen/heygen-voice-1-turbo",
      output_modalities: [
        {
          supported_parameters: {
            response_format: { values: ["pcm"] },
            voice: { values: ["nadine", "bram"] },
          },
          type: "speech",
        },
      ],
    },
    {
      id: "fish-audio/s2.1-pro-free",
      output_modalities: [
        {
          supported_parameters: {
            response_format: { values: ["mp3", "pcm"] },
            speed: { max: 2, min: 0.5 },
          },
          type: "speech",
        },
      ],
    },
    {
      id: "deepgram/flux-tts",
      output_modalities: [
        {
          supported_parameters: {
            response_format: { values: ["mp3", "pcm"] },
            voice: { values: ["flux-alexis-en", "flux-bree-en"] },
          },
          type: "speech",
        },
      ],
    },
  ]);

  it("limite Free aux deux modèles :free et expose tout aux comptes payants", () => {
    const freeIds = buildSpeechCatalog({
      isPaid: false,
      paramSpecs,
      storedModels: speechModels,
    }).map((m) => m.id);
    expect(freeIds).toEqual([
      "heygen/heygen-voice-1-turbo:free",
      "fish-audio/s2.1-pro-free:free",
    ]);

    const paidIds = buildSpeechCatalog({
      isPaid: true,
      paramSpecs,
      storedModels: speechModels,
    }).map((m) => m.id);
    expect(paidIds).toHaveLength(3);
  });

  it("omet speed quand non supporté et adapte response_format + voice", () => {
    const resolvedFree = resolveSpeechGenerationParams({
      allActiveModels: speechModels,
      isPaid: false,
      paramSpecs,
      requestedFormat: "mp3",
      requestedModel: "deepgram/flux-tts:free",
      requestedSpeed: 1.25,
      requestedVoice: "flux-alexis-en",
    });

    expect(resolvedFree.ok).toBe(true);
    if (resolvedFree.ok) {
      expect(resolvedFree.model.id).toBe("heygen/heygen-voice-1-turbo:free");
      expect(resolvedFree.voice).toBe("nadine");
      expect(resolvedFree.responseFormat).toBe("pcm");
      expect(resolvedFree.payload).not.toHaveProperty("speed");
    }

    const freeCallingPaid = resolveSpeechGenerationParams({
      allActiveModels: speechModels,
      isPaid: false,
      paramSpecs,
      requestedFormat: "mp3",
      requestedModel: "deepgram/flux-tts",
      requestedSpeed: 1,
      requestedVoice: "flux-alexis-en",
    });
    expect(freeCallingPaid.ok).toBe(false);
    if (!freeCallingPaid.ok) {
      expect(freeCallingPaid.status).toBe(403);
    }

    const fishResolved = resolveSpeechGenerationParams({
      allActiveModels: speechModels,
      isPaid: false,
      paramSpecs,
      requestedFormat: "mp3",
      requestedModel: "fish-audio/s2.1-pro-free:free",
      requestedSpeed: 1.2,
      requestedVoice: "flux-alexis-en",
    });
    expect(fishResolved.ok).toBe(true);
    if (fishResolved.ok) {
      expect(fishResolved.payload.speed).toBe(1.2);
      expect(fishResolved.payload).not.toHaveProperty("voice");
      expect(fishResolved.responseFormat).toBe("mp3");
    }
  });
});

describe("Encapsulation PCM -> WAV", () => {
  it("lit le taux d'échantillonnage et les canaux depuis Content-Type et génère un en-tête RIFF valide", () => {
    expect(parsePcmAudioParams("audio/pcm;rate=16000;channels=2")).toEqual({
      channels: 2,
      sampleRate: 16_000,
    });

    const pcm = new Uint8Array([0, 0, 1, 0, 2, 0, 3, 0]);
    const wrapped = wrapPcm16AsWav(pcm, { channels: 1, sampleRate: 24_000 });
    expect(wrapped.byteLength).toBe(44 + pcm.byteLength);
    expect(String.fromCharCode(...wrapped.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...wrapped.slice(8, 12))).toBe("WAVE");

    // Aucun double en-tête si déjà en WAV
    const doubleWrapped = wrapPcm16AsWav(wrapped);
    expect(doubleWrapped.byteLength).toBe(wrapped.byteLength);

    const normalized = normalizePlayableAudioBinary({
      bytes: pcm,
      requestedFormat: "pcm",
      upstreamContentType: "audio/pcm;rate=24000;channels=1",
    });
    expect(normalized.mimeType).toBe("audio/wav");
    expect(normalized.format).toBe("wav");
    expect(normalized.bytes.byteLength).toBe(44 + pcm.byteLength);
  });
});
