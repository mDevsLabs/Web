import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { splitSQL } from '../lib/db/split-sql.js';
const url=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
if(!url){console.error('Configure DATABASE_URL in .env.local or in the server environment.');process.exit(1);}
const sql=neon(url),directory=new URL('../lib/db/migrations/',import.meta.url);
try{
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  const applied=await sql`SELECT name,checksum FROM schema_migrations`,known=new Map(applied.map(r=>[r.name,r.checksum]));
  for(const name of readdirSync(directory).filter(n=>/^\d+.*\.sql$/.test(n)).sort()){
    const source=readFileSync(new URL(name,directory),'utf8'),checksum=createHash('sha256').update(source).digest('hex');
    if(known.has(name)){if(known.get(name)!==checksum)throw new Error('An applied migration has changed');continue;}
    await sql.transaction([...splitSQL(source).map(statement=>sql.query(statement,[])),sql`INSERT INTO schema_migrations(name,checksum) VALUES (${name},${checksum})`]);
    console.log('Applied '+name);
  }
  console.log('Migrations complete.');
}catch{console.error('Migration failed. Check database access and schema compatibility. No connection secret was printed.');process.exitCode=1;}
