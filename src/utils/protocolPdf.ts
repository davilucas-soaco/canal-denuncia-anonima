import { jsPDF } from 'jspdf'

const COMPANY_NAME = 'SÓ AÇO INDUSTRIAL LTDA'
const CHANNEL_NAME = 'Canal de Denúncias Anônimas'

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logo-soaco.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Gera e baixa um PDF comprovante com o número do protocolo. */
export async function downloadProtocolPdf(
  protocol: string,
  submittedAt = new Date(),
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 22
  const contentWidth = pageWidth - margin * 2
  const dateLabel = submittedAt.toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const logoDataUrl = await loadLogoDataUrl()

  // Cabeçalho
  const headerH = 48
  doc.setFillColor(4, 30, 66)
  doc.rect(0, 0, pageWidth, headerH, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 8, 48, 22)
  } else {
    doc.setTextColor(255, 173, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('SÓ AÇO', margin, 18)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(COMPANY_NAME, margin, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 173, 0)
  doc.text(`${CHANNEL_NAME} — Comprovante de protocolo`, margin, 43)

  // Corpo
  let y = headerH + 16
  doc.setTextColor(46, 45, 44)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Sua denúncia foi registrada com sucesso.', margin, y)

  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  const intro = doc.splitTextToSize(
    'Guarde este documento em local seguro. Com o protocolo abaixo, a equipe responsável poderá localizar seu relato sem comprometer o anonimato.',
    contentWidth,
  )
  doc.text(intro, margin, y)
  y += intro.length * 5 + 8

  // Caixa do protocolo
  const boxH = 40
  doc.setDrawColor(16, 185, 129)
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(margin, y, contentWidth, boxH, 3, 3, 'FD')

  doc.setTextColor(4, 120, 87)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('PROTOCOLO', pageWidth / 2, y + 12, { align: 'center' })

  doc.setTextColor(4, 30, 66)
  doc.setFontSize(22)
  doc.text(protocol, pageWidth / 2, y + 27, { align: 'center' })

  y += boxH + 10

  // Aviso de sigilo
  const warningLines = doc.splitTextToSize(
    'ATENÇÃO: este código é extremamente sigiloso. Não compartilhe com terceiros, não envie por canais inseguros e não publique em redes sociais. Somente pessoas autorizadas pela Só Aço devem ter acesso a ele. A divulgação indevida pode comprometer a apuração e a sua segurança.',
    contentWidth - 10,
  )
  const warningH = warningLines.length * 4.6 + 14
  doc.setDrawColor(255, 173, 0)
  doc.setFillColor(255, 248, 230)
  doc.roundedRect(margin, y, contentWidth, warningH, 3, 3, 'FD')

  doc.setTextColor(146, 64, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Sigilo obrigatório', margin + 5, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(92, 55, 10)
  doc.text(warningLines, margin + 5, y + 15)

  y += warningH + 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text(`Registrado em: ${dateLabel}`, margin, y)

  y += 7
  doc.text(`${COMPANY_NAME} — ${CHANNEL_NAME}`, margin, y)

  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(
    'Este comprovante não substitui a apuração do caso. Documento de uso exclusivo do denunciante.',
    margin,
    285,
    { maxWidth: contentWidth },
  )

  doc.save(`protocolo-${protocol}.pdf`)
}
