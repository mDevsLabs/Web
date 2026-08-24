import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

function toMarkdown(chat: any, messages: any[]) {
  let md = `# ${chat.title}\n\n`;
  md += `> Conversation exportée — ${new Date().toISOString()}\n\n`;
  if (chat.tags?.length) {
    md += `Tags: ${chat.tags.join(", ")}\n\n`;
  }
  if (chat.projectId) {
    md += `Projet: ${chat.projectId}\n\n`;
  }
  for (const m of messages) {
    const text = (() => {
      try {
        return getTextFromMessage(m as any) || "";
      } catch {
        const parts = (m.parts as any[]) || [];
        return parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n");
      }
    })();
    if (!text.trim()) {
      continue;
    }
    md += `## ${m.role === "user" ? "Vous" : "mAI"} — ${new Date(m.createdAt).toLocaleString("fr-FR")}\n\n${text}\n\n---\n\n`;
    // Attachments
    const parts = (m.parts as any[]) || [];
    const files = parts.filter((p) => p.type === "file");
    if (files.length) {
      md += `Fichiers: ${files.map((f) => f.filename || f.name || f.url).join(", ")}\n\n`;
    }
  }
  return md;
}

function toTxt(chat: any, messages: any[]) {
  let txt = `${chat.title}\n${"=".repeat(chat.title.length)}\n\n`;
  for (const m of messages) {
    const text = (() => {
      try {
        return getTextFromMessage(m as any) || "";
      } catch {
        return "";
      }
    })();
    txt += `${m.role.toUpperCase()}: ${text}\n\n`;
  }
  return txt;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "md").toLowerCase();

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = maiUser.id || maiUser.email;

  const chat = await getChatById({ id });
  if (!chat) {
    return NextResponse.json({ error: "Chat introuvable" }, { status: 404 });
  }
  if (chat.userId !== userId && chat.userId !== maiUser.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getMessagesByChatId({ id });

  if (format === "json") {
    return NextResponse.json(
      { chat, messages },
      {
        headers: {
          "Content-Disposition": `attachment; filename="chat-${id}.json"`,
        },
      }
    );
  }
  if (format === "txt") {
    const txt = toTxt(chat, messages);
    return new NextResponse(txt, {
      headers: {
        "Content-Disposition": `attachment; filename="chat-${id}.txt"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
  // default md
  const md = toMarkdown(chat, messages);
  return new NextResponse(md, {
    headers: {
      "Content-Disposition": `attachment; filename="chat-${id}.md"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
