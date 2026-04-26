import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
}

const CONTENT: Record<string, { title: string; sections: Array<{ h: string; p: string }> }> = {
  'pt-BR': {
    title: 'Termos de Uso',
    sections: [
      { h: '1. Objeto', p: 'Este site oferece um orçamento gratuito e indicativo de projetos de tecnologia, com base nas respostas fornecidas pelo usuário.' },
      { h: '2. Natureza da estimativa', p: 'As faixas de preço e prazo apresentadas são estimativas preliminares não vinculantes e podem variar conforme o detalhamento do escopo.' },
      { h: '3. Privacidade', p: 'O uso dos seus dados pessoais é regido pela nossa Política de Privacidade.' },
      { h: '4. Limitação de responsabilidade', p: 'Não garantimos adequação da estimativa a contratos firmados com terceiros.' },
      { h: '5. Alterações', p: 'Estes termos podem ser atualizados a qualquer momento.' },
    ],
  },
  'en-US': {
    title: 'Terms of Use',
    sections: [
      { h: '1. Purpose', p: 'This site provides a free indicative estimate for technology projects based on user-submitted answers.' },
      { h: '2. Nature of the estimate', p: 'Price and timeline ranges shown are preliminary, non-binding, and may vary as scope is detailed.' },
      { h: '3. Privacy', p: 'Personal data usage is governed by our Privacy Policy.' },
      { h: '4. Liability', p: 'We do not warrant fitness of the estimate for any third-party contract.' },
      { h: '5. Changes', p: 'These terms may be updated at any time.' },
    ],
  },
  'es-ES': {
    title: 'Términos de Uso',
    sections: [
      { h: '1. Objeto', p: 'Este sitio ofrece una estimación gratuita e indicativa de proyectos tecnológicos según las respuestas proporcionadas.' },
      { h: '2. Naturaleza de la estimación', p: 'Los rangos de precio y plazo son preliminares, no vinculantes y pueden variar según el detalle del alcance.' },
      { h: '3. Privacidad', p: 'El uso de tus datos personales se rige por nuestra Política de Privacidad.' },
      { h: '4. Responsabilidad', p: 'No garantizamos la adecuación de la estimación a contratos con terceros.' },
      { h: '5. Cambios', p: 'Estos términos pueden actualizarse en cualquier momento.' },
    ],
  },
  'it-IT': {
    title: "Termini d'Uso",
    sections: [
      { h: '1. Oggetto', p: 'Questo sito fornisce una stima gratuita e indicativa di progetti tecnologici sulla base delle risposte fornite.' },
      { h: '2. Natura della stima', p: 'Le fasce di prezzo e tempo sono preliminari, non vincolanti e possono variare con il dettaglio dello scope.' },
      { h: '3. Privacy', p: "L'uso dei tuoi dati personali è regolato dalla nostra Informativa sulla Privacy." },
      { h: '4. Responsabilità', p: 'Non garantiamo adeguatezza della stima a contratti con terzi.' },
      { h: '5. Modifiche', p: 'Questi termini possono essere aggiornati in qualsiasi momento.' },
    ],
  },
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const content = CONTENT[locale] ?? CONTENT['en-US']!
  return (
    <main data-testid="terms-page" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{content.title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-800">
        {content.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-medium">{s.h}</h2>
            <p className="mt-1">{s.p}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
