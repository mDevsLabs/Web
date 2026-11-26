/**
 * Client d'images CometAPI, partagé par la route `/api/images/generations` et
 * l'outil de génération du Chat/Agent.
 *
 * POURQUOI UN CLIENT DÉDIÉ
 *
 * CometAPI n'expose pas tous ses modèles sur `/v1/images/generations` :
 *  - les modèles FLUX (`black-forest-labs/*`, `flux-*`) doivent être appelés au
 *    « format flux » : `POST /flux/v1/<modèle>` puis interrogation de
 *    `GET /flux/v1/get_result?id=…` jusqu'à `status: "Ready"`. L'ancien appel
 *    OpenAI renvoyait 404 (ID namespacé) ou 400 (« must be called via the flux
 *    format ») : c'est le bug « Le fournisseur d'images a renvoyé une erreur » ;
 *  - les autres modèles (gpt-image-*, etc.) suivent le format OpenAI et
 *    répondent en `b64_json`.
 *
 * Les paramètres non standard (`negative_prompt`, `response_format`…) ne sont
 * pas envoyés : l'amont les refuse sur certains modèles.
 */

const COMET_BASE_URL = "https://api.cometapi.com";
const FLUX_POLL_INTERVAL_MS = 2000;
const FLUX_POLL_TIMEOUT_MS = 100_000;
const FLUX_MIN_SIDE = 256;
const FLUX_MAX_SIDE = 1440;

export type CometImageResult = { b64_json?: string; url?: string };

export class CometImageError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CometImageError";
    this.status = status;
  }
}

export type CometImageParams = {
  apiKey: string;
  fetcher?: typeof fetch;
  height: number;
  modelId: string;
  pollIntervalMs?: number;
  prompt: string;
  signal?: AbortSignal;
  width: number;
};

/** Alias dont le nom d'appel diffère du nom du catalogue namespacé. */
const FLUX_CALL_ALIASES: Record<string, string> = {
  "black-forest-labs/flux-1.1-pro": "flux-pro-1.1",
  "black-forest-labs/flux-1.1-pro-ultra": "flux-pro-1.1-ultra",
  "flux-1.1-pro": "flux-pro-1.1",
  "flux-1.1-pro-ultra": "flux-pro-1.1-ultra",
};

export function isFluxModelId(modelId: string): boolean {
  const lower = modelId.toLowerCase().trim();
  const shortName = stripNamespace(lower);
  return lower.startsWith("black-forest-labs/") || shortName.startsWith("flux");
}

function stripNamespace(modelId: string): string {
  return modelId.includes("/")
    ? modelId.split("/").slice(1).join("/")
    : modelId;
}

/** Noms à essayer, du plus probable au moins probable, sans doublon. */
export function fluxCallCandidates(modelId: string): string[] {
  const lower = modelId.toLowerCase().trim();
  const shortName = stripNamespace(lower);
  const names = [
    FLUX_CALL_ALIASES[lower],
    FLUX_CALL_ALIASES[shortName],
    shortName,
    lower,
  ].filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

function clampFluxSide(value: number): number {
  const rounded = Math.round(value / 32) * 32;
  return Math.min(FLUX_MAX_SIDE, Math.max(FLUX_MIN_SIDE, rounded));
}

/** gpt-image n'accepte que trois formats : on prend le plus proche du ratio. */
export function nearestGptImageSize(width: number, height: number): string {
  if (width > height * 1.2) {
    return "1536x1024";
  }
  if (height > width * 1.2) {
    return "1024x1536";
  }
  return "1024x1024";
}

async function readError(res: Response): Promise<string> {
  return await res
    .text()
    .then((text) => text.slice(0, 400))
    .catch(() => "");
}

async function generateFlux(
  params: CometImageParams
): Promise<CometImageResult> {
  const doFetch = params.fetcher ?? fetch;
  const headers = {
    Authorization: `Bearer ${params.apiKey}`,
    "Content-Type": "application/json",
  };
  const body = {
    height: clampFluxSide(params.height),
    prompt: params.prompt,
    width: clampFluxSide(params.width),
  };

  let lastStatus = 502;
  let lastBody = "";
  for (const name of fluxCallCandidates(params.modelId)) {
    const submit = await doFetch(`${COMET_BASE_URL}/flux/v1/${name}`, {
      body: JSON.stringify(body),
      headers,
      method: "POST",
      signal: params.signal,
    });
    if (!submit.ok) {
      lastStatus = submit.status;
      lastBody = await readError(submit);
      // Mauvais nom d'appel : on tente le candidat suivant.
      if ([400, 404, 503].includes(submit.status)) {
        continue;
      }
      break;
    }

    const task = (await submit.json().catch(() => null)) as {
      id?: string;
    } | null;
    if (!task?.id) {
      throw new CometImageError(
        "Réponse CometAPI sans identifiant de tâche.",
        502
      );
    }

    const deadline = Date.now() + FLUX_POLL_TIMEOUT_MS;
    const interval = params.pollIntervalMs ?? FLUX_POLL_INTERVAL_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      const poll = await doFetch(
        `${COMET_BASE_URL}/flux/v1/get_result?id=${encodeURIComponent(task.id)}`,
        { headers, signal: params.signal }
      );
      if (!poll.ok) {
        throw new CometImageError(await readError(poll), poll.status);
      }
      const state = (await poll.json().catch(() => null)) as {
        result?: { sample?: string };
        status?: string;
      } | null;
      if (state?.status === "Ready") {
        const url = state.result?.sample;
        if (!url) {
          throw new CometImageError("Aucune image retournée.", 502);
        }
        return { url };
      }
      if (
        ["Error", "Failed", "Content Moderated", "Request Moderated"].includes(
          state?.status ?? ""
        )
      ) {
        throw new CometImageError(`Génération refusée : ${state?.status}`, 422);
      }
    }
    throw new CometImageError("Délai de génération dépassé.", 504);
  }
  throw new CometImageError(
    lastBody || "Modèle FLUX indisponible.",
    lastStatus
  );
}

async function generateOpenAiStandard(
  params: CometImageParams
): Promise<CometImageResult> {
  const doFetch = params.fetcher ?? fetch;
  const lower = params.modelId.toLowerCase();
  const isGptImage = stripNamespace(lower).startsWith("gpt-image");
  const size = isGptImage
    ? nearestGptImageSize(params.width, params.height)
    : `${params.width}x${params.height}`;

  let lastStatus = 502;
  let lastBody = "";
  for (const name of [
    ...new Set([stripNamespace(params.modelId), params.modelId]),
  ]) {
    const res = await doFetch(`${COMET_BASE_URL}/v1/images/generations`, {
      body: JSON.stringify({ model: name, n: 1, prompt: params.prompt, size }),
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: params.signal,
    });
    if (!res.ok) {
      lastStatus = res.status;
      lastBody = await readError(res);
      if ([400, 404, 503].includes(res.status)) {
        continue;
      }
      break;
    }
    const json = (await res.json().catch(() => null)) as {
      data?: CometImageResult[];
    } | null;
    const first = json?.data?.[0];
    if (!(first?.url || first?.b64_json)) {
      throw new CometImageError("Aucune image retournée.", 502);
    }
    return { b64_json: first.b64_json, url: first.url };
  }
  throw new CometImageError(
    lastBody || "Modèle d'image indisponible.",
    lastStatus
  );
}

export function generateCometImage(
  params: CometImageParams
): Promise<CometImageResult> {
  return isFluxModelId(params.modelId)
    ? generateFlux(params)
    : generateOpenAiStandard(params);
}
