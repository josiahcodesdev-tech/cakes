// Vercel serverless function behind /p/<name> (see vercel.json): serves a client's reference photo
// from our own domain, so links in WhatsApp messages don't show the storage provider's address.

const BUCKET = 'reference-photos'

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') ?? ''
  // Only the random names api/upload.ts creates.
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return new Response('Not found', { status: 404 })

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
  if (!url) return new Response('Not found', { status: 404 })

  const res = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${name}`)
  if (!res.ok || !res.body) return new Response('Not found', { status: 404 })

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      // Photos never change once uploaded, so browsers and Vercel's edge can keep them.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
