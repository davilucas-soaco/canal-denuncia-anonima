import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import multer from 'multer'
import { getPool, sql } from '../db.js'
import { notifyNovaDenuncia } from '../services/reportEmailNotify.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'data', 'uploads'),
)

fs.mkdirSync(uploadRoot, { recursive: true })

const ALLOWED_TYPES = new Set([
  'fraude',
  'conflito_interesses',
  'assedio_moral',
  'assedio_sexual',
  'discriminacao',
  'seguranca_trabalho',
  'uso_indevido',
  'outro',
])

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120)
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safe}`)
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 5,
  },
})

function generateProtocol(date = new Date()) {
  const year = date.getFullYear()
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = crypto.randomBytes(6)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[values[i] % alphabet.length]
  }
  return `SA-${year}-${code}`
}

function parseIdentification(raw) {
  if (!raw || !String(raw).trim()) return null
  try {
    const parsed = JSON.parse(String(raw))
    if (!parsed || typeof parsed !== 'object') return null
    return {
      name: parsed.name ? String(parsed.name).slice(0, 200) : undefined,
      email: parsed.email ? String(parsed.email).slice(0, 200) : undefined,
      phone: parsed.phone ? String(parsed.phone).slice(0, 50) : undefined,
    }
  } catch {
    return null
  }
}

export const reportsRouter = express.Router()

reportsRouter.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const type = String(req.body.type || '')
    const description = String(req.body.description || '').trim()
    const occurredAt = String(req.body.occurredAt || '').trim()
    const location = String(req.body.location || '').trim()
    const involved = String(req.body.involved || '').trim() || null
    const identification = parseIdentification(req.body.identification)
    const isAnonymous = !identification

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).send('Tipo de denúncia inválido.')
    }
    if (description.length < 30) {
      return res.status(400).send('Descrição muito curta.')
    }
    if (!occurredAt || !location) {
      return res.status(400).send('Data e local são obrigatórios.')
    }

    const protocol = generateProtocol()
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      const insert = await new sql.Request(tx)
        .input('protocol', sql.NVarChar(20), protocol)
        .input('type', sql.NVarChar(50), type)
        .input('description', sql.NVarChar(sql.MAX), description)
        .input('occurred_at', sql.NVarChar(100), occurredAt)
        .input('location', sql.NVarChar(500), location.slice(0, 500))
        .input('involved', sql.NVarChar(sql.MAX), involved)
        .input('is_anonymous', sql.Bit, isAnonymous)
        .input('contact_name', sql.NVarChar(200), identification?.name || null)
        .input('contact_email', sql.NVarChar(200), identification?.email || null)
        .input('contact_phone', sql.NVarChar(50), identification?.phone || null)
        .query(`
          INSERT INTO dbo.reports (
            protocol, type, description, occurred_at, location, involved,
            is_anonymous, contact_name, contact_email, contact_phone
          )
          OUTPUT INSERTED.id, INSERTED.created_at
          VALUES (
            @protocol, @type, @description, @occurred_at, @location, @involved,
            @is_anonymous, @contact_name, @contact_email, @contact_phone
          )
        `)

      const row = insert.recordset[0]
      const reportId = row.id
      const files = req.files || []

      for (const file of files) {
        await new sql.Request(tx)
          .input('report_id', sql.UniqueIdentifier, reportId)
          .input('original_name', sql.NVarChar(260), file.originalname.slice(0, 260))
          .input('stored_name', sql.NVarChar(260), file.filename.slice(0, 260))
          .input('mime_type', sql.NVarChar(120), file.mimetype?.slice(0, 120) || null)
          .input('size_bytes', sql.BigInt, String(file.size))
          .query(`
            INSERT INTO dbo.attachments (
              report_id, original_name, stored_name, mime_type, size_bytes, is_internal
            )
            VALUES (
              @report_id, @original_name, @stored_name, @mime_type, @size_bytes, 0
            )
          `)
      }

      await tx.commit()

      const submittedAt = new Date(row.created_at).toISOString()

      void notifyNovaDenuncia({
        protocol,
        type,
        location: location.slice(0, 500),
        occurredAt,
        isAnonymous,
        attachmentCount: files.length,
        submittedAt,
      })

      return res.status(201).json({
        protocol,
        submittedAt,
      })
    } catch (error) {
      await tx.rollback()
      throw error
    }
  } catch (error) {
    console.error('[POST /api/reports]', error)
    return res.status(500).send('Não foi possível registrar a denúncia.')
  }
})

reportsRouter.get('/:protocol', async (req, res) => {
  try {
    const protocol = String(req.params.protocol || '')
      .trim()
      .toUpperCase()

    if (!/^SA-\d{4}-[A-Z0-9]{6}$/.test(protocol)) {
      return res.status(400).json({ message: 'Protocolo inválido.' })
    }

    const pool = await getPool()
    const result = await pool
      .request()
      .input('protocol', sql.NVarChar(20), protocol)
      .query(`
        SELECT
          protocol,
          status,
          type,
          description,
          created_at,
          updated_at,
          is_anonymous
        FROM dbo.reports
        WHERE protocol = @protocol
      `)

    const report = result.recordset[0]
    if (!report) {
      return res.status(404).json({ message: 'Protocolo não encontrado.' })
    }

    const attachments = await pool
      .request()
      .input('protocol', sql.NVarChar(20), protocol)
      .query(`
        SELECT a.original_name, a.size_bytes, a.created_at
        FROM dbo.attachments a
        INNER JOIN dbo.reports r ON r.id = a.report_id
        WHERE r.protocol = @protocol
          AND a.is_internal = 0
        ORDER BY a.created_at
      `)

    let complementRequest = null
    if (report.status === 'aguardando_complemento') {
      const eventResult = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT TOP 1 e.note, e.created_at
          FROM dbo.report_events e
          INNER JOIN dbo.reports r ON r.id = e.report_id
          WHERE r.protocol = @protocol
            AND e.to_status = N'aguardando_complemento'
          ORDER BY e.created_at DESC
        `)

      const event = eventResult.recordset[0]
      const message = String(event?.note || '').trim()
      complementRequest = {
        message:
          message ||
          'A equipe responsável solicitou informações ou documentos complementares para seguir a apuração.',
        requestedAt: event?.created_at
          ? new Date(event.created_at).toISOString()
          : new Date(report.updated_at).toISOString(),
      }
    }

    return res.json({
      protocol: report.protocol,
      status: report.status,
      type: report.type,
      description: report.description || '',
      isAnonymous: Boolean(report.is_anonymous),
      submittedAt: new Date(report.created_at).toISOString(),
      updatedAt: new Date(report.updated_at).toISOString(),
      attachmentCount: attachments.recordset.length,
      attachments: attachments.recordset.map((row) => ({
        name: row.original_name,
        sizeBytes: Number(row.size_bytes) || 0,
        uploadedAt: new Date(row.created_at).toISOString(),
      })),
      complementRequest,
    })
  } catch (error) {
    console.error('[GET /api/reports/:protocol]', error)
    return res.status(500).json({ message: 'Erro ao consultar protocolo.' })
  }
})

const MAX_ATTACHMENTS_TOTAL = 10

async function listAttachmentsByProtocol(pool, protocol) {
  const attachments = await pool
    .request()
    .input('protocol', sql.NVarChar(20), protocol)
    .query(`
      SELECT a.original_name, a.size_bytes, a.created_at
      FROM dbo.attachments a
      INNER JOIN dbo.reports r ON r.id = a.report_id
      WHERE r.protocol = @protocol
        AND a.is_internal = 0
      ORDER BY a.created_at
    `)

  return attachments.recordset.map((row) => ({
    name: row.original_name,
    sizeBytes: Number(row.size_bytes) || 0,
    uploadedAt: new Date(row.created_at).toISOString(),
  }))
}

reportsRouter.post(
  '/:protocol/complement',
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const protocol = String(req.params.protocol || '')
        .trim()
        .toUpperCase()

      if (!/^SA-\d{4}-[A-Z0-9]{6}$/.test(protocol)) {
        return res.status(400).json({ message: 'Protocolo inválido.' })
      }

      const message = String(req.body.message || '').trim()
      const files = req.files || []

      if (message.length < 10 && !files.length) {
        return res.status(400).json({
          message:
            'Informe o complemento (mín. 10 caracteres) e/ou anexe ao menos um arquivo.',
        })
      }

      if (message.length > 0 && message.length < 10) {
        return res.status(400).json({
          message: 'O texto do complemento precisa ter ao menos 10 caracteres.',
        })
      }

      const pool = await getPool()
      const reportResult = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT id, status
          FROM dbo.reports
          WHERE protocol = @protocol
        `)

      const report = reportResult.recordset[0]
      if (!report) {
        return res.status(404).json({ message: 'Protocolo não encontrado.' })
      }

      if (report.status !== 'aguardando_complemento') {
        return res.status(409).json({
          message:
            'Este protocolo não está aguardando complemento no momento.',
        })
      }

      if (files.length) {
        const countResult = await pool
          .request()
          .input('report_id', sql.UniqueIdentifier, report.id)
          .query(`
            SELECT COUNT(*) AS total
            FROM dbo.attachments
            WHERE report_id = @report_id
              AND is_internal = 0
          `)

        const currentCount = Number(countResult.recordset[0]?.total || 0)
        if (currentCount + files.length > MAX_ATTACHMENTS_TOTAL) {
          return res.status(400).json({
            message: `Limite de ${MAX_ATTACHMENTS_TOTAL} anexos por protocolo. Já existem ${currentCount}.`,
          })
        }
      }

      const noteParts = []
      if (message) noteParts.push(message)
      if (files.length) {
        noteParts.push(
          `Anexos enviados no complemento: ${files.map((f) => f.originalname).join(', ')}`,
        )
      }
      const eventNote = noteParts.join('\n\n')

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
                @report_id, @original_name, @stored_name, @mime_type, @size_bytes, 0
              )
            `)
        }

        await new sql.Request(tx)
          .input('report_id', sql.UniqueIdentifier, report.id)
          .input('status', sql.NVarChar(40), 'em_analise')
          .query(`
            UPDATE dbo.reports
            SET status = @status, updated_at = SYSUTCDATETIME()
            WHERE id = @report_id
          `)

        await new sql.Request(tx)
          .input('report_id', sql.UniqueIdentifier, report.id)
          .input('event_type', sql.NVarChar(60), 'complement_received')
          .input('from_status', sql.NVarChar(40), 'aguardando_complemento')
          .input('to_status', sql.NVarChar(40), 'em_analise')
          .input('note', sql.NVarChar(sql.MAX), eventNote)
          .query(`
            INSERT INTO dbo.report_events (
              report_id, actor_id, actor_email, event_type, from_status, to_status, note
            )
            VALUES (
              @report_id, NULL, NULL, @event_type, @from_status, @to_status, @note
            )
          `)

        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }

      const mappedAttachments = await listAttachmentsByProtocol(pool, protocol)
      const updated = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT status, updated_at
          FROM dbo.reports
          WHERE protocol = @protocol
        `)

      return res.status(201).json({
        protocol,
        status: updated.recordset[0].status,
        updatedAt: new Date(updated.recordset[0].updated_at).toISOString(),
        attachmentCount: mappedAttachments.length,
        attachments: mappedAttachments,
        complementRequest: null,
      })
    } catch (error) {
      console.error('[POST /api/reports/:protocol/complement]', error)
      return res.status(500).json({ message: 'Não foi possível enviar o complemento.' })
    }
  },
)

reportsRouter.post(
  '/:protocol/attachments',
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const protocol = String(req.params.protocol || '')
        .trim()
        .toUpperCase()

      if (!/^SA-\d{4}-[A-Z0-9]{6}$/.test(protocol)) {
        return res.status(400).json({ message: 'Protocolo inválido.' })
      }

      const files = req.files || []
      if (!files.length) {
        return res.status(400).json({ message: 'Selecione ao menos um arquivo.' })
      }

      const pool = await getPool()
      const reportResult = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT id, status
          FROM dbo.reports
          WHERE protocol = @protocol
        `)

      const report = reportResult.recordset[0]
      if (!report) {
        return res.status(404).json({ message: 'Protocolo não encontrado.' })
      }

      if (
        report.status === 'arquivada' ||
        report.status === 'concluida' ||
        report.status === 'descartada'
      ) {
        return res.status(409).json({
          message: 'Este protocolo não aceita novos anexos no status atual.',
        })
      }

      const countResult = await pool
        .request()
        .input('report_id', sql.UniqueIdentifier, report.id)
        .query(`
          SELECT COUNT(*) AS total
          FROM dbo.attachments
          WHERE report_id = @report_id
            AND is_internal = 0
        `)

      const currentCount = Number(countResult.recordset[0]?.total || 0)
      if (currentCount + files.length > MAX_ATTACHMENTS_TOTAL) {
        return res.status(400).json({
          message: `Limite de ${MAX_ATTACHMENTS_TOTAL} anexos por protocolo. Já existem ${currentCount}.`,
        })
      }

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
                @report_id, @original_name, @stored_name, @mime_type, @size_bytes, 0
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

        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }

      const attachments = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT a.original_name, a.size_bytes, a.created_at
          FROM dbo.attachments a
          INNER JOIN dbo.reports r ON r.id = a.report_id
          WHERE r.protocol = @protocol
            AND a.is_internal = 0
          ORDER BY a.created_at
        `)

      const updated = await pool
        .request()
        .input('protocol', sql.NVarChar(20), protocol)
        .query(`
          SELECT updated_at
          FROM dbo.reports
          WHERE protocol = @protocol
        `)

      return res.status(201).json({
        protocol,
        attachmentCount: attachments.recordset.length,
        updatedAt: new Date(updated.recordset[0].updated_at).toISOString(),
        attachments: attachments.recordset.map((row) => ({
          name: row.original_name,
          sizeBytes: Number(row.size_bytes) || 0,
          uploadedAt: new Date(row.created_at).toISOString(),
        })),
      })
    } catch (error) {
      console.error('[POST /api/reports/:protocol/attachments]', error)
      return res.status(500).json({ message: 'Não foi possível adicionar os anexos.' })
    }
  },
)
