/**
 * Migration des propriétaires de conversations vers l'identifiant canonique.
 *
 *   pnpm exec tsx scripts/migrate-chat-owner-canonical.ts            # simulation
 *   pnpm exec tsx scripts/migrate-chat-owner-canonical.ts --apply    # écriture
 *
 * Pourquoi : `chatOwnerMatches` acceptait l'identifiant, mais aussi l'EMAIL et
 * le PSEUDONYME — deux valeurs que l'utilisateur peut modifier. Le contrôle est
 * désormais strict (identifiant canonique uniquement). Les conversations
 * historiques dont `userId` contient un email ou un pseudonyme doivent donc
 * être converties AVANT le déploiement, sinon elles deviennent inaccessibles.
 *
 * Correspondances utilisées : `users.id::text`, `users.email`, `users.username`.
 * Les tables concernées sont `Chat` et `Document` (toutes deux filtrées par
 * propriétaire). La conversion est idempotente et n'écrit rien sans `--apply`.
 * Aucune donnée n'est supprimée : les lignes non résolues sont seulement
 * LISTÉES, à traiter manuellement.
 */
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");

const TABLES = ["Chat", "Document"] as const;

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.error("DATABASE_URL / POSTGRES_URL absent : rien à migrer.");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  try {
    const totals = { already: 0, converted: 0, unresolved: 0 };

    for (const table of TABLES) {
      const rows = await sql<Array<{ userId: string; n: string }>>`
        SELECT "userId", count(*)::text AS n
        FROM ${sql(table)}
        GROUP BY "userId"
      `;

      for (const row of rows) {
        const owner = row.userId;
        const count = Number(row.n);
        if (!owner) {
          totals.unresolved += count;
          console.warn(
            `[${table}] userId NULL sur ${count} ligne(s) — à traiter à la main.`
          );
          continue;
        }
        if (!owner.includes("@")) {
          // Identifiant déjà canonique (ou pseudonyme historique : traité plus bas).
          const asId = await sql`
            SELECT 1 FROM "users" WHERE id::text = ${owner} LIMIT 1
          `;
          if (asId.length > 0) {
            totals.already += count;
            continue;
          }
        }

        const matched = await sql<Array<{ id: string }>>`
          SELECT id::text AS id FROM "users"
          WHERE email = ${owner} OR username = ${owner}
          LIMIT 1
        `;
        if (matched.length === 0) {
          totals.unresolved += count;
          console.warn(
            `[${table}] propriétaire « ${owner} » sans compte correspondant (${count} ligne(s)) — conservation en l'état.`
          );
          continue;
        }

        const canonical = matched[0].id;
        console.log(
          `[${table}] « ${owner} » -> ${canonical} (${count} ligne(s))`
        );
        if (APPLY) {
          await sql`
            UPDATE ${sql(table)} SET "userId" = ${canonical}
            WHERE "userId" = ${owner}
          `;
        }
        totals.converted += count;
      }
    }

    console.log(
      `\nRésumé : ${totals.converted} ligne(s) à convertir · ${totals.already} déjà canoniques · ${totals.unresolved} non résolues.`
    );
    if (!APPLY) {
      console.log("Simulation : relancer avec --apply pour écrire.");
      return;
    }
    if (totals.unresolved > 0) {
      console.log(
        "Conservez CHAT_OWNER_LEGACY_MATCH=true le temps de traiter les lignes non résolues."
      );
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(
    "Échec de la migration des propriétaires de conversations :",
    error
  );
  process.exit(1);
});
