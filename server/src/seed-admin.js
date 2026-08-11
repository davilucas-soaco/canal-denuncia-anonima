import 'dotenv/config'
import bcrypt from 'bcryptjs'
import sql from 'mssql'
import { buildSqlConfig } from './db.js'

const DEFAULT_USERS = [
  {
    email: 'admin',
    name: 'Administrador',
    role: 'rh',
    password: process.env.ADMIN_SEED_PASSWORD || 'admin123',
  },
]

async function run() {
  const pool = await sql.connect(buildSqlConfig({ database: 'CanalDenuncia' }))
  try {
    for (const user of DEFAULT_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10)
      const existing = await pool
        .request()
        .input('email', sql.NVarChar(200), user.email.toLowerCase())
        .query(`SELECT id FROM dbo.admin_users WHERE email = @email`)

      if (existing.recordset[0]) {
        await pool
          .request()
          .input('email', sql.NVarChar(200), user.email.toLowerCase())
          .input('name', sql.NVarChar(200), user.name)
          .input('password_hash', sql.NVarChar(200), passwordHash)
          .input('role', sql.NVarChar(40), user.role)
          .query(`
            UPDATE dbo.admin_users
            SET name = @name, password_hash = @password_hash, role = @role, is_active = 1
            WHERE email = @email
          `)
        console.log(`[seed] Atualizado: ${user.email} (${user.role})`)
        continue
      }

      await pool
        .request()
        .input('email', sql.NVarChar(200), user.email.toLowerCase())
        .input('name', sql.NVarChar(200), user.name)
        .input('password_hash', sql.NVarChar(200), passwordHash)
        .input('role', sql.NVarChar(40), user.role)
        .query(`
          INSERT INTO dbo.admin_users (email, name, password_hash, role)
          VALUES (@email, @name, @password_hash, @role)
        `)

      console.log(`[seed] Criado: ${user.email} (${user.role})`)
    }
    console.log('[seed] Concluído. Credencial padrão: admin / admin123')
  } finally {
    await pool.close()
  }
}

run().catch((error) => {
  console.error('[seed] Falha:', error.message)
  process.exit(1)
})
