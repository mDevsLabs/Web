import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests unitaires (logique pure et garde-fous serveur) : aucun réseau, aucune
// base réelle, aucun compte de production. Les dépendances serveur (DB,
// next/headers) sont mockées dans les tests qui en ont besoin ; l'alias
// server-only neutralise la garde RSC hors runtime Next.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/empty.ts"),
    },
  },
  test: {
    environment: "node",
    // lib/ai/models.test.ts est un utilitaire de mocks IA préexistant (aucun
    // suite de test) : conservé tel quel, exclu de la collecte Vitest.
    exclude: ["lib/ai/models.test.ts", "**/node_modules/**"],
    include: [
      "lib/**/*.test.ts",
      "app/**/*.test.ts",
      "tests/unit/**/*.test.ts",
    ],
  },
});
