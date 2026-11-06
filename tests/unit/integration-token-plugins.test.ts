import { describe, expect, it } from "vitest";
import {
  packCredential,
  unpackCredential,
} from "@/lib/integrations/credential-envelope";
import { hostAllowed } from "@/lib/integrations/hosts";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import {
  fillCredentialUrl,
  validateTokenFields,
} from "@/lib/integrations/token-fields";

const TOKEN_IDS = [
  "asana",
  "brave",
  "brevo",
  "dockerhub",
  "exchange-rate",
  "jira",
  "make",
  "mapbox",
  "neon",
  "npm",
  "sonarcloud",
  "supabase",
  "discord",
  "notion",
  "twilio",
  "upstash",
  "zapier",
] as const;

describe("connecteurs à jeton", () => {
  it("enregistre les connecteurs à jeton, avec un jeton de mention unique", () => {
    const mentions = INTEGRATION_PROVIDERS.map((item) => item.mentionToken);
    expect(new Set(mentions).size).toBe(mentions.length);
    for (const token of mentions) {
      expect(token).toMatch(/^[a-zA-Z0-9_.-]{3,30}$/);
    }
    for (const id of TOKEN_IDS) {
      const descriptor = INTEGRATION_PROVIDERS.find((item) => item.id === id);
      expect(descriptor?.authMode).toBe("token");
      expect(descriptor?.pluginId).toBe(id);
      expect(descriptor?.logoPath).toBeUndefined();
    }
  });

  it("n'accepte un hôte à suffixe que sur une seule étiquette", () => {
    const jira = { hostSuffixes: [".atlassian.net"], hosts: [] as const };
    expect(hostAllowed("exemple.atlassian.net", jira)).toBe(true);
    expect(hostAllowed("foo.bar.atlassian.net", jira)).toBe(false);
    expect(hostAllowed("atlassian.net", jira)).toBe(false);
    expect(hostAllowed("exemple.atlassian.net.evil.com", jira)).toBe(false);
    const upstash = {
      hostSuffixes: [".upstash.io"],
      hosts: ["api.vercel.com"],
    };
    expect(hostAllowed("abc.upstash.io", upstash)).toBe(true);
    expect(hostAllowed("api.vercel.com", upstash)).toBe(true);
    expect(hostAllowed("evil.com", upstash)).toBe(false);
  });

  it("valide les champs collés avec le jeton et rejette le reste", () => {
    const specs = INTEGRATION_PROVIDERS.find((item) => item.id === "jira")
      ?.token?.fields;
    expect(specs?.map((field) => field.kind)).toEqual(["email", "jira-site"]);
    const ok = validateTokenFields(specs ?? [], {
      email: "Ada@Exemple.com",
      site: "https://Mon-Site.atlassian.net/",
    });
    expect(ok).toEqual({
      fields: { email: "ada@exemple.com", site: "mon-site.atlassian.net" },
      ok: true,
    });
    expect(
      validateTokenFields(specs ?? [], {
        email: "ada@exemple.com",
        site: "mon-site.evil.com",
      }).ok
    ).toBe(false);
    expect(validateTokenFields([], { extra: "non" })).toMatchObject({
      ok: false,
    });
    const make = validateTokenFields(
      INTEGRATION_PROVIDERS.find((item) => item.id === "make")?.token?.fields ??
        [],
      { zone: "EU1" }
    );
    expect(make).toEqual({ fields: { zone: "eu1" }, ok: true });
    const upstash = validateTokenFields(
      INTEGRATION_PROVIDERS.find((item) => item.id === "upstash")?.token
        ?.fields ?? [],
      { restOrigin: "https://Ma-Base.upstash.io/chemin" }
    );
    expect(upstash.ok).toBe(false);
  });

  it("transporte les champs avec le jeton et laisse un jeton simple intact", () => {
    const packed = packCredential("secret-token", {
      site: "exemple.atlassian.net",
    });
    expect(packed.startsWith("mai-cred.v1.")).toBe(true);
    expect(unpackCredential(packed)).toEqual({
      fields: { site: "exemple.atlassian.net" },
      token: "secret-token",
    });
    expect(unpackCredential("vercel-token")).toEqual({
      fields: {},
      token: "vercel-token",
    });
    expect(unpackCredential("mai-cred.v1.%%%")).toEqual({
      fields: {},
      token: "",
    });
  });

  it("n'insère dans une URL que des morceaux déjà validés", () => {
    expect(
      fillCredentialUrl("https://{seg:site}/rest/api/3/myself", {
        fields: { site: "exemple.atlassian.net" },
        token: "secret",
      })
    ).toBe("https://exemple.atlassian.net/rest/api/3/myself");
    expect(
      fillCredentialUrl(
        "https://v6.exchangerate-api.com/v6/{token}/latest/EUR",
        {
          fields: {},
          token: "ab/../cd",
        }
      )
    ).toBe("https://v6.exchangerate-api.com/v6/ab%2F..%2Fcd/latest/EUR");
    expect(
      fillCredentialUrl("{origin:restOrigin}/", {
        fields: { restOrigin: "https://evil.com" },
        token: "secret",
      })
    ).toBeNull();
  });
});
