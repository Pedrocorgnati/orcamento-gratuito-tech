/**
 * Lighthouse CI Configuration — Budget Free Engine
 * INT-116: <1s por interação, <200ms transição
 * INT-119: Acessibilidade WCAG AA
 * FEAT-UX-004: SEO
 *
 * Executar: npm run lighthouse
 * Requer: npm install --save-dev @lhci/cli
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/pt-BR',
        'http://localhost:3000/pt-BR/flow',
        'http://localhost:3000/pt-BR/privacy',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      settings: {
        preset: 'desktop', // medir desktop primeiro
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Performance (INT-116)
        'categories:performance': ['error', { minScore: 0.9 }],
        // Accessibility (INT-119)
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }],
        // SEO (FEAT-UX-004)
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals (INT-116)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],        // TBT proxy para INP
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // CLS < 0.1

        // Imagens
        'uses-optimized-images': ['warn', {}],
        'uses-webp-images': ['warn', {}],
        'image-alt': ['error', {}],

        // JavaScript
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],       // < 100kb JS não usados

        // Cache
        'uses-long-cache-ttl': ['warn', {}],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Para CI — sem servidor LHCI
    },
  },
}
