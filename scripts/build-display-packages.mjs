/** Reconstruit les moteurs d'affichage modifiés sans régénérer les catalogues. */
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { transform } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
for (const [name, module] of [
  ["icons", "create-icon"],
  ["ui", "primitives/tooltip"],
]) {
  const source = readFileSync(
    resolve(root, `packages/${name}/src/${module}.tsx`),
    "utf8"
  );
  const installed = dirname(
    realpathSync(require.resolve(`@mdevs/${name}/package.json`))
  );
  for (const [format, extension] of [
    ["esm", "js"],
    ["cjs", "cjs"],
  ]) {
    const { code } = await transform(source, {
      format,
      jsx: "automatic",
      loader: "tsx",
      target: "es2020",
    });
    for (const directory of new Set([
      resolve(root, `packages/${name}`),
      installed,
    ])) {
      writeFileSync(resolve(directory, `dist/${module}.${extension}`), code);
    }
  }
}
const css = ["styles.css", "extensions.css"]
  .map((file) => readFileSync(resolve(root, `packages/ui/src/${file}`), "utf8"))
  .join("\n");
const installedUi = dirname(
  realpathSync(require.resolve("@mdevs/ui/package.json"))
);
for (const directory of new Set([resolve(root, "packages/ui"), installedUi])) {
  writeFileSync(resolve(directory, "dist/styles.css"), css);
}
console.log(
  "Moteurs Icons et Tooltip, styles UI et dépendances locales actualisés."
);
