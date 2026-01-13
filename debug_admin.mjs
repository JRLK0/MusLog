import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    console.log("--- Perfil de admin@megia.eu ---");
    const users = await sql`SELECT id, email, name, status, is_admin FROM public.profiles WHERE email = 'admin@megia.eu'`;
    console.log(users);
    
    if (users.length > 0) {
        console.log("Intentando forzar admin manualmente...");
        await sql`UPDATE public.profiles SET is_admin = true, status = 'approved' WHERE email = 'admin@megia.eu'`;
        console.log("Update ejecutado.");
        
        const updated = await sql`SELECT id, email, status, is_admin FROM public.profiles WHERE email = 'admin@megia.eu'`;
        console.log("Estado final:", updated);
    } else {
        console.log("El usuario NO existe en profiles (quizás auth trigger falló?).");
    }

  } catch (e) {
      console.error(e);
  } finally {
    await sql.end();
  }
}

run();
