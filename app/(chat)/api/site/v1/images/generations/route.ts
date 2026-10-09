import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { type NextRequest, NextResponse } from "next/server";
import { recordApiLog } from "@/lib/site/api-key-manager";
import { getCometApiKey } from "@/lib/site/comet";
import { authenticateOpenAIRequest } from "@/lib/site/openai-auth";
import {
  getTierDailyImageLimit,
  getTierImageRequestCost,
} from "@/lib/site/tiers";

function parseDimension(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;
  return Number.isFinite(n) && n >= 64 && n <= 4096 ? n : null;
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  // 1. Authentification
  const auth = await authenticateOpenAIRequest(req);
  if (!auth.valid) {
    return auth.response;
  }

  // Déclaré hors du `try` pour rester accessible depuis le `catch` : toute exception
  // survenue après la réservation doit rendre le quota d'images du jour.
  let releaseQuota: (() => Promise<void>) | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt;
    const model = body.model || "black-forest-labs/flux-1-schnell";
    const sizeParts =
      typeof body.size === "string" && body.size.includes("x")
        ? body.size.split("x")
        : [];
    const width = parseDimension(body.width ?? sizeParts[0] ?? 1024);
    const height = parseDimension(body.height ?? sizeParts[1] ?? 1024);
    const negativePrompt = body.negative_prompt || "";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "missing_required_parameter",
            message: "Missing required parameter: 'prompt'.",
            param: "prompt",
            type: "invalid_request_error",
          },
        },
        { status: 400 }
      );
    }

    if (width === null || height === null) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_parameter",
            message:
              "Paramètre 'size' invalide. Format attendu : largeurxhauteur (ex: 1024x1024), valeurs entre 64 et 4096.",
            param: "size",
            type: "invalid_request_error",
          },
        },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "Configuration base de données manquante." },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);
    // Le quota doit être rattaché à un propriétaire stable et unique. `apiKeyId` est
    // une référence de clé (`mai-pro-XXXX`) et ne doit jamais servir de `user_id` ;
    // l'ancien repli "api_user" faisait en plus partager un seul quota d'images à
    // toutes les clés système. On dérive donc un seau dédié par empreinte de clé.
    const userId =
      auth.ownerId ??
      (auth.apiKeyToken
        ? `apikey:${createHash("sha256").update(auth.apiKeyToken).digest("hex").slice(0, 32)}`
        : "anonymous");
    const userPlan = auth.plan || "Free";

    // 2. Vérification des droits selon le forfait
    const planStr = userPlan.toLowerCase().trim();
    const isPaidPlan = ["plus", "pro", "max"].includes(planStr);

    if (!isPaidPlan) {
      return NextResponse.json(
        {
          error: {
            code: "image_generation_tier_restricted",
            message: `La génération d'images via l'API est réservée aux forfaits payants (Plus, Pro, Max). Votre forfait actuel (${userPlan}) ne permet pas d'utiliser l'API de génération d'images.`,
            param: null,
            type: "permission_error",
          },
        },
        { status: 403 }
      );
    }

    // 3. Réservation atomique du quota journalier (Plus: 10/j, Pro: 20/j, Max: 35/j)
    const dailyLimit = getTierDailyImageLimit(userPlan);
    const requestCost = getTierImageRequestCost(userPlan);

    const reserved = await sql`
      INSERT INTO mprojects_daily_image_usage (user_id, usage_date, images_generated, updated_at)
      VALUES (${userId}::text, CURRENT_DATE, 1, NOW())
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET 
        images_generated = mprojects_daily_image_usage.images_generated + 1,
        updated_at = NOW()
      WHERE mprojects_daily_image_usage.images_generated < ${dailyLimit}
      RETURNING images_generated
    `;

    if (reserved.length === 0) {
      const usageRows = await sql`
        SELECT images_generated 
        FROM mprojects_daily_image_usage 
        WHERE user_id = ${userId}::text AND usage_date = CURRENT_DATE 
        LIMIT 1
      `;
      const currentDailyUsage = usageRows[0]?.images_generated || dailyLimit;
      return NextResponse.json(
        {
          error: {
            code: "daily_image_quota_exceeded",
            limit: dailyLimit,
            message: `Votre quota journalier de génération d'images est atteint (${currentDailyUsage}/${dailyLimit} par jour pour le forfait ${userPlan}). Réinitialisation automatique à minuit UTC.`,
            type: "quota_error",
            used: currentDailyUsage,
          },
        },
        { status: 429 }
      );
    }
    const newDailyUsage = Number.parseInt(reserved[0].images_generated, 10);

    // Libère la place réservée si la génération échoue
    releaseQuota = async () => {
      try {
        await sql`
          UPDATE mprojects_daily_image_usage
          SET images_generated = GREATEST(images_generated - 1, 0), updated_at = NOW()
          WHERE user_id = ${userId}::text AND usage_date = CURRENT_DATE
        `;
      } catch (e) {
        console.error("Erreur libération quota image:", e);
      }
    };

    // 4. Appel à Comet API
    const cometApiKey = getCometApiKey();
    let generatedImageUrl = "";
    let cometResultData: any[] = [];

    if (cometApiKey) {
      let cometRes: Response;
      try {
        cometRes = await fetch(
          "https://api.cometapi.com/v1/images/generations",
          {
            body: JSON.stringify({
              model,
              n: 1,
              negative_prompt: negativePrompt || undefined,
              prompt,
              response_format: body.response_format || "url",
              size: `${width}x${height}`,
            }),
            headers: {
              Authorization: `Bearer ${cometApiKey}`,
              "Content-Type": "application/json",
            },
            method: "POST",
          }
        );
      } catch (e) {
        console.error("Erreur réseau Comet API:", e);
        await releaseQuota();
        return NextResponse.json(
          {
            error: {
              code: "provider_unreachable",
              message: "Le fournisseur de génération d'images est injoignable.",
              type: "api_error",
            },
          },
          { status: 502 }
        );
      }

      if (!cometRes.ok) {
        const errText = await cometRes.text().catch(() => "");
        console.error(`Comet API error ${cometRes.status}:`, errText);
        await releaseQuota();
        return NextResponse.json(
          {
            error: {
              code: "comet_api_error",
              message: "Erreur retournée par le fournisseur Comet API.",
              type: "api_error",
            },
          },
          { status: cometRes.status }
        );
      }

      const cometJson = await cometRes.json();
      cometResultData = cometJson.data || [];
      if (cometResultData.length > 0) {
        generatedImageUrl =
          cometResultData[0].url || cometResultData[0].b64_json || "";
      }
    } else {
      // Aucune clé Comet configurée : on refuse explicitement plutôt que de renvoyer
      // une image de substitution. Une image factive était historiquement enregistrée
      // comme 'completed' ET facturée au client comme une vraie génération.
      await releaseQuota();
      return NextResponse.json(
        {
          error: {
            code: "image_service_unconfigured",
            message:
              "Le service de génération d'images n'est pas configuré sur cette instance.",
            type: "api_error",
          },
        },
        { status: 503 }
      );
    }

    if (!generatedImageUrl) {
      await releaseQuota();
      return NextResponse.json(
        {
          error: {
            code: "empty_generation",
            message: "Le fournisseur n'a retourné aucune image.",
            type: "api_error",
          },
        },
        { status: 502 }
      );
    }

    // 5. Historique de génération
    await sql`
      INSERT INTO mprojects_image_generations (
        user_id, api_key, model, prompt, negative_prompt, width, height, image_url, status
      ) VALUES (
        ${userId}::text,
        ${auth.apiKeyToken}::text,
        ${model}::text,
        ${prompt}::text,
        ${negativePrompt || null},
        ${width}::integer,
        ${height}::integer,
        ${generatedImageUrl}::text,
        'completed'
      )
    `;

    // 6. Incrémentation du compteur de requêtes de la clé API
    if (auth.apiKeyToken) {
      await sql`
        UPDATE mprojects_api_keys
        SET request_count = request_count + ${requestCost}, last_used_at = NOW()
        WHERE api_key = ${auth.apiKeyToken}
      `;
    }

    // 7. Enregistrement d'usage log automatique
    const latency = Math.round(performance.now() - startTime);
    await recordApiLog({
      apiKey: auth.apiKeyToken || "anonymous",
      endpoint: "/v1/images/generations",
      latencyMs: latency,
      method: "POST",
      statusCode: 200,
    });

    return NextResponse.json({
      created: Math.floor(Date.now() / 1000),
      data: cometResultData,
      usage: {
        daily_limit: dailyLimit,
        daily_used: newDailyUsage,
        plan: userPlan,
        request_cost: requestCost,
      },
    });
  } catch (err: any) {
    console.error("Image Generation API Error:", err);
    // Toute exception survenue après la réservation (insert d'historique, update du
    // compteur…) doit rendre le quota, sinon le créneau image du jour est perdu.
    await releaseQuota?.();
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: "Erreur interne lors de la génération d'images.",
          type: "api_error",
        },
      },
      { status: 500 }
    );
  }
}
