import { describe, expect, it } from "vitest";
import { masquer } from "@/lib/cron/log-mask";

describe("masquer (journaux publics des ticks)", () => {
  it("masque URL de base, jetons, e-mails et identifiants", () => {
    const ligne = [
      "postgres://u:p@ep-x.neon.tech/db?sslmode=require",
      "Bearer abc.def",
      "eyJhbGciOi.eyJzdWIiOi.sig",
      "sk-or-v1-0123456789abcdef",
      "ghp_0123456789abcdefghijABCD",
      "eleve@exemple.fr",
      "0f8fad5b-d9cb-469f-a165-70867728950e",
    ].join(" ");
    const sortie = masquer(ligne);
    expect(sortie).toBe(
      "<db-url> Bearer <secret> <jwt> <cle> <cle> <email> <id>"
    );
  });

  it("laisse intacts les journaux ordinaires", () => {
    const ligne = "[cron-direct] ✓ planning -> 200 (412 ms)";
    expect(masquer(ligne)).toBe(ligne);
  });
});
