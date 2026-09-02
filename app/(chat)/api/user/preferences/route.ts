import postgres from "postgres";
import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

function getPostgres() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error("DATABASE_URL missing");
  }
  return postgres(url, { prepare: false });
}

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    // S'assure que la DB et les migrations sont initialisées
    getDb();
    const sql = getPostgres();
    const rows =
      await sql`SELECT custom_instructions, custom_instructions_enabled, default_temperature, default_top_p, default_agent_id, default_chat_model, default_chat_visibility, default_image_model, default_image_size, default_audio_model, default_audio_voice, default_audio_speed, ghost_memory_enabled, show_agent_chat_icons FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`;
    await sql.end();
    if (rows.length === 0) {
      return Response.json({
        customInstructions: "",
        defaultAgentId: null,
        defaultAudioModel: "deepgram/flux-tts:free",
        defaultAudioSpeed: 1.0,
        defaultAudioVoice: "flux-alexis-en",
        defaultChatModel: null,
        defaultChatVisibility: "private",
        defaultImageModel: "black-forest-labs/flux-schnell",
        defaultImageSize: "1024x1024",
        enabled: false,
        ghostMemoryEnabled: false,
        showAgentChatIcons: true,
        temperature: 0.7,
        topP: 0.9,
      });
    }
    return Response.json({
      customInstructions: rows[0].custom_instructions || "",
      defaultAgentId: rows[0].default_agent_id || null,
      defaultAudioModel:
        rows[0].default_audio_model || "deepgram/flux-tts:free",
      defaultAudioSpeed: rows[0].default_audio_speed ?? 1.0,
      defaultAudioVoice: rows[0].default_audio_voice || "flux-alexis-en",
      defaultChatModel: rows[0].default_chat_model || null,
      defaultChatVisibility: rows[0].default_chat_visibility || "private",
      defaultImageModel:
        rows[0].default_image_model || "black-forest-labs/flux-schnell",
      defaultImageSize: rows[0].default_image_size || "1024x1024",
      enabled: Boolean(rows[0].custom_instructions_enabled),
      ghostMemoryEnabled: Boolean(rows[0].ghost_memory_enabled),
      showAgentChatIcons: rows[0].show_agent_chat_icons ?? true,
      temperature: rows[0].default_temperature ?? 0.7,
      topP: rows[0].default_top_p ?? 0.9,
    });
  } catch (e) {
    console.error("GET preferences error", e);
    // Fallback gracieux en cas de table vide
    return Response.json({
      customInstructions: "",
      defaultAgentId: null,
      defaultAudioModel: "deepgram/flux-tts:free",
      defaultAudioSpeed: 1.0,
      defaultAudioVoice: "flux-alexis-en",
      defaultChatModel: null,
      defaultChatVisibility: "private",
      defaultImageModel: "black-forest-labs/flux-schnell",
      defaultImageSize: "1024x1024",
      enabled: false,
      ghostMemoryEnabled: false,
      showAgentChatIcons: true,
      temperature: 0.7,
      topP: 0.9,
    });
  }
}

const schema = z.object({
  customInstructions: z.string().max(4000).optional(),
  defaultAgentId: z.string().uuid().nullable().optional(),
  defaultAudioModel: z.string().max(150).optional(),
  defaultAudioSpeed: z.number().min(0.5).max(2.0).optional(),
  defaultAudioVoice: z.string().max(100).optional(),
  defaultChatModel: z.string().max(200).nullable().optional(),
  defaultChatVisibility: z.enum(["private", "public"]).optional(),
  defaultImageModel: z.string().max(150).optional(),
  defaultImageSize: z.string().max(50).optional(),
  enabled: z.boolean().optional(),
  ghostMemoryEnabled: z.boolean().optional(),
  showAgentChatIcons: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
});

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    getDb();
    const sql = getPostgres();

    // Vérifier si l'utilisateur existe dans la table users
    const existing =
      await sql`SELECT id FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`;

    if (existing.length === 0) {
      // Utilisateur non présent dans la table : insertion avec préférences
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId
        );
      if (isUuid) {
        await sql`
          INSERT INTO users (
            id,
            email,
            username,
            custom_instructions,
            custom_instructions_enabled,
            default_temperature,
            default_top_p,
            default_agent_id,
            default_chat_model,
            default_chat_visibility,
            default_image_model,
            default_image_size,
            default_audio_model,
            default_audio_voice,
            default_audio_speed,
            ghost_memory_enabled,
            show_agent_chat_icons
          ) VALUES (
            ${userId},
            ${user.email || userId},
            ${user.username || "Utilisateur"},
            ${parsed.customInstructions ?? ""},
            ${parsed.enabled ?? false},
            ${parsed.temperature ?? 0.7},
            ${parsed.topP ?? 0.9},
            ${parsed.defaultAgentId ?? null},
            ${parsed.defaultChatModel ?? null},
            ${parsed.defaultChatVisibility ?? "private"},
            ${parsed.defaultImageModel ?? "black-forest-labs/flux-schnell"},
            ${parsed.defaultImageSize ?? "1024x1024"},
            ${parsed.defaultAudioModel ?? "deepgram/flux-tts:free"},
            ${parsed.defaultAudioVoice ?? "flux-alexis-en"},
            ${parsed.defaultAudioSpeed ?? 1.0},
            ${parsed.ghostMemoryEnabled ?? false},
            ${parsed.showAgentChatIcons ?? true}
          )
        `;
      } else {
        await sql`
          INSERT INTO users (
            email,
            username,
            custom_instructions,
            custom_instructions_enabled,
            default_temperature,
            default_top_p,
            default_agent_id,
            default_chat_model,
            default_chat_visibility,
            default_image_model,
            default_image_size,
            default_audio_model,
            default_audio_voice,
            default_audio_speed,
            ghost_memory_enabled,
            show_agent_chat_icons
          ) VALUES (
            ${user.email || userId},
            ${user.username || "Utilisateur"},
            ${parsed.customInstructions ?? ""},
            ${parsed.enabled ?? false},
            ${parsed.temperature ?? 0.7},
            ${parsed.topP ?? 0.9},
            ${parsed.defaultAgentId ?? null},
            ${parsed.defaultChatModel ?? null},
            ${parsed.defaultChatVisibility ?? "private"},
            ${parsed.defaultImageModel ?? "black-forest-labs/flux-schnell"},
            ${parsed.defaultImageSize ?? "1024x1024"},
            ${parsed.defaultAudioModel ?? "deepgram/flux-tts:free"},
            ${parsed.defaultAudioVoice ?? "flux-alexis-en"},
            ${parsed.defaultAudioSpeed ?? 1.0},
            ${parsed.ghostMemoryEnabled ?? false},
            ${parsed.showAgentChatIcons ?? true}
          )
        `;
      }
      await sql.end();
      return Response.json({ success: true });
    }

    // Mise à jour dynamique
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (parsed.customInstructions !== undefined) {
      sets.push(`custom_instructions = $${idx++}`);
      values.push(parsed.customInstructions);
    }
    if (parsed.enabled !== undefined) {
      sets.push(`custom_instructions_enabled = $${idx++}`);
      values.push(parsed.enabled);
    }
    if (parsed.showAgentChatIcons !== undefined) {
      sets.push(`show_agent_chat_icons = $${idx++}`);
      values.push(parsed.showAgentChatIcons);
    }
    if (parsed.ghostMemoryEnabled !== undefined) {
      sets.push(`ghost_memory_enabled = $${idx++}`);
      values.push(parsed.ghostMemoryEnabled);
    }
    if (parsed.temperature !== undefined) {
      sets.push(`default_temperature = $${idx++}`);
      values.push(parsed.temperature);
    }
    if (parsed.topP !== undefined) {
      sets.push(`default_top_p = $${idx++}`);
      values.push(parsed.topP);
    }
    if (parsed.defaultAgentId !== undefined) {
      if (parsed.defaultAgentId === null) {
        sets.push("default_agent_id = NULL");
      } else {
        sets.push(`default_agent_id = $${idx++}`);
        values.push(parsed.defaultAgentId);
      }
    }
    if (parsed.defaultChatModel !== undefined) {
      if (parsed.defaultChatModel === null) {
        sets.push("default_chat_model = NULL");
      } else {
        sets.push(`default_chat_model = $${idx++}`);
        values.push(parsed.defaultChatModel);
      }
    }
    if (parsed.defaultChatVisibility !== undefined) {
      sets.push(`default_chat_visibility = $${idx++}`);
      values.push(parsed.defaultChatVisibility);
    }
    if (parsed.defaultImageModel !== undefined) {
      sets.push(`default_image_model = $${idx++}`);
      values.push(parsed.defaultImageModel);
    }
    if (parsed.defaultImageSize !== undefined) {
      sets.push(`default_image_size = $${idx++}`);
      values.push(parsed.defaultImageSize);
    }
    if (parsed.defaultAudioModel !== undefined) {
      sets.push(`default_audio_model = $${idx++}`);
      values.push(parsed.defaultAudioModel);
    }
    if (parsed.defaultAudioVoice !== undefined) {
      sets.push(`default_audio_voice = $${idx++}`);
      values.push(parsed.defaultAudioVoice);
    }
    if (parsed.defaultAudioSpeed !== undefined) {
      sets.push(`default_audio_speed = $${idx++}`);
      values.push(parsed.defaultAudioSpeed);
    }
    if (sets.length === 0) {
      await sql.end();
      return Response.json({ success: true });
    }
    const query = `UPDATE users SET ${sets.join(", ")} WHERE id::text = $${idx}::text OR username = $${idx}::text OR email = $${idx}::text`;
    values.push(userId);
    await sql.unsafe(query, values);
    await sql.end();
    return Response.json({ success: true });
  } catch (e) {
    console.error("POST preferences error", e);
    if (e instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", e.message).toResponse();
    }
    return new ChatbotError("bad_request:database").toResponse();
  }
}
