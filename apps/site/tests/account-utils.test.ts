import { describe, expect, it } from "vitest";

import {
  formatResetDate,
  formatTokens,
  getSafeKeyPrefix,
} from "@/components/account/account-utils";
import { MAX_PUBLIC_PREFIX_LENGTH } from "@/lib/api-key-ref";

describe("account utils", () => {
  it("formats token quotas compactly", () => {
    expect(formatTokens(999)).toBe("999");
    expect(formatTokens(1_500)).toBe("1.5k");
    expect(formatTokens(2_000_000)).toBe("2M");
  });

  it("never returns a complete API secret as a public prefix", () => {
    const secret = "mai-pro-ABCDE-verySecretValue";
    expect(getSafeKeyPrefix(secret, "fallback")).toBe("mai-pro-ABCDE");
    expect(getSafeKeyPrefix(undefined, "fallback")).toBe("fallback");
  });

  it("never exposes more than the documented public prefix", () => {
    // Le plafond historique était de 16 caractères, soit 5 de plus que la
    // référence officielle : sur une clé de 19 caractères, il exposait 84 % du secret.
    const legacy = "mai_liveAbCdEfGhIjKl";
    const prefix = getSafeKeyPrefix(legacy, "fallback");
    expect(prefix).toBe("mai_liveAbC");
    expect(prefix.length).toBeLessThanOrEqual(MAX_PUBLIC_PREFIX_LENGTH);
    expect(legacy.startsWith(prefix)).toBe(true);
    expect(prefix).not.toContain(legacy.slice(MAX_PUBLIC_PREFIX_LENGTH));
  });

  it("keeps an already-public reference untouched", () => {
    const reference = "mai-pro-ABCDE";
    expect(getSafeKeyPrefix(reference, "fallback")).toBe(reference);
  });

  it("handles missing reset dates", () => {
    expect(formatResetDate()).toBe("—");
    expect(formatResetDate("not-a-date")).toBe("not-a-date");
  });
});
