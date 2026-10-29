import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
// Explicit .ts extensions: Vite loads this file with Node's own TypeScript support.
import { getCategory, products } from './src/data/products.ts'
import { site } from './src/config.ts'

const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`

// Public address of the site, used for absolute links in link previews. Vercel sets the second one.
const siteUrl = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Preview { title: string; description: string; image: string; path: string }

const previewTags = ({ title, description, image, path }: Preview) =>
  [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    siteUrl && `<meta property="og:url" content="${esc(siteUrl + path)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].filter(Boolean).join('\n    ')

const homePreview: Preview = {
  title: `${site.name} Bakery | Cakes Delivered in Nairobi`,
  description: 'Freshly baked celebration cakes, cupcakes and custom designs delivered across Nairobi.',
  image: products[0].image,
  path: '/',
}

/**
 * Link previews for shared links. The site is a single-page app, so WhatsApp, Facebook etc. only ever
 * see index.html. This writes a copy of it for every cake (dist/cake/<slug>/index.html) carrying that
 * cake's name, price and photo, so a shared cake link shows the right cake.
 */
function linkPreviews(): Plugin {
  const block = /<!--preview-->[\s\S]*?<!--\/preview-->/
  let outDir = 'dist'
  return {
    name: 'link-previews',
    configResolved: (config) => { outDir = resolve(config.root, config.build.outDir) },
    transformIndexHtml: (html) => html.replace(block, `<!--preview-->\n    ${previewTags(homePreview)}\n    <!--/preview-->`),
    // Runs once the built index.html is on disk.
    closeBundle() {
      let html: string
      try { html = readFileSync(resolve(outDir, 'index.html'), 'utf8') } catch { return }
      for (const p of products) {
        const tags = previewTags({
          title: `${p.name} | ${site.name}`,
          description: `${formatKES(p.basePrice)} · ${getCategory(p.category)?.name ?? 'Cake'} · ${p.description}`,
          image: p.image.replace('w=800', 'w=1200'),
          path: `/cake/${p.slug}`,
        })
        const file = resolve(outDir, 'cake', p.slug, 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html.replace(block, `<!--preview-->\n    ${tags}\n    <!--/preview-->`))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), linkPreviews()],
})
