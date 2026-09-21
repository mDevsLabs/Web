/**
 * Rotation / migration des secrets MCP chiffrés.
 *
 *   pnpm exec tsx scripts/reencrypt-mcp-secrets.ts            # simulation (défaut)
 *   pnpm exec tsx scripts/reencrypt-mcp-secrets.ts --apply    # écriture
 *
 * Contexte : le format stocké est passé de « base64 nu, clé dérivée de
 * DATABASE_URL ou constante de dev » à `mai1.<keyId>.<base64>`. Ce script
 * ré-chiffre les valeurs héritées avec la clé courante.
 *
 * Prérequis :
 *  • `MCP_ENCRYPTION_KEY` (+ `MCP_ENCRYPTION_KEY_ID`) : clé courante, dédiée ;
 *  • `MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY=true` le temps de la migration,
 *    sinon les valeurs héritées restent indéchiffrables (comportement voulu) ;
 *  • anciennes clés dans `MCP_ENCRYPTION_PREVIOUS_KEYS` lors d'une rotation.
 *
 * Aucune valeur secrète n'est affichée : uniquement des compteurs et des
 * identifiants de ligne.
 */
import postgres from "postgres";
import { reencrypt } from "../lib/mcp/encryption";

const APPLY = process.argv.includes("--apply");

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.error("DATABASE_URL / POSTGRES_URL absent : rien à migrer.");
    process.exit(1);
  }
  if (!process.env.MCP_ENCRYPTION_KEY?.trim()) {
    console.error(
      "MCP_ENCRYPTION_KEY absente : la rotation écrirait des valeurs non déchiffrables. Abandon."
    );
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  try {
    const rows = await sql<
      Array<{ id: string; encryptedValue: string; key: string; kind: string }>
    >`SELECT "id", "encryptedValue", "key", "kind" FROM "mcp_server_secret"`;

    const counts = { already_current: 0, reencrypted: 0, undecryptable: 0 };
    const migrated: Array<{ id: string; value: string }> = [];

    for (const row of rows) {
      const result = reencrypt(row.encryptedValue);
      counts[result.status] += 1;
      if (result.status === "reencrypted") {
        migrated.push({ id: row.id, value: result.value });
      }
      if (result.status === "undecryptable") {
        console.warn(
          `[undecryptable] id=${row.id} kind=${row.kind} key=${row.key} — clé manquante ou donnée corrompue, valeur CONSERVÉE telle quelle.`
        );
      }
    }

    console.log(
      `Secrets examinés : ${rows.length} · déjà à jour : ${counts.already_current} · à ré-chiffrer : ${counts.reencrypted} · indéchiffrables : ${counts.undecryptable}`
    );

    if (!APPLY) {
      console.log("Simulation terminée. Relancer avec --apply pour écrire.");
      return;
    }

    for (const entry of migrated) {
      await sql`UPDATE "mcp_server_secret" SET "encryptedValue" = ${entry.value} WHERE "id" = ${entry.id}`;
    }
    console.log(`Ré-chiffrement appliqué sur ${migrated.length} secret(s).`);
    console.log(
      "Pensez à retirer MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY de l'environnement."
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("Échec de la rotation des secrets MCP :", error);
  process.exit(1);
});
