/**
 * 轻量导出符号索引（正则），供 Quick Open @ 与 Grep(symbol) 使用。
 * 按 workspace 根路径分桶，支持多窗口不同文件夹并存。
 */

import * as fsp from "node:fs/promises";
import * as path from "node:path";

export type WorkspaceSymbolHit = {
  name: string;
  path: string;
  line: number;
  kind: string;
};

const SOURCE_EXT = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "rs",
  "java",
  "kt",
  "cs",
  "vue",
  "svelte",
]);

type SymbolBucket = {
  rootNorm: string;
  byLowerName: Map<string, WorkspaceSymbolHit[]>;
  byFile: Map<string, WorkspaceSymbolHit[]>;
  loadPromise: Promise<void> | null;
  rebuildingAll: boolean;
  lazyLoadAttempted: boolean;
};

const symbolBuckets = new Map<string, SymbolBucket>();

function normRoot(rootNorm: string): string {
  return path.normalize(path.resolve(rootNorm));
}

function getBucket(rootNorm: string): SymbolBucket {
  const k = normRoot(rootNorm);
  let b = symbolBuckets.get(k);
  if (!b) {
    b = {
      byFile: new Map(),
      byLowerName: new Map(),
      lazyLoadAttempted: false,
      loadPromise: null,
      rebuildingAll: false,
      rootNorm: k,
    };
    symbolBuckets.set(k, b);
  }
  return b;
}

function destroySymBucket(b: SymbolBucket): void {
  b.byLowerName.clear();
  b.byFile.clear();
  b.loadPromise = null;
  b.rebuildingAll = false;
  b.lazyLoadAttempted = false;
}

export function clearWorkspaceSymbolIndexForRoot(rootNorm: string): void {
  const k = normRoot(rootNorm);
  const b = symbolBuckets.get(k);
  if (b) {
    destroySymBucket(b);
    symbolBuckets.delete(k);
  }
}

function isSourceRel(rel: string): boolean {
  const ext = path.extname(rel).slice(1).toLowerCase();
  return SOURCE_EXT.has(ext);
}

function removeFileSymbols(b: SymbolBucket, rel: string): void {
  const prev = b.byFile.get(rel);
  if (!prev?.length) {
    return;
  }
  for (const sym of prev) {
    const key = sym.name.toLowerCase();
    const arr = b.byLowerName.get(key);
    if (!arr) {
      continue;
    }
    const next = arr.filter(
      (x) => !(x.path === rel && x.line === sym.line && x.name === sym.name)
    );
    if (next.length === 0) {
      b.byLowerName.delete(key);
    } else {
      b.byLowerName.set(key, next);
    }
  }
  b.byFile.delete(rel);
}

function addSymbols(
  b: SymbolBucket,
  rel: string,
  syms: WorkspaceSymbolHit[]
): void {
  if (syms.length === 0) {
    return;
  }
  b.byFile.set(rel, syms);
  for (const sym of syms) {
    const key = sym.name.toLowerCase();
    const arr = b.byLowerName.get(key) ?? [];
    arr.push(sym);
    b.byLowerName.set(key, arr);
  }
}

function extractSymbols(
  relPath: string,
  content: string
): WorkspaceSymbolHit[] {
  const ext = path.extname(relPath).slice(1).toLowerCase();
  const lines = content.split(/\r?\n/);
  const out: WorkspaceSymbolHit[] = [];
  const seen = new Set<string>();

  const push = (name: string, line: number, kind: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 120) {
      return;
    }
    const k = `${line}:${kind}:${trimmed}`;
    if (seen.has(k)) {
      return;
    }
    seen.add(k);
    out.push({ kind, line, name: trimmed, path: relPath });
  };

  if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte"].includes(ext)) {
    const patterns: { re: RegExp; kind: string }[] = [
      {
        kind: "function",
        re: /^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
      },
      { kind: "const", re: /^\s*export\s+const\s+([A-Za-z_$][\w$]*)/ },
      { kind: "let", re: /^\s*export\s+let\s+([A-Za-z_$][\w$]*)/ },
      { kind: "class", re: /^\s*export\s+class\s+([A-Za-z_$][\w$]*)/ },
      { kind: "interface", re: /^\s*export\s+interface\s+([A-Za-z_$][\w$]*)/ },
      { kind: "type", re: /^\s*export\s+type\s+([A-Za-z_$][\w$]*)/ },
      { kind: "enum", re: /^\s*export\s+enum\s+([A-Za-z_$][\w$]*)/ },
      {
        kind: "function",
        re: /^\s*export\s+default\s+function\s+([A-Za-z_$][\w$]*)/,
      },
      {
        kind: "declare",
        re: /^\s*export\s+declare\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/,
      },
    ];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      for (const { re, kind } of patterns) {
        const m = line.match(re);
        if (m?.[1]) {
          push(m[1], i + 1, kind);
        }
      }
      const expNamed = line.match(/^\s*export\s*\{\s*([^}]+)\}\s*(?:from|;|$)/);
      if (expNamed?.[1]) {
        const parts = expNamed[1].split(",");
        for (const p of parts) {
          const seg = p.trim();
          if (!seg) {
            continue;
          }
          const alias = seg.split(/\s+as\s+/i);
          const name = (alias[1] ?? alias[0] ?? "").trim();
          if (name && /^[A-Za-z_$][\w$]*$/.test(name)) {
            push(name, i + 1, "export");
          }
        }
      }
    }
  }

  if (ext === "py") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      let m = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/);
      if (m?.[1]) {
        push(m[1], i + 1, "def");
      }
      m = line.match(/^\s*class\s+([A-Za-z_]\w*)\s*[:(]/);
      if (m?.[1]) {
        push(m[1], i + 1, "class");
      }
    }
  }

  if (ext === "go") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const m = line.match(/^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/);
      if (m?.[1]) {
        push(m[1], i + 1, "func");
      }
      const t = line.match(/^\s*type\s+([A-Za-z_]\w*)\s+/);
      if (t?.[1]) {
        push(t[1], i + 1, "type");
      }
    }
  }

  if (ext === "rs") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const m = line.match(
        /^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(/
      );
      if (m?.[1]) {
        push(m[1], i + 1, "fn");
      }
      const s = line.match(/^\s*(?:pub\s+)?struct\s+([A-Za-z_]\w*)/);
      if (s?.[1]) {
        push(s[1], i + 1, "struct");
      }
      const e = line.match(/^\s*(?:pub\s+)?enum\s+([A-Za-z_]\w*)/);
      if (e?.[1]) {
        push(e[1], i + 1, "enum");
      }
    }
  }

  return out;
}

export async function indexWorkspaceSourceFile(
  rootNorm: string,
  rel: string
): Promise<void> {
  if (!isSourceRel(rel)) {
    return;
  }
  const b = getBucket(rootNorm);
  const full = path.join(b.rootNorm, rel.split("/").join(path.sep));
  removeFileSymbols(b, rel);
  try {
    const st = await fsp.stat(full);
    if (!st.isFile() || st.size > 400_000) {
      return;
    }
    const buf = await fsp.readFile(full);
    if (buf.includes(0)) {
      return;
    }
    const text = buf.toString("utf8");
    addSymbols(b, rel, extractSymbols(rel, text));
  } catch {
    /* ignore */
  }
}

export function removeWorkspaceSymbolsForRel(
  rootNorm: string,
  rel: string
): void {
  const b = symbolBuckets.get(normRoot(rootNorm));
  if (!b) {
    return;
  }
  removeFileSymbols(b, rel);
}

export function removeWorkspaceSymbolsUnderPrefix(
  rootNorm: string,
  prefixRel: string
): void {
  const b = symbolBuckets.get(normRoot(rootNorm));
  if (!b) {
    return;
  }
  const pref = prefixRel.endsWith("/") ? prefixRel : `${prefixRel}/`;
  for (const k of [...b.byFile.keys()]) {
    if (k === prefixRel || k.startsWith(pref)) {
      removeFileSymbols(b, k);
    }
  }
}

export async function ensureSymbolIndexLoaded(rootNorm: string): Promise<void> {
  const b = getBucket(rootNorm);
  if (b.byFile.size > 0) {
    b.lazyLoadAttempted = true;
    return;
  }
  if (b.loadPromise) {
    await b.loadPromise;
    return;
  }
  b.lazyLoadAttempted = true;
  const t0 = Date.now();
  b.loadPromise = (async () => {
    const { ensureWorkspaceFileIndex } = await import(
      "./workspaceFileIndex.js"
    );
    const files = await ensureWorkspaceFileIndex(rootNorm);
    await runFullRebuild(b, files);
    console.log(
      `[symbolIndex] rebuild done: ${b.byFile.size} files, ${b.byLowerName.size} symbols in ${Date.now() - t0}ms`
    );
  })();
  try {
    await b.loadPromise;
  } finally {
    b.loadPromise = null;
  }
}

function yieldEventLoop(): Promise<void> {
  return new Promise((r) => setImmediate(r));
}

async function runFullRebuild(
  b: SymbolBucket,
  relativeFiles: string[]
): Promise<void> {
  b.byLowerName.clear();
  b.byFile.clear();
  b.rebuildingAll = true;
  const targets = relativeFiles.filter(isSourceRel).slice(0, 12_000);
  const YIELD_EVERY = 40;
  try {
    for (let i = 0; i < targets.length; i++) {
      await indexWorkspaceSourceFile(b.rootNorm, targets[i]!);
      if ((i + 1) % YIELD_EVERY === 0) {
        await yieldEventLoop();
      }
    }
  } finally {
    b.rebuildingAll = false;
  }
}

export function searchWorkspaceSymbols(
  rawQuery: string,
  limit: number,
  rootNorm: string
): WorkspaceSymbolHit[] {
  const b = symbolBuckets.get(normRoot(rootNorm));
  if (!b) {
    return [];
  }
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const out: WorkspaceSymbolHit[] = [];
  const direct = b.byLowerName.get(q);
  if (direct) {
    out.push(...direct);
  }
  if (out.length < limit) {
    for (const [name, hits] of b.byLowerName) {
      if (name.includes(q) || q.includes(name)) {
        for (const h of hits) {
          if (out.length >= limit) {
            break;
          }
          if (
            !out.some(
              (x) => x.path === h.path && x.line === h.line && x.name === h.name
            )
          ) {
            out.push(h);
          }
        }
      }
      if (out.length >= limit) {
        break;
      }
    }
  }
  return out.slice(0, limit);
}

export function formatSymbolSearchResults(hits: WorkspaceSymbolHit[]): string {
  if (hits.length === 0) {
    return "No matching exported symbols found.";
  }
  return hits.map((h) => `${h.path}:${h.line}:${h.kind} ${h.name}`).join("\n");
}
