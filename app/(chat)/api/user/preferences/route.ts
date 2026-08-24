import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import postgres from "postgres";

function getPostgres() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return postgres(url, { prepare: false });
}

export async function GET() {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  try {
    const sql = getPostgres();
    const rows = await sql`SELECT custom_instructions, custom_instructions_enabled, default_temperature, default_top_p FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`;
    await sql.end();
    if (rows.length === 0) return Response.json({ customInstructions: "", enabled: false, temperature: 0.7 });
    return Response.json({
      customInstructions: rows[0].custom_instructions || "",
      enabled: rows[0].custom_instructions_enabled || false,
      temperature: rows[0].default_temperature ?? 0.7,
      topP: rows[0].default_top_p ?? 0.9,
    });
  } catch (e) {
    console.error("GET preferences error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

const schema = z.object({
  customInstructions: z.string().max(4000).optional(),
  enabled: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
});

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const sql = getPostgres();
    // Build dynamic update
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
    if (parsed.temperature !== undefined) {
      sets.push(`default_temperature = $${idx++}`);
      values.push(parsed.temperature);
    }
    if (parsed.topP !== undefined) {
      sets.push(`default_top_p = $${idx++}`);
      values.push(parsed.topP);
    }
    if (sets.length === 0) {
      await sql.end();
      return Response.json({ success: true });
    }
    // Use raw query with postgres
    const query = `UPDATE users SET ${sets.join(", ")} WHERE id::text = $${idx}::text OR username = $${idx}::text OR email = $${idx}::text`;
    values.push(userId);
    await sql.unsafe(query, values);
    await sql.end();
    return Response.json({ success: true });
  } catch (e) {
    console.error("POST preferences error", e);
    if (e instanceof z.ZodError) return new ChatbotError("bad_request:api", e.message).toResponse();
    return new ChatbotError("bad_request:database").toResponse();
  }
}
