import { useEffect, useState } from 'react'
import type { ReportFormData, ReportTypeId, SubmitReportResponse } from '../../types/report'
import type { LegalDocId } from '../../content/legal'
import { submitReport } from '../../services/reportApi'
import { composeReportDescription } from '../../utils/composeReport'
import {
  stepAttachmentsSchema,
  stepDescriptionSchema,
  stepIdentificationSchema,
  stepTypeSchema,
} from '../../utils/validation'
import { StepIndicator } from './StepIndicator'
import { ProtocolSuccess } from './ProtocolSuccess'
import { SubmitOverlay } from './SubmitOverlay'
import { StepType } from './steps/StepType'
import { StepDescription } from './steps/StepDescription'
import { StepIdentification } from './steps/StepIdentification'

const LAST_STEP = 2

const initialData: ReportFormData = {
  type: '',
  whatHappened: '',
  whoInvolved: '',
  occurredAt: '',
  location: '',
  contextDetails: '',
  freeReport: '',
  attachments: [],
  isAnonymous: true,
  identification: {},
}

type MultiStepFormProps = {
  selectedTypeFromLanding?: ReportTypeId | ''
  onTypeChange?: (type: ReportTypeId | '') => void
  onOpenLegal?: (docId: LegalDocId) => void
}

function scrollToFirstError(keys: string[]) {
  const order = [
    'type',
    'whatHappened',
    'whoInvolved',
    'occurredAt',
    'location',
    'contextDetails',
    'attachments',
    'freeReport',
    'identification',
  ]
  const first = order.find((key) => keys.includes(key))
  if (!first) return
  const el =
    document.getElementById(first) ||
    document.querySelector(`[data-error-field="${first}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function scrollFormIntoView() {
  document.getElementById('formulario')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export function MultiStepForm({
  selectedTypeFromLanding = '',
  onTypeChange,
  onOpenLegal,
}: MultiStepFormProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ReportFormData>({
    ...initialData,
    type: selectedTypeFromLanding,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [overlayPhase, setOverlayPhase] = useState<'loading' | 'success' | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<SubmitReportResponse | null>(null)

  useEffect(() => {
    if (!selectedTypeFromLanding) return
    setData((prev) =>
      prev.type === selectedTypeFromLanding
        ? prev
        : { ...prev, type: selectedTypeFromLanding },
    )
    setStep(0)
    setResult(null)
  }, [selectedTypeFromLanding])

  function update<K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function setType(type: ReportTypeId) {
    update('type', type)
    onTypeChange?.(type)
  }

  function validateCurrentStep(): boolean {
    setErrors({})

    switch (step) {
      case 0: {
        const parsed = stepTypeSchema.safeParse({ type: data.type })
        if (!parsed.success) {
          setErrors({ type: parsed.error.issues[0]?.message ?? 'Campo inválido.' })
          scrollToFirstError(['type'])
          return false
        }
        return true
      }
      case 1: {
        const desc = stepDescriptionSchema.safeParse({
          whatHappened: data.whatHappened,
          whoInvolved: data.whoInvolved || undefined,
          occurredAt: data.occurredAt,
          location: data.location,
          contextDetails: data.contextDetails || undefined,
          freeReport: data.freeReport,
        })
        const map: Record<string, string> = {}
        if (!desc.success) {
          for (const issue of desc.error.issues) {
            const key = String(issue.path[0] ?? 'freeReport')
            if (!map[key]) map[key] = issue.message
          }
        }
        const files = stepAttachmentsSchema.safeParse({
          attachments: data.attachments ?? [],
        })
        if (!files.success) {
          map.attachments = files.error.issues[0]?.message ?? 'Arquivo inválido.'
        }
        if (Object.keys(map).length) {
          setErrors(map)
          scrollToFirstError(Object.keys(map))
          return false
        }
        return true
      }
      case 2: {
        const parsed = stepIdentificationSchema.safeParse({
          isAnonymous: data.isAnonymous,
          identification: data.identification,
        })
        if (!parsed.success) {
          setErrors({
            identification: parsed.error.issues[0]?.message ?? 'Campo inválido.',
          })
          scrollToFirstError(['identification'])
          return false
        }
        return true
      }
      default:
        return true
    }
  }

  function handleNext() {
    if (!validateCurrentStep()) return
    setStep((s) => Math.min(s + 1, LAST_STEP))
    // Aguarda o React pintar a etapa (mais curta) antes de reposicionar o scroll.
    window.setTimeout(() => scrollFormIntoView(), 50)
  }

  function handleBack() {
    setErrors({})
    setSubmitError('')
    setStep((s) => Math.max(s - 1, 0))
    window.setTimeout(() => scrollFormIntoView(), 50)
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return
    if (!data.type) return

    setSubmitting(true)
    setSubmitError('')
    setOverlayPhase('loading')

    try {
      const response = await submitReport({
        type: data.type,
        description: composeReportDescription({
          whatHappened: data.whatHappened,
          contextDetails: data.contextDetails,
          freeReport: data.freeReport,
        }),
        occurredAt: data.occurredAt.trim(),
        location: data.location.trim(),
        involved: data.whoInvolved.trim() || undefined,
        attachments: data.attachments ?? [],
        identification: data.isAnonymous
          ? null
          : {
              name: data.identification.name?.trim() || undefined,
              email: data.identification.email?.trim() || undefined,
              phone: data.identification.phone?.trim() || undefined,
            },
      })

      setOverlayPhase('success')
      await new Promise((resolve) => setTimeout(resolve, 900))
      setResult(response)
      setOverlayPhase(null)
      document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setOverlayPhase(null)
      setSubmitError(
        err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleNewReport() {
    setData({ ...initialData })
    setStep(0)
    setErrors({})
    setSubmitError('')
    setResult(null)
    setOverlayPhase(null)
    onTypeChange?.('')
  }

  return (
    <section id="formulario" className="bg-brand-mist">
      {overlayPhase && <SubmitOverlay phase={overlayPhase} />}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <span className="inline-flex rounded-full bg-brand-amber/15 px-3.5 py-1 text-sm text-brand-navy">
            Formulário
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Fazer denúncia
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-gray sm:text-base">
            Preencha as etapas abaixo com o máximo de detalhes possível.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-4 py-8 shadow-sm ring-1 ring-brand-navy/5 sm:px-8 sm:py-10">
          {!result ? (
            <>
              <StepIndicator currentStep={step} />

              <div className="min-h-[280px]">
                {step === 0 && (
                  <StepType
                    value={data.type}
                    onChange={setType}
                    error={errors.type}
                  />
                )}
                {step === 1 && (
                  <StepDescription
                    values={{
                      whatHappened: data.whatHappened,
                      whoInvolved: data.whoInvolved,
                      occurredAt: data.occurredAt,
                      location: data.location,
                      contextDetails: data.contextDetails,
                      freeReport: data.freeReport,
                    }}
                    onChange={(key, value) => update(key, value)}
                    attachments={data.attachments ?? []}
                    onChangeAttachments={(files) => update('attachments', files)}
                    errors={{
                      whatHappened: errors.whatHappened,
                      whoInvolved: errors.whoInvolved,
                      occurredAt: errors.occurredAt,
                      location: errors.location,
                      contextDetails: errors.contextDetails,
                      freeReport: errors.freeReport,
                      attachments: errors.attachments,
                    }}
                  />
                )}
                {step === 2 && (
                  <div data-error-field="identification">
                    <StepIdentification
                      isAnonymous={data.isAnonymous}
                      identification={data.identification}
                      onChangeAnonymous={(v) => update('isAnonymous', v)}
                      onChangeIdentification={(v) => update('identification', v)}
                      error={errors.identification}
                    />
                  </div>
                )}
              </div>

              {submitError && (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              )}

              <p className="mt-6 text-xs leading-relaxed text-brand-gray">
                Ao enviar, você declara ciência da{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal?.('privacidade')}
                  className="font-bold text-brand-blue underline-offset-2 hover:underline"
                >
                  Política de Privacidade
                </button>{' '}
                e dos{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal?.('termos')}
                  className="font-bold text-brand-blue underline-offset-2 hover:underline"
                >
                  Termos do Canal
                </button>
                . Os dados informados serão usados apenas para apuração do relato.
              </p>

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0 || submitting}
                  className="rounded-xl border border-brand-navy/15 px-5 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Voltar
                </button>

                {step < LAST_STEP ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                    className="btn-amber rounded-xl px-7 py-3 text-sm font-bold disabled:opacity-60"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-amber rounded-xl px-7 py-3 text-sm font-bold disabled:opacity-60"
                  >
                    Enviar denúncia
                  </button>
                )}
              </div>
            </>
          ) : (
            <ProtocolSuccess protocol={result.protocol} onNewReport={handleNewReport} />
          )}
        </div>
      </div>
    </section>
  )
}
