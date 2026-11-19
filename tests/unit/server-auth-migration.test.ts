import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/auth/server-auth";
import { MAX_VERIFICATION_ATTEMPTS } from "@/lib/auth/verification";

describe("server-auth & verification", () => {
  describe("parseUserAgent", () => {
    it("détecte correctement macOS et Safari", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
      const info = parseUserAgent(ua);
      expect(info.os).toBe("apple");
      expect(info.device_model).toBe("Safari");
    });

    it("détecte correctement Windows et Chrome", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const info = parseUserAgent(ua);
      expect(info.os).toBe("microsoft");
      expect(info.device_model).toBe("Chrome");
    });

    it("détecte correctement iPhone", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
      const info = parseUserAgent(ua);
      expect(info.os).toBe("apple");
    });

    it("gère les User-Agents vides ou inconnus sans crash", () => {
      const info = parseUserAgent("");
      expect(info.os).toBe("linux");
      expect(info.device_model).toBe("Navigateur Web");
    });
  });

  describe("constantes et règles de vérification", () => {
    it("limite le nombre de tentatives à 5", () => {
      expect(MAX_VERIFICATION_ATTEMPTS).toBe(5);
    });
  });
});
