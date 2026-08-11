import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getPool } from './db.js'
import { logStatusEnvioNotificacoes } from './config/envioNotificacoes.js'
import { reportsRouter } from './routes/reports.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'

const app = express()
const port = Number(process.env.PORT || 3001)

const corsOrigins = String(process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowLocalhost =
  String(process.env.CORS_ALLOW_LOCALHOST || 'true').toLowerCase() !== 'false'

function isLocalDevOrigin(origin) {
  if (!allowLocalhost) return false
  try {
    const url = new URL(origin)
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.protocol === 'http:' || url.protocol === 'https:')
    )
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`CORS bloqueado para origem: ${origin}`))
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.request().query('SELECT 1 AS ok')
    res.json({ ok: true, database: 'up' })
  } catch (error) {
    res.status(503).json({ ok: false, database: 'down', error: error.message })
  }
})

app.use('/api/reports', reportsRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

app.listen(port, () => {
  console.log(`[api] Canal de Denúncia ouvindo em http://localhost:${port}`)
  logStatusEnvioNotificacoes()
})
