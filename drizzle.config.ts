import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env.local",
});
config({
  path: ".env",
});

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "POSTGRES_URL (ou DATABASE_URL) manquant — définissez-le dans .env.local/.env"
  );
}

export default defineConfig({
  dbCredentials: {
    url: dbUrl,
  },
  dialect: "postgresql",
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
});
