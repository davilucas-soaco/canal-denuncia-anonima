import { CheckCircle } from '@phosphor-icons/react'
import { cn } from '../../utils/cn'

type SubmitOverlayProps = {
  phase: 'loading' | 'success'
}

export function SubmitOverlay({ phase }: SubmitOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/55 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy={phase === 'loading'}
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-10 text-center shadow-xl">
        {phase === 'loading' ? (
          <>
            <span
              className="h-12 w-12 animate-spin rounded-full border-[3px] border-brand-navy/15 border-t-brand-amber"
              aria-hidden
            />
            <p className="mt-5 text-base font-bold text-brand-navy">Enviando denúncia…</p>
            <p className="mt-1.5 text-sm text-brand-gray">Aguarde enquanto geramos o protocolo.</p>
          </>
        ) : (
          <>
            <span
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white',
                'animate-fade-up shadow-[0_0_0_8px_rgba(16,185,129,0.2)]',
              )}
            >
              <CheckCircle weight="fill" className="h-8 w-8" aria-hidden />
            </span>
            <p className="mt-5 text-base font-bold text-emerald-700">Denúncia enviada com sucesso</p>
            <p className="mt-1.5 text-sm text-brand-gray">Preparando o número do protocolo…</p>
          </>
        )}
      </div>
    </div>
  )
}
