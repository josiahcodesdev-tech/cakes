import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
// Explicit .ts extensions: Vite loads this file with Node's own TypeScript support.
import { products } from './src/data/products.ts'
import { site } from './src/config.ts'

// Public address of the site, used for absolute links in link previews. Vercel sets the second one.
const siteUrl = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const title = `${site.name} Bakery | Cakes Delivered in Nairobi`
const description = 'Freshly baked celebration cakes, cupcakes and custom designs delivered across Nairobi.'

/**
 * The site-wide link preview (title, description, photo) in index.html. Each cake's own preview is
 * swapped in per request by api/cake.ts, which replaces this same <!--preview--> block.
 */
function linkPreview(): Plugin {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(products[0].image)}" />`,
    siteUrl && `<meta property="og:url" content="${esc(`${siteUrl}/`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].filter(Boolean).join('\n    ')
  return {
    name: 'link-preview',
    transformIndexHtml: (html) => html.replace(/<!--preview-->[\s\S]*?<!--\/preview-->/, `<!--preview-->\n    ${tags}\n    <!--/preview-->`),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), linkPreview()],
})
