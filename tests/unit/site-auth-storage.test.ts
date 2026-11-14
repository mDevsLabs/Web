// Issue #10 — la session ne doit plus exister dans un stockage lisible par le
// renderer. Les anciennes clés (localStorage + cookies JavaScript) sont
// purgées à chaque visite.
import { afterEach, describe, expect, it, vi } from "vitest";
import { purgeLegacyAuthStorage } from "@/lib/site/auth-storage";

type FakeDom = {
  cookieJar: Map<string, string>;
  store: Map<string, string>;
};

function installFakeDom(): FakeDom {
  const store = new Map<string, string>();
  const cookieJar = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  });
  vi.stubGlobal("document", {
    get cookie() {
      return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(value: string) {
      const [pair] = value.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const rest = value.slice(value.indexOf(";") + 1).trim();
      if (rest.startsWith("expires=Thu, 01 Jan 1970")) {
        cookieJar.delete(name);
        return;
      }
      cookieJar.set(name, pair.slice(eq + 1));
    },
  });
  return { cookieJar, store };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("purgeLegacyAuthStorage", () => {
  it("efface la clé localStorage et les cookies lisibles hérités", () => {
    const dom = installFakeDom();
    dom.store.set("mai_auth", '{"token":"jwt-hérité"}');
    dom.cookieJar.set("mai_user", '{"token":"jwt-hérité"}');
    dom.cookieJar.set("mai_token", "jwt-hérité");

    purgeLegacyAuthStorage();

    expect(dom.store.has("mai_auth")).toBe(false);
    expect(dom.cookieJar.has("mai_user")).toBe(false);
    expect(dom.cookieJar.has("mai_token")).toBe(false);
  });

  it("laisse intactes les autres clés et cookies", () => {
    const dom = installFakeDom();
    dom.store.set("autre_reglage", "valeur");
    dom.cookieJar.set("autre_cookie", "valeur");

    purgeLegacyAuthStorage();

    expect(dom.store.get("autre_reglage")).toBe("valeur");
    expect(dom.cookieJar.get("autre_cookie")).toBe("valeur");
  });

  it("ne plante pas hors navigateur", () => {
    expect(() => purgeLegacyAuthStorage()).not.toThrow();
  });
});
