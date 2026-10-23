import { describe, expect, it } from "vitest";
import {
  decodeJwtPayload,
  isUsableSessionToken,
  pickSessionToken,
} from "../../apps/desktop/src/session-token";

// Ce test vivait dans apps/desktop/src/, où aucun collecteur ne l'exécutait :
// ni Vitest (le motif de collecte racine n'atteint pas apps/) ni le paquet
// apps/desktop (ni script « test » ni configuration Vitest). Il est ici
// exécuté par la suite unitaire de l'hôte, comme les autres tests du bureau.

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/[=]+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

const future = Math.floor(Date.now() / 1000) + 3600;
const past = Math.floor(Date.now() / 1000) - 3600;

describe("decodeJwtPayload", () => {
  it("décode le payload sans vérifier la signature", () => {
    expect(decodeJwtPayload(jwt({ email: "a@b.c", exp: future }))).toEqual({
      email: "a@b.c",
      exp: future,
    });
  });

  it("refuse une valeur qui n'est pas un JWT", () => {
    expect(decodeJwtPayload("a.b")).toBeNull();
    expect(decodeJwtPayload("pas-un-jeton")).toBeNull();
  });
});

describe("isUsableSessionToken", () => {
  it("accepte un jeton porteur d'une identité et non expiré", () => {
    expect(isUsableSessionToken(jwt({ exp: future, sub: "42" }))).toBe(true);
  });

  it("refuse un jeton expiré", () => {
    expect(isUsableSessionToken(jwt({ exp: past, sub: "42" }))).toBe(false);
  });

  it("refuse un JWT sans identité", () => {
    expect(isUsableSessionToken(jwt({ exp: future }))).toBe(false);
  });

  it("refuse un cookie de forme a.b.c qui n'est pas un JWT", () => {
    expect(isUsableSessionToken("tracking.123.456")).toBe(false);
  });
});

describe("pickSessionToken", () => {
  it("privilégie le nom de cookie de session connu", () => {
    const token = jwt({ exp: future, sub: "42" });
    expect(
      pickSessionToken([
        { name: "mesure", value: jwt({ email: "x@y.z", exp: future }) },
        { name: "mai_session_token", value: token },
      ])
    ).toBe(token);
  });

  it("ignore un cookie connu expiré au profit d'un alias valide", () => {
    const fresh = jwt({ exp: future, sub: "42" });
    expect(
      pickSessionToken([
        { name: "mai_session_token", value: jwt({ exp: past, sub: "42" }) },
        { name: "__Secure-mai_session_token", value: fresh },
      ])
    ).toBe(fresh);
  });

  it("ne transmet pas un cookie quelconque de forme JWT sans identité", () => {
    expect(
      pickSessionToken([
        { name: "analytics", value: jwt({ exp: future, id: "abc" }) },
      ])
    ).toBeNull();
  });

  it("retombe sur un cookie renommé porteur d'une identité", () => {
    const token = jwt({ email: "a@b.c", exp: future });
    expect(pickSessionToken([{ name: "mai-auth-v2", value: token }])).toBe(
      token
    );
  });

  it("renvoie null sans cookie exploitable", () => {
    expect(pickSessionToken([])).toBeNull();
  });
});
