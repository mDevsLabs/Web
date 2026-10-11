import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "@/lib/vibe/services/api";

// Le seed RSC n'évite l'appel API que s'il tombe pile sur la clé que le getter
// construit. Ces deux builders (feedEndpoint, profileEndpoint) sont donc un
// contrat entre `lib/vibe/server/queries/*` (qui génère la graine) et
// `ApiService` (qui la lit) : une divergence de clé ne casse rien
// visiblement — elle redéclenche silencieusement la requête supprimée.

afterEach(() => {
  ApiService.clearCache();
  vi.unstubAllGlobals();
});

describe("feedEndpoint — clé canonique du feed", () => {
  it("sans tag ni curseur", () => {
    expect(ApiService.feedEndpoint("stream")).toBe("/v1/feed?type=stream");
  });
  it("ordre stable type → tag → cursor, valeurs encodées", () => {
    expect(ApiService.feedEndpoint("trending", "ia & web", "ts|id")).toBe(
      "/v1/feed?type=trending&tag=ia+%26+web&cursor=ts%7Cid"
    );
  });
});

describe("profileEndpoint — clé canonique du profil", () => {
  it("trimme le segment, retire le @ de tête, encode le pseudo", () => {
    expect(ApiService.profileEndpoint(" @Marie ")).toBe("/v1/profiles/Marie");
    expect(ApiService.profileEndpoint("a b")).toBe("/v1/profiles/a%20b");
  });
});

describe("seedCache — la graine sert au getter sans réseau", () => {
  it("getProfile résout depuis le cache, aucun fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    ApiService.seedCache(ApiService.profileEndpoint("marie"), {
      posts: [],
      profile: { username: "marie" },
    });
    await expect(ApiService.getProfile("marie")).resolves.toEqual({
      posts: [],
      profile: { username: "marie" },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("la même graine est servie pour '@marie' (normalisation partagée)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    ApiService.seedCache(ApiService.profileEndpoint("marie"), {
      posts: [],
      profile: { username: "marie" },
    });
    await expect(ApiService.getProfile("@marie")).resolves.toEqual({
      posts: [],
      profile: { username: "marie" },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("une purge (écriture, changement de session) chasse la graine", async () => {
    const fetchSpy = vi.fn(async () => ({
      json: async () => ({ fresh: true, posts: [], profile: null }),
      ok: true,
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchSpy);
    ApiService.seedCache(ApiService.profileEndpoint("marie"), {
      posts: [],
      profile: { username: "marie" },
    });
    ApiService.clearCache();
    const res = await ApiService.getProfile("marie");
    expect(res).toEqual({ fresh: true, posts: [], profile: null });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
