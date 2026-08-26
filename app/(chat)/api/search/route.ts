import { and, desc, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/queries";
import { chat, message, project } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({
      chats: [],
      files: [],
      messages: [],
      projects: [],
    });
  }
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || "8"), 1),
    20
  );
  const escaped = `%${q.replace(/[%_]/g, "\\$&")}%`;

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userIds = Array.from(
    new Set([maiUser.id, maiUser.email, maiUser.username].filter(Boolean))
  ) as string[];

  try {
    const db = getDb();

    // Chats by title
    const chatsPromise = db
      .select()
      .from(chat)
      .where(
        and(
          sql`${chat.userId}::text = ANY(${userIds})`,
          ilike(chat.title, escaped)
        )
      )
      .orderBy(desc(chat.createdAt))
      .limit(limit);

    // Projects by name/description
    const projectsPromise = db
      .select()
      .from(project)
      .where(
        and(
          sql`${project.userId}::text = ANY(${userIds})`,
          or(ilike(project.name, escaped), ilike(project.description, escaped))
        )
      )
      .orderBy(desc(project.updatedAt))
      .limit(limit);

    // Messages by content (parts::text) + join chat for ownership
    const messagesPromise = db
      .select({
        chatId: message.chatId,
        chatTitle: chat.title,
        createdAt: message.createdAt,
        id: message.id,
        parts: message.parts,
        role: message.role,
      })
      .from(message)
      .innerJoin(chat, sql`${message.chatId}::text = ${chat.id}::text`)
      .where(
        and(
          sql`${chat.userId}::text = ANY(${userIds})`,
          sql`${message.parts}::text ILIKE ${escaped}`
        )
      )
      .orderBy(desc(message.createdAt))
      .limit(limit);

    const [chats, projects, messages] = await Promise.all([
      chatsPromise,
      projectsPromise,
      messagesPromise,
    ]);

    // Files from MAI cloud - proxy and filter
    let files: any[] = [];
    try {
      const sessionModule = await import("@/lib/auth/session");
      const token = await sessionModule.getMaiSessionToken();
      if (token) {
        const { MAI_API_URL } = await import("@/lib/constants");
        const res = await fetch(`${MAI_API_URL}/cloud/files`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const allFiles: any[] = data.files || [];
          const lower = q.toLowerCase();
          files = allFiles
            .filter(
              (f: any) =>
                f.original_name?.toLowerCase().includes(lower) ||
                f.mime_type?.toLowerCase().includes(lower)
            )
            .slice(0, limit);
        }
      }
    } catch {
      files = [];
    }

    return NextResponse.json({ chats, files, messages, projects });
  } catch (e) {
    console.error("search error", e);
    return NextResponse.json({
      chats: [],
      files: [],
      messages: [],
      projects: [],
    });
  }
}
