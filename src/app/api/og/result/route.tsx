import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const minPrice = searchParams.get('min') ?? '0'
    const maxPrice = searchParams.get('max') ?? '0'
    const currency = searchParams.get('currency') ?? 'BRL'
    const projectType = searchParams.get('type') ?? 'Software'

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            padding: '60px',
          }}
        >
          <p style={{ fontSize: '28px', color: '#94a3b8', marginBottom: '16px' }}>
            Orçamento Estimado — Budget Free Engine
          </p>
          <p style={{ fontSize: '72px', fontWeight: 'bold', color: '#38bdf8' }}>
            {currency} {Number(minPrice).toLocaleString()} – {Number(maxPrice).toLocaleString()}
          </p>
          <p style={{ fontSize: '32px', color: '#cbd5e1', marginTop: '16px' }}>
            {projectType}
          </p>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch {
    // Edge runtime: retornar resposta de erro simples em vez de crash
    return new Response('OG image generation failed', { status: 500 })
  }
}
