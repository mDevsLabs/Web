import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower.startsWith("10.") ||
    lower.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)
  ) {
    return true;
  }
  return false;
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
    if (isBlockedHost(parsed.hostname)) {
      return new NextResponse("Hôte non autorisé", { status: 403 });
    }
  } catch {
    return new NextResponse("URL malformée", { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return new NextResponse("Image distante indisponible", {
        status: res.status,
      });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": contentType,
      },
      status: 200,
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "Erreur de proxy d'image", {
      status: 502,
    });
  }
}
