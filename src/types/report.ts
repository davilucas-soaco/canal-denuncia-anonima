export const REPORT_TYPES = [
  {
    id: 'fraude',
    label: 'Fraude, corrupção e lavagem de dinheiro',
    description:
      'Desvio de recursos, suborno, propinas, falsificação de documentos, manipulação de registros contábeis, lavagem de dinheiro e demais irregularidades financeiras — inclusive condutas tipificadas na Lei Anticorrupção Brasileira (Lei nº 12.846/2013, “Lei da Empresa Limpa”).',
    shortDescription: 'Desvio de recursos, suborno ou irregularidades financeiras.',
    examples: [
      'Corrupção, suborno, propina ou pagamentos de facilitação',
      'Fraudes em licitação, propostas ou contratos',
      'Fraudes contábeis ou irregularidades em demonstrações financeiras',
      'Lavagem de dinheiro ou ocultação de recursos',
      'Relação indevida com agentes públicos',
    ],
  },
  {
    id: 'conflito_interesses',
    label: 'Conflito de interesses',
    description:
      'Situações em que interesses pessoais, familiares ou de terceiros conflitam com os da Só Aço — como favores indevidos, negócios paralelos, decisões enviesadas ou descumprimento de normas e procedimentos internos.',
    shortDescription: 'Interesse pessoal em conflito com o da empresa.',
    examples: [
      'Favorecimento de fornecedores, clientes ou parceiros',
      'Negócios paralelos que concorram com a empresa',
      'Nepotismo ou relacionamento afetivo com subordinação direta',
      'Concessão ou recebimento indevido de brindes, doações ou patrocínios',
      'Dano à imagem ou reputação da empresa por interesse próprio',
    ],
  },
  {
    id: 'assedio_moral',
    label: 'Assédio moral',
    description:
      'Humilhação, intimidação, isolamento, perseguição ou pressão indevida e reiterada no ambiente de trabalho, por superiores, colegas ou terceiros — condutas que prejudicam a dignidade e o clima organizacional.',
    shortDescription: 'Humilhação, intimidação ou pressão indevida.',
    examples: [
      'Humilhação pública, gritos ou exposição constrangedora',
      'Isolamento, exclusão deliberada ou sabotagem do trabalho',
      'Perseguição, ameaças ou pressão abusiva de liderança',
      'Gestão inadequada com abuso de poder ou desrespeito reiterado',
      'Intriga, briga ou clima tóxico que configure assédio',
    ],
  },
  {
    id: 'assedio_sexual',
    label: 'Assédio sexual',
    description:
      'Condutas de natureza sexual indesejadas, constrangedoras ou coercitivas — incluindo comentários, propostas, gestos ou toques sem consentimento no ambiente de trabalho ou em contexto profissional.',
    shortDescription: 'Conduta sexual indesejada ou constrangedora.',
    examples: [
      'Propostas, cantadas ou comentários sexuais indesejados',
      'Toques, gestos ou aproximação física sem consentimento',
      'Exposição a conteúdo sexual no ambiente de trabalho',
      'Coerção sexual vinculada a promoções, benefícios ou ameaças',
    ],
  },
  {
    id: 'discriminacao',
    label: 'Discriminação',
    description:
      'Tratamento desigual, exclusão ou preconceito por gênero, raça, religião, orientação sexual, deficiência, idade ou outras características pessoais — inclusive discriminação salarial e desrespeito à diversidade.',
    shortDescription: 'Tratamento desigual por características pessoais.',
    examples: [
      'Racismo, preconceito ou desrespeito à diversidade',
      'Exclusão ou tratamento desigual por gênero, idade ou deficiência',
      'Discriminação salarial (Lei nº 14.611) ou em oportunidades',
      'Barreiras injustas em seleção, promoção ou avaliação',
    ],
  },
  {
    id: 'seguranca_trabalho',
    label: 'Segurança, meio ambiente e saúde',
    description:
      'Riscos ocupacionais, condições inseguras, acidentes, impactos ambientais ou descumprimento de normas de segurança, meio ambiente e saúde (SMS), inclusive leis ambientais e requisitos de órgãos reguladores do segmento.',
    shortDescription: 'Riscos, condições inseguras ou normas de SMS.',
    examples: [
      'Riscos, acidentes, insalubridade ou periculosidade não tratados',
      'Falta de EPIs ou descumprimento de procedimentos de segurança',
      'Impactos ambientais ou descumprimento de leis ambientais',
      'Irregularidades em CIPA, saúde ocupacional ou requisitos legais de SMS',
    ],
  },
  {
    id: 'uso_indevido',
    label: 'Uso indevido de bens, dados ou informações',
    description:
      'Uso indevido de bens, equipamentos, serviços, sistemas, dados pessoais ou informações confidenciais da empresa — inclusive vazamento, apropriação indevida, destruição de ativos ou roubo de propriedade intelectual.',
    shortDescription: 'Bens, dados ou informações da empresa.',
    examples: [
      'Roubo ou desvio de bens, matéria-prima, produtos ou dinheiro',
      'Apropriação indevida de materiais ou equipamentos da empresa',
      'Vazamento de informações confidenciais ou segredo industrial',
      'Uso indevido de sistemas, mídia eletrônica ou recursos da empresa',
      'Destruição ou danificação deliberada de bens da Só Aço',
    ],
  },
  {
    id: 'outro',
    label: 'Outras irregularidades',
    description:
      'Qualquer outra conduta que viole o código de ética, políticas internas, procedimentos da empresa ou a legislação vigente — inclusive irregularidades trabalhistas, sindicais, tributárias, societárias ou retaliação contra denunciantes.',
    shortDescription: 'Condutas que violem ética, políticas ou a lei.',
    examples: [
      'Retaliação contra quem denunciou de boa-fé',
      'Irregularidades trabalhistas graves (além de dúvidas rotineiras de RH)',
      'Trabalho em condições análogas à escravidão ou mão de obra infantil',
      'Descumprimento de leis tributárias, societárias ou regulamentos do segmento',
      'Outras ilegalidades contra a administração pública ou a integridade da empresa',
    ],
  },
] as const

export type ReportTypeId = (typeof REPORT_TYPES)[number]['id']

export type ReportIdentification = {
  name?: string
  email?: string
  phone?: string
}

export type ReportFormData = {
  type: ReportTypeId | ''
  whatHappened: string
  whoInvolved: string
  occurredAt: string
  location: string
  contextDetails: string
  freeReport: string
  attachments: File[]
  isAnonymous: boolean
  identification: ReportIdentification
}

export type ReportPayload = {
  type: ReportTypeId
  description: string
  occurredAt: string
  location: string
  involved?: string
  identification?: ReportIdentification | null
  attachments: File[]
}

export type SubmitReportResponse = {
  protocol: string
  submittedAt: string
}
