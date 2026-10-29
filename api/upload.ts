// Vercel serverless function: stores a photo a client attaches to a custom cake request.
// POST /api/upload with the image as the body (Content-Type image/jpeg, image/png or image/webp)
// → { url } of the stored photo, which goes into the WhatsApp message and the admin order.
//
// Uses SUPABASE_SERVICE_ROLE_KEY (already set for payments), so clients never get write access to
// storage themselves. The "reference-photos" folder is created on first use.

const BUCKET = 'reference-photos'
const MAX_BYTES = 4 * 1024 * 1024 // Vercel's request limit is ~4.5 MB; the site shrinks photos well below this
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const json = (body: unknown, status = 200) => Response.json(body, { status })

// Real images start with these bytes; anything else is refused even if it claims to be an image.
function looksLikeImage(bytes: Uint8Array) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return jpeg || png || webp
}

export async function POST(request: Request) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Photo uploads are not set up yet.' }, 503)

  const type = request.headers.get('content-type')?.split(';')[0].trim() ?? ''
  const ext = TYPES[type]
  if (!ext) return json({ error: 'Please choose a JPG, PNG or WebP photo.' }, 415)

  const bytes = new Uint8Array(await request.arrayBuffer())
  if (!bytes.length || bytes.length > MAX_BYTES) return json({ error: 'That photo is too big (max 4 MB).' }, 413)
  if (!looksLikeImage(bytes)) return json({ error: 'That file isn’t a photo.' }, 415)

  const auth = { apikey: key, Authorization: `Bearer ${key}` }
  const name = `${crypto.randomUUID()}.${ext}`
  const put = () =>
    fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, { method: 'POST', headers: { ...auth, 'Content-Type': type }, body: bytes })

  let res = await put()
  if (res.status === 404 || res.status === 400) {
    // First upload ever: create the public, images-only folder, then try again.
    await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: Object.keys(TYPES) }),
    })
    res = await put()
  }
  if (!res.ok) {
    console.error('Photo upload failed', res.status, await res.text().catch(() => ''))
    return json({ error: 'Upload failed. Please try again.' }, 502)
  }
  return json({ url: `${url}/storage/v1/object/public/${BUCKET}/${name}` })
}
