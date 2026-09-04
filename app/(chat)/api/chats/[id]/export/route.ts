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

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatContent(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(
    /```([a-z0-9_-]*)\n([\s\S]*?)```/g,
    (_m, lang, code) =>
      `<div class="code-wrapper"><div class="code-lang">${lang || "code"}</div><pre><code>${code}</code></pre></div>`
  );
  out = out.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return out;
}

function toPrintableHtml(
  chat: any,
  messages: any[],
  autoPrint = false
): string {
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const messagesHtml = messages
    .map((m) => {
      const isUser = m.role === "user";
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
      if (!text.trim()) return "";
      const time = new Date(m.createdAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formatted = formatContent(text);
      return `
        <article class="message ${isUser ? "message-user" : "message-assistant"}">
          <div class="message-header">
            <span class="author-badge ${isUser ? "badge-user" : "badge-assistant"}">
              ${isUser ? "👤 Vous" : "✨ mAI"}
            </span>
            <time class="message-time">${time}</time>
          </div>
          <div class="message-body">
            ${formatted}
          </div>
        </article>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chat.title)} — Export mAI</title>
  <style>
    :root {
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --bg: #ffffff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --user-bg: #f9fafb;
      --user-border: #e5e7eb;
      --ai-bg: #f8fafc;
      --ai-border: #e2e8f0;
      --code-bg: #1e293b;
      --code-text: #f8fafc;
      --primary: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f17;
        --text: #f3f4f6;
        --muted: #9ca3af;
        --border: #1f2937;
        --user-bg: #131b2e;
        --user-border: #1e293b;
        --ai-bg: #111827;
        --ai-border: #1f2937;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2.5rem 1.5rem;
      max-width: 860px;
      margin: 0 auto;
    }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    h1 { font-size: 1.65rem; font-weight: 700; color: var(--text); line-height: 1.3; }
    .meta { font-size: 0.875rem; color: var(--muted); margin-top: 0.35rem; }
    .actions-bar {
      display: flex;
      gap: 0.5rem;
    }
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--primary);
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-print:hover { opacity: 0.9; }
    .chat-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .message {
      border-radius: 0.85rem;
      padding: 1.25rem;
      border: 1px solid var(--border);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .message-user { background: var(--user-bg); border-color: var(--user-border); }
    .message-assistant { background: var(--ai-bg); border-color: var(--ai-border); }
    .message-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid rgba(150,150,150,0.15);
    }
    .author-badge {
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .message-time { font-size: 0.75rem; color: var(--muted); }
    .message-body { font-size: 0.95rem; }
    .message-body p { margin-bottom: 0.75rem; }
    .message-body p:last-child { margin-bottom: 0; }
    .inline-code {
      background: rgba(120, 120, 120, 0.15);
      padding: 0.15rem 0.35rem;
      border-radius: 0.25rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85em;
    }
    .code-wrapper {
      margin: 0.75rem 0;
      background: var(--code-bg);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .code-lang {
      background: rgba(255,255,255,0.08);
      color: #94a3b8;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-family: monospace;
      text-transform: uppercase;
      font-weight: 600;
    }
    pre {
      padding: 0.75rem 1rem;
      overflow-x: auto;
      color: var(--code-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      line-height: 1.45;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.8rem;
      color: var(--muted);
    }
    @media print {
      body { padding: 0; max-width: 100%; color: #000; background: #fff; }
      header { border-bottom: 1px solid #ccc; }
      .actions-bar { display: none !important; }
      .message { border: 1px solid #ddd; background: transparent !important; }
      .code-wrapper { background: #f8fafc !important; border: 1px solid #cbd5e1; }
      pre, code { color: #0f172a !important; }
      .code-lang { color: #475569 !important; background: #e2e8f0 !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(chat.title)}</h1>
      <div class="meta">Exporté le ${dateStr} • ${messages.length} messages</div>
    </div>
    <div class="actions-bar">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    </div>
  </header>

  <main class="chat-container">
    ${messagesHtml}
  </main>

  <footer>
    Généré par mAI Web • Document confidentiel
  </footer>

  ${autoPrint ? "<script>window.addEventListener('load', () => window.print());</script>" : ""}
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "md").toLowerCase();
  const inline = searchParams.get("inline") === "true";

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = maiUser.id || maiUser.email;

  const chat = await getChatById({ id });
  if (!chat) {
    return NextResponse.json({ error: "Chat introuvable" }, { status: 404 });
  }
  if (
    chat.userId !== userId &&
    chat.userId !== maiUser.email &&
    chat.visibility !== "public"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getMessagesByChatId({ id });

  if (format === "html" || format === "pdf") {
    const html = toPrintableHtml(chat, messages, inline);
    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
    };
    if (!inline) {
      headers["Content-Disposition"] = `attachment; filename="chat-${id}.html"`;
    }
    return new NextResponse(html, { headers });
  }

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
