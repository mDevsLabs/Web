import path from "node:path";
import { writeGeneratedFiles } from "./lib/plugin-catalog";

const written = writeGeneratedFiles();

for (const file of written) {
  console.log(`✓ ${path.relative(process.cwd(), file)}`);
}

console.log(`Catalogue de plugins régénéré (${written.length} fichiers).`);
