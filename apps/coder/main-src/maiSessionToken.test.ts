import { describe, expect, it } from "vitest";
import {
  decodeMaiJwtPayload,
  isUsableMaiSessionToken,
} from "./maiSessionToken.js";

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.sig`;
}

const future = Math.floor(Date.now() / 1000) + 3_600;
const past = Math.floor(Date.now() / 1000) - 3_600;

describe("decodeMaiJwtPayload", () => {
  it("décode un payload JWT", () => {
    expect(decodeMaiJwtPayload(jwt({ sub: "u1" }))).toEqual({ sub: "u1" });
  });

  it("refuse une valeur quelconque", () => {
    expect(decodeMaiJwtPayload("a.b")).toBeNull();
    expect(decodeMaiJwtPayload("compte@mai.val.run")).toBeNull();
  });
});

describe("isUsableMaiSessionToken", () => {
  it("accepte un jeton valide porteur d'une identité", () => {
    expect(isUsableMaiSessionToken(jwt({ exp: future, sub: "u1" }))).toBe(true);
  });

  it("refuse un jeton expiré", () => {
    expect(isUsableMaiSessionToken(jwt({ exp: past, sub: "u1" }))).toBe(false);
  });

  it("refuse un jeton sans identité", () => {
    expect(isUsableMaiSessionToken(jwt({ exp: future }))).toBe(false);
  });
});
