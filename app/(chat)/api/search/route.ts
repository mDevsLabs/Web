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
    Math.max(Number(searchParams.get("limit") || "10"), 1),
    30
  );

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userIds = Array.from(
    new Set([maiUser.id, maiUser.email, maiUser.username].filter(Boolean))
  ) as string[];

  // Tokenize keywords for flexible multi-term search
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  const escapedTokens = tokens.map((t) => `%${t.replace(/[%_]/g, "\\$&")}%`);
  const escapedFull = `%${q.replace(/[%_]/g, "\\$&")}%`;

  try {
    const db = getDb();

    // Chat search: Title matches all tokens OR tags contain any token OR prompt matches
    const chatConditions = escapedTokens.map((tok) =>
      or(
        ilike(chat.title, tok),
        sql`EXISTS (SELECT 1 FROM unnest(${chat.tags}) tag WHERE tag ILIKE ${tok})`
      )
    );

    // Chats by title, tags & pinned first
    const chatsPromise = db
      .select()
      .from(chat)
      .where(
        and(
          sql`${chat.userId}::text = ANY(${userIds})`,
          chatConditions.length > 0
            ? and(...chatConditions)
            : ilike(chat.title, escapedFull)
        )
      )
      .orderBy(desc(chat.pinned), desc(chat.createdAt))
      .limit(limit);

    // Projects by name/description
    const projectConditions = escapedTokens.map((tok) =>
      or(ilike(project.name, tok), ilike(project.description, tok))
    );

    const projectsPromise = db
      .select()
      .from(project)
      .where(
        and(
          sql`${project.userId}::text = ANY(${userIds})`,
          projectConditions.length > 0
            ? and(...projectConditions)
            : ilike(project.name, escapedFull)
        )
      )
      .orderBy(desc(project.updatedAt))
      .limit(limit);

    // Messages by content (parts::text) + join chat for ownership
    const messageConditions = escapedTokens.map(
      (tok) => sql`${message.parts}::text ILIKE ${tok}`
    );

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
          messageConditions.length > 0
            ? and(...messageConditions)
            : sql`${message.parts}::text ILIKE ${escapedFull}`
        )
      )
      .orderBy(desc(message.createdAt))
      .limit(limit);

    const [chats, projects, rawMessages] = await Promise.all([
      chatsPromise,
      projectsPromise,
      messagesPromise,
    ]);

    // Format message snippets
    const formattedMessages = rawMessages.map((msg: any) => {
      let snippet = "";
      try {
        const parts = Array.isArray(msg.parts) ? msg.parts : [];
        const textParts = parts
          .filter(
            (p: any) => p && (p.type === "text" || typeof p.text === "string")
          )
          .map((p: any) => p.text || "")
          .join(" ");

        if (textParts) {
          const lowerText = textParts.toLowerCase();
          const matchIdx = lowerText.indexOf(
            tokens[0]?.toLowerCase() || q.toLowerCase()
          );
          if (matchIdx === -1) {
            snippet =
              textParts.slice(0, 100) + (textParts.length > 100 ? "…" : "");
          } else {
            const start = Math.max(0, matchIdx - 40);
            const end = Math.min(textParts.length, matchIdx + 80);
            snippet = `${start > 0 ? "…" : ""}${textParts.slice(start, end)}${end < textParts.length ? "…" : ""}`;
          }
        }
      } catch {
        snippet = "";
      }

      return {
        ...msg,
        snippet,
      };
    });

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
          const _lower = q.toLowerCase();
          files = allFiles
            .filter((f: any) => {
              const name = (f.original_name || "").toLowerCase();
              const mime = (f.mime_type || "").toLowerCase();
              return tokens.every(
                (tok) =>
                  name.includes(tok.toLowerCase()) ||
                  mime.includes(tok.toLowerCase())
              );
            })
            .slice(0, limit);
        }
      }
    } catch {
      files = [];
    }

    return NextResponse.json({
      chats,
      files,
      messages: formattedMessages,
      projects,
    });
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
