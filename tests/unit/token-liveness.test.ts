import { describe, expect, it } from "vitest";

import { isLiveSessionToken } from "@/lib/auth/token-liveness";

// Le middleware est la PREMIÈRE porte de l'application : c'est lui qui décide
// si `/login` est accessible, si une API répond 401 et si l'on entre dans
// l'interface. Il ne peut pas vérifier la signature du jeton — il se contente
// donc de lire l'expiration. Ces tests verrouillent le comportement qui
// enfermait l'utilisateur hors de l'écran de connexion : un cookie expiré
// valait « connecté », ce qui redirigeait `/login` vers `/` et laissait
// l'application dans un état sans aucune issue.

function token(exp: number | undefined) {
  const b64url = (value: string) =>
    Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/[=]+$/, "");
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify(exp === undefined ? { sub: "u-1" } : { exp, sub: "u-1" })
  );
  return `${head}.${body}.signature-bidon`;
}

const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;
const anHourAgo = () => Math.floor(Date.now() / 1000) - 3600;

describe("isLiveSessionToken", () => {
  it("accepte un jeton dont l'expiration est à venir", () => {
    expect(isLiveSessionToken(token(inOneHour()))).toBe(true);
  });

  it("refuse un jeton expiré — le cookie seul ne vaut pas session", () => {
    expect(isLiveSessionToken(token(anHourAgo()))).toBe(false);
  });

  it("refuse un jeton sans expiration (session non révocable)", () => {
    expect(isLiveSessionToken(token(undefined))).toBe(false);
  });

  it("refuse une valeur qui n'est pas un JWT", () => {
    expect(isLiveSessionToken("opaque-token")).toBe(false);
    expect(isLiveSessionToken("a.b.c")).toBe(false);
    expect(isLiveSessionToken("a.eyJub3QtanNvbg.sig")).toBe(false);
  });

  it("refuse l'absence de cookie", () => {
    expect(isLiveSessionToken(undefined)).toBe(false);
    expect(isLiveSessionToken(null)).toBe(false);
    expect(isLiveSessionToken("")).toBe(false);
  });
});
