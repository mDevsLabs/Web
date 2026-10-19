// ─────────────────────────────────────────────
// Outils portables communs aux surfaces mAI.
//
// Chat, Agent et Wakies utilisent déjà les implémentations Next
// (`lib/ai/tools/*`) ; ce module est le miroir exécutable du backend Val Town,
// pour que Vibe propose LES MÊMES outils de base : calcul, date/heure et
// lecture d'URL. Il ne dépend ni de Deno, ni de Hono, ni de la base : il est
// importable partout et testable seul.
//
// La liste `PORTABLE_TOOL_IDS` est le contrat : une surface qui ajoute un outil
// ici doit l'ajouter aux trois autres, et inversement.
// ─────────────────────────────────────────────

export const PORTABLE_TOOL_IDS = ["calculator", "dateTime", "readUrl"] as const;

export type PortableToolId = (typeof PORTABLE_TOOL_IDS)[number];

/**
 * Calcule une expression arithmétique simple.
 *
 * L'entrée est bornée avant évaluation : seuls chiffres, opérateurs, espaces,
 * parenthèses et point décimal sont acceptés. Une expression refusée renvoie
 * une erreur, jamais une évaluation partielle.
 */
function calculate(expression: string): number {
  const nettoyee = String(expression ?? "").trim();
  if (!nettoyee || nettoyee.length > 200) {
    throw new Error("Expression absente ou trop longue.");
  }
  if (!/^[\d\s+\-*/().%]+$/.test(nettoyee)) {
    throw new Error("Expression refusée : caractères non arithmétiques.");
  }
  const valeur = Function(`"use strict"; return (${nettoyee});`)();
  if (typeof valeur !== "number" || !Number.isFinite(valeur)) {
    throw new Error("Le résultat n'est pas un nombre fini.");
  }
  return valeur;
}

/** Extrait le texte lisible d'une page HTML, sans dépendance externe. */
function texteDepuisHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function executePortableTool(
  id: string,
  args: Record<string, any> = {}
): Promise<unknown> {
  switch (id) {
    case "calculator": {
      const expression = String(args.expression ?? args.input ?? "");
      return { expression, result: calculate(expression), success: true };
    }
    case "dateTime": {
      const date = args.date ? new Date(String(args.date)) : new Date();
      if (Number.isNaN(date.getTime())) {
        throw new Error("Date illisible.");
      }
      return {
        iso: date.toISOString(),
        timestamp: date.getTime(),
        timezone: args.timezone ?? "UTC",
      };
    }
    case "readUrl": {
      const url = String(args.url ?? "");
      if (!/^https?:\/\//i.test(url)) {
        throw new Error("URL http(s) requise.");
      }
      const controleur = new AbortController();
      const minuteur = setTimeout(() => controleur.abort(), 15_000);
      try {
        const reponse = await fetch(url, { signal: controleur.signal });
        if (!reponse.ok) {
          throw new Error(`HTTP ${reponse.status}`);
        }
        const brut = await reponse.text();
        return {
          content: texteDepuisHtml(brut).slice(0, 20_000),
          title: /<title[^>]*>([\s\S]*?)<\/title>/i
            .exec(brut)?.[1]
            ?.trim()
            ?.slice(0, 200),
          url,
        };
      } finally {
        clearTimeout(minuteur);
      }
    }
    default:
      throw new Error(`Outil portable inconnu : ${id}`);
  }
}
