import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import multer from 'multer'
import { getPool, sql } from '../db.js'
import { requireAdminAuth } from '../middleware/auth.js'
import { emailSettingsRouter } from './emailSettings.js'
import { notifyPedidoComplemento } from '../services/reportEmailNotify.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'data', 'uploads'),
)

fs.mkdirSync(uploadRoot, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120)
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safe}`)
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
})

const MAX_INTERNAL_ATTACHMENTS = 20

const ALLOWED_STATUS = new Set([
  'recebida',
  'em_analise',
  'aguardando_complemento',
  'concluida',
  'arquivada',
  'descartada',
])

const TYPE_LABELS = {
  fraude: 'Fraude, corrupção e lavagem de dinheiro',
  conflito_interesses: 'Conflito de interesses',
  assedio_moral: 'Assédio moral',
  assedio_sexual: 'Assédio sexual',
  discriminacao: 'Discriminação',
  seguranca_trabalho: 'Segurança, meio ambiente e saúde',
  uso_indevido: 'Uso indevido de bens, dados ou informações',
  outro: 'Outras irregularidades',
}

export const adminRouter = express.Router()
adminRouter.use(requireAdminAuth)
adminRouter.use('/email-settings', emailSettingsRouter)

adminRouter.get('/reports/stats', async (_req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT status, COUNT(1) AS total
      FROM dbo.reports
      GROUP BY status
    `)

    const byStatus = Object.fromEntries(
      result.recordset.map((row) => [row.status, Number(row.total) || 0]),
    )

    const pendencias = byStatus.recebida || 0
    const andamento =
      (byStatus.em_analise || 0) + (byStatus.aguardando_complemento || 0)
    const arquivo =
      (byStatus.concluida || 0) +
      (byStatus.arquivada || 0) +
      (byStatus.descartada || 0)

    return res.json({
      byStatus,
      pendencias,
      andamento,
      arquivo,
      total: pendencias + andamento + arquivo,
    })
  } catch (error) {
    console.error('[GET /api/admin/reports/stats]', error)
    return res.status(500).json({ message: 'Erro ao carregar estatísticas.' })
  }
})

adminRouter.get('/reports', async (req, res) => {
  try {
    const status = String(req.query.status || '').trim()
    const inbox = String(req.query.inbox || '').trim()
    const type = String(req.query.type || '').trim()
    const q = String(req.query.q || '').trim()

    const pool = await getPool()
    const request = pool.request()

    let where = 'WHERE 1 = 1'
    if (status && ALLOWED_STATUS.has(status)) {
      request.input('status', sql.NVarChar(40), status)
      where += ' AND r.status = @status'
    } else if (inbox === 'pendencias') {
      where += ` AND r.status = N'recebida'`
    } else if (inbox === 'andamento') {
      where += ` AND r.status IN (N'em_analise', N'aguardando_complemento')`
    } else if (inbox === 'arquivo') {
      where += ` AND r.status IN (N'concluida', N'arquivada', N'descartada')`
    }

    if (type) {
      request.input('type', sql.NVarChar(50), type)
      where += ' AND r.type = @type'
    }
    if (q) {
      request.input('q', sql.NVarChar(100), `%${q}%`)
      where += ' AND (r.protocol LIKE @q OR r.description LIKE @q OR r.location LIKE @q)'
    }

    const result = await request.query(`
      SELECT
        r.id,
        r.protocol,
        r.status,
        r.type,
        r.is_anonymous,
        r.location,
        r.created_at,
        r.updated_at,
        (
          SELECT COUNT(1) FROM dbo.attachments a WHERE a.report_id = r.id
        ) AS attachment_count
      FROM dbo.reports r
      ${where}
      ORDER BY r.created_at DESC
    `)

    return res.json({
      items: result.recordset.map((row) => ({
        id: row.id,
        protocol: row.protocol,
        status: row.status,
        type: row.type,
        typeLabel: TYPE_LABELS[row.type] || row.type,
        isAnonymous: Boolean(row.is_anonymous),
        location: row.location,
        submittedAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        attachmentCount: Number(row.attachment_count) || 0,
      })),
    })
  } catch (error) {
    console.error('[GET /api/admin/reports]', error)
    return res.status(500).json({ message: 'Erro ao listar denúncias.' })
  }
})

adminRouter.get('/reports/:protocol', async (req, res) => {
  try {
    const protocol = String(req.params.protocol || '')
      .trim()
      .toUpperCase()

    const pool = await getPool()
    const result = await pool
      .request()
      .input('protocol', sql.NVarChar(20), protocol)
      .query(`
        SELECT
          id, protocol, status, type, description, occurred_at, location, involved,
          is_anonymous, contact_name, contact_email, contact_phone,
          created_at, updated_at
        FROM dbo.reports
        WHERE protocol = @protocol
      `)

    const report = result.recordset[0]
    if (!report) {
      return res.status(404).json({ message: 'Protocolo não encontrado.' })
    }

    const attachments = await pool
      .request()
      .input('report_id', sql.UniqueIdentifier, report.id)
      .query(`
        SELECT id, original_name, size_bytes, mime_type, is_internal, created_at
        FROM dbo.attachments
        WHERE report_id = @report_id
        ORDER BY created_at
      `)

    const events = await pool
      .request()
      .input('report_id', sql.UniqueIdentifier, report.id)
      .query(`
        SELECT id, actor_email, event_type, from_status, to_status, note, created_at
        FROM dbo.report_events
        WHERE report_id = @report_id
        ORDER BY created_at DESC
      `)

    return res.json({
      id: report.id,
      protocol: report.protocol,
      status: report.status,
      type: report.type,
      typeLabel: TYPE_LABELS[report.type] || report.type,
      description: report.description || '',
      occurredAt: report.occurred_at,
      location: report.location,
      involved: report.involved || '',
      isAnonymous: Boolean(report.is_anonymous),
      contact: report.is_anonymous
        ? null
        : {
            name: report.contact_name || null,
            email: report.contact_email || null,
            phone: report.contact_phone || null,
          },
      submittedAt: new Date(report.created_at).toISOString(),
      updatedAt: new Date(report.updated_at).toISOString(),
      attachments: attachments.recordset.map((row) => ({
        id: row.id,
        name: row.original_name,
        sizeBytes: Number(row.size_bytes) || 0,
        mimeType: row.mime_type,
        isInternal: Boolean(row.is_internal),
        uploadedAt: new Date(row.created_at).toISOString(),
      })),
      events: events.recordset.map((row) => ({
        id: row.id,
        actorEmail: row.actor_email,
        eventType: row.event_type,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        note: row.note,
        createdAt: new Date(row.created_at).toISOString(),
      })),
    })
  } catch (error) {
    console.error('[GET /api/admin/reports/:protocol]', error)
    return res.status(500).json({ message: 'Erro ao carregar denúncia.' })
  }
})

adminRouter.patch('/reports/:protocol/status', async (req, res) => {
  try {
    const protocol = String(req.params.protocol || '')
      .trim()
      .toUpperCase()
    const toStatus = String(req.body.status || '').trim()
    const note = String(req.body.note || '').trim() || null

    if (!ALLOWED_STATUS.has(toStatus)) {
      return res.status(400).json({ message: 'Status inválido.' })
    }

    const pool = await getPool()
    const current = await pool
      .request()
      .input('protocol', sql.NVarChar(20), protocol)
      .query(`
        SELECT id, status, is_anonymous, contact_email, contact_name
        FROM dbo.reports
        WHERE protocol = @protocol
      `)

    const report = current.recordset[0]
    if (!report) {
      return res.status(404).json({ message: 'Protocolo não encontrado.' })
    }

    if (report.status === toStatus && !note) {
      return res.json({ protocol, status: toStatus, updatedAt: new Date().toISOString() })
    }

    const statusChanged = report.status !== toStatus

    const tx = new sql.Transaction(pool)
    await tx.begin()
    try {
      const updated = await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, report.id)
        .input('status', sql.NVarChar(40), toStatus)
        .query(`
          UPDATE dbo.reports
          SET status = @status, updated_at = SYSUTCDATETIME()
          OUTPUT INSERTED.updated_at
          WHERE id = @id
        `)

      await new sql.Request(tx)
        .input('report_id', sql.UniqueIdentifier, report.id)
        .input('actor_id', sql.UniqueIdentifier, req.admin.id)
        .input('actor_email', sql.NVarChar(200), req.admin.email)
        .input('event_type', sql.NVarChar(60), 'status_change')
        .input('from_status', sql.NVarChar(40), report.status)
        .input('to_status', sql.NVarChar(40), toStatus)
        .input('note', sql.NVarChar(sql.MAX), note)
        .query(`
          INSERT INTO dbo.report_events (
            report_id, actor_id, actor_email, event_type, from_status, to_status, note
          )
          VALUES (
            @report_id, @actor_id, @actor_email, @event_type, @from_status, @to_status, @note
          )
        `)

      await tx.commit()

      if (statusChanged && toStatus === 'aguardando_complemento') {
        void notifyPedidoComplemento({
          protocol,
          contactEmail: report.contact_email,
          contactName: report.contact_name,
          message: note,
          isAnonymous: Boolean(report.is_anonymous),
        })
      }

      return res.json({
        protocol,
        status: toStatus,
        updatedAt: new Date(updated.recordset[0].updated_at).toISOString(),
      })
    } catch (error) {
      await tx.rollback()
      throw error
    }
  } catch (error) {
    console.error('[PATCH /api/admin/reports/:protocol/status]', error)
    return res.status(500).json({ message: 'Erro ao atualizar status.' })
  }
})

adminRouter.post(
  '/reports/:protocol/attachments',
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const protocol = String(req.params.protocol || '')
        .trim()
        .toUpperCase()
      const files = req.files || []
      const note = String(req.body.note || '').trim() || null

      if (!files.length) {
        return res.status(400).json({ message: 'Selecione ao menos um arquivo.' })
      }

      const pool = await getPool()
      const current = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`SELECT id, status FROM dbo.reports WHERE protocol = @protocol`)

      const report = current.recordset[0]
      if (!report) {
        return res.status(404).json({ message: 'Protocolo não encontrado.' })
      }

      const countResult = await pool
        .request()
        .input('report_id', sql.UniqueIdentifier, report.id)
        .query(`
          SELECT COUNT(*) AS total
          FROM dbo.attachments
          WHERE report_id = @report_id
            AND is_internal = 1
        `)

      const currentCount = Number(countResult.recordset[0]?.total || 0)
      if (currentCount + files.length > MAX_INTERNAL_ATTACHMENTS) {
        return res.status(400).json({
          message: `Limite de ${MAX_INTERNAL_ATTACHMENTS} anexos internos por protocolo.`,
        })
      }

      const fileNames = files.map((f) => f.originalname).join(', ')
      const eventNote = note
        ? `${note}\n\nAnexos internos: ${fileNames}`
        : `Anexos internos adicionados: ${fileNames}`

      const tx = new sql.Transaction(pool)
      await tx.begin()
      try {
        for (const file of files) {
          await new sql.Request(tx)
            .input('report_id', sql.UniqueIdentifier, report.id)
            .input('original_name', sql.NVarChar(260), file.originalname.slice(0, 260))
            .input('stored_name', sql.NVarChar(260), file.filename.slice(0, 260))
            .input('mime_type', sql.NVarChar(120), file.mimetype?.slice(0, 120) || null)
            .input('size_bytes', sql.BigInt, String(file.size))
            .query(`
              INSERT INTO dbo.attachments (
                report_id, original_name, stored_name, mime_type, size_bytes, is_internal
              )
              VALUES (
                @report_id, @original_name, @stored_name, @mime_type, @size_bytes, 1
              )
            `)
        }

        await new sql.Request(tx)
          .input('report_id', sql.UniqueIdentifier, report.id)
          .query(`
            UPDATE dbo.reports
            SET updated_at = SYSUTCDATETIME()
            WHERE id = @report_id
          `)

        await new sql.Request(tx)
          .input('report_id', sql.UniqueIdentifier, report.id)
          .input('actor_id', sql.UniqueIdentifier, req.admin.id)
          .input('actor_email', sql.NVarChar(200), req.admin.email)
          .input('event_type', sql.NVarChar(60), 'admin_attachment')
          .input('from_status', sql.NVarChar(40), report.status)
          .input('to_status', sql.NVarChar(40), report.status)
          .input('note', sql.NVarChar(sql.MAX), eventNote)
          .query(`
            INSERT INTO dbo.report_events (
              report_id, actor_id, actor_email, event_type, from_status, to_status, note
            )
            VALUES (
              @report_id, @actor_id, @actor_email, @event_type, @from_status, @to_status, @note
            )
          `)

        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }

      return res.status(201).json({
        protocol,
        uploaded: files.length,
      })
    } catch (error) {
      console.error('[POST /api/admin/reports/:protocol/attachments]', error)
      return res.status(500).json({ message: 'Erro ao enviar anexos.' })
    }
  },
)

adminRouter.get('/attachments/:id/download', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT original_name, stored_name, mime_type
        FROM dbo.attachments
        WHERE id = @id
      `)

    const file = result.recordset[0]
    if (!file) {
      return res.status(404).json({ message: 'Anexo não encontrado.' })
    }

    const filePath = path.join(uploadRoot, file.stored_name)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado no servidor.' })
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
    )
    if (file.mime_type) {
      res.setHeader('Content-Type', file.mime_type)
    }
    return fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('[GET /api/admin/attachments/:id/download]', error)
    return res.status(500).json({ message: 'Erro ao baixar anexo.' })
  }
})
