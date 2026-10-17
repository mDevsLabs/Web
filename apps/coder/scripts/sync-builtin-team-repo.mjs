import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const configuredSource = process.env.ASYNC_BUILTIN_TEAM_SOURCE;
const fallbackSourceRoots = [
  path.resolve(projectRoot, "..", "agency-agents"),
  path.resolve("D:\\WebstormProjects\\agency-agents"),
];
const sourceCandidates = configuredSource
  ? [path.resolve(configuredSource)]
  : fallbackSourceRoots;

const targetRoot = path.join(
  projectRoot,
  "resources",
  "builtin-team",
  "agency-agents"
);

const SKIP_DIRS = new Set([
  ".git",
  ".github",
  "examples",
  "integrations",
  "node_modules",
  "scripts",
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { force: true, recursive: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function shouldCopyFile(fullPath) {
  return path.extname(fullPath).toLowerCase() === ".md";
}

function copyDocs(sourceDir, destDir) {
  ensureDir(destDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      copyDocs(
        path.join(sourceDir, entry.name),
        path.join(destDir, entry.name)
      );
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const sourceFile = path.join(sourceDir, entry.name);
    if (!shouldCopyFile(sourceFile)) {
      continue;
    }
    ensureDir(destDir);
    fs.copyFileSync(sourceFile, path.join(destDir, entry.name));
  }
}

const sourceRoot = sourceCandidates.find((candidate) => {
  if (!fs.existsSync(candidate)) {
    return false;
  }
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
});

if (!sourceRoot) {
  const triedPaths = sourceCandidates.join(", ");
  console.warn(
    `[builtin-team] source repo not found (tried: ${triedPaths}). Set ASYNC_BUILTIN_TEAM_SOURCE to sync. Keeping existing target untouched.`
  );
  ensureDir(targetRoot);
  // Marker to make the empty state explicit (avoids silent green build with empty resources).
  try {
    const marker = path.join(targetRoot, ".sync-missing");
    if (!fs.existsSync(marker))
      fs.writeFileSync(
        marker,
        `missing source. tried: ${triedPaths}\n`,
        "utf8"
      );
  } catch {
    /* ignore */
  }
  process.exit(0);
}

// Guard: never rm -rf outside project resources.
const expectedPrefix = path.join(projectRoot, "resources") + path.sep;
if (!targetRoot.startsWith(expectedPrefix)) {
  console.error(
    `[builtin-team] refusing to clean outside resources: ${targetRoot}`
  );
  process.exit(1);
}

cleanDir(targetRoot);
copyDocs(sourceRoot, targetRoot);
console.log(`[builtin-team] synced ${sourceRoot} -> ${targetRoot}`);
