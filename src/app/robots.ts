import { MetadataRoute } from 'next'

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://orcamentogratuito.tech'
  return url.replace(/\/$/, '')
})()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/*/privacy', '/*/flow'],
        disallow: ['/admin', '/*/result', '/*/lead-capture', '/*/thank-you', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
