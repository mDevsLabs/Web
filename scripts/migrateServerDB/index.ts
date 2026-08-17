import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { migrate as neonMigrate } from 'drizzle-orm/neon-serverless/migrator';
import { migrate as nodeMigrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'node:path';

// @ts-ignore tsgo handle esm import cjs and compatibility issues
import { DB_FAIL_INIT_HINT, DUPLICATE_EMAIL_HINT, PGVECTOR_HINT } from './errorHint';

// Load environment variables in priority order:
// 1. .env (lowest priority)
// 2. .env.[env] (medium priority, overrides .env)
// 3. .env.[env].local (highest priority, overrides previous)
// Use dotenv-expand to support ${var} variable expansion
const env = process.env.NODE_ENV || 'development';
dotenvExpand.expand(dotenv.config()); // Load .env
dotenvExpand.expand(dotenv.config({ override: true, path: `.env.${env}` })); // Load .env.[env] and override
dotenvExpand.expand(dotenv.config({ override: true, path: `.env.${env}.local` })); // Load .env.[env].local and override

const migrationsFolder = join(__dirname, '../../packages/database/migrations');

const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';

const runMigrations = async () => {
  const { serverDB } = await import('../../packages/database/src/server');

  const time = Date.now();
  if (process.env.DATABASE_DRIVER === 'node') {
    await nodeMigrate(serverDB, { migrationsFolder });
  } else {
    await neonMigrate(serverDB, { migrationsFolder });
  }

  console.log('✅ database migration pass. use: %s ms', Date.now() - time);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
};

let connectionString = process.env.DATABASE_URL;

// Validate that DATABASE_URL is a proper URL (not a placeholder or key=value format)
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// only migrate database if the connection string is available and valid
if (!isDesktop && !connectionString) {
  console.log('🟢 DATABASE_URL not set, migration skipped');
} else if (!isDesktop && !isValidUrl(connectionString)) {
  console.log('🟡 DATABASE_URL is not a valid URL, migration skipped');
  console.log('   Make sure DATABASE_URL follows the format: postgresql://user:password@host:port/database');
} else if (!isDesktop) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  runMigrations().catch((err) => {
    console.error('❌ Database migrate failed:', err);

    const errMsg = err.message as string;
    const errCode = (err as NodeJS.ErrnoException).code;

    const constraint = (err as { constraint?: string })?.constraint;

    if (errCode === 'ERR_INVALID_URL' || errMsg.includes('Invalid URL')) {
      console.log('🟡 DATABASE_URL could not be parsed, migration skipped');
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    } else if (errMsg.includes('extension "vector" is not available')) {
      console.info(PGVECTOR_HINT);
    } else if (constraint === 'users_email_unique' || errMsg.includes('users_email_unique')) {
      console.info(DUPLICATE_EMAIL_HINT);
    } else if (errMsg.includes(`Cannot read properties of undefined (reading 'migrate')`)) {
      console.info(DB_FAIL_INIT_HINT);
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
} else {
  console.log('🟢 in desktop mode, migration skipped');
}
