import { z } from 'zod'
import { REPORT_TYPES } from '../types/report'

const typeIds = REPORT_TYPES.map((t) => t.id) as [string, ...string[]]

export const stepTypeSchema = z.object({
  type: z.enum(typeIds, { message: 'Selecione o tipo de denúncia.' }),
})

export const stepDescriptionSchema = z.object({
  whatHappened: z
    .string()
    .trim()
    .min(10, 'Descreva o que aconteceu com pelo menos 10 caracteres.')
    .max(2000, 'Máximo de 2.000 caracteres.'),
  whoInvolved: z.string().trim().max(1000, 'Máximo de 1.000 caracteres.').optional(),
  occurredAt: z.string().trim().min(1, 'Selecione a data aproximada do ocorrido.'),
  location: z
    .string()
    .trim()
    .min(2, 'Informe o local ou unidade com pelo menos 2 caracteres.')
    .max(200, 'O local deve ter no máximo 200 caracteres.'),
  contextDetails: z.string().trim().max(2000, 'Máximo de 2.000 caracteres.').optional(),
  freeReport: z
    .string()
    .trim()
    .min(50, 'No relato livre, descreva o ocorrido com pelo menos 50 caracteres.')
    .max(5000, 'O relato livre deve ter no máximo 5.000 caracteres.'),
})

export const stepDateLocationSchema = z.object({
  occurredAt: z.string().min(1, 'Informe a data aproximada do ocorrido.'),
  location: z
    .string()
    .trim()
    .min(2, 'Informe o local ou unidade com pelo menos 2 caracteres.')
    .max(200, 'O local deve ter no máximo 200 caracteres.'),
})

export const stepInvolvedSchema = z.object({
  involved: z.string().trim().max(1000, 'Máximo de 1.000 caracteres.').optional(),
})

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const stepAttachmentsSchema = z.object({
  attachments: z
    .array(z.instanceof(File))
    .max(MAX_FILES, `Envie no máximo ${MAX_FILES} arquivos.`)
    .superRefine((files, ctx) => {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: 'custom',
            message: `"${file.name}" excede 10 MB.`,
          })
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          ctx.addIssue({
            code: 'custom',
            message: `"${file.name}" não é um formato permitido.`,
          })
        }
      }
    }),
})

export const stepIdentificationSchema = z
  .object({
    isAnonymous: z.boolean(),
    identification: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.isAnonymous) return

    const email = data.identification.email?.trim() ?? ''
    if (!email) {
      ctx.addIssue({
        code: 'custom',
        path: ['identification', 'email'],
        message: 'Informe um e-mail para contato ou marque o modo anônimo.',
      })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['identification', 'email'],
        message: 'Informe um e-mail válido.',
      })
    }
  })

export const ATTACHMENT_LIMITS = {
  maxFiles: MAX_FILES,
  maxFileSize: MAX_FILE_SIZE,
  allowedTypes: ALLOWED_TYPES,
  accept: '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx',
} as const
