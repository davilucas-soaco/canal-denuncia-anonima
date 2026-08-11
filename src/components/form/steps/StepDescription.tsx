import { AttachmentSlots } from '../AttachmentSlots'
import { DatePicker } from '../DatePicker'

type StepDescriptionValues = {
  whatHappened: string
  whoInvolved: string
  occurredAt: string
  location: string
  contextDetails: string
  freeReport: string
}

type StepDescriptionProps = {
  values: StepDescriptionValues
  onChange: <K extends keyof StepDescriptionValues>(
    key: K,
    value: StepDescriptionValues[K],
  ) => void
  attachments: File[]
  onChangeAttachments: (files: File[]) => void
  errors?: Partial<Record<keyof StepDescriptionValues | 'attachments', string>>
}

function FieldLabel({
  htmlFor,
  title,
  hint,
  optional,
}: {
  htmlFor: string
  title: string
  hint: string
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block">
      <span className="text-sm font-bold text-brand-navy">
        {title}
        {optional ? (
          <span className="ml-1.5 text-xs font-normal text-brand-gray">(opcional)</span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs text-brand-gray">{hint}</span>
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-brand-navy/15 bg-white px-4 py-3 text-sm text-brand-charcoal outline-none transition placeholder:text-brand-gray/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20'

const textareaClass = `${inputClass} resize-y`

export function StepDescription({
  values,
  onChange,
  attachments,
  onChangeAttachments,
  errors,
}: StepDescriptionProps) {
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h3 className="text-lg font-bold text-brand-navy">Descrição do ocorrido</h3>
        <p className="mt-1 text-sm text-brand-gray">
          Responda cada ponto para facilitar a apuração. Se optar pelo anonimato, evite
          incluir informações que revelem a sua identidade.
        </p>
      </div>

      <div>
        <FieldLabel
          htmlFor="whatHappened"
          title="O quê"
          hint="Descreva a irregularidade ou conduta que deseja reportar."
        />
        <textarea
          id="whatHappened"
          rows={3}
          value={values.whatHappened}
          onChange={(e) => onChange('whatHappened', e.target.value)}
          placeholder="Ex.: cobrança indevida, assédio, desvio de recursos..."
          className={textareaClass}
        />
        {errors?.whatHappened && (
          <p className="mt-1.5 text-sm text-red-600">{errors.whatHappened}</p>
        )}
      </div>

      <div>
        <FieldLabel
          htmlFor="whoInvolved"
          title="Quem"
          hint="Denunciados, vítimas, testemunhas ou outros envolvidos."
          optional
        />
        <textarea
          id="whoInvolved"
          rows={2}
          value={values.whoInvolved}
          onChange={(e) => onChange('whoInvolved', e.target.value)}
          placeholder="Nomes, cargos ou setores, se souber..."
          className={textareaClass}
        />
        {errors?.whoInvolved && (
          <p className="mt-1.5 text-sm text-red-600">{errors.whoInvolved}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="occurredAt"
            title="Quando"
            hint="Selecione a data aproximada do ocorrido."
          />
          <DatePicker
            id="occurredAt"
            value={values.occurredAt}
            onChange={(value) => onChange('occurredAt', value)}
            placeholder="Selecione a data"
            aria-invalid={Boolean(errors?.occurredAt)}
          />
          {errors?.occurredAt && (
            <p className="mt-1.5 text-sm text-red-600">{errors.occurredAt}</p>
          )}
        </div>
        <div>
          <FieldLabel
            htmlFor="location"
            title="Onde"
            hint="Unidade, setor, cidade ou local do ocorrido."
          />
          <input
            id="location"
            type="text"
            value={values.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="Ex.: Unidade X"
            className={inputClass}
          />
          {errors?.location && (
            <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
          )}
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="contextDetails"
          title="Por quê / Quanto / Provas"
          hint="Motivação, valores envolvidos ou evidências, se souber."
          optional
        />
        <textarea
          id="contextDetails"
          rows={3}
          value={values.contextDetails}
          onChange={(e) => onChange('contextDetails', e.target.value)}
          placeholder="Ex.: valor estimado, documentos que existem, possível motivação..."
          className={textareaClass}
        />
        {errors?.contextDetails && (
          <p className="mt-1.5 text-sm text-red-600">{errors.contextDetails}</p>
        )}
      </div>

      <AttachmentSlots
        files={attachments}
        onChange={onChangeAttachments}
        error={errors?.attachments}
      />

      <div>
        <FieldLabel
          htmlFor="freeReport"
          title="Relato livre"
          hint="Use este espaço para contar o caso com suas palavras, no formato que preferir."
        />
        <textarea
          id="freeReport"
          rows={6}
          value={values.freeReport}
          onChange={(e) => onChange('freeReport', e.target.value)}
          placeholder="Escreva aqui o relato completo, com o máximo de detalhes possível..."
          className={textareaClass}
        />
        <div className="mt-1.5 flex justify-between text-xs text-brand-gray">
          <span>Mínimo de 50 caracteres</span>
          <span>{values.freeReport.trim().length} / 5000</span>
        </div>
        {errors?.freeReport && (
          <p className="mt-1.5 text-sm text-red-600">{errors.freeReport}</p>
        )}
      </div>
    </div>
  )
}
