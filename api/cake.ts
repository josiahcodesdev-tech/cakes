// Vercel serverless function behind /cake/<slug> (see vercel.json).
// The site is a single-page app, so WhatsApp, Facebook etc. would only ever see the home page's preview.
// This serves the same page but with that cake's name, price and photo in the link-preview tags,
// read live from Supabase so cakes added in the admin page preview correctly straight away.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Cake { name: string; description: string; image: string; base_price: number }

async function findCake(slug: string): Promise<Cake | null> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const res = await fetch(
    `${url}/rest/v1/products?select=name,description,image,base_price&active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!res.ok) return null
  const rows = (await res.json()) as Cake[]
  return rows[0] ?? null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') ?? ''
  const page = await fetch(`${url.origin}/index.html`)
  let html = await page.text()

  const cake = /^[a-z0-9-]{1,120}$/.test(slug) ? await findCake(slug).catch(() => null) : null
  if (cake) {
    const title = `${cake.name} | Crumb & Frost`
    const description = `KES ${cake.base_price.toLocaleString('en-KE')} · ${cake.description}`
    const image = cake.image.replace('w=800', 'w=1200')
    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(description)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Crumb &amp; Frost" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta property="og:url" content="${esc(`${url.origin}/cake/${slug}`)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join('\n    ')
    html = html.replace(/<!--preview-->[\s\S]*?<!--\/preview-->/, `<!--preview-->\n    ${tags}\n    <!--/preview-->`)
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Cached briefly at the edge; edits in the admin page show within a minute.
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
