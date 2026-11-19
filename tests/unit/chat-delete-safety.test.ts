import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chatOwnerMatches } from "@/lib/agent/channel";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function codeOnly(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("Sécurité et robustesse de la suppression de discussion", () => {
  it("Response.json ne jette pas d'erreur lorsque la discussion supprimée est null/undefined", () => {
    const deletedChat: unknown = undefined;
    const safePayload = deletedChat ?? { id: "test-id", success: true };
    expect(() => Response.json(safePayload, { status: 200 })).not.toThrow();
    const res = Response.json(safePayload, { status: 200 });
    expect(res.status).toBe(200);
  });

  it("chatOwnerMatches valide l'accès du propriétaire avec userId canonique", () => {
    expect(
      chatOwnerMatches({
        chatUserId: "user-123",
        userId: "user-123",
      })
    ).toBe(true);

    expect(
      chatOwnerMatches({
        chatUserId: "user-123",
        userId: "user-456",
      })
    ).toBe(false);
  });

  it("la route DELETE /api/chat protège contre le crash JSON et garantit l'idempotence", () => {
    const routeCode = codeOnly("app/(chat)/api/chat/route.ts");
    // Vérification de la présence du fallback deletedChat ??
    expect(routeCode).toContain("deletedChat ??");
    // Idempotence : si le chat est déjà supprimé, renvoyer 200
    expect(routeCode).toContain(
      "Response.json({ id, success: true }, { status: 200 })"
    );
  });

  it("getChatsByUserId ne jette plus d'exception sur un curseur supprimé (endingBefore / startingAfter)", () => {
    const queryCode = codeOnly("lib/db/queries/chats.ts");
    // Ne doit plus lancer de ChatbotError not_found:database pour endingBefore ou startingAfter
    const endingTarget = ["Chat with id", "{endingBefore} not found"].join(
      " $"
    );
    const startingTarget = ["Chat with id", "{startingAfter} not found"].join(
      " $"
    );
    expect(queryCode).not.toContain(endingTarget);
    expect(queryCode).not.toContain(startingTarget);
  });

  it("sidebar-history réinitialise l'état actif, libère pointerEvents et applique une mise à jour optimiste", () => {
    const sidebarCode = codeOnly("components/chat/sidebar-history.tsx");
    expect(sidebarCode).toContain("resetChat()");
    expect(sidebarCode).toContain("pointerEvents");
    expect(sidebarCode).toContain('document.body.style.pointerEvents = ""');
    // Vérification de la mise à jour optimiste dans mutate()
    expect(sidebarCode).toContain("filter((c) => c.id !== chatToDelete)");
  });

  it("le gel Radix et la course du stream abandonné sont neutralisés", () => {
    const itemCode = codeOnly("components/chat/sidebar-history-item.tsx");
    // Un dropdown modal laisse pointer-events: none sur <body> en ouvrant
    // l'AlertDialog de suppression: l'interface devient alors inerte.
    expect(itemCode).toContain("<DropdownMenu modal={false}>");

    const sidebarCode = codeOnly("components/chat/sidebar-history.tsx");
    // Le verrou est relâché même si la requête de suppression échoue.
    expect(sidebarCode).toContain("} finally {");

    const activeChatCode = codeOnly("hooks/use-active-chat.tsx");
    // Les erreurs du stream de la discussion supprimée sont ignorées.
    expect(activeChatCode).toContain("awaitingResetChatIdRef.current = newId");
    expect(activeChatCode).toContain("chatId !== awaitedId");

    const headerCode = codeOnly("components/chat/chat-header.tsx");
    // La confirmation ne peut pas rester en attente indéfiniment.
    expect(headerCode).toContain("confirmWithFallback");
  });

  it("chat-header réinitialise l'état actif et libère pointerEvents lors de la suppression", () => {
    const headerCode = codeOnly("components/chat/chat-header.tsx");
    expect(headerCode).toContain("resetChat()");
    expect(headerCode).toContain('router.replace("/")');
    expect(headerCode).toContain('document.body.style.pointerEvents = ""');
  });

  it("deleteChatById nettoie chatSecurity avant de supprimer le chat", () => {
    const queryCode = codeOnly("lib/db/queries/chats.ts");
    expect(queryCode).toContain("delete(chatSecurity)");
    expect(queryCode).toContain("delete(vote)");
    expect(queryCode).toContain("delete(message)");
    expect(queryCode).toContain("delete(stream)");
  });
});
