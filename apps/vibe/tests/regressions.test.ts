import { strict as assert } from "node:assert";
import {
  extractTierFromApiKey,
  getWeekData,
  normalizeTier,
  rateLimit,
} from "../config.ts";
import {
  APPROVAL_NONCE_ARG,
  extractApprovalNonce,
  sanitizeToolArgs,
  toolArgsEqual,
} from "../vibe-mai-core.ts";
import { isUuid, stripHtmlTags } from "../vibe-posts-core.ts";

Deno.test("normalise les forfaits et rejette les clés API forgées", () => {
  assert.equal(normalizeTier(" PRO "), "Pro");
  assert.equal(normalizeTier("inconnu"), "Free");
  assert.equal(extractTierFromApiKey("mai-pro-abcd-1234"), "Pro");
  assert.equal(extractTierFromApiKey("mai-pro-abcd-1234") === "Max", false);
  assert.equal(extractTierFromApiKey("autre"), null);
});

Deno.test("les buckets de rate-limit respectent la limite", () => {
  const key = `test-rate-${crypto.randomUUID()}`;
  assert.equal(rateLimit(key, 2, 60_000), true);
  assert.equal(rateLimit(key, 2, 60_000), true);
  assert.equal(rateLimit(key, 2, 60_000), false);
});

Deno.test("la semaine UTC est stable et bornée", () => {
  const week = getWeekData();
  assert.match(week.weekStartStr, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(week.nextResetIso).getTime() > Date.now() - 1_000);
});

Deno.test("les helpers de posts valident les UUID et nettoient le HTML", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("42"), false);
  assert.equal(stripHtmlTags("<p>Bonjour<br>monde</p>"), "Bonjour\nmonde");
});

Deno.test("les arguments d'outil sont assainis et les nonces extraits", () => {
  const nonce = "abcdefghijklmnopqrstuvwxyz123456";
  const args = sanitizeToolArgs({
    post_id: "550e8400-e29b-41d4-a716-446655440000",
    [APPROVAL_NONCE_ARG]: nonce,
  });
  const extracted = extractApprovalNonce({
    ...args,
    [APPROVAL_NONCE_ARG]: nonce,
  });
  assert.equal(extracted.nonce, nonce);
  assert.equal(
    Object.prototype.hasOwnProperty.call(extracted.args, APPROVAL_NONCE_ARG),
    false,
  );
  assert.equal(toolArgsEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
});
