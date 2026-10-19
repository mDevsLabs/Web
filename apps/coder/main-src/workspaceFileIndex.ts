import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import chokidar from "chokidar";
import {
  clearWorkspaceSymbolIndexForRoot,
  indexWorkspaceSourceFile,
  removeWorkspaceSymbolsForRel,
  removeWorkspaceSymbolsUnderPrefix,
} from "./workspaceSymbolIndex.js";

const execFileAsync = promisify(execFile);
const AUTO_ATTACH_WORKSPACE_FILE_WATCHER =
  process.env.MAI_CODER_ENABLE_WORKSPACE_FILE_WATCHER === "1" ||
  process.env.ASYNC_ENABLE_WORKSPACE_FILE_WATCHER === "1";

function throwIfAborted(
  signal?: AbortSignal,
  _phase?: string,
  _rootNorm?: string
): void {
  if (!signal?.aborted) {
    return;
  }
  throw new DOMException("Aborted", "AbortError");
}

/** Noms de dossiers ignorés lors du parcours (comparaison insensible à la casse) */
const SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".venv",
  "venv",
  "dist",
  "build",
  "out",
  "coverage",
  "__pycache__",
  ".idea",
  ".vs",
  "target",
  ".next",
  ".nuxt",
  "Pods",
  ".gradle",
  "DerivedData",
  "appdata",
  "application data",
  "cookies",
  "local settings",
]);

const SKIP_RELATIVE_PREFIXES = [
  ".mai/index/",
  ".mai/memory/",
  ".mai/composer-drops/",
  ".mai/agent-memory/",
  ".mai/agent-memory-local/",
  ".async/index/",
  ".async/memory/",
  ".async/composer-drops/",
  ".async/agent-memory/",
  ".async/agent-memory-local/",
];

/** Nombre max de fichiers par workspace (plafond relevé pour gros monorepos) */
export const MAX_WORKSPACE_FILES = 5000;

type FileIndexBucket = {
  rootNorm: string;
  relPathSet: Set<string>;
  /** 整库扫描后的有序快照；watcher 变更后置空，搜索时再按需重建 */
  sortedPathsSnapshot: string[] | null;
  /** basename 前两字符（小写）→ 路径；与 relPathSet 同步，在快照失效时清空 */
  basenameTwoCharBuckets: Map<string, Set<string>> | null;
  watcher: chokidar.FSWatcher | null;
  inFlightRefresh: Promise<string[]> | null;
  refCount: number;
};

const buckets = new Map<string, FileIndexBucket>();

/** Notifie le renderer après le premier scan complet (pour rejouer la dernière requête du menu @) */
let notifyFileIndexReady: ((rootNorm: string) => void) | null = null;

export function setWorkspaceFileIndexReadyBroadcaster(
  cb: ((rootNorm: string) => void) | null
): void {
  notifyFileIndexReady = cb;
}

function getBucket(rootNorm: string): FileIndexBucket {
  let b = buckets.get(rootNorm);
  if (!b) {
    b = {
      basenameTwoCharBuckets: null,
      inFlightRefresh: null,
      refCount: 0,
      relPathSet: new Set(),
      rootNorm,
      sortedPathsSnapshot: null,
      watcher: null,
    };
    buckets.set(rootNorm, b);
  }
  return b;
}

/** Incrémente la référence à l'ouverture d'un dossier ; plusieurs fenêtres sur le même root partagent l'index. */
export function acquireWorkspaceFileIndexRef(rootAbs: string): void {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  const b = getBucket(rootNorm);
  b.refCount++;
}

/** Décrémente la référence à la fermeture ; à 0, arrête le watcher et nettoie l'index mémoire. */
export function releaseWorkspaceFileIndexRef(rootAbs: string): void {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  const b = buckets.get(rootNorm);
  if (!b) {
    return;
  }
  b.refCount = Math.max(0, b.refCount - 1);
  if (b.refCount > 0) {
    return;
  }
  destroyBucket(b);
  buckets.delete(rootNorm);
  clearWorkspaceSymbolIndexForRoot(rootNorm);
}

function destroyBucket(b: FileIndexBucket): void {
  if (b.watcher) {
    void b.watcher.close();
    b.watcher = null;
  }
  b.relPathSet = new Set();
  b.sortedPathsSnapshot = null;
  b.basenameTwoCharBuckets = null;
  b.inFlightRefresh = null;
}

function invalidateSortedPathsSnapshot(b: FileIndexBucket): void {
  b.sortedPathsSnapshot = null;
  b.basenameTwoCharBuckets = null;
}

export function registerKnownWorkspaceRelPath(
  relPath: string,
  rootAbs: string
): void {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  const b = buckets.get(rootNorm);
  if (!b) {
    return;
  }
  const norm = relPath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!norm || norm.includes("..") || shouldIgnoreRelativePath(norm)) {
    return;
  }
  b.relPathSet.add(norm);
  invalidateSortedPathsSnapshot(b);
}

let workspaceFsTouchNotifier: (() => void) | null = null;
let workspaceFsTouchTimer: ReturnType<typeof setTimeout> | null = null;
const WORKSPACE_FS_TOUCH_DEBOUNCE_MS = 400;

export function setWorkspaceFsTouchNotifier(cb: (() => void) | null): void {
  workspaceFsTouchNotifier = cb;
}

function scheduleWorkspaceFsTouchNotify(): void {
  if (!workspaceFsTouchNotifier) {
    return;
  }
  if (workspaceFsTouchTimer) {
    clearTimeout(workspaceFsTouchTimer);
  }
  workspaceFsTouchTimer = setTimeout(() => {
    workspaceFsTouchTimer = null;
    try {
      workspaceFsTouchNotifier?.();
    } catch {
      /* ignore */
    }
  }, WORKSPACE_FS_TOUCH_DEBOUNCE_MS);
}

function normalizeRel(rootNorm: string, absPath: string): string | null {
  const rel = path.relative(rootNorm, absPath).split(path.sep).join("/");
  if (!rel || rel.startsWith("..")) {
    return null;
  }
  if (shouldIgnoreRelativePath(rel)) {
    return null;
  }
  return rel;
}

function shouldIgnoreRelativePath(relPath: string): boolean {
  const rel = relPath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!rel) {
    return true;
  }
  if (
    SKIP_RELATIVE_PREFIXES.some(
      (prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix)
    )
  ) {
    return true;
  }
  const parts = rel.split("/");
  for (const part of parts) {
    if (part && SKIP_DIR_NAMES.has(part.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function shouldIgnoreAbsolutePath(absPath: string): boolean {
  const parts = absPath.split(path.sep);
  for (const part of parts) {
    if (part && SKIP_DIR_NAMES.has(part.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function listWorkspaceRelativeFiles(rootAbs: string): string[] {
  const root = path.normalize(path.resolve(rootAbs));
  const out: string[] = [];
  let truncated = false;

  function walk(absDir: string, depth: number): void {
    if (out.length >= MAX_WORKSPACE_FILES) {
      truncated = true;
      return;
    }
    if (depth > 20) {
      truncated = true;
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (out.length >= MAX_WORKSPACE_FILES) {
        truncated = true;
        return;
      }
      const name = ent.name;
      if (name === "." || name === "..") {
        continue;
      }
      const abs = path.join(absDir, name);
      // Ne jamais suivre les symlinks dans l'index (évite boucle + escape).
      try {
        if (ent.isSymbolicLink() || fs.lstatSync(abs).isSymbolicLink()) {
          continue;
        }
      } catch {
        continue;
      }
      if (ent.isDirectory()) {
        if (SKIP_DIR_NAMES.has(name.toLowerCase())) {
          continue;
        }
        walk(abs, depth + 1);
      } else if (ent.isFile()) {
        const rel = normalizeRel(root, abs);
        if (rel) {
          out.push(rel);
        }
      }
    }
  }

  try {
    const st = fs.statSync(root);
    if (!st.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  walk(root, 0);
  if (truncated) {
    console.warn(
      `[workspaceFileIndex] truncated at ${MAX_WORKSPACE_FILES} files / depth 20 for ${root}`
    );
  }
  out.sort((a, c) => a.localeCompare(c, undefined, { sensitivity: "base" }));
  return out;
}

/** 限制 scanFullAsync 中并发 readdir 的数量，避免大型项目淹没 Node.js 事件循环 */
const SCAN_READDIR_CONCURRENCY = 8;

async function scanFullAsync(
  rootNorm: string,
  signal?: AbortSignal
): Promise<string[]> {
  const out: string[] = [];

  // 简单信号量：限制同时发出的 fsp.readdir 数量
  let permits = SCAN_READDIR_CONCURRENCY;
  const waitQueue: Array<() => void> = [];
  const acquirePermit = (): Promise<void> => {
    if (permits > 0) {
      permits--;
      return Promise.resolve();
    }
    return new Promise<void>((res) => waitQueue.push(res));
  };
  const releasePermit = (): void => {
    const next = waitQueue.shift();
    if (next) {
      next();
    } else {
      permits++;
    }
  };

  async function processDir(absDir: string): Promise<void> {
    throwIfAborted(signal, "scanFullAsync:processDir:start", rootNorm);
    if (out.length >= MAX_WORKSPACE_FILES) {
      return;
    }
    await acquirePermit();
    throwIfAborted(signal, "scanFullAsync:afterAcquirePermit", rootNorm);
    let entries: fs.Dirent[];
    try {
      entries = await fsp.readdir(absDir, { withFileTypes: true });
    } catch {
      releasePermit();
      return;
    }
    releasePermit();
    const subdirs: string[] = [];
    for (const ent of entries) {
      throwIfAborted(signal, "scanFullAsync:walkEntries", rootNorm);
      if (out.length >= MAX_WORKSPACE_FILES) {
        return;
      }
      if (ent.name === "." || ent.name === "..") {
        continue;
      }
      const abs = path.join(absDir, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIR_NAMES.has(ent.name.toLowerCase())) {
          continue;
        }
        subdirs.push(abs);
      } else if (ent.isFile()) {
        const rel = normalizeRel(rootNorm, abs);
        if (rel) {
          out.push(rel);
        }
      }
    }
    await Promise.all(subdirs.map((d) => processDir(d)));
  }

  try {
    throwIfAborted(signal, "scanFullAsync:stat", rootNorm);
    const st = await fsp.stat(rootNorm);
    if (!st.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  await processDir(rootNorm);
  throwIfAborted(signal, "scanFullAsync:afterProcessDir", rootNorm);
  out.sort((a, c) => a.localeCompare(c, undefined, { sensitivity: "base" }));
  return out;
}

/**
 * 通过 `git ls-files` 获取工作区文件列表（~50ms），作为 filesystem 全量扫描的替代。
 * 同时拉取追踪文件和未追踪文件（遵守 .gitignore）。
 * 非 git 仓库或 git 不可用时返回 null，由调用方降级到 scanFullAsync。
 */
async function getFilesViaGit(
  rootNorm: string,
  signal?: AbortSignal
): Promise<string[] | null> {
  try {
    throwIfAborted(signal, "gitLsFiles:start", rootNorm);
    const [tracked, untracked] = await Promise.all([
      execFileAsync(
        "git",
        [
          "-c",
          "core.quotepath=false",
          "ls-files",
          "--recurse-submodules",
          "-z",
        ],
        {
          cwd: rootNorm,
          maxBuffer: 100 * 1024 * 1024,
          signal,
        }
      ).then(({ stdout }) => stdout.split("\0").filter(Boolean)),
      execFileAsync(
        "git",
        [
          "-c",
          "core.quotepath=false",
          "ls-files",
          "--others",
          "--exclude-standard",
          "-z",
        ],
        {
          cwd: rootNorm,
          maxBuffer: 50 * 1024 * 1024,
          signal,
        }
      )
        .then(({ stdout }) => stdout.split("\0").filter(Boolean))
        .catch(() => [] as string[]),
    ]);
    throwIfAborted(signal, "gitLsFiles:afterExec", rootNorm);
    const all = [...tracked, ...untracked]
      .map((item) => item.replace(/\\/g, "/").replace(/^\/+/, "").trim())
      .filter((item) => item && !item.startsWith(".."))
      .filter((item) => !shouldIgnoreRelativePath(item));
    if (all.length === 0) {
      return null;
    }
    return all.slice(0, MAX_WORKSPACE_FILES);
  } catch {
    // 非 git 仓库或 git 未安装，降级到 scanFullAsync
    return null;
  }
}

function sortedFromSet(b: FileIndexBucket): string[] {
  return Array.from(b.relPathSet).sort((a, c) =>
    a.localeCompare(c, undefined, { sensitivity: "base" })
  );
}

function stopWatcherOnly(b: FileIndexBucket): void {
  if (b.watcher) {
    void b.watcher.close();
    b.watcher = null;
  }
}

export function getIndexedWorkspaceFilesIfFresh(
  rootAbs: string
): string[] | null {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  const b = buckets.get(rootNorm);
  if (b && b.relPathSet.size > 0) {
    return sortedFromSet(b);
  }
  return null;
}

/** 停止所有 root 的监听与缓存（例如应用退出前调试）。 */
export function stopAllWorkspaceFileIndexes(): void {
  for (const b of buckets.values()) {
    destroyBucket(b);
  }
  buckets.clear();
  if (workspaceFsTouchTimer) {
    clearTimeout(workspaceFsTouchTimer);
    workspaceFsTouchTimer = null;
  }
}

/** @deprecated 使用 releaseWorkspaceFileIndexRef(stopAllWorkspaceFileIndexes) */
export function stopWorkspaceFileIndex(): void {
  stopAllWorkspaceFileIndexes();
}

function attachWatcher(b: FileIndexBucket): void {
  stopWatcherOnly(b);
  const rootNorm = b.rootNorm;
  b.watcher = chokidar.watch(rootNorm, {
    awaitWriteFinish: { pollInterval: 100, stabilityThreshold: 200 },
    depth: 20,
    followSymlinks: false,
    ignored: (p) => shouldIgnoreAbsolutePath(p),
    ignoreInitial: true,
    ignorePermissionErrors: true,
    persistent: true,
  });

  b.watcher.on("error", (err: unknown) => {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    if (code === "EPERM" || code === "EACCES") {
      return;
    }
    console.warn("[workspaceFileIndex] chokidar error:", err);
  });

  const applyAdd = (absPath: string) => {
    if (!buckets.get(rootNorm)) {
      return;
    }
    fs.stat(absPath, (err, st) => {
      if (err || !st.isFile()) {
        return;
      }
      const rel = normalizeRel(rootNorm, absPath);
      if (rel) {
        b.relPathSet.add(rel);
        invalidateSortedPathsSnapshot(b);
        void indexWorkspaceSourceFile(rootNorm, rel);
        scheduleWorkspaceFsTouchNotify();
      }
    });
  };

  const applyChange = (absPath: string) => {
    if (!buckets.get(rootNorm)) {
      return;
    }
    const rel = normalizeRel(rootNorm, absPath);
    if (rel) {
      b.relPathSet.add(rel);
      invalidateSortedPathsSnapshot(b);
      void indexWorkspaceSourceFile(rootNorm, rel);
      scheduleWorkspaceFsTouchNotify();
    }
  };

  const applyUnlink = (absPath: string) => {
    if (!buckets.get(rootNorm)) {
      return;
    }
    const rel = normalizeRel(rootNorm, absPath);
    if (rel) {
      b.relPathSet.delete(rel);
      invalidateSortedPathsSnapshot(b);
      removeWorkspaceSymbolsForRel(rootNorm, rel);
      scheduleWorkspaceFsTouchNotify();
    }
  };

  const applyUnlinkDir = (absPath: string) => {
    if (!buckets.get(rootNorm)) {
      return;
    }
    const rel = normalizeRel(rootNorm, absPath);
    if (!rel) {
      return;
    }
    const prefix = rel + "/";
    for (const k of [...b.relPathSet]) {
      if (k === rel || k.startsWith(prefix)) {
        b.relPathSet.delete(k);
      }
    }
    invalidateSortedPathsSnapshot(b);
    removeWorkspaceSymbolsUnderPrefix(rootNorm, rel);
    scheduleWorkspaceFsTouchNotify();
  };

  b.watcher.on("add", applyAdd);
  b.watcher.on("change", applyChange);
  b.watcher.on("unlink", applyUnlink);
  b.watcher.on("unlinkDir", applyUnlinkDir);
}

// ── 按需搜索（主进程侧过滤，渲染进程不再持有全量文件列表） ───────────────

export type FileSearchItem = {
  /** 相对路径（正斜杠） */
  path: string;
  /** 文件名 */
  label: string;
  /** 目录部分 */
  description: string;
};

type ScoredPath = { path: string; score: number };

function compareScoredPath(a: ScoredPath, b: ScoredPath): number {
  if (a.score !== b.score) {
    return a.score - b.score;
  }
  const ab = (a.path.split("/").pop() || a.path).toLowerCase();
  const bb = (b.path.split("/").pop() || b.path).toLowerCase();
  const c = ab.localeCompare(bb, undefined, { sensitivity: "base" });
  if (c !== 0) {
    return c;
  }
  return a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
}

/** 维护按 compareScoredPath 升序的前 limit 条，避免对全量结果 O(N log N) 排序 */
function insertTopScored(
  top: ScoredPath[],
  item: ScoredPath,
  limit: number
): void {
  if (limit <= 0) {
    return;
  }
  let lo = 0;
  let hi = top.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (compareScoredPath(item, top[mid]!) < 0) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  top.splice(lo, 0, item);
  if (top.length > limit) {
    top.length = limit;
  }
}

/** 按 basename 前两字符分桶；模糊查询时先扫与 query 前缀一致的桶，再扫其余路径，避免漏匹配且常减少首轮无效打分 */
function ensureBasenameTwoCharBuckets(
  b: FileIndexBucket
): Map<string, Set<string>> {
  let m = b.basenameTwoCharBuckets;
  if (m) {
    return m;
  }
  m = new Map<string, Set<string>>();
  for (const p of b.relPathSet) {
    const bn = (p.split("/").pop() || p).toLowerCase();
    const key = bn.length < 2 ? bn : bn.slice(0, 2);
    let s = m.get(key);
    if (!s) {
      s = new Set();
      m.set(key, s);
    }
    s.add(p);
  }
  b.basenameTwoCharBuckets = m;
  return m;
}

function isPathLikeFileQuery(q: string): boolean {
  return q.includes("/") || q.includes("\\") || q.startsWith(".");
}

function scorePathForQuery(
  p: string,
  q: string,
  gitSet: Set<string>,
  pathLike: boolean
): number | null {
  const pl = p.toLowerCase();
  const base = (p.split("/").pop() || p).toLowerCase();
  if (pathLike) {
    if (!pl.includes(q) && !base.includes(q)) {
      return null;
    }
    let score = 20;
    if (pl.startsWith(q)) {
      score = 3;
    } else if (pl.includes(q)) {
      score = 8;
    } else if (base.includes(q)) {
      score = 12;
    }
    if (gitSet.has(p)) {
      score -= 1;
    }
    return score;
  }
  if (!pl.includes(q) && !base.includes(q)) {
    return null;
  }
  let score = 20;
  if (base === q) {
    score = 0;
  } else if (base.startsWith(q)) {
    score = 2;
  } else if (base.includes(q)) {
    score = 5;
  } else if (pl.includes(q)) {
    score = 10;
  }
  if (gitSet.has(p)) {
    score -= 1;
  }
  return score;
}

function emptyQueryTopPaths(
  b: FileIndexBucket,
  gitSet: Set<string>,
  limit: number
): ScoredPath[] {
  const snap = b.sortedPathsSnapshot;
  if (snap && snap.length === b.relPathSet.size) {
    const out: ScoredPath[] = [];
    for (const p of snap) {
      if (out.length >= limit) {
        break;
      }
      if (gitSet.has(p)) {
        out.push({ path: p, score: 0 });
      }
    }
    if (out.length < limit) {
      for (const p of snap) {
        if (out.length >= limit) {
          break;
        }
        if (!gitSet.has(p)) {
          out.push({ path: p, score: 2 });
        }
      }
    }
    return out;
  }
  const top: ScoredPath[] = [];
  for (const p of b.relPathSet) {
    insertTopScored(top, { path: p, score: gitSet.has(p) ? 0 : 2 }, limit);
  }
  return top;
}

function relPathToSearchItem(slash: string): FileSearchItem {
  const idx = slash.lastIndexOf("/");
  return {
    description: idx >= 0 ? slash.slice(0, idx) : "",
    label: idx >= 0 ? slash.slice(idx + 1) : slash,
    path: slash,
  };
}

/**
 * 在已建好的文件索引上执行过滤搜索，返回评分后的 top-N 结果。
 * 如果索引未就绪，先 await 构建完成。
 * @param gitChangedPaths  渲染进程传来的 git 变更路径列表（用于提权排序）
 */
export async function searchWorkspaceFiles(
  rootAbs: string,
  query: string,
  gitChangedPaths: string[],
  limit = 60
): Promise<FileSearchItem[]> {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  await ensureWorkspaceFileIndex(rootAbs);
  const b = buckets.get(rootNorm);
  if (!b || b.relPathSet.size === 0) {
    return [];
  }
  const gitSet = new Set(gitChangedPaths.map((p) => p.replace(/\\/g, "/")));
  const q = query.trim().toLowerCase();
  const cap = Math.max(1, Math.min(limit, 200));

  if (!q) {
    return emptyQueryTopPaths(b, gitSet, cap).map((s) =>
      relPathToSearchItem(s.path)
    );
  }

  const pathLike = isPathLikeFileQuery(q);
  const top: ScoredPath[] = [];

  const scoreIntoTop = (p: string): void => {
    const sc = scorePathForQuery(p, q, gitSet, pathLike);
    if (sc == null) {
      return;
    }
    insertTopScored(top, { path: p, score: sc }, cap);
  };

  if (!pathLike && q.length >= 2) {
    const primary = ensureBasenameTwoCharBuckets(b).get(q.slice(0, 2));
    if (primary && primary.size > 0) {
      for (const p of primary) {
        scoreIntoTop(p);
      }
      for (const p of b.relPathSet) {
        if (primary.has(p)) {
          continue;
        }
        scoreIntoTop(p);
      }
      return top.map((s) => relPathToSearchItem(s.path));
    }
  }

  for (const p of b.relPathSet) {
    scoreIntoTop(p);
  }
  return top.map((s) => relPathToSearchItem(s.path));
}

export async function ensureWorkspaceFileIndex(
  rootAbs: string,
  signal?: AbortSignal
): Promise<string[]> {
  const rootNorm = path.normalize(path.resolve(rootAbs));
  const b = getBucket(rootNorm);

  if (b.relPathSet.size > 0 && !b.inFlightRefresh) {
    return sortedFromSet(b);
  }

  if (b.inFlightRefresh) {
    return b.inFlightRefresh;
  }

  b.inFlightRefresh = (async () => {
    const finalize = (sorted: string[]) => {
      b.relPathSet = new Set(sorted);
      b.sortedPathsSnapshot = sorted;
      if (AUTO_ATTACH_WORKSPACE_FILE_WATCHER) {
        attachWatcher(b);
      } else {
        stopWatcherOnly(b);
      }
      try {
        notifyFileIndexReady?.(rootNorm);
      } catch {
        /* ignore */
      }
      return sorted;
    };

    // 1. git ls-files（~50ms，覆盖绝大多数 git 仓库场景）
    throwIfAborted(
      signal,
      "ensureWorkspaceFileIndex:beforeGitLsFiles",
      rootNorm
    );
    const gitFiles = await getFilesViaGit(rootNorm, signal);
    if (gitFiles) {
      const sorted = gitFiles.sort((a, c) =>
        a.localeCompare(c, undefined, { sensitivity: "base" })
      );
      console.log(`[fileIndex] git ls-files: ${sorted.length} files`);
      return finalize(sorted);
    }

    // 2. 兜底：全量 filesystem 扫描（非 git 仓库）
    const t0 = Date.now();
    throwIfAborted(signal, "ensureWorkspaceFileIndex:beforeFullScan", rootNorm);
    const list = await scanFullAsync(rootNorm, signal);
    console.log(
      `[fileIndex] scan done: ${list.length} files in ${Date.now() - t0}ms`
    );
    return finalize(list);
  })();

  try {
    return await b.inFlightRefresh;
  } finally {
    b.inFlightRefresh = null;
  }
}
