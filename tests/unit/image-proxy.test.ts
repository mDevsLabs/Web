import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/(chat)/api/mai-search/image-proxy/route";
import { sniffImageType } from "@/lib/search/image-sniff";
import { safeFetchBuffer } from "@/lib/web/safe-fetch";

vi.mock("@/lib/web/safe-fetch", () => ({
  safeFetchBuffer: vi.fn(),
}));

const safeFetchBufferMock = vi.mocked(safeFetchBuffer);

function pngBytes(extra = 0): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(extra, 0x01),
  ]);
}

function proxyRequest(target: string): NextRequest {
  return new NextRequest(
    `https://app.mai.test/api/mai-search/image-proxy?url=${encodeURIComponent(target)}`
  );
}

describe("Proxy d'images — types sûrs et SSRF", () => {
  beforeEach(() => {
    safeFetchBufferMock.mockReset();
  });

  it("détecte uniquement des formats raster par signature", () => {
    expect(sniffImageType(pngBytes(4))).toBe("image/png");
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg"
    );
    expect(sniffImageType(Buffer.from("GIF89a...."))).toBe("image/gif");
    expect(sniffImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(Buffer.from("<html><script>x</script>"))).toBeNull();
    expect(sniffImageType(Buffer.from("%PDF-1.7"))).toBeNull();
  });

  it("sert une image PNG réelle avec nosniff et le type détecté", async () => {
    safeFetchBufferMock.mockResolvedValue({
      buffer: pngBytes(12),
      bytes: 20,
      contentType: "image/png",
      finalUrl: "https://cdn.example/image.png",
      ok: true,
      status: 200,
      truncated: false,
    });

    const response = await GET(proxyRequest("https://cdn.example/image.png"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'"
    );
  });

  it("refuse text/html même annoncé par le service distant", async () => {
    safeFetchBufferMock.mockResolvedValue({
      buffer: Buffer.from("<html><body>click</body></html>"),
      bytes: 32,
      contentType: "text/html",
      finalUrl: "https://evil.example/x",
      ok: true,
      status: 200,
      truncated: false,
    });

    const response = await GET(proxyRequest("https://evil.example/x"));
    expect(response.status).toBe(415);
  });

  it("refuse un type mensonger (HTML annoncé image/png)", async () => {
    safeFetchBufferMock.mockResolvedValue({
      buffer: Buffer.from("<html><script>alert(1)</script></html>"),
      bytes: 39,
      contentType: "image/png",
      finalUrl: "https://evil.example/y",
      ok: true,
      status: 200,
      truncated: false,
    });

    const response = await GET(proxyRequest("https://evil.example/y"));
    expect(response.status).toBe(415);
  });

  it("refuse un SVG actif, même si son en-tête est image/svg+xml", async () => {
    safeFetchBufferMock.mockResolvedValue({
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
      ),
      bytes: 90,
      contentType: "image/svg+xml",
      finalUrl: "https://evil.example/icon.svg",
      ok: true,
      status: 200,
      truncated: false,
    });

    const response = await GET(proxyRequest("https://evil.example/icon.svg"));
    expect(response.status).toBe(415);
  });

  it("passe par le transport sûr (pas de fetch nu) et refuse une destination privée", async () => {
    safeFetchBufferMock.mockResolvedValue({
      error: "Adresse privée ou réservée refusée : 169.254.169.254.",
      ok: false,
    });

    const response = await GET(
      proxyRequest("http://169.254.169.254/latest/meta-data/")
    );
    expect(response.status).toBe(502);
    expect(safeFetchBufferMock).toHaveBeenCalledTimes(1);
    const [, options] = safeFetchBufferMock.mock.calls[0];
    expect(options?.maxBytes).toBeGreaterThan(0);
    expect(options?.maxRedirects).toBeGreaterThan(0);
    expect(options?.timeoutMs).toBeGreaterThan(0);
  });

  it("refuse un protocole non HTTP(S) avant tout accès réseau", async () => {
    const response = await GET(proxyRequest("file:///etc/passwd"));
    expect(response.status).toBe(400);
    expect(safeFetchBufferMock).not.toHaveBeenCalled();
  });
});
