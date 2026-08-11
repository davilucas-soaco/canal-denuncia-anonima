import 'dotenv/config'
import sql from 'mssql/msnodesqlv8.js'

/**
 * SQL Server Express local — arquivos .mdf/.ldf em /data
 * Autenticação Windows (mesmo padrão de apps internos na máquina).
 */
export function buildSqlConfig(overrides = {}) {
  const server = process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS'
  const database = overrides.database || process.env.MSSQL_DATABASE || 'CanalDenuncia'
  const useWindowsAuth = process.env.MSSQL_TRUSTED_CONNECTION !== 'false'

  if (useWindowsAuth) {
    const connectionString = [
      `Server=${server}`,
      `Database=${database}`,
      'Trusted_Connection=Yes',
      'TrustServerCertificate=Yes',
      'Driver={ODBC Driver 18 for SQL Server}',
    ].join(';')

    return {
      connectionString,
      options: {
        trustedConnection: true,
      },
      ...overrides,
      database,
    }
  }

  return {
    server,
    database,
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || '',
    driver: 'msnodesqlv8',
    options: {
      trustedConnection: false,
      trustServerCertificate: true,
    },
    ...overrides,
  }
}

/** @type {import('mssql').ConnectionPool | null} */
let pool = null

export async function getPool() {
  if (pool?.connected) return pool
  pool = await sql.connect(buildSqlConfig())
  return pool
}

export { sql }
