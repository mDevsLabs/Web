import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";

// Un antivirus ou l'indexeur Windows ouvrent brièvement la cible : le rename
// qui la remplace échoue alors que rien n'est réellement cassé. On injecte ces
// échecs pour vérifier que l'écriture les encaisse au lieu de les remonter.
const injected = vi.hoisted(() => ({ renameFailures: 0, renames: 0 }));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    default: actual,
    renameSync(from: fs.PathLike, to: fs.PathLike) {
      injected.renames += 1;
      if (injected.renameFailures > 0) {
        injected.renameFailures -= 1;
        const error = new Error(
          "EPERM: operation not permitted, rename"
        ) as NodeJS.ErrnoException;
        error.code = "EPERM";
        throw error;
      }
      return actual.renameSync(from, to);
    },
  };
});

import {
  decodeTextBuffer,
  encodeTextBuffer,
  readTextFileSyncWithMetadata,
  writeTextFileAtomicSync,
} from "./textEncoding.js";

describe("text encoding helpers", () => {
  it("decodes UTF-8 shell output with CJK text", () => {
    const decoded = decodeTextBuffer(Buffer.from("中文输出 OK", "utf8"));
    expect(decoded.text).toBe("中文输出 OK");
    expect(decoded.encoding).toBe("utf8");
  });

  it("decodes UTF-16LE output without a BOM, including WSL-style Chinese errors", () => {
    const message = "适用于 Linux 的 Windows 子系统没有已安装的分发。\n";
    const decoded = decodeTextBuffer(Buffer.from(message, "utf16le"));
    expect(decoded.text).toBe(message);
    expect(decoded.encoding).toBe("utf16le");
  });

  it("decodes legacy GB18030 when selected as the preferred legacy encoding", () => {
    const decoded = decodeTextBuffer(Buffer.from([0xd6, 0xd0, 0xce, 0xc4]), {
      preferredLegacyEncoding: "gb18030",
    });
    expect(decoded.text).toBe("中文");
    expect(decoded.encoding).toBe("gb18030");
  });

  it("preserves UTF-16LE BOM when writing text back", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "async-encoding-"));
    const file = path.join(dir, "utf16.txt");
    fs.writeFileSync(file, encodeTextBuffer("你好\r\nold", "utf16le-bom"));

    const meta = readTextFileSyncWithMetadata(file);
    expect(meta.encoding).toBe("utf16le-bom");
    expect(meta.lineEndings).toBe("CRLF");

    writeTextFileAtomicSync(
      file,
      meta.text.replace("old", "new"),
      meta.encoding
    );
    const raw = fs.readFileSync(file);
    expect([...raw.subarray(0, 2)]).toEqual([0xff, 0xfe]);
    expect(readTextFileSyncWithMetadata(file).text).toBe("你好\r\nnew");
  });

  it("retries the atomic replace when the rename is transiently blocked", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "async-encoding-"));
    const file = path.join(dir, "replace.txt");
    fs.writeFileSync(file, "before");

    injected.renameFailures = 2;
    injected.renames = 0;
    writeTextFileAtomicSync(file, "after", "utf8");

    expect(injected.renames).toBe(3);
    expect(fs.readFileSync(file, "utf8")).toBe("after");
    // Chaque essai repart d'un fichier temporaire neuf : aucun ne doit rester.
    expect(fs.readdirSync(dir).filter((e) => e.includes(".tmp-"))).toEqual([]);
  });

  it("gives up once the transient failures outlast the retries", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "async-encoding-"));
    const file = path.join(dir, "doomed.txt");
    fs.writeFileSync(file, "before");

    injected.renameFailures = Number.MAX_SAFE_INTEGER;
    injected.renames = 0;
    try {
      expect(() => writeTextFileAtomicSync(file, "after", "utf8")).toThrow(
        /EPERM/
      );
    } finally {
      injected.renameFailures = 0;
    }

    expect(injected.renames).toBe(5);
    expect(fs.readFileSync(file, "utf8")).toBe("before");
    expect(fs.readdirSync(dir).filter((e) => e.includes(".tmp-"))).toEqual([]);
  });

  it("surfaces a missing file instead of retrying it", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "async-encoding-"));
    const missing = path.join(dir, "absent.txt");

    injected.renames = 0;
    // Un ENOENT est définitif : le retenter retarderait le message d'erreur
    // sans jamais le changer.
    expect(() => readTextFileSyncWithMetadata(missing)).toThrow(/ENOENT/);
  });
});
