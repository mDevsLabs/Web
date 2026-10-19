import { requireUser } from "@/lib/auth/require-user";
import { getMessagesForExportByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { getTextFromMessage } from "@/lib/utils";

// Export de TOUT l'historique en un fichier Markdown.
//
// Complément de `/api/chats/[id]/export` (une conversation) : ici la demande
// vient de l'onglet Données, où l'utilisateur veut emporter ses données avant
// de les supprimer. Format Markdown et non ZIP : il s'ouvre partout, se relit
// dans n'importe quel éditeur, et évite d'ajouter une dépendance d'archivage
// pour un besoin ponctuel.

/**
 * Garde-fou de taille. Un compte de plusieurs années dépasse vite 100 000
 * messages : sans plafond, la route tiendrait un rapport en mémoire et
 * expirerait sur le timeout serveur. Au-delà, l'export est Tronqué et le
 * lisible — un export partiel annoncé vaut mieux qu'un 500 opaque.
 */
const MAX_MESSAGES = 100_000;

/** Date locale dans un nom de fichier : un horodatage UTC y est illisible. */
function exportFileName(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `mai-historique-${stamp}.md`;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { userId } = session;

  let rows: Awaited<ReturnType<typeof getMessagesForExportByUserId>>;
  try {
    rows = await getMessagesForExportByUserId({
      limit: MAX_MESSAGES,
      userId,
    });
  } catch (error) {
    console.error("Erreur export historique:", error);
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return new ChatbotError("bad_request:database", {
      cause: error,
    }).toResponse();
  }

  // Les lignes arrivent triées par conversation (createdAt décroissant) puis par
  // message : un simple changement de chatId marque la frontière d'un nouveau
  // chapitre. Aucune structure intermédiaire n'est nécessaire.
  const lines: string[] = [
    "# Historique mAI",
    "",
    `> Export du ${new Date().toLocaleString("fr-FR")} — ${new Set(rows.map((row) => row.chatId)).size} conversation(s).`,
    "",
  ];

  let currentChatId: string | null = null;
  let currentTitle = "";
  let currentTags: string[] = [];
  let exported = 0;
  let skipped = 0;

  const closeChapter = () => {
    lines.push("---", "");
  };

  for (const row of rows) {
    if (row.chatId !== currentChatId) {
      if (currentChatId) {
        closeChapter();
      }
      currentChatId = row.chatId;
      currentTitle = row.chatTitle || "Sans titre";
      currentTags = Array.isArray(row.chatTags) ? row.chatTags : [];
      lines.push(`## ${currentTitle}`, "");
      lines.push(
        `*${new Date(row.chatCreatedAt).toLocaleString("fr-FR")}*`,
        ""
      );
      if (currentTags.length > 0) {
        lines.push(`Tags : ${currentTags.join(", ")}`, "");
      }
    }

    let text = "";
    try {
      text =
        getTextFromMessage({ parts: row.parts, role: row.role } as never) ?? "";
    } catch {
      const parts = (row.parts as { text?: string; type?: string }[]) || [];
      text = parts
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("\n");
    }
    // Un message vide est écarté : il gonflerait le fichier de dizaines de
    // milliers de lignes vides sur un historique chargé en pièces jointes.
    if (!text.trim()) {
      skipped += 1;
      continue;
    }
    exported += 1;
    const author = row.role === "user" ? "Vous" : "mAI";
    lines.push(
      `**${author}** — ${new Date(row.createdAt).toLocaleString("fr-FR")}`,
      "",
      text,
      ""
    );
  }

  if (currentChatId) {
    closeChapter();
  }

  if (exported === 0) {
    lines.push("_Aucune conversation à exporter._", "");
  } else {
    lines.push(
      "---",
      "",
      `${exported} message(s) exporté(s)` +
        (skipped > 0 ? `, ${skipped} message(s) sans texte écarté(s)` : "") +
        (rows.length >= MAX_MESSAGES
          ? ` — export limité à ${MAX_MESSAGES} messages.`
          : "") +
        ".",
      ""
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Disposition": `attachment; filename="${exportFileName()}"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
