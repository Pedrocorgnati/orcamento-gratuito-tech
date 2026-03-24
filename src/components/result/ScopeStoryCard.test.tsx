import { render, screen } from '@testing-library/react'
import { ScopeStoryCard } from './ScopeStoryCard'

const defaultProps = {
  scopeStory: 'Sistema web completo com autenticação segura.',
  features: ['Autenticação', 'Dashboard', 'Pagamentos'],
  complexity: 'HIGH' as const,
  locale: 'pt-BR',
}

describe('ScopeStoryCard enhanced', () => {
  it('renderiza scope story narrativa', () => {
    render(<ScopeStoryCard {...defaultProps} />)
    expect(screen.getByText(/Sistema web completo/)).toBeInTheDocument()
  })

  it('exibe label de complexidade em pt-BR', () => {
    render(<ScopeStoryCard {...defaultProps} complexity="HIGH" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('exibe label de complexidade em en-US', () => {
    render(<ScopeStoryCard {...defaultProps} complexity="VERY_HIGH" locale="en-US" />)
    expect(screen.getByText('Very High')).toBeInTheDocument()
  })

  it('exibe label de complexidade em es-ES', () => {
    render(<ScopeStoryCard {...defaultProps} complexity="LOW" locale="es-ES" />)
    expect(screen.getByText('Baja')).toBeInTheDocument()
  })

  it('exibe label de complexidade em it-IT', () => {
    render(<ScopeStoryCard {...defaultProps} complexity="MEDIUM" locale="it-IT" />)
    expect(screen.getByText('Media')).toBeInTheDocument()
  })

  it('renderiza todos os itens da lista de features', () => {
    render(<ScopeStoryCard {...defaultProps} />)
    expect(screen.getByText('Autenticação')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Pagamentos')).toBeInTheDocument()
  })

  it('ícones têm aria-hidden=true (acessibilidade)', () => {
    render(<ScopeStoryCard {...defaultProps} />)
    const icons = document.querySelectorAll('[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('renderiza sem features sem erro', () => {
    render(<ScopeStoryCard {...defaultProps} features={[]} />)
    expect(screen.getByText(/Sistema web completo/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('aplica classe feature-item-stagger nos itens da lista', () => {
    render(<ScopeStoryCard {...defaultProps} />)
    const items = document.querySelectorAll('.feature-item-stagger')
    expect(items.length).toBe(3)
  })

  it('complexity desconhecida não causa crash', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<ScopeStoryCard {...defaultProps} complexity={'UNKNOWN' as any} />)
    expect(screen.getByText(/Sistema web completo/)).toBeInTheDocument()
  })

  it('sem complexity: sem badge, sem borda colorida', () => {
    render(<ScopeStoryCard scopeStory="Projeto simples." features={[]} locale="pt-BR" />)
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument()
    expect(screen.getByText(/Projeto simples/)).toBeInTheDocument()
  })
})
