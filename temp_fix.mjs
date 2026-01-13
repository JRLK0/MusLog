import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    await sql`DELETE FROM public.schema_migrations WHERE filename = '015_recreate_admin_with_autoconfirm.sql'`;
    console.log('Borrado registro de migración 015');
  } finally {
    await sql.end();
  }
}

run();
