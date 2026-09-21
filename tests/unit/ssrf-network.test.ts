import { describe, expect, it } from "vitest";
import {
  blockedIpReason,
  isPrivateOrBlockedHost,
  MAX_REDIRECTS,
  parseIpv4ToBytes,
  redactUrlForThirdParty,
  resolveRedirectTarget,
  safeExternalUrl,
  validateAndResolveUrl,
} from "@/lib/web/ssrf";
import {
  headersForHop,
  isTokenOriginAllowed,
  readStreamCapped,
} from "@/lib/web/safe-fetch";
import { inspectZipArchive, looksLikePdf, looksLikeZip } from "@/lib/web/zip-guard";

describe("SSRF — classification des adresses littérales", () => {
  it("bloque loopback, privé, CGNAT, link-local et métadonnées cloud", () => {
    const blocked = [
      "127.0.0.1",
      "127.1",
      "0x7f.0.0.1",
      "0177.0.0.1",
      "2130706433",
      "10.0.0.5",
      "172.16.4.1",
      "172.31.255.254",
      "192.168.1.10",
      "169.254.169.254", // métadonnées AWS/GCP/Azure
      "100.100.100.200", // métadonnées Alibaba (CGNAT)
      "0.0.0.0",
      "224.0.0.1",
      "255.255.255.255",
      "[::1]",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "::ffff:169.254.169.254",
      "fe80::1",
      "fd00::1",
      "fc00::1",
    ];
    for (const host of blocked) {
      expect(blockedIpReason(host), host).not.toBeNull();
      expect(isPrivateOrBlockedHost(host), host).toBe(true);
    }
  });

  it("laisse passer les adresses publiques", () => {
    for (const host of [
      "1.1.1.1",
      "8.8.8.8",
      "93.184.216.34",
      "2606:4700:4700::1111",
      "example.com",
      "api.github.com",
    ]) {
      expect(blockedIpReason(host), host).toBeNull();
      expect(isPrivateOrBlockedHost(host), host).toBe(false);
    }
  });

  it("bloque les noms internes de cluster", () => {
    for (const host of [
      "localhost",
      "app.localhost",
      "service.internal",
      "db.local",
      "api.cluster.local",
      "metadata.google.internal",
      "kubernetes.default",
    ]) {
      expect(isPrivateOrBlockedHost(host), host).toBe(true);
    }
  });

  it("normalise les encodages IPv4 abrégés", () => {
    expect(parseIpv4ToBytes("2130706433")).toEqual([127, 0, 0, 1]);
    expect(parseIpv4ToBytes("0x7f.1")).toEqual([127, 0, 0, 1]);
    expect(parseIpv4ToBytes("10.1")).toEqual([10, 0, 0, 1]);
    expect(parseIpv4ToBytes("pas-une-ip")).toBeNull();
    expect(parseIpv4ToBytes("300.1.1.1")).toBeNull();
  });
});

describe("SSRF — URL et redirections", () => {
  it("refuse les schémas non http(s), les identifiants et les ports exotiques", () => {
    expect(safeExternalUrl("file:///etc/passwd").error).toBeDefined();
    expect(safeExternalUrl("gopher://example.com/").error).toBeDefined();
    expect(safeExternalUrl("data:text/html,<script>").error).toBeDefined();
    expect(safeExternalUrl("https://user:pass@example.com/").error).toBeDefined();
    expect(safeExternalUrl("https://example.com:2375/").error).toBeDefined();
    expect(safeExternalUrl("javascript:alert(1)").error).toBeDefined();
    expect(safeExternalUrl("").error).toBeDefined();
    // `hote:port` reste interprété comme un hôte, pas comme un schéma.
    expect(safeExternalUrl("example.com:8443/x").url?.hostname).toBe(
      "example.com"
    );
    expect(safeExternalUrl("https://example.com/path").url?.hostname).toBe(
      "example.com"
    );
  });

  it("revalide CHAQUE saut de redirection et refuse les protocoles détournés", () => {
    // Le cas classique : une URL publique redirige vers les métadonnées cloud.
    const target = resolveRedirectTarget(
      "http://169.254.169.254/latest/meta-data/",
      "https://example.com/"
    );
    expect(target).not.toBeNull();
    expect(safeExternalUrl(target!.toString()).error).toBeDefined();

    expect(
      resolveRedirectTarget("file:///etc/passwd", "https://example.com/")
    ).toBeNull();
    expect(
      resolveRedirectTarget("/relatif", "https://example.com/a/b")?.toString()
    ).toBe("https://example.com/relatif");
    expect(MAX_REDIRECTS).toBeLessThanOrEqual(3);
  });

  it("refuse un hôte résolu vers une adresse privée (DNS rebinding)", async () => {
    const rebind = await validateAndResolveUrl("https://public-looking.example/x", {
      resolver: async () => ["93.184.216.34", "127.0.0.1"],
    });
    expect(rebind.error).toBeDefined();
    expect(rebind.error).toContain("adresse interdite");

    const metadata = await validateAndResolveUrl("https://metadata.example/", {
      resolver: async () => ["169.254.169.254"],
    });
    expect(metadata.error).toBeDefined();
  });

  it("accepte un hôte résolu uniquement vers des adresses publiques", async () => {
    const ok = await validateAndResolveUrl("https://api.example.com/v1", {
      resolver: async () => ["93.184.216.34", "2606:4700::1"],
    });
    expect(ok.error).toBeUndefined();
    expect(ok.host?.addresses).toHaveLength(2);
  });

  it("échoue proprement quand la résolution DNS échoue", async () => {
    const failed = await validateAndResolveUrl("https://nx.example/", {
      resolver: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    expect(failed.error).toContain("DNS");
  });

  it("masque les paramètres sensibles envoyés à un service tiers", () => {
    expect(
      redactUrlForThirdParty(
        "https://app.example/private?token=ghp_secret&lang=fr#x"
      )
    ).toBe("https://app.example/private?token=***&lang=fr#x");
    expect(redactUrlForThirdParty("pas une url")).toBe("pas une url");
  });
});

describe("Client sortant — en-têtes et plafonds", () => {
  it("n'envoie un jeton que vers une origine explicitement autorisée", () => {
    const allowlist = ["https://api.mai.example"];
    expect(
      isTokenOriginAllowed("https://api.mai.example/cloud/files", allowlist)
    ).toBe(true);
    // Piège classique : suffixe trompeur.
    expect(
      isTokenOriginAllowed("https://api.mai.example.evil.com/steal", allowlist)
    ).toBe(false);
    expect(isTokenOriginAllowed("http://api.mai.example/", allowlist)).toBe(false);
    expect(isTokenOriginAllowed("https://autre.example/", allowlist)).toBe(false);
  });

  it("retire l'en-tête Authorization à chaque saut non autorisé", () => {
    const headers = { Accept: "*/*", Authorization: "Bearer secret-session" };
    const allowed = headersForHop(
      headers,
      "https://api.mai.example/x",
      ["https://api.mai.example"]
    );
    expect(allowed.Authorization).toBe("Bearer secret-session");

    const foreign = headersForHop(headers, "https://evil.example/x", [
      "https://api.mai.example",
    ]);
    expect(foreign.Authorization).toBeUndefined();
    expect(foreign.Accept).toBe("*/*");

    // Sans liste blanche déclarée : jamais de jeton (défaut restrictif).
    const undeclared = headersForHop(headers, "https://api.mai.example/x", undefined);
    expect(undeclared.Authorization).toBeUndefined();
  });

  it("borne la lecture d'un flux et détruit la source au dépassement", async () => {
    let destroyed = false;
    async function* stream() {
      for (let index = 0; index < 100; index += 1) {
        yield Buffer.alloc(1024, index);
      }
    }
    const source = {
      destroy: () => {
        destroyed = true;
      },
      [Symbol.asyncIterator]: stream,
    } as unknown as AsyncIterable<unknown> & { destroy: () => void };

    const result = await readStreamCapped(source, 4096);
    expect(result.truncated).toBe(true);
    expect(result.bytes).toBe(4096);
    expect(result.buffer.length).toBe(4096);
    expect(destroyed).toBe(true);
  });

  it("renvoie le contenu entier quand il tient sous le plafond", async () => {
    async function* stream() {
      yield Buffer.from("bonjour ");
      yield Buffer.from("le monde");
    }
    const source = {
      destroy: () => {},
      [Symbol.asyncIterator]: stream,
    } as unknown as AsyncIterable<unknown> & { destroy: () => void };

    const result = await readStreamCapped(source, 1024);
    expect(result.truncated).toBe(false);
    expect(result.buffer.toString("utf8")).toBe("bonjour le monde");
  });
});

describe("Bombes de décompression (DOCX/ZIP)", () => {
  /** Construit un ZIP minimal dont l'annuaire central déclare les tailles. */
  function buildZip(entries: Array<{ name: string; uncompressed: number }>): Buffer {
    const central: Buffer[] = [];
    for (const entry of entries) {
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);
      header.writeUInt32LE(entry.uncompressed, 24);
      header.writeUInt16LE(entry.name.length, 28);
      central.push(Buffer.concat([header, Buffer.from(entry.name, "utf8")]));
    }
    const centralBuffer = Buffer.concat(central);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralBuffer.length, 12);
    eocd.writeUInt32LE(0, 16);
    return Buffer.concat([centralBuffer, eocd]);
  }

  it("accepte une archive raisonnable", () => {
    const archive = buildZip([
      { name: "word/document.xml", uncompressed: 40_000 },
      { name: "[Content_Types].xml", uncompressed: 1_200 },
    ]);
    const inspection = inspectZipArchive(archive as Buffer);
    expect(inspection.ok).toBe(true);
    if (inspection.ok) {
      expect(inspection.entries).toBe(2);
      expect(inspection.totalUncompressedBytes).toBe(41_200);
    }
    expect(looksLikeZip(archive as Buffer)).toBe(false); // annuaire seul : pas d'en-tête local
  });

  it("refuse une bombe de décompression (taille annoncée délirante)", () => {
    const bomb = buildZip([
      { name: "word/document.xml", uncompressed: 0x7fffffff },
    ]);
    const inspection = inspectZipArchive(bomb as Buffer);
    expect(inspection.ok).toBe(false);
    if (!inspection.ok) {
      expect(inspection.error).toMatch(/refus/i);
    }
  });

  it("refuse une archive avec trop d'entrées", () => {
    const many = buildZip(
      Array.from({ length: 10 }, (_, index) => ({
        name: `f${index}.xml`,
        uncompressed: 10,
      }))
    );
    expect(inspectZipArchive(many as Buffer, { maxEntries: 5 }).ok).toBe(false);
  });

  it("refuse les tailles zip64 non vérifiables et les buffers non ZIP", () => {
    const zip64 = buildZip([{ name: "a", uncompressed: 1 }]);
    zip64.writeUInt32LE(0xffffffff, zip64.length - 22 + 16);
    expect(inspectZipArchive(zip64 as Buffer).ok).toBe(false);
    expect(inspectZipArchive(Buffer.from("pas un zip")).ok).toBe(false);
  });

  it("identifie les en-têtes PDF et ZIP", () => {
    expect(looksLikePdf(Buffer.from("%PDF-1.7\n…"))).toBe(true);
    expect(looksLikePdf(Buffer.from("<html>"))).toBe(false);
    expect(looksLikeZip(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });
});
