type StepDateLocationProps = {
  occurredAt: string
  location: string
  onChangeOccurredAt: (value: string) => void
  onChangeLocation: (value: string) => void
  errors?: { occurredAt?: string; location?: string }
}

export function StepDateLocation({
  occurredAt,
  location,
  onChangeOccurredAt,
  onChangeLocation,
  errors,
}: StepDateLocationProps) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h3 className="text-lg font-bold text-brand-navy">Data e local</h3>
        <p className="mt-1 text-sm text-brand-gray">
          Informe quando e onde o fato ocorreu, mesmo que de forma aproximada.
        </p>
      </div>

      <div>
        <label htmlFor="occurredAt" className="mb-1.5 block text-sm font-bold text-brand-navy">
          Data aproximada
        </label>
        <input
          id="occurredAt"
          type="date"
          max={today}
          value={occurredAt}
          onChange={(e) => onChangeOccurredAt(e.target.value)}
          className="w-full border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue"
        />
        {errors?.occurredAt && (
          <p className="mt-1.5 text-sm text-red-600">{errors.occurredAt}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="mb-1.5 block text-sm font-bold text-brand-navy">
          Local ou unidade
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => onChangeLocation(e.target.value)}
          placeholder="Ex.: Filial Manaus, setor de expedição"
          className="w-full border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-gray/60 focus:border-brand-blue"
        />
        {errors?.location && (
          <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
        )}
      </div>
    </div>
  )
}
