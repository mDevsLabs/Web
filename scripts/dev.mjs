#!/usr/bin/env node
/**
 * Lance Next.js en développement tout en assurant la compatibilité avec
 * l'option `--host` (standard dans Vite et d'autres outils d'outillage web).
 *
 * Par défaut, le CLI Next.js ne reconnaît que `-H` et `--hostname`. Ce script
 * intercepte `--host` (avec ou sans argument) et le convertit en `--hostname`
 * avant de déléguer l'exécution au binaire Next.js officiel.
 *
 * Syntaxes gérées :
 *   - `--host` (sans argument) -> `--hostname 0.0.0.0`
 *   - `--host 0.0.0.0` ou `--host <ip>` -> `--hostname <ip>`
 *   - `--host=<ip>` -> `--hostname <ip>`
 */

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Traduit les arguments CLI pour remplacer `--host` par `--hostname`.
 *
 * @param {string[]} rawArgs
 * @returns {string[]}
 */
export function translateArgs(rawArgs) {
  const result = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--host") {
      const nextArg = rawArgs[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith("-")) {
        result.push("--hostname", nextArg);
        i++;
      } else {
        result.push("--hostname", "0.0.0.0");
      }
    } else if (arg.startsWith("--host=")) {
      const value = arg.slice("--host=".length).trim();
      result.push("--hostname", value || "0.0.0.0");
    } else {
      result.push(arg);
    }
  }
  return result;
}

/**
 * Exécute Next.js dev avec les arguments traduits.
 *
 * @param {string[]} rawArgs
 */
export function runDevServer(rawArgs = []) {
  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");
  const forwardedArgs = translateArgs(rawArgs);

  const child = spawn(process.execPath, [nextBin, "dev", ...forwardedArgs], {
    env: process.env,
    stdio: "inherit",
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  return child;
}

const currentFilePath = path
  .normalize(fileURLToPath(import.meta.url))
  .toLowerCase();
const executedFilePath = process.argv[1]
  ? path.normalize(path.resolve(process.argv[1])).toLowerCase()
  : "";

if (currentFilePath === executedFilePath) {
  runDevServer(process.argv.slice(2));
}
