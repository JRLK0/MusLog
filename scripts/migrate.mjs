import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[migrate] ${msg}`)
}

function warn(msg) {
  // eslint-disable-next-line no-console
  console.warn(`[migrate] ${msg}`)
}

function loadEnvFiles() {
  // Node NO carga .env.* automáticamente (Next.js sí, pero aquí estamos en predev/prebuild/prestart).
  // Intentamos cargar .env.local y .env desde la raíz del repo.
  const rootDir = path.resolve(__dirname, "..")

  dotenv.config({ path: path.join(rootDir, ".env.local") })
  dotenv.config({ path: path.join(rootDir, ".env") })
}

async function getSqlFiles(migrationsDir) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && /^\d+_.*\.sql$/i.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

async function main() {
  loadEnvFiles()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    warn("DATABASE_URL no está definida; no se aplican migraciones. (Tip: ponla en .env.local/.env o en variables de entorno del sistema/Vercel).")
    process.exit(0)
  }

  // Permite desactivar explícitamente en entornos donde no quieras tocar la BBDD
  const skip =
    process.env.SKIP_DB_MIGRATIONS === "1" ||
    process.env.SKIP_DB_MIGRATIONS === "true" ||
    process.env.SKIP_DB_MIGRATIONS === "yes"

  if (skip) {
    warn("SKIP_DB_MIGRATIONS está activo; no se aplican migraciones.")
    process.exit(0)
  }

  const migrationsDir = path.resolve(__dirname)
  const files = await getSqlFiles(migrationsDir)

  if (files.length === 0) {
    log("No hay archivos de migración en scripts/.")
    process.exit(0)
  }

  // Supabase Pooler (transaction/statement) puede NO soportar PREPARE.
  // Por eso: prepare:false
  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 30,
  })

  try {
    // Bootstrap mínimo para gen_random_uuid() usado en los scripts.
    // (En Supabase suele estar, pero mejor asegurarlo.)
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
    // Necesario para índices/ops tipo gin_trgm_ops (búsqueda por similitud/trigram).
    await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`

    await sql`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    const appliedRows = await sql`SELECT filename FROM public.schema_migrations;`
    const applied = new Set(appliedRows.map((r) => r.filename))
    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      log(`OK: no hay migraciones pendientes (total ${files.length}).`)
      return
    }

    log(`Encontradas ${pending.length} migraciones pendientes.`)

    for (const filename of pending) {
      const fullPath = path.join(migrationsDir, filename)
      const sqlText = await fs.readFile(fullPath, "utf8")

      log(`Aplicando ${filename}...`)

      await sql.begin(async (tx) => {
        // unsafe porque ejecutamos DDL multi-statement desde un archivo .sql
        await tx.unsafe(sqlText)
        await tx`INSERT INTO public.schema_migrations (filename) VALUES (${filename});`
      })

      log(`Aplicada ${filename}`)
    }

    log("Migraciones aplicadas correctamente.")
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[migrate] ERROR aplicando migraciones:", e)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main()
