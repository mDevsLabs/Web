// Le paquet embarque une application Coder complète, avec son runtime et ses
// dépendances natives pour la même plateforme et architecture que mAI Desktop.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coderRoot = path.resolve(desktopRoot, "../coder");
const arch = process.argv[2] || process.arch;
if (!["x64", "arm64"].includes(arch)) throw new Error("Architecture Coder non prise en charge.");
const target = { win32: "win", darwin: "mac", linux: "linux" }[process.platform];
if (!target) throw new Error("Plateforme Coder non prise en charge.");

function run(args) {
  // corepack lance pnpm sans passer par un shell ni interpoler les chemins.
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: coderRoot, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`La préparation de Coder a échoué (${args.join(" ")}).`);
}
if (!process.env.npm_execpath) throw new Error("Exécutez ce script avec pnpm run prepare:coder.");
run(["run", "sync:builtin-team"]);
run(["run", "build:main"]);
run(["run", "build:renderer"]);
run(["run", "icons"]);
// electron-builder prépare les modules natifs pour l'architecture demandée.
run(["exec", "electron-builder", "install-app-deps", `--arch=${arch}`]);
const output = `release/desktop-${arch}`;
run(["exec", "electron-builder", "--dir", `--${target}`, `--${arch}`, "--publish", "never", `--config.directories.output=${output}`]);
const outputRoot = path.join(coderRoot, output);
let source;
if (target === "mac") {
  const directory = arch === "arm64" ? "mac-arm64" : "mac";
  const appDirectory = path.join(outputRoot, directory);
  const appName = readdirSync(appDirectory).find((name) => name.endsWith(".app"));
  if (!appName) throw new Error("Le paquet macOS Coder est absent.");
  source = path.join(appDirectory, appName);
} else {
  const architectureSuffix = arch === "arm64" ? "-arm64" : "";
  source = path.join(outputRoot, `${target === "win" ? "win" : "linux"}${architectureSuffix}-unpacked`);
}
if (!existsSync(source)) throw new Error("Le runtime Coder compilé est absent.");
const destination = path.join(desktopRoot, `build/coder-${arch}`);
const buildRoot = path.resolve(desktopRoot, "build");
if (path.dirname(path.resolve(destination)) !== buildRoot) throw new Error("Destination Coder hors du dossier de build.");
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, target === "mac" ? path.join(destination, "mAI Coder.app") : destination, { recursive: true, verbatimSymlinks: true });
console.log(`Coder ${target}/${arch} est prêt à être embarqué dans mAI Desktop.`);
