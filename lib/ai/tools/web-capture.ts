import { tool } from "ai";
import { z } from "zod";
import { redactUrlForThirdParty, safeExternalUrl } from "@/lib/web/ssrf";
import { safeFetchBuffer, safeFetchText } from "@/lib/web/safe-fetch";

function extractMetaContent(
  html: string,
  patterns: RegExp[]
): string | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      return m[1]
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
  }
}

function detectTechnologies(html: string): string[] {
  const techs: string[] = [];
  const signals: [RegExp, string][] = [
    [/\/_next\//i, "Next.js"],
    [/wp-content|wp-includes/i, "WordPress"],
    [/cdn\.shopify\.com/i, "Shopify"],
    [/gtag\(|googletagmanager/i, "Google Analytics"],
    [/tailwind/i, "Tailwind CSS"],
    [/bootstrap/i, "Bootstrap"],
    [/react/i, "React"],
    [/vue(\.min)?\.js/i, "Vue.js"],
    [/cloudflare/i, "Cloudflare"],
    [/stripe\.com/i, "Stripe"],
  ];
  for (const [re, name] of signals) {
    if (re.test(html)) {
      techs.push(name);
    }
    if (techs.length >= 8) {
      break;
    }
  }
  return techs;
}

// Capture d'écran via service externe gratuit sans clé, avec repli.
function buildScreenshotUrls(url: string): string[] {
  const encoded = encodeURIComponent(url);
  return [
    `https://image.thum.io/get/width/1200/crop/900/${url}`,
    `https://s0.wp.com/mshots/v1/${encoded}?w=1200&h=900`,
  ];
}

// webCapture : capture d'écran réelle + métadonnées OpenGraph/SEO d'une page.
// La capture est rendue visible au modèle vision via toModelOutput multimodal.
export const webCapture = tool({
  description:
    "Capture une page web comme un navigateur : screenshot réel de l'URL + métadonnées OpenGraph (titre, image, description), informations SEO (robots, canonical, lang, h1) et technologies détectées. À activer pour critiquer le design d'un site, analyser une landing page, auditer le SEO ou montrer visuellement un site à l'utilisateur.",
  execute: async ({ url }, options) => {
    const target = safeExternalUrl(url.trim());
    if (target.error || !target.url) {
      return { error: target.error ?? "URL invalide." };
    }
    const finalUrl = target.url.toString();

    try {
      // Client unique : redirections revalidées (une page publique peut
      // rediriger vers 169.254.169.254) et corps plafonné pendant la lecture —
      // `(await response.text()).slice(...)` allouait tout avant troncature.
      const fetched = await safeFetchText(finalUrl, {
        allowedContentTypes: ["html", "xml", "text/", "json"],
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 mAI-Bot/1.0",
        },
        maxBytes: 500_000,
        timeoutMs: 15_000,
      });

      if (!fetched.ok) {
        return {
          error: `Impossible de charger la page (${fetched.error}).`,
          url: finalUrl,
        };
      }

      const html = fetched.text;

      const meta = (name: string) =>
        extractMetaContent(html, [
          new RegExp(
            `<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
            "i"
          ),
          new RegExp(
            `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
            "i"
          ),
        ]);

      const title =
        meta("og:title") ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
      const description =
        meta("og:description") ||
        meta("description") ||
        meta("twitter:description");
      const ogImage = meta("og:image");
      const robots = meta("robots");
      const canonical =
        html.match(
          /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i
        )?.[1] ?? undefined;
      const lang =
        html.match(/<html[^>]*lang=["']([^"']+)["']/i)?.[1] ?? undefined;
      const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
        .map((m) =>
          m[1]
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean)
        .slice(0, 5);
      const technologies = detectTechnologies(html);
      // Le service de capture est un tiers : il reçoit une URL débarrassée de
      // ses paramètres sensibles (jeton de session, clé, lien signé).
      const screenshotUrls = buildScreenshotUrls(
        redactUrlForThirdParty(finalUrl)
      );

      // Vérifie rapidement que le service de capture répond (fallback sinon)
      let screenshotUrl = screenshotUrls[0];
      try {
        const probe = await fetch(screenshotUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
        });
        if (!probe.ok) {
          screenshotUrl = screenshotUrls[1];
        }
      } catch {
        screenshotUrl = screenshotUrls[1];
      }

      const result = {
        description,
        h1s,
        lang,
        ogImage,
        robots,
        screenshotFallbackUrl: screenshotUrls[1],
        screenshotUrl,
        technologies,
        title,
        url: finalUrl,
      };

      // Modèles vision : l'image de capture est transmise au modèle.
      // Plafonnée (2 Mo) : une capture de 4 K en base64 représente plusieurs
      // mégaoctets qui seraient sinon ajoutés au contexte du modèle.
      try {
        const image = await safeFetchBuffer(screenshotUrl, {
          allowedContentTypes: ["image/"],
          maxBytes: 2_000_000,
          timeoutMs: 12_000,
        });
        if (image.ok) {
          (result as any).__screenshotBase64 = `data:image/png;base64,${image.buffer.toString("base64")}`;
        }
      } catch {}

      return result;
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.name === "TimeoutError") {
        return { error: "Délai de capture dépassé (timeout).", url: finalUrl };
      }
      return {
        error: `Erreur lors de la capture : ${err?.message || "inconnue"}`,
        url: finalUrl,
      };
    }
  },
  inputSchema: z.object({
    url: z.string().url().describe("URL complète de la page à capturer."),
  }),
  // Sortie multimodale : le texte + la capture d'écran (si obtenue) sont
  // envoyés au modèle pour analyse visuelle.
  toModelOutput: ({ output }: { output: any }) => {
    const value: any[] = [
      {
        text: JSON.stringify(
          {
            description: output?.description,
            h1s: output?.h1s,
            lang: output?.lang,
            ogImage: output?.ogImage,
            robots: output?.robots,
            technologies: output?.technologies,
            title: output?.title,
            url: output?.url,
          },
          null,
          2
        ),
        type: "text",
      },
    ];
    if (output?.__screenshotBase64) {
      value.push({
        data: output.__screenshotBase64,
        mediaType: "image/png",
        type: "image",
      });
    }
    return { type: "content" as const, value };
  },
});
