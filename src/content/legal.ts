export type LegalDocId = 'privacidade' | 'termos'

export type LegalDoc = {
  id: LegalDocId
  title: string
  updatedAt: string
  sections: { heading: string; paragraphs: string[] }[]
}

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  privacidade: {
    id: 'privacidade',
    title: 'Política de Privacidade',
    updatedAt: '07/08/2026',
    sections: [
      {
        heading: '1. Quem somos',
        paragraphs: [
          'Esta Política de Privacidade descreve como a Só Aço Industrial (“Só Aço”, “nós”) trata dados pessoais no Canal de Denúncias Anônimas, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis.',
          'Controladora: Só Aço Industrial. Para assuntos de privacidade, utilize o contato do encarregado indicado no final deste documento.',
        ],
      },
      {
        heading: '2. Escopo',
        paragraphs: [
          'Esta política aplica-se exclusivamente ao uso deste Canal de Denúncias (site), incluindo o formulário de relato, a consulta de protocolo e conteúdos institucionais relacionados.',
          'Este canal não deve ser utilizado para dúvidas comerciais, suporte ao cliente, reclamações de atendimento ou assuntos fora do escopo de denúncias éticas e de integridade — inclusive dúvidas rotineiras de RH sem indício de irregularidade.',
        ],
      },
      {
        heading: '3. Dados que podemos coletar',
        paragraphs: [
          'Dependendo do que você informar, podemos tratar: tipo e descrição do relato; data e local aproximados; nomes ou informações de pessoas envolvidas; arquivos anexos (imagens, PDF ou documentos); e, se você optar por se identificar, nome, e-mail e telefone.',
          'No modo anônimo (padrão), não solicitamos dados de identificação. Mesmo assim, o conteúdo do relato ou anexos pode conter dados pessoais seus ou de terceiros.',
          'Não utilizamos login. O envio é feito sem cookies de sessão. Atualmente não empregamos cookies de marketing ou ferramentas de analytics de terceiros neste site. Se isso mudar, esta política será atualizada.',
        ],
      },
      {
        heading: '4. Finalidades e bases legais',
        paragraphs: [
          'Tratamos os dados para receber, registrar, apurar e responder denúncias de boa-fé; gerar e gerenciar protocolo de acompanhamento; complementar informações do caso; cumprir obrigações legais e regulatórias; e proteger direitos da Só Aço e de terceiros.',
          'As bases legais aplicáveis podem incluir cumprimento de obrigação legal ou regulatória, legítimo interesse (integridade e ambiente seguro de trabalho) e, quando você fornecer contato voluntariamente, consentimento ou legítimo interesse para esclarecimentos do caso — conforme avaliação jurídica da controladora.',
        ],
      },
      {
        heading: '5. Anonimato, sigilo e compartilhamento',
        paragraphs: [
          'O Canal prioriza o sigilo e a confidencialidade. Relatos são acessados apenas por pessoas autorizadas à apuração.',
          'Podemos compartilhar dados com prestadores que atuem como operadores (por exemplo, hospedagem ou plataforma de canal), sempre sob contrato e medidas de segurança adequadas, e com autoridades quando houver obrigação legal.',
          'Os fatos relatados e dados pessoais eventualmente coletados podem, quando necessário, ser conhecidos por partes relacionadas à denúncia (pessoa denunciada, testemunhas, equipe de apuração e gestores ligados ao tratamento), priorizando anonimização ou pseudonimização sempre que possível.',
          'A Só Aço não tolera retaliação contra quem denuncia de boa-fé.',
        ],
      },
      {
        heading: '6. Retenção',
        paragraphs: [
          'Os relatos e anexos são mantidos pelo tempo necessário à apuração, ao cumprimento de obrigações legais e à defesa de direitos. Após esse período, os dados podem ser eliminados, anonimizados ou arquivados conforme política interna e exigência legal.',
        ],
      },
      {
        heading: '7. Segurança',
        paragraphs: [
          'Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou alteração indevida. Nenhum sistema é absolutamente seguro; se identificar um incidente, entre em contato pelos canais abaixo.',
        ],
      },
      {
        heading: '8. Direitos do titular (LGPD)',
        paragraphs: [
          'Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários, informação sobre compartilhamentos, portabilidade (quando aplicável), revogação de consentimento e revisão de decisões automatizadas, nos termos da LGPD.',
          'No modo anônimo, a identificação do titular pode ser limitada. Guarde o protocolo para facilitar a localização do relato sem comprometer o anonimato.',
        ],
      },
      {
        heading: '9. Dados de menores',
        paragraphs: [
          'Este canal não é destinado à coleta deliberada de dados de crianças e adolescentes. Se um relato envolver menores, o tratamento observará as salvaguardas legais cabíveis.',
        ],
      },
      {
        heading: '10. Contato do encarregado (DPO)',
        paragraphs: [
          'Para exercer direitos ou esclarecer dúvidas sobre privacidade: privacidade@soaco.com.br',
        ],
      },
      {
        heading: '11. Atualizações',
        paragraphs: [
          'Esta política pode ser atualizada periodicamente. A data da última atualização consta no topo da página. O uso contínuo do Canal após alterações relevantes implica ciência da versão vigente, quando aplicável.',
        ],
      },
    ],
  },
  termos: {
    id: 'termos',
    title: 'Termos do Canal de Denúncia',
    updatedAt: '07/08/2026',
    sections: [
      {
        heading: '1. Objeto',
        paragraphs: [
          'Estes Termos regulam o uso do Canal de Denúncias Anônimas da Só Aço Industrial, destinado ao registro de relatos sobre condutas irregulares, violações éticas, assédio, discriminação, fraude, corrupção e lavagem de dinheiro (inclusive condutas previstas na Lei Anticorrupção Brasileira — Lei nº 12.846/2013), conflito de interesses, segurança, meio ambiente e saúde, uso indevido de bens ou dados, retaliação e outras irregularidades relacionadas à empresa.',
        ],
      },
      {
        heading: '2. Aceitação',
        paragraphs: [
          'Ao acessar o Canal ou enviar um relato, você declara ter lido e compreendido estes Termos e a Política de Privacidade. Se não concordar, não utilize o Canal.',
        ],
      },
      {
        heading: '3. Uso adequado',
        paragraphs: [
          'Utilize o Canal para denúncias relacionadas a ética, integridade e irregularidades. Não utilize para reclamações comerciais, pedidos de suporte, spam, conteúdo ilícito, ofensas sem relação com o objeto do relato ou dúvidas rotineiras de RH sem indício de irregularidade.',
          'A Só Aço valoriza relatos responsáveis e não tolera retaliação contra quem denuncia irregularidades de boa-fé.',
        ],
      },
      {
        heading: '4. Anonimato e identificação',
        paragraphs: [
          'O modo anônimo é o padrão. Você pode, opcionalmente, informar contato para esclarecimentos. A escolha de se identificar não é obrigatória para o envio.',
          'O protocolo gerado após o envio permite acompanhar e complementar o relato. Guarde-o em local seguro.',
        ],
      },
      {
        heading: '5. Conteúdo do relato e anexos',
        paragraphs: [
          'Forneça informações verdadeiras e o mais completas possível: o quê, quem, quando, onde, por quê, quanto (quando aplicável) e provas. Anexos devem ser pertinentes ao caso e não devem violar direitos de terceiros de forma ilícita.',
          'A Só Aço poderá rejeitar, arquivar ou encaminhar relatos fora do escopo, incompletos ou incompatíveis com estes Termos.',
        ],
      },
      {
        heading: '6. Apuração',
        paragraphs: [
          'O recebimento do relato não implica reconhecimento prévio de irregularidade. A apuração seguirá procedimentos internos com sigilo, imparcialidade e confidencialidade, na medida do possível e do legítimo.',
          'Prazos e forma de retorno dependem da complexidade do caso e das informações disponíveis.',
        ],
      },
      {
        heading: '7. Disponibilidade do serviço',
        paragraphs: [
          'O Canal é oferecido “como disponível”. Podem ocorrer interrupções por manutenção, falhas técnicas ou fatores externos. A Só Aço não garante disponibilidade ininterrupta.',
        ],
      },
      {
        heading: '8. Propriedade intelectual',
        paragraphs: [
          'Marcas, layout, textos e demais elementos do site são de titularidade da Só Aço ou de licenciantes. É vedada a reprodução não autorizada para fins comerciais.',
        ],
      },
      {
        heading: '9. Limitação',
        paragraphs: [
          'Na máxima extensão permitida pela lei, a Só Aço não se responsabiliza por danos decorrentes do uso indevido do Canal ou de indisponibilidade temporária do serviço, ressalvadas hipóteses legais inafastáveis.',
        ],
      },
      {
        heading: '10. Alterações e foro',
        paragraphs: [
          'Estes Termos podem ser alterados a qualquer momento, com publicação da versão atualizada nesta página.',
          'Fica eleito o foro da comarca da sede da Só Aço Industrial, salvo disposição legal em contrário em favor do usuário.',
        ],
      },
    ],
  },
}
