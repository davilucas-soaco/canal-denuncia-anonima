import express from 'express'
import bcrypt from 'bcryptjs'
import { getPool, sql } from '../db.js'
import { requireAdminAuth, signAdminToken } from '../middleware/auth.js'

export const authRouter = express.Router()

authRouter.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
    }

    const pool = await getPool()
    const result = await pool
      .request()
      .input('email', sql.NVarChar(200), email)
      .query(`
        SELECT id, email, name, password_hash, role, is_active
        FROM dbo.admin_users
        WHERE email = @email
      `)

    const user = result.recordset[0]
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const token = signAdminToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return res.status(500).json({ message: 'Erro ao autenticar.' })
  }
})

authRouter.get('/me', requireAdminAuth, (req, res) => {
  return res.json({ user: req.admin })
})
