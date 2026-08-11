import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { HeroInstitutional } from './components/HeroInstitutional'
import { FollowReport } from './components/FollowReport'
import { EthicsCommitment } from './components/EthicsCommitment'
import { HowItWorks } from './components/HowItWorks'
import { ReportTypes } from './components/ReportTypes'
import { MultiStepForm } from './components/form/MultiStepForm'
import { FaqAccordion } from './components/FaqAccordion'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { LegalPage } from './components/LegalPage'
import type { LegalDocId } from './content/legal'
import type { ReportTypeId } from './types/report'

function legalFromHash(hash: string): LegalDocId | null {
  const id = hash.replace(/^#/, '')
  if (id === 'privacidade' || id === 'termos') return id
  return null
}

export default function App() {
  const [selectedType, setSelectedType] = useState<ReportTypeId | ''>('')
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(() =>
    typeof window !== 'undefined' ? legalFromHash(window.location.hash) : null,
  )

  useEffect(() => {
    function onHashChange() {
      setLegalDoc(legalFromHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleSelectType(typeId: ReportTypeId) {
    setSelectedType(typeId)
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
  }

  function openLegal(docId: LegalDocId) {
    setLegalDoc(docId)
    window.location.hash = docId
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeLegal() {
    setLegalDoc(null)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {legalDoc ? (
          <LegalPage
            docId={legalDoc}
            onBack={closeLegal}
            onOpenLegal={openLegal}
          />
        ) : (
          <>
            <HeroInstitutional />
            <FollowReport />
            <EthicsCommitment />
            <HowItWorks />
            <ReportTypes selectedType={selectedType} onSelect={handleSelectType} />
            <MultiStepForm
              selectedTypeFromLanding={selectedType}
              onTypeChange={setSelectedType}
              onOpenLegal={openLegal}
            />
            <FaqAccordion onOpenLegal={openLegal} />
            <FinalCta />
          </>
        )}
      </main>
      <Footer onOpenLegal={openLegal} />
    </div>
  )
}
