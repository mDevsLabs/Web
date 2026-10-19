// Refuser un client bureau dont le numéro diverge de celui du site Web.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const desktopDirectory = path.resolve(scriptDirectory, "..");
const repositoryDirectory = path.resolve(desktopDirectory, "../..");
const desktopPackage = JSON.parse(
  readFileSync(path.join(desktopDirectory, "package.json"), "utf8"),
);
const webPackage = JSON.parse(
  readFileSync(path.join(repositoryDirectory, "package.json"), "utf8"),
);

if (desktopPackage.version !== webPackage.version) {
  throw new Error(
    `La version mAI Desktop (${desktopPackage.version}) doit correspondre à la version Web (${webPackage.version}).`,
  );
}

console.log(`Version mAI Web/Desktop synchronisée : ${webPackage.version}`);
