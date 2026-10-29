import { type NextRequest, NextResponse } from "next/server";
import { sniffImageType } from "@/lib/search/image-sniff";
import { safeFetchBuffer } from "@/lib/web/safe-fetch";

export const maxDuration = 15;

// Plafond volontairement modeste : une vignette de résultat de recherche n'a
// aucune raison de peser davantage.
const MAX_IMAGE_BYTES = 5_000_000;
const IMAGE_TIMEOUT_MS = 6000;

function responseHeaders(contentType: string): Record<string, string> {
  return {
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": contentType,
    "Cross-Origin-Resource-Policy": "same-origin",
    // Le type annoncé est celui des octets réellement détectés.
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return new NextResponse("URL manquante", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Protocole invalide", { status: 400 });
    }
  } catch {
    return new NextResponse("URL malformée", { status: 400 });
  }

  // safeFetchBuffer épingle la résolution DNS, revalide chaque redirection et
  // borne taille et délai : aucune requête ne part vers une adresse privée,
  // locale ou de métadonnées, même après un `Location:` intermédiaire.
  const result = await safeFetchBuffer(parsed.toString(), {
    allowedContentTypes: [/^image\//i],
    headers: {
      Accept:
        "image/avif,image/webp,image/apng,image/png,image/jpeg,image/gif,*/*;q=0.5",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    maxBytes: MAX_IMAGE_BYTES,
    maxRedirects: 3,
    timeoutMs: IMAGE_TIMEOUT_MS,
  });

  if (!result.ok) {
    // Le statut amont n'est pas relayé tel quel : un 401/403 distant ne doit
    // pas laisser croire à un problème de session mAI.
    return new NextResponse("Image distante indisponible", { status: 502 });
  }
  if (result.truncated) {
    return new NextResponse("Image trop volumineuse", { status: 413 });
  }

  // Le type déclaré ne suffit pas : on exige une signature binaire connue.
  // HTML déguisé en image/png, SVG actif et contenu exécutable sont refusés.
  const detected = sniffImageType(result.buffer);
  if (!detected) {
    return new NextResponse("Format d'image non autorisé", { status: 415 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: responseHeaders(detected),
    status: 200,
  });
}
