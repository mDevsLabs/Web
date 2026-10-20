/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — OUTILS CRÉATIFS & ANALYTIQUES (vibe-mai-creative.ts)
 * ============================================================================
 *
 * Module séparé de `vibe-mai-fleet.ts` pour une raison prosaïque : Val Town
 * impose une limite de taille de fichier, et la flotte approchait déjà de
 * ses 2000 lignes. Les outils d'écriture et d'analyse y vivent désormais,
 * mais la flotte reste le point d'entrée unique : elle délègue.
 *
 * Ces outils ne publient rien. Ils produisent du texte que l'utilisateur
 * relit, corrige et publie lui-même (via `/publish`, qui reste sensible).
 * Aucun n'est donc dans `SENSITIVE_TOOLS`.
 */

/** Réponse LLM absente : aucune clé IA n'est configurée sur le serveur. */
const NO_KEY_ERROR =
  "Génération indisponible : aucune clé IA configurée sur le serveur.";

/**
 * Appel au modèle de langage.
 *
 * Injecté par la flotte plutôt qu'importé : la flotte appelle ce module, un
 * import direct créerait un cycle entre les deux fichiers. Le cycle
 * fonctionnerait (bindings vivants), mais il rend l'ordre de chargement
 * dépendant du point d'entrée — une fragilité inutile.
 */
export type CreativeLlmCaller = (
  system: string,
  user: string,
  model?: string
) => Promise<string | null>;

/** Réseaux sociaux cibles de l'adaptation de post. */
const NETWORKS = ["x", "instagram", "linkedin"] as const;

type Network = (typeof NETWORKS)[number];

function normalizeNetwork(raw: unknown): Network {
  const value = String(raw || "")
    .toLowerCase()
    .trim();
  if (value.startsWith("insta")) return "instagram";
  if (value.startsWith("linked")) return "linkedin";
  return "x";
}

/** Contraintes éditoriales par réseau : c'est le cœur de l'adaptation. */
const NETWORK_RULES: Record<
  Network,
  { hint: string; maxLength: number; name: string }
> = {
  instagram: {
    hint: "3 à 5 phrases, hashtags en fin de post, émojis mesurés.",
    maxLength: 2200,
    name: "Instagram",
  },
  linkedin: {
    hint: "Ton professionnel, une accroche courte, 3 à 5 lignes, pas de hashtag au-delà de 3.",
    maxLength: 3000,
    name: "LinkedIn",
  },
  x: {
    hint: "Une seule idée, 280 caractères maximum, aucun hashtag ou un seul.",
    maxLength: 280,
    name: "X",
  },
};

/**
 * Exécute un outil créatif ou analytique.
 *
 * @param toolName Identifiant du catalogue (`analyze_sentiment`, …).
 * @param args    Arguments déjà parsés par `detectTool()`.
 * @param uid     Identifiant de l'utilisateur (pour les lectures SQL).
 * @param sql     Client SQL (le même que celui de la flotte).
 */
export async function executeCreativeTool(
  toolName: string,
  args: Record<string, any>,
  uid: number,
  sql: any,
  callLlm: CreativeLlmCaller
): Promise<any> {
  switch (toolName) {
    // ── ANALYSE DE SENTIMENT ────────────────────────────────────────────
    case "analyze_sentiment": {
      const { post_id } = args;
      if (!post_id) throw new Error("post_id est requis.");

      const rows = await sql`
        SELECT c.content, COALESCE(c.likes_count, 0) AS likes
        FROM comments c
        WHERE c.post_id = ${post_id}::uuid AND c.is_hidden = FALSE
        ORDER BY c.likes_count DESC
        LIMIT 200
      `;

      const comments = (rows as any[]).map((row) =>
        String(row.content || "").trim()
      );
      const visible = comments.filter(Boolean);
      if (visible.length === 0) {
        throw new Error("Aucun commentaire visible sur cette publication.");
      }

      const llm = await callLlm(
        `Tu analyses le sentiment d'une discussion en ligne. Réponds UNIQUEMENT par un objet JSON strict, sans texte autour, avec ces clés : {"polarity": "positive|neutral|negative|mixed", "score": nombre entre -1 et 1, "key_terms": ["terme", ...] (3 à 6 termes qui portent le sentiment), "summary": "une phrase de synthèse", "top_comment": "le commentaire le plus représentatif"}.`,
        visible.join("\n---\n")
      );
      if (!llm) throw new Error(NO_KEY_ERROR);

      // Le modèle peut bavarder autour du JSON : on extrait l'objet.
      const match = llm.match(/\{[\s\S]*\}/);
      let analysis: any = null;
      try {
        analysis = JSON.parse(match ? match[0] : llm);
      } catch {
        analysis = null;
      }

      return {
        analysis: analysis ?? {
          polarity: "neutral",
          score: 0,
          summary: llm,
        },
        commentCount: visible.length,
        post_id,
        raw: analysis ? undefined : llm,
      };
    }

    // ── RÉSUMÉ D'UN FIL DE COMMENTAIRES ──────────────────────────────────
    case "summarize_thread": {
      const { post_id } = args;
      if (!post_id) throw new Error("post_id est requis.");

      const rows = await sql`
        SELECT c.content, u.username
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ${post_id}::uuid AND c.is_hidden = FALSE
        ORDER BY c.depth ASC, c.created_at ASC
        LIMIT 300
      `;

      const comments = (rows as any[])
        .map((row) => `@${row.username} : ${String(row.content || "").trim()}`)
        .filter((line) => line.length > 3);
      if (comments.length === 0) {
        throw new Error("Aucun commentaire visible sur cette publication.");
      }

      const llm = await callLlm(
        `Tu synthétises une discussion en ligne. Réponds UNIQUEMENT par un objet JSON strict, sans texte autour, avec ces clés : {"summary": "résumé en 2 à 4 phrases", "key_points": ["point clé", ...] (3 à 6 points), "disagreements": ["désaccord notable", ...], "participants_count": nombre}.`,
        comments.join("\n")
      );
      if (!llm) throw new Error(NO_KEY_ERROR);

      const match = llm.match(/\{[\s\S]*\}/);
      let analysis: any = null;
      try {
        analysis = JSON.parse(match ? match[0] : llm);
      } catch {
        analysis = null;
      }

      return {
        analysis: analysis ?? { key_points: [], summary: llm },
        commentCount: comments.length,
        post_id,
        raw: analysis ? undefined : llm,
      };
    }

    // ── ADAPTATION D'UN POST PAR RÉSEAU ───────────────────────────────────
    case "adapt_post": {
      const { text, network = "x" } = args;
      if (!text?.trim()) throw new Error("Le texte à adapter est requis.");

      const target = normalizeNetwork(network);
      const rules = NETWORK_RULES[target];

      const llm = await callLlm(
        `Tu réécris un publication pour ${rules.name}. Contraintes : ${rules.hint} Maximum ${rules.maxLength} caractères. Réponds UNIQUEMENT par le texte final, sans guillemets ni commentaire.`,
        String(text)
      );
      if (!llm) throw new Error(NO_KEY_ERROR);

      const adapted = llm.trim();
      return {
        adapted,
        characterCount: adapted.length,
        maxLength: rules.maxLength,
        network: target,
        networkName: rules.name,
        original: String(text),
        withinLimit: adapted.length <= rules.maxLength,
      };
    }

    // ── VARIANTES D'UN POST ───────────────────────────────────────────────
    case "generate_variants": {
      const { text, tone = "viral" } = args;
      if (!text?.trim()) throw new Error("Le texte source est requis.");

      const llm = await callLlm(
        `Tu proposes 3 accroches alternatives pour une publication, dans un style « ${tone} ». Chaque variante doit attackquer par un angle différent (question, constat,rebond d'actualité). Réponds UNIQUEMENT par un objet JSON strict : {"variants": [{"hook": "...", "angle": "..."}]}.`,
        String(text)
      );
      if (!llm) throw new Error(NO_KEY_ERROR);

      const match = llm.match(/\{[\s\S]*\}/);
      let parsed: any = null;
      try {
        parsed = JSON.parse(match ? match[0] : llm);
      } catch {
        parsed = null;
      }

      const variants = Array.isArray(parsed?.variants)
        ? parsed.variants
        : [
            {
              angle: "variante",
              hook: llm,
            },
          ];

      return {
        source: String(text),
        tone,
        variants,
      };
    }

    // ── LÉGENDE ET HASHTAGS ───────────────────────────────────────────────
    case "generate_caption": {
      const { text, context = "" } = args;
      if (!text?.trim()) throw new Error("Le visuel ou le sujet est requis.");

      const llm = await callLlm(
        `Tu écris une légende de publication à partir d'un visuel. Règles : 1 à 3 phrases, ton naturel, pas de hashtag dans la phrase. Ajoute 5 à 8 hashtags pertinents. Réponds UNIQUEMENT par un objet JSON strict : {"caption": "...", "hashtags": ["#tag", ...], "call_to_action": "..."}.${context ? ` Contexte : ${context}.` : ""}`,
        String(text)
      );
      if (!llm) throw new Error(NO_KEY_ERROR);

      const match = llm.match(/\{[\s\S]*\}/);
      let parsed: any = null;
      try {
        parsed = JSON.parse(match ? match[0] : llm);
      } catch {
        parsed = null;
      }

      return {
        callToAction: parsed?.call_to_action ?? "",
        caption: parsed?.caption ?? llm,
        hashtags: Array.isArray(parsed?.hashtags) ? parsed.hashtags : [],
        source: String(text),
      };
    }

    // ── COMPARAISON DE DEUX MODÈLES ──────────────────────────────────────
    case "compare_models": {
      const { prompt, model_a, model_b } = args;
      if (!prompt?.trim()) throw new Error("Le prompt est requis.");
      if (!model_a || !model_b) {
        throw new Error("Deux modèles sont requis (model_a et model_b).");
      }
      if (model_a === model_b) {
        throw new Error("Choisissez deux modèles différents.");
      }

      // Les deux appels sont concurrents : la comparaison mesure le temps de
      // réponse, pas la somme des deux.
      const [first, second] = await Promise.all([
        measure(() =>
          callLlm(
            "Tu réponds à la question de l'utilisateur, de façon concise et précise.",
            String(prompt),
            model_a
          )
        ),
        measure(() =>
          callLlm(
            "Tu réponds à la question de l'utilisateur, de façon concise et précise.",
            String(prompt),
            model_b
          )
        ),
      ]);

      if (!first.text && !second.text) throw new Error(NO_KEY_ERROR);

      return {
        modelA: {
          latencyMs: first.latencyMs,
          model: model_a,
          response: first.text ?? "",
          responseLength: first.text?.length ?? 0,
        },
        modelB: {
          latencyMs: second.latencyMs,
          model: model_b,
          response: second.text ?? "",
          responseLength: second.text?.length ?? 0,
        },
        prompt: String(prompt),
      };
    }

    default:
      return null;
  }
}

/** Mesure la latence d'un appel. */
async function measure<T>(fn: () => Promise<T>): Promise<{
  latencyMs: number;
  text: T;
}> {
  const startedAt = Date.now();
  const text = await fn();
  return { latencyMs: Date.now() - startedAt, text };
}
