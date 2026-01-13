import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    console.log("Borrando registro de migración 017...");
    await sql`DELETE FROM public.schema_migrations WHERE filename = '017_fix_rls_policies.sql'`;
    console.log("Borrado.");
  } catch(e) {
      console.error(e);
  } finally {
    await sql.end();
  }
}

run();
