import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchRemoteImage,
  parseRemoteImageUrl,
  REMOTE_IMAGE_MAX_BYTES,
  sniffImageMime,
} from "@/lib/net/fetch-image";

// Garde SSRF : HTTPS strict, hôtes privés interdits, redirections revalidées,
// sniff magic bytes (pas d'extension ni Content-Type seul), taille plafonnée.

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13,
]);
const SVG_BYTES = new TextEncoder()
  .encode("<svg xmlns='http://www.w3.org/2000/svg'><script/></svg>")
  .slice(0, 32);

function htmlResponse(
  status: number,
  headers: Record<string, string> = {},
  body: Uint8Array = PNG_BYTES
): Response {
  return {
    arrayBuffer: async () => body.buffer.slice(0) as ArrayBuffer,
    headers: new Headers(headers),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

describe("parseRemoteImageUrl (validation statique HTTPS)", () => {
  it("accepte une URL HTTPS publique correctement parsée", () => {
    const result = parseRemoteImageUrl("https://example.com/images/avatar.png");
    expect(result.ok).toBe(true);
  });

  it("refuse HTTP, FTP et tout schéma non HTTPS", () => {
    expect(parseRemoteImageUrl("http://example.com/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("ftp://example.com/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("refuse localhost, .local, .internal et les littéraux IP", () => {
    expect(parseRemoteImageUrl("https://localhost/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("https://sub.localhost/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("https://db.internal/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("https://127.0.0.1/a.png").ok).toBe(false);
    expect(parseRemoteImageUrl("https://10.0.0.5/a.png").ok).toBe(false);
    expect(
      parseRemoteImageUrl("https://169.254.169.254/latest/meta-data").ok
    ).toBe(false);
    expect(parseRemoteImageUrl("https://[::1]/a.png").ok).toBe(false);
  });

  it("refuse les URL avec identifiants embarqués", () => {
    expect(parseRemoteImageUrl("https://user:pass@example.com/a.png").ok).toBe(
      false
    );
  });

  it("refuse une URL malformée", () => {
    expect(parseRemoteImageUrl("not a url").ok).toBe(false);
  });
});

describe("sniffImageMime (magic bytes, pas de confiance au Content-Type)", () => {
  it("reconnaît PNG, JPEG, GIF et WebP", () => {
    expect(sniffImageMime(PNG_BYTES)).toBe("image/png");
    expect(
      sniffImageMime(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
      )
    ).toBe("image/jpeg");
    expect(
      sniffImageMime(
        new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0])
      )
    ).toBe("image/gif");
    expect(
      sniffImageMime(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ])
      )
    ).toBe("image/webp");
  });

  it("rejette SVG et tout contenu actif ou inconnu", () => {
    expect(sniffImageMime(SVG_BYTES)).toBeNull();
    expect(
      sniffImageMime(new TextEncoder().encode("<html>").slice(0, 12))
    ).toBeNull();
  });

  it("rejette les buffers trop courts", () => {
    expect(sniffImageMime(new Uint8Array(4))).toBeNull();
  });
});

describe("fetchRemoteImage (garde SSRF à l'exécution)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("récupère une image PNG valide et renvoie le MIME sniffé", async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | globalThis.Request, _init?: RequestInit) =>
        htmlResponse(200, { "content-type": "image/png" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRemoteImage("https://example.com/a.png");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe("image/png");
    }
    // Aucun cookie/token utilisateur : uniquement l'en-tête Accept, en
    // redirect: manual pour revalider chaque saut.
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://example.com/a.png");
    expect((init as RequestInit).redirect).toBe("manual");
    expect((init as RequestInit).headers).toEqual({
      Accept: "image/jpeg,image/png,image/webp,image/gif",
    });
  });

  it("refuse un SVG servi avec un Content-Type image (arbitre = magic bytes)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        htmlResponse(200, { "content-type": "image/svg+xml" }, SVG_BYTES)
      )
    );

    const result = await fetchRemoteImage("https://example.com/a.svg");
    expect(!result.ok && result.error.code).toBe("not_an_image");
  });

  it("refuse un Content-Type déclaré non image (text/html)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => htmlResponse(200, { "content-type": "text/html" }))
    );

    const result = await fetchRemoteImage("https://example.com/a.png");
    expect(!result.ok && result.error.code).toBe("not_an_image");
  });

  it("refuse un contenu dépassant la limite de taille", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        htmlResponse(200, {
          "content-length": String(REMOTE_IMAGE_MAX_BYTES + 1),
        })
      )
    );

    const result = await fetchRemoteImage("https://example.com/big.png");
    expect(!result.ok && result.error.code).toBe("too_large");
  });

  it("revalide chaque redirection : http et hôte privé restent interdits", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        htmlResponse(302, { location: "http://example.com/b.png" })
      );
    vi.stubGlobal("fetch", fetchMock);

    const httpRedirect = await fetchRemoteImage("https://example.com/a.png");
    expect(!httpRedirect.ok && httpRedirect.error.code).toBe("invalid_url");

    const fetchMock2 = vi
      .fn()
      .mockResolvedValueOnce(
        htmlResponse(302, { location: "https://127.0.0.1/b.png" })
      );
    vi.stubGlobal("fetch", fetchMock2);

    const ssrfRedirect = await fetchRemoteImage("https://example.com/a.png");
    expect(!ssrfRedirect.ok && ssrfRedirect.error.code).toBe("blocked_host");
  });

  it("borne le nombre de redirections (max 3)", async () => {
    const redirect = () =>
      htmlResponse(302, { location: "https://example.com/next" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirect())
      .mockResolvedValueOnce(redirect())
      .mockResolvedValueOnce(redirect())
      .mockResolvedValueOnce(redirect());
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRemoteImage("https://example.com/a.png");
    expect(!result.ok && result.error.code).toBe("too_many_redirects");
  });

  it("renvoie timeout sur abort et network sur échec de connexion", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw abortError;
      })
    );
    const timeout = await fetchRemoteImage("https://example.com/a.png");
    expect(!timeout.ok && timeout.error.code).toBe("timeout");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const network = await fetchRemoteImage("https://example.com/a.png");
    expect(!network.ok && network.error.code).toBe("network");
  });

  it("refuse un statut 404 avec une erreur réseau explicite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => htmlResponse(404))
    );

    const result = await fetchRemoteImage("https://example.com/gone.png");
    expect(!result.ok && result.error.code).toBe("network");
  });
});
