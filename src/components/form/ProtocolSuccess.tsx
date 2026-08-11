import { useState } from 'react'
import {
  CheckCircle,
  Copy,
  Check,
  FilePdf,
  LockKey,
  Warning,
} from '@phosphor-icons/react'
import { downloadProtocolPdf } from '../../utils/protocolPdf'

type ProtocolSuccessProps = {
  protocol: string
  onNewReport: () => void
}

export function ProtocolSuccess({ protocol, onNewReport }: ProtocolSuccessProps) {
  const [copied, setCopied] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(protocol)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function handlePdf() {
    setPdfBusy(true)
    try {
      await downloadProtocolPdf(protocol)
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="animate-fade-up py-4 text-center">
      <div className="mx-auto inline-flex flex-col items-center">
        <img
          src="/logo-soaco-sucesso.png"
          alt="Só Aço — Produzindo com excelência"
          className="mx-auto h-14 w-auto max-w-[240px] object-contain sm:h-16 sm:max-w-[280px]"
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-navy/70">
          SÓ AÇO INDUSTRIAL LTDA
        </p>
      </div>

      <span className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_10px_rgba(16,185,129,0.18)]">
        <CheckCircle weight="fill" className="h-9 w-9" aria-hidden />
      </span>
      <h3 className="mt-5 text-2xl font-bold text-brand-navy">Denúncia registrada</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-gray">
        Guarde o protocolo abaixo. Com ele, a equipe responsável da Só Aço Industrial
        poderá localizar seu relato sem comprometer o anonimato.
      </p>

      <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-emerald-50 px-4 py-5 ring-1 ring-emerald-200">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Protocolo
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-brand-navy">
          {protocol}
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 hover:text-brand-navy"
          >
            {copied ? (
              <>
                <Check weight="bold" className="h-4 w-4" /> Copiado
              </>
            ) : (
              <>
                <Copy weight="duotone" className="h-4 w-4" /> Copiar protocolo
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-blue disabled:opacity-60"
          >
            <FilePdf weight="duotone" className="h-4 w-4" aria-hidden />
            {pdfBusy ? 'Gerando…' : 'Gerar PDF'}
          </button>
        </div>
      </div>

      <div
        role="note"
        className="mx-auto mt-5 flex max-w-md gap-3 rounded-2xl border border-brand-amber/40 bg-brand-amber/10 px-4 py-3.5 text-left"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-amber/20 text-brand-navy">
          <LockKey weight="fill" className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-brand-navy">
            <Warning weight="fill" className="h-4 w-4 text-brand-amber" aria-hidden />
            Código extremamente sigiloso
          </p>
          <p className="mt-1 text-xs leading-relaxed text-brand-charcoal/80">
            Não compartilhe este protocolo com terceiros, não envie por canais inseguros
            e não publique em redes sociais. Guarde-o em local seguro — a divulgação
            indevida pode comprometer a apuração e a sua proteção.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewReport}
        className="mt-8 inline-flex rounded-xl border border-brand-navy/15 px-7 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-mist"
      >
        Nova denúncia
      </button>
    </div>
  )
}
