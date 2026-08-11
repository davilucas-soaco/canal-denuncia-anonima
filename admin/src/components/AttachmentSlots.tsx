import { useEffect, useId, useState } from 'react'
import { Paperclip, Plus, Trash } from '@phosphor-icons/react'
import { formatSize } from '../labels'

const MAX_FILES = 5
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'

type AttachmentSlotsProps = {
  files?: File[]
  onChange: (files: File[]) => void
  error?: string
  title?: string
  hint?: string
}

/** Slots de arquivo: uma caixa por anexo + botão para adicionar mais. */
export function AttachmentSlots({
  files: filesProp,
  onChange,
  error,
  title = 'Anexos',
  hint = `PDF, imagens ou Word. Até ${MAX_FILES} arquivos, 10 MB cada.`,
}: AttachmentSlotsProps) {
  const files = filesProp ?? []
  const baseId = useId()
  const [slotCount, setSlotCount] = useState(() => Math.max(1, files.length))

  useEffect(() => {
    if (files.length > slotCount) {
      setSlotCount(files.length)
    }
  }, [files.length, slotCount])

  const slots = Array.from({ length: slotCount }, (_, i) => files[i] ?? null)

  function commitSlots(nextSlots: (File | null)[]) {
    onChange(nextSlots.filter((f): f is File => Boolean(f)))
  }

  function handlePick(index: number, list: FileList | null) {
    const file = list?.[0]
    if (!file) return
    const next = Array.from({ length: slotCount }, (_, i) => files[i] ?? null)
    next[index] = file
    commitSlots(next)
  }

  function removeSlot(index: number) {
    const next = Array.from({ length: slotCount }, (_, i) => files[i] ?? null)
    next.splice(index, 1)
    commitSlots(next)
    setSlotCount((c) => Math.max(1, c - 1))
  }

  function clearFile(index: number) {
    const next: (File | null)[] = Array.from(
      { length: slotCount },
      (_, i) => files[i] ?? null,
    )
    next[index] = null
    commitSlots(next)
  }

  function addSlot() {
    if (slotCount >= MAX_FILES) return
    setSlotCount((c) => c + 1)
  }

  const canAdd = slotCount < MAX_FILES

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-brand-navy">
          {title}
          <span className="ml-1.5 text-xs font-normal text-brand-gray">(opcional)</span>
        </p>
        <p className="mt-0.5 text-xs text-brand-gray">{hint}</p>
      </div>

      <ul className="space-y-2.5">
        {slots.map((file, index) => {
          const inputId = `${baseId}-slot-${index}`
          return (
            <li key={inputId}>
              <div className="flex items-stretch gap-2">
                <label
                  htmlFor={inputId}
                  className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-navy/20 bg-brand-mist/60 px-4 py-3 transition hover:border-brand-amber/60 hover:bg-brand-amber/5"
                >
                  <Paperclip
                    weight="duotone"
                    className="h-4 w-4 shrink-0 text-brand-blue"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-brand-navy">
                    {file ? (
                      <>
                        <span className="font-bold">{file.name}</span>
                        <span className="ml-2 text-xs text-brand-gray">
                          {formatSize(file.size)}
                        </span>
                      </>
                    ) : (
                      <span className="text-brand-gray">
                        Anexo {index + 1} — clique para selecionar
                      </span>
                    )}
                  </span>
                  <input
                    id={inputId}
                    type="file"
                    className="sr-only"
                    accept={ACCEPT}
                    onChange={(e) => {
                      handlePick(index, e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
                {(slotCount > 1 || file) && (
                  <button
                    type="button"
                    onClick={() =>
                      slotCount === 1 ? clearFile(index) : removeSlot(index)
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-navy/10 px-3 text-brand-gray transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label={file ? `Remover ${file.name}` : `Remover caixa ${index + 1}`}
                  >
                    <Trash weight="bold" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {canAdd && (
        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-navy transition hover:border-brand-amber/50 hover:bg-brand-mist"
        >
          <Plus weight="bold" className="h-4 w-4 text-brand-amber" aria-hidden />
          Adicionar outro anexo
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
