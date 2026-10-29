import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

/**
 * Invariants de sécurité des corrections d'audit. Ces assertions figent les
 * décisions structurelles (garde commune, filtres en base, réservation avant
 * le fournisseur) que des refactorisations pourraient défaire silencieusement.
 * Les comportements purs sont testés dans les fichiers dédiés.
 */
describe("Invariants d'audit — chemins serveur", () => {
  it("le middleware débite AVANT le handler et refuse si le quota est indisponible", () => {
    const source = read("api-middleware.ts");
    expect(source).toContain("reserveApiQuotaOrRefuse");
    expect(source).toContain(
      '"Quota service unavailable. Please retry later."'
    );
    expect(source).not.toContain("extractTierFromApiKey");
    expect(source).toContain("is_active");
    expect(source).toContain("user_blocked");
  });

  it("la révocation backend distingue révoqué, actif et inconnu", () => {
    const source = read("config.ts");
    expect(source).toContain("evaluateRevocationProbes");
    expect(source).toContain("AuthAuthorityUnavailableError");
    expect(source).toContain("is_blocked");
  });

  it("l'image proxy utilise le transport sûr et n'accepte que les signatures raster", () => {
    const route = read("app/(chat)/api/mai-search/image-proxy/route.ts");
    expect(route).toContain("safeFetchBuffer");
    expect(route).toContain("sniffImageType");
    expect(route).not.toContain("isBlockedHost");
    expect(route).toContain("nosniff");
  });

  it("les livres, commentaires et le contexte mAI appliquent visibilityFilter", () => {
    const books = read("vibe-books.ts");
    expect(
      (books.match(/visibilityFilter\(userId\)/g) ?? []).length
    ).toBeGreaterThanOrEqual(2);
    const engage = read("vibe-posts-engage.ts");
    expect(engage).toContain("visibilityFilter(userId)");
    expect(engage).toContain("WITH inserted");
    expect(engage).toContain("WITH removed");
    const context = read("vibe-mai-core.ts");
    expect(context).toContain("visibilityFilter(viewerId)");
    expect(context).toContain("fetchApprovedImage");
    const core = read("vibe-posts-core.ts");
    expect(core).toContain("blocked_users");
  });

  it("les réponses DM vérifient le fil et l'outil send_message le consentement", () => {
    const dms = read("vibe-dms-conversations.ts");
    expect(dms).toContain("r.conversation_id = m.conversation_id");
    expect(dms).toContain(
      "Message de réponse introuvable dans cette conversation."
    );
    expect(dms).toContain("assertDmRecipientAllowed");
    const fleet = read("vibe-mai-fleet.ts");
    expect(fleet).toContain("assertDmRecipientAllowed");
  });

  it("le chat Vibe valide le modèle et réserve le quota avant le fournisseur", () => {
    const source = read("vibe-mai-chat.ts");
    expect(source).toContain("requireChatModel");
    expect(source).toContain("reserveWeeklyTokens");
    expect(source).toContain("settleWeeklyTokens");
    expect(source).not.toContain("tokens_used + 250");
    expect(source).not.toMatch(/::date, 250\)/);
  });

  it("les stories appliquent la garde commune aux vues, réactions et votes", () => {
    const source = read("vibe-stories.ts");
    expect(
      (source.match(/storyInteractionGuard\(sql, id, userId\)/g) ?? []).length
    ).toBeGreaterThanOrEqual(3);
    expect(source).toContain("decideStoryInteraction");
  });

  it("les générations directes comptent l'usage réel du fournisseur", () => {
    const models = read("models.ts");
    expect(models).toContain("forwardProviderResponse");
    expect(models).toContain("extractUsageFromSseText");
    expect(models).toContain("parseUsageLogPayload");
    expect(models).not.toContain("weekly_usage.tokens_used + 1");
  });

  it("les routes image réservent quota et propriété avant le fournisseur", () => {
    const images = read("images.ts");
    expect(images).toContain("reserveDailyImages");
    expect(images).toContain("classifyMidjourneyPath");
    expect(images).toContain("ownsImageTask");
    expect(images).toContain("mprojects_image_tasks");
  });

  it("les suppressions cloud ne confirment qu'après le stockage", () => {
    const storage = read("storage.ts");
    expect(storage).toContain("remoteDeleted");
    expect(storage).toContain("retryable: true");
    expect(storage).toContain("WITH removed AS");
    expect(storage).toContain("decidePublicUpload");
  });

  it("les notifications lues sont supprimées par filtre SQL", () => {
    const queries = read("lib/db/queries/notifications.ts");
    expect(queries).toContain("deleteReadNotifications");
    expect(queries).toContain("eq(notification.isRead, true)");
    expect(queries).toContain("returning({ id: notification.id })");
  });
});
