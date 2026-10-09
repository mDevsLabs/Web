import { neon } from "@neondatabase/serverless";
import { getTierDailyImageLimit, getUserQuotaBoost } from "@/lib/site/tiers";

export interface UserImageUsageData {
  dailyLimit: number;
  history: Array<{
    id: string;
    model: string;
    prompt: string;
    negativePrompt?: string;
    width: number;
    height: number;
    imageUrl?: string;
    status: string;
    createdAt: string;
  }>;
  plan: string;
  resetAt: string;
  usedToday: number;
}

export async function getUserImageUsageForUser(userId: string): Promise<{
  success: boolean;
  data?: UserImageUsageData;
  error?: string;
}> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL manquante.");
    }

    const sql = neon(databaseUrl);

    // 1. Récupérer le plan de l'utilisateur
    const userRows = await sql`
      SELECT tier FROM users
      WHERE id::text = ${userId}::text 
         OR username = ${userId}::text 
         OR email = ${userId}::text
      LIMIT 1
    `;
    const tier = userRows[0]?.tier || "Free";
    const imageBoost = await getUserQuotaBoost(sql, userId, "images");
    const dailyLimit = getTierDailyImageLimit(tier) + imageBoost;

    // 2. Récupérer l'usage du jour
    const usageRows = await sql`
      SELECT images_generated 
      FROM mprojects_daily_image_usage 
      WHERE user_id = ${userId}::text AND usage_date = CURRENT_DATE 
      LIMIT 1
    `;
    const usedToday = usageRows[0]?.images_generated || 0;

    // 3. Récupérer l'historique des générations
    const historyRows = await sql`
      SELECT id, model, prompt, negative_prompt, width, height, image_url, status, created_at
      FROM mprojects_image_generations
      WHERE user_id = ${userId}::text
      ORDER BY created_at DESC
      LIMIT 30
    `;

    const now = new Date();
    const tomorrowMidnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0
      )
    );

    return {
      data: {
        dailyLimit,
        history: historyRows.map((r) => ({
          createdAt: r.created_at,
          height: r.height,
          id: r.id,
          imageUrl: r.image_url,
          model: r.model,
          negativePrompt: r.negative_prompt,
          prompt: r.prompt,
          status: r.status,
          width: r.width,
        })),
        plan: tier,
        resetAt: tomorrowMidnight.toISOString(),
        usedToday,
      },
      success: true,
    };
  } catch (err: any) {
    console.error("Erreur getUserImageUsage:", err);
    return {
      error: "Impossible de récupérer l'usage image.",
      success: false,
    };
  }
}
