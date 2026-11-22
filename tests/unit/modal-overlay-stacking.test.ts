import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

describe("Hiérarchie d'empilement des modales / overlays (anti-gel gris)", () => {
  it("app/globals.css place les contenus de modales et tiroirs strictement au-dessus des overlays @mdevs/ui", () => {
    const css = readSource("app/globals.css");
    expect(css).toContain('[data-slot="alert-dialog-overlay"]');
    expect(css).toContain('[data-slot="alert-dialog-content"]');
    expect(css).toContain('[data-slot="sheet-overlay"]');
    expect(css).toContain('[data-slot="sheet-content"]');

    const overlayMatch = css.match(
      /\[data-slot="alert-dialog-overlay"\][^}]*z-index:\s*(\d+)/
    );
    const contentMatch = css.match(
      /\[data-slot="alert-dialog-content"\][^}]*z-index:\s*(\d+)/
    );
    const menuMatch = css.match(
      /\[data-slot="dropdown-menu-content"\][^}]*z-index:\s*(\d+)/
    );
    const tooltipMatch = css.match(
      /\[data-slot="tooltip-content"\][^}]*z-index:\s*(\d+)/
    );

    expect(overlayMatch).not.toBeNull();
    expect(contentMatch).not.toBeNull();
    expect(menuMatch).not.toBeNull();
    expect(tooltipMatch).not.toBeNull();

    const overlayZ = Number(overlayMatch?.[1]);
    const contentZ = Number(contentMatch?.[1]);
    const menuZ = Number(menuMatch?.[1]);
    const tooltipZ = Number(tooltipMatch?.[1]);

    // Strictement supérieur à .md-overlay (1000) dans @layer mdevs
    expect(overlayZ).toBeGreaterThan(1000);
    expect(contentZ).toBeGreaterThan(overlayZ);
    expect(menuZ).toBeGreaterThan(contentZ);
    expect(tooltipZ).toBeGreaterThan(menuZ);
  });

  it("AlertDialogContent et SheetContent n'utilisent plus z-50 (inférieur à .md-overlay 1000)", () => {
    const alertDialog = readSource("components/ui/alert-dialog.tsx");
    const sheet = readSource("components/ui/sheet.tsx");
    const dialog = readSource("components/ui/dialog.tsx");
    const appDialogHost = readSource("components/common/app-dialog-host.tsx");

    expect(alertDialog).toContain("z-[1050]");
    expect(alertDialog).toContain("z-[1051]");
    expect(alertDialog).not.toMatch(/\bz-50\b/);

    expect(sheet).toContain("z-[1050]");
    expect(sheet).toContain("z-[1051]");
    expect(sheet).not.toMatch(/\bz-50\b/);

    expect(dialog).toContain("z-[1051]");
    expect(appDialogHost).toContain("z-[1080]");
  });

  it("la suppression depuis la sidebar ne bloque plus la fermeture du DropdownMenu", () => {
    const item = readSource("components/chat/sidebar-history-item.tsx");
    const deleteBlock = item.slice(item.indexOf('variant="destructive"') - 140);
    expect(deleteBlock).not.toContain("e.preventDefault()");
  });

  it("deleteAllChatsByUserId couvre aussi userEmail et DELETE /api/history protège contre les exceptions", () => {
    const chatsQuery = readSource("lib/db/queries/chats.ts");
    const historyRoute = readSource("app/(chat)/api/history/route.ts");

    expect(chatsQuery).toContain("chatUserFilter(userId, userEmail)");
    expect(historyRoute).toContain("userEmail: session.user.email");
    expect(historyRoute).toContain("} catch (error) {");
  });
});
