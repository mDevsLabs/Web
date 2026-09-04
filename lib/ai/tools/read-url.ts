import { tool } from "ai";
import { z } from "zod";

function cleanHtmlToText(html: string): string {
  // Supprimer les balises script, style, noscript, svg, iframe
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ");

  // Remplacer les balises de structure par des sauts de ligne
  cleaned = cleaned
    .replace(/<\/(h[1-6]|p|div|section|article|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n");

  // Supprimer toutes les autres balises HTML
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Décoder les entités HTML fréquentes
  cleaned = cleaned
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "—");

  // Normaliser les espaces et sauts de ligne
  return cleaned
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .filter(
      (line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1]?.length > 0)
    )
    .join("\n")
    .trim();
}

function extractMeta(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch =
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
    );

  return {
    description: descMatch ? descMatch[1].trim() : undefined,
    title: titleMatch ? titleMatch[1].trim() : undefined,
  };
}

function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Hostnames réservés / locaux
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    return true;
  }

  // Vérification des adresses IPv4
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    if (octets.some((o) => o > 255)) return true; // IP invalide

    // 0.0.0.0/8 (Broadcast/source)
    if (octets[0] === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;
    // 10.0.0.0/8 (Privé)
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 (Privé: 172.16.0.0 à 172.31.255.255)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16 (Privé)
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 169.254.0.0/16 (Link-local & Métadonnées AWS/GCP/Azure)
    if (octets[0] === 169 && octets[1] === 254) return true;
    // 100.64.0.0/10 (CGNAT)
    if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;
  }

  // IPv6 (entre crochets ou brutes)
  const cleanIpv6 = host.replace(/^\[|\]$/g, "");
  if (
    cleanIpv6 === "::1" ||
    cleanIpv6 === "::" ||
    cleanIpv6.startsWith("fe80:") ||
    cleanIpv6.startsWith("fc00:") ||
    cleanIpv6.startsWith("fd") ||
    cleanIpv6.includes("::ffff:127.") ||
    cleanIpv6.includes("::ffff:10.") ||
    cleanIpv6.includes("::ffff:192.168.")
  ) {
    return true;
  }

  return false;
}

export const readUrl = tool({
  description:
    "Extraire et lire le contenu textuel propre d'une page Web ou d'une documentation technique à partir de son URL. Supprime les éléments parasites (scripts, styles, menus) et renvoie le texte structuré pour analyse.",
  execute: async (input) => {
    const rawUrl = input.url.trim();
    if (!rawUrl) {
      return { error: "URL manquante ou vide." };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(
        rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
      );
    } catch {
      return { error: `URL invalide : "${rawUrl}".` };
    }

    // Protection anti-SSRF
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        error: "Protocole non autorisé. Seuls HTTP et HTTPS sont acceptés.",
      };
    }

    if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
      return {
        error:
          "Accès refusé pour des raisons de sécurité (adresse IP privée, locale ou métadonnées internes).",
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);

      const response = await fetch(parsedUrl.toString(), {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 mAI-Bot/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          error: `Impossible de charger la page (HTTP ${response.status} : ${response.statusText}).`,
          url: parsedUrl.toString(),
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();

      const maxChars = Math.min(
        Math.max(input.maxLength ?? 15_000, 1000),
        50_000
      );

      let textContent = "";
      let title: string | undefined;
      let description: string | undefined;

      if (contentType.includes("html") || rawText.includes("<html")) {
        const meta = extractMeta(rawText);
        title = meta.title;
        description = meta.description;
        textContent = cleanHtmlToText(rawText);
      } else {
        textContent = rawText.trim();
      }

      const isTruncated = textContent.length > maxChars;
      const truncatedContent = isTruncated
        ? `${textContent.slice(0, maxChars)}\n\n[... Contenu tronqué à ${maxChars} caractères pour préserver le contexte]`
        : textContent;

      return {
        content: truncatedContent,
        description,
        isTruncated,
        length: textContent.length,
        title: title || parsedUrl.hostname,
        url: parsedUrl.toString(),
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { error: "Délai de connexion dépassé (timeout 12s)." };
      }
      return {
        error: `Erreur lors de la récupération de l'URL : ${err.message || "inconnue"}`,
      };
    }
  },
  inputSchema: z.object({
    maxLength: z
      .number()
      .int()
      .min(1000)
      .max(50_000)
      .optional()
      .describe("Nombre maximum de caractères à extraire (défaut: 15000)"),
    url: z
      .string()
      .url()
      .or(z.string().min(3))
      .describe(
        "L'adresse URL du site Web ou de la documentation à lire (ex: https://nextjs.org/docs)"
      ),
  }),
});
