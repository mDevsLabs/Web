import postgres from "postgres";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const urlMatch = env.match(/(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/);
const sql = postgres(urlMatch[1].trim(), { prepare: false });

const tables = ["weekly_usage", "mprojects_api_keys", "mprojects_api_logs", "users"];

for (const t of tables) {
  const exists = await sql`
    SELECT 1 FROM information_schema.tables WHERE table_name = ${t}
  `;
  if (!exists.length) {
    console.log(`\n== ${t} : ABSENTE ==`);
    continue;
  }
  const cols = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = ${t}
    ORDER BY ordinal_position
  `;
  console.log(`\n== ${t} ==`);
  for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);

  const cons = await sql`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = ${t}::regclass
  `;
  for (const c of cons) console.log(`  ${c.conname}: ${c.def}`);
}

await sql.end();
