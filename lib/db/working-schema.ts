/**
 * Le schéma de travail du runner de migrations.
 *
 * POURQUOI CE MODULE EXISTE
 *
 * Le `search_path` est un paramètre de CONNEXION, pas une propriété de la
 * base : une URL qui transporte `options=-c search_path=` (le serveur l'applique
 * à l'ouverture de la session), un rôle configuré ainsi, ou un relais qui le
 * réinitialise laisse la session SANS aucun schéma. Les CREATE non qualifiés
 * échouent alors en 3F000 (« no schema has been selected to create in ») et les
 * ALTER en 42P01 (« relation "user_preferences" does not exist ») — y compris
 * sur des tables qui existent, sont remplies, et que l'application lit sans
 * difficulté.
 *
 * Le runner ne doit donc JAMAIS hériter du réglage de la connexion : il
 * détermine le schéma qui porte les tables de l'application, l'y épingle, puis
 * il le vérifie. Sans cela, une migration échoue sur une base parfaitement
 * saine, et le message accuse une table absente là où la table est là.
 *
 * Le module ne dépend que du client Postgres : il est testable hors runtime
 * Next, comme les autres modules purs de `lib/db`.
 */
import type postgres from "postgres";

/** Le schéma par défaut de PostgreSQL : celui des bases neuves. */
export const SCHEMA_PAR_DEFAUT = "public";

/**
 * Tables de l'application : le schéma qui en porte une est celui où le DDL
 * doit tomber. Le premier nom trouvé suffit — une application ne vit pas dans
 * deux schémas à la fois.
 */
export const TABLES_REPERES = [
  "users",
  "Chat",
  "Message_v2",
  "user_preferences",
];

/**
 * Le schéma qui porte les tables de l'application, ou le schéma par défaut.
 *
 * On regarde le catalogue plutôt que le `search_path` reçu : celui-ci peut
 * désigner un schéma qui n'existe pas, ou en omettre un qui existe.
 */
export async function resolveWorkingSchema(
  connection: postgres.Sql
): Promise<string> {
  const [porteur] = await connection`
    SELECT n.nspname AS schema
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND c.relname = ANY(${TABLES_REPERES}::text[])
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    LIMIT 1
  `;
  return porteur?.schema ?? SCHEMA_PAR_DEFAUT;
}

/**
 * Épingle le schéma de travail de la session, puis le vérifie.
 *
 * Le `search_path` reçu est journalisé à chaque appel : c'est la trace qui
 * permet de lire ensuite « le job CI a reçu un search_path vide » sans avoir
 * à deviner.
 *
 * Lancer l'épinglage une seconde fois, juste avant une phase sensible,
 * est sans danger : c'est un `SET` idempotent.
 */
export async function pinWorkingSchema(
  connection: postgres.Sql,
  etape: string
): Promise<string> {
  const [recu] = await connection`SHOW search_path`;
  const schema = await resolveWorkingSchema(connection);
  if (schema === SCHEMA_PAR_DEFAUT) {
    // Base neuve : le schéma par défaut de PostgreSQL peut ne pas exister.
    await connection`CREATE SCHEMA IF NOT EXISTS "public"`;
  }
  // `set_config` plutôt qu'un `SET` : la valeur passe en paramètre, donc un
  // nom de schéma exotique ne peut pas casser la requête.
  await connection`SELECT set_config('search_path', ${`"${schema}"`}, false)`;
  const [courant] = await connection`SELECT current_schema() AS schema`;
  if (courant?.schema !== schema) {
    throw new Error(
      `Schéma de travail inutilisable : « ${schema} » n'est pas le schéma courant (« ${courant?.schema ?? "aucun"} »). Le search_path reçu était « ${recu?.search_path || "vide"} ».`
    );
  }
  console.log(
    `[migrate] ${etape} — schéma de travail : ${schema} (search_path reçu : « ${recu?.search_path || "vide"} »)`
  );
  return schema;
}
