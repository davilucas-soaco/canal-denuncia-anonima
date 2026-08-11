export const STATUS_LABELS: Record<string, string> = {
  recebida: 'Pendente',
  em_analise: 'Em análise',
  aguardando_complemento: 'Aguardando complemento',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
  descartada: 'Descartada (má-fé)',
}

export const STATUS_STYLES: Record<string, string> = {
  recebida: 'bg-amber-50 text-amber-900 ring-amber-200',
  em_analise: 'bg-sky-50 text-sky-800 ring-sky-200',
  aguardando_complemento: 'bg-orange-50 text-orange-900 ring-orange-200',
  concluida: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  arquivada: 'bg-slate-100 text-slate-600 ring-slate-200',
  descartada: 'bg-red-50 text-red-800 ring-red-200',
}

/** Status disponíveis após a triagem inicial */
export const WORKFLOW_STATUS_OPTIONS = [
  'em_analise',
  'aguardando_complemento',
  'concluida',
  'arquivada',
  'descartada',
] as const

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS)

export type InboxTab = 'pendencias' | 'andamento' | 'arquivo' | 'todas'

export const INBOX_TABS: { id: InboxTab; label: string }[] = [
  { id: 'pendencias', label: 'Pendências' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'arquivo', label: 'Arquivo' },
  { id: 'todas', label: 'Todas' },
]

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}
