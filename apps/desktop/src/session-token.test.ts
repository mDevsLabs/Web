import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeJwtPayload,
  isUsableSessionToken,
  pickSessionToken,
} from "./session-token";

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

const future = Math.floor(Date.now() / 1000) + 3_600;
const past = Math.floor(Date.now() / 1000) - 3_600;

describe("decodeJwtPayload", () => {
  it("décode le payload sans vérifier la signature", () => {
    assert.deepEqual(decodeJwtPayload(jwt({ email: "a@b.c", exp: future })), {
      email: "a@b.c",
      exp: future,
    });
  });

  it("refuse une valeur qui n'est pas un JWT", () => {
    assert.equal(decodeJwtPayload("a.b"), null);
    assert.equal(decodeJwtPayload("pas-un-jeton"), null);
  });
});

describe("isUsableSessionToken", () => {
  it("accepte un jeton porteur d'une identité et non expiré", () => {
    assert.equal(isUsableSessionToken(jwt({ exp: future, sub: "42" })), true);
  });

  it("refuse un jeton expiré", () => {
    assert.equal(isUsableSessionToken(jwt({ exp: past, sub: "42" })), false);
  });

  it("refuse un JWT sans identité", () => {
    assert.equal(isUsableSessionToken(jwt({ exp: future })), false);
  });

  it("refuse un cookie de forme a.b.c qui n'est pas un JWT", () => {
    assert.equal(isUsableSessionToken("tracking.123.456"), false);
  });
});

describe("pickSessionToken", () => {
  it("privilégie le nom de cookie de session connu", () => {
    const token = jwt({ exp: future, sub: "42" });
    assert.equal(
      pickSessionToken([
        { name: "mesure", value: jwt({ exp: future, email: "x@y.z" }) },
        { name: "mai_session_token", value: token },
      ]),
      token
    );
  });

  it("ignore un cookie connu expiré au profit d'un alias valide", () => {
    const fresh = jwt({ exp: future, sub: "42" });
    assert.equal(
      pickSessionToken([
        { name: "mai_session_token", value: jwt({ exp: past, sub: "42" }) },
        { name: "__Secure-mai_session_token", value: fresh },
      ]),
      fresh
    );
  });

  it("ne transmet pas un cookie quelconque de forme JWT sans identité", () => {
    assert.equal(
      pickSessionToken([
        { name: "analytics", value: jwt({ exp: future, id: "abc" }) },
      ]),
      null
    );
  });

  it("retombe sur un cookie renommé porteur d'une identité", () => {
    const token = jwt({ email: "a@b.c", exp: future });
    assert.equal(
      pickSessionToken([{ name: "mai-auth-v2", value: token }]),
      token
    );
  });

  it("renvoie null sans cookie exploitable", () => {
    assert.equal(pickSessionToken([]), null);
  });
});
