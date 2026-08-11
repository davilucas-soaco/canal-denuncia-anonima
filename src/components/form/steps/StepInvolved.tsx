type StepInvolvedProps = {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function StepInvolved({ value, onChange, error }: StepInvolvedProps) {
  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h3 className="text-lg font-bold text-brand-navy">Envolvidos</h3>
        <p className="mt-1 text-sm text-brand-gray">
          Se souber, informe nomes, cargos ou áreas das pessoas envolvidas. Este campo
          é opcional.
        </p>
      </div>
      <div>
        <label htmlFor="involved" className="sr-only">
          Envolvidos
        </label>
        <textarea
          id="involved"
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex.: João Silva (supervisão), setor de logística..."
          className="w-full resize-y border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-gray/60 focus:border-brand-blue"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
