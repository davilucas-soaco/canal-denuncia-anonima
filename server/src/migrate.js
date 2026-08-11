import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import sql from 'mssql'
import { buildSqlConfig } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(
  process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'),
)

async function waitForSql(retries = 20) {
  const config = buildSqlConfig({ database: 'master' })
  for (let i = 1; i <= retries; i++) {
    try {
      const pool = await sql.connect(config)
      await pool.request().query('SELECT 1 AS ok')
      await pool.close()
      return
    } catch (error) {
      console.log(`[migrate] Aguardando SQL Server... (${i}/${retries})`)
      if (i === retries) throw error
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

async function ensureDatabase(pool) {
  fs.mkdirSync(dataDir, { recursive: true })

  const exists = await pool
    .request()
    .input('name', sql.NVarChar, 'CanalDenuncia')
    .query(`SELECT DB_ID(@name) AS id`)

  if (exists.recordset[0]?.id) {
    console.log('[migrate] Banco CanalDenuncia já existe.')
    return
  }

  const mdf = path.join(dataDir, 'CanalDenuncia.mdf').replace(/'/g, "''")
  const ldf = path.join(dataDir, 'CanalDenuncia_log.ldf').replace(/'/g, "''")

  await pool.request().batch(`
    CREATE DATABASE CanalDenuncia ON (
      NAME = N'CanalDenuncia',
      FILENAME = N'${mdf}',
      SIZE = 20MB,
      MAXSIZE = UNLIMITED,
      FILEGROWTH = 10MB
    )
    LOG ON (
      NAME = N'CanalDenuncia_log',
      FILENAME = N'${ldf}',
      SIZE = 10MB,
      MAXSIZE = UNLIMITED,
      FILEGROWTH = 10MB
    );
  `)

  console.log(`[migrate] Banco criado em:\n  ${mdf}\n  ${ldf}`)
}

async function run() {
  await waitForSql()

  const masterPool = await sql.connect(buildSqlConfig({ database: 'master' }))
  try {
    await ensureDatabase(masterPool)
  } finally {
    await masterPool.close()
  }

  const sqlDir = path.join(__dirname, '..', 'sql')
  const sqlFiles = fs
    .readdirSync(sqlDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const pool = await sql.connect(buildSqlConfig({ database: 'CanalDenuncia' }))
  try {
    for (const file of sqlFiles) {
      const script = fs.readFileSync(path.join(sqlDir, file), 'utf8')
      const batches = script
        .split(/^\s*GO\s*$/gim)
        .map((b) => b.trim())
        .filter(Boolean)

      for (const batch of batches) {
        await pool.request().batch(batch)
      }
      console.log(`[migrate] Aplicado: ${file}`)
    }
    console.log('[migrate] Tabelas aplicadas com sucesso.')
  } finally {
    await pool.close()
  }
}

run().catch((error) => {
  console.error('[migrate] Falha:', error.message)
  process.exit(1)
})
