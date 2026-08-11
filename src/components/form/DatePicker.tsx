import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

type Panel = 'day' | 'month' | 'year'

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }
  return date
}

function formatDisplay(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return date.toLocaleDateString('pt-BR')
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function buildCalendarDays(viewYear: number, viewMonth: number): (Date | null)[] {
  const first = new Date(viewYear, viewMonth, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (Date | null)[] = []

  for (let i = 0; i < mondayOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewYear, viewMonth, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

function decadeStart(year: number): number {
  return Math.floor(year / 12) * 12
}

type DatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  max?: Date
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

export function DatePicker({
  id,
  value,
  onChange,
  max = startOfDay(new Date()),
  placeholder = 'Selecione a data',
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = parseIsoDate(value)
  const initialView = selected ?? startOfDay(new Date())

  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('day')
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())

  useEffect(() => {
    if (!open) return
    const next = selected ?? startOfDay(new Date())
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
    setPanel('day')
  }, [open, value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (panel !== 'day') {
          setPanel(panel === 'year' ? 'month' : 'day')
          return
        }
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, panel])

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function shiftYear(delta: number) {
    const nextYear = viewYear + delta
    if (nextYear > max.getFullYear()) return
    setViewYear(nextYear)
  }

  function shiftDecade(delta: number) {
    const next = decadeStart(viewYear) + delta * 12
    if (next > max.getFullYear()) return
    setViewYear(Math.min(next, max.getFullYear()))
  }

  function selectDay(date: Date) {
    if (startOfDay(date) > max) return
    onChange(toIsoDate(date))
    setOpen(false)
  }

  function selectMonth(month: number) {
    if (viewYear === max.getFullYear() && month > max.getMonth()) return
    setViewMonth(month)
    setPanel('day')
  }

  function selectYear(year: number) {
    if (year > max.getFullYear()) return
    setViewYear(year)
    if (year === max.getFullYear() && viewMonth > max.getMonth()) {
      setViewMonth(max.getMonth())
    }
    setPanel('month')
  }

  const days = buildCalendarDays(viewYear, viewMonth)
  const today = startOfDay(new Date())
  const display = formatDisplay(value)
  const yearRangeStart = decadeStart(viewYear)
  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i)

  const canGoNextMonth =
    viewYear < max.getFullYear() ||
    (viewYear === max.getFullYear() && viewMonth < max.getMonth())
  const canGoNextYear = viewYear < max.getFullYear()
  const canGoNextDecade = yearRangeStart + 12 <= max.getFullYear()

  const titleLabel =
    panel === 'day'
      ? `${MONTHS[viewMonth]} ${viewYear}`
      : panel === 'month'
        ? String(viewYear)
        : `${yearRangeStart} – ${yearRangeStart + 11}`

  function handleTitleClick() {
    if (panel === 'day') setPanel('month')
    else if (panel === 'month') setPanel('year')
  }

  function handlePrev() {
    if (panel === 'day') shiftMonth(-1)
    else if (panel === 'month') shiftYear(-1)
    else shiftDecade(-1)
  }

  function handleNext() {
    if (panel === 'day') shiftMonth(1)
    else if (panel === 'month') shiftYear(1)
    else shiftDecade(1)
  }

  const canGoNext =
    panel === 'day' ? canGoNextMonth : panel === 'month' ? canGoNextYear : canGoNextDecade

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition',
          'focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
          open
            ? 'border-brand-blue ring-2 ring-brand-blue/20'
            : 'border-brand-navy/15 hover:border-brand-navy/30',
          ariaInvalid && 'border-red-400 focus:border-red-500 focus:ring-red-200',
        )}
      >
        <CalendarBlank
          weight="duotone"
          className="h-5 w-5 shrink-0 text-brand-amber"
          aria-hidden
        />
        <span className={cn('flex-1', display ? 'text-brand-charcoal' : 'text-brand-gray/60')}>
          {display || placeholder}
        </span>
      </button>

      <div
        className={cn(
          'absolute left-0 right-0 z-30 origin-top pt-2 transition duration-200 ease-out',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        <div
          id={listboxId}
          role="dialog"
          aria-label="Selecionar data"
          className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white p-4 shadow-[0_18px_40px_rgba(4,30,66,0.14)]"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy transition hover:bg-brand-mist"
              aria-label={
                panel === 'day'
                  ? 'Mês anterior'
                  : panel === 'month'
                    ? 'Ano anterior'
                    : 'Década anterior'
              }
            >
              <CaretLeft weight="bold" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleTitleClick}
              disabled={panel === 'year'}
              className={cn(
                'rounded-xl px-3 py-1.5 text-sm font-bold text-brand-navy transition',
                panel === 'year'
                  ? 'cursor-default'
                  : 'hover:bg-brand-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
              )}
              aria-label={
                panel === 'day'
                  ? 'Selecionar mês'
                  : panel === 'month'
                    ? 'Selecionar ano'
                    : undefined
              }
            >
              {titleLabel}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy transition hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={
                panel === 'day'
                  ? 'Próximo mês'
                  : panel === 'month'
                    ? 'Próximo ano'
                    : 'Próxima década'
              }
            >
              <CaretRight weight="bold" className="h-4 w-4" />
            </button>
          </div>

          {panel === 'day' && (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="py-1 text-center text-[0.7rem] font-bold uppercase tracking-wide text-brand-gray"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  if (!date) {
                    return <span key={`empty-${index}`} className="h-10" />
                  }

                  const iso = toIsoDate(date)
                  const isSelected = value === iso
                  const isToday = toIsoDate(today) === iso
                  const isDisabled = startOfDay(date) > max

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => selectDay(date)}
                      className={cn(
                        'relative flex h-10 items-center justify-center rounded-xl text-sm font-medium transition duration-200',
                        isDisabled && 'cursor-not-allowed text-brand-gray/30',
                        !isDisabled && !isSelected && 'text-brand-navy hover:bg-brand-amber/15',
                        isSelected && 'bg-brand-navy text-white shadow-sm',
                        isToday && !isSelected && 'ring-1 ring-brand-amber/70',
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {panel === 'month' && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_SHORT.map((label, month) => {
                const isSelected =
                  selected?.getFullYear() === viewYear && selected.getMonth() === month
                const isCurrent =
                  today.getFullYear() === viewYear && today.getMonth() === month
                const isDisabled =
                  viewYear > max.getFullYear() ||
                  (viewYear === max.getFullYear() && month > max.getMonth())

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectMonth(month)}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-xl text-sm font-bold transition duration-200',
                      isDisabled && 'cursor-not-allowed text-brand-gray/30',
                      !isDisabled && !isSelected && 'text-brand-navy hover:bg-brand-amber/15',
                      isSelected && 'bg-brand-navy text-white shadow-sm',
                      isCurrent && !isSelected && 'ring-1 ring-brand-amber/70',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {panel === 'year' && (
            <div className="grid grid-cols-3 gap-2">
              {years.map((year) => {
                const isSelected = selected?.getFullYear() === year
                const isCurrent = today.getFullYear() === year
                const isDisabled = year > max.getFullYear()

                return (
                  <button
                    key={year}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectYear(year)}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-xl text-sm font-bold transition duration-200',
                      isDisabled && 'cursor-not-allowed text-brand-gray/30',
                      !isDisabled && !isSelected && 'text-brand-navy hover:bg-brand-amber/15',
                      isSelected && 'bg-brand-navy text-white shadow-sm',
                      isCurrent && !isSelected && 'ring-1 ring-brand-amber/70',
                    )}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-brand-navy/10 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-gray transition hover:bg-brand-mist hover:text-brand-navy"
            >
              Limpar
            </button>
            <button
              type="button"
              disabled={today > max}
              onClick={() => selectDay(today)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-navy transition hover:bg-brand-amber/15"
            >
              Hoje
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
