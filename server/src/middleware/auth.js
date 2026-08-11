import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-canal-denuncia-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h'

export function signAdminToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

export function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Não autenticado.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.admin = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
    return next()
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' })
  }
}
