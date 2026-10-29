// Vercel serverless function: sends M-Pesa STK push prompts through PayHero and reports their status.
// The PayHero keys live only in Vercel's environment variables, never in the website code:
//   PAYHERO_AUTH_TOKEN   the "Basic ..." token from the PayHero dashboard
//   PAYHERO_CHANNEL_ID   your payment channel ID (PayHero → Payment Channels → My Payment Channels)
//   ADMIN_PASSWORD       password for the private /admin/payments page
//
// POST /api/payhero  { phone, amount, name?, reference? }            → client paying at checkout
// POST /api/payhero  same, plus header "x-admin-password"            → shop owner sending a prompt
// GET  /api/payhero?reference=...                                     → payment status

const PAYHERO = 'https://backend.payhero.co.ke/api/v2'
// Checkout payments are capped so the public endpoint can't be used for huge requests.
const MAX_CHECKOUT = 150_000
const MAX_ADMIN = 500_000

const json = (body: unknown, status = 200) => Response.json(body, { status })

function config() {
  const token = process.env.PAYHERO_AUTH_TOKEN?.trim()
  const channel = Number(process.env.PAYHERO_CHANNEL_ID)
  if (!token || !channel) return null
  return { auth: token.startsWith('Basic ') ? token : `Basic ${token}`, channel }
}

/** Accepts 07.., 01.., 7.., +2547.., 2547.. and returns the 07XXXXXXXX form PayHero expects, or null. */
function normalizePhone(raw: unknown) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  const local = digits.replace(/^254/, '').replace(/^0/, '')
  return /^[17]\d{8}$/.test(local) ? `0${local}` : null
}

const clean = (s: unknown, max: number) => String(s ?? '').replace(/[^\w .,'&#/-]/g, '').trim().slice(0, max)

export async function POST(request: Request) {
  const cfg = config()
  if (!cfg) return json({ error: 'M-Pesa payments are not set up yet.' }, 503)

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return json({ error: 'Invalid request.' }, 400)

  const adminHeader = request.headers.get('x-admin-password')
  const isAdmin = adminHeader !== null
  if (isAdmin && (!process.env.ADMIN_PASSWORD || adminHeader !== process.env.ADMIN_PASSWORD)) {
    return json({ error: 'Wrong password.' }, 401)
  }

  const phone = normalizePhone(body.phone)
  if (!phone) return json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' }, 400)

  const amount = Math.round(Number(body.amount))
  const max = isAdmin ? MAX_ADMIN : MAX_CHECKOUT
  if (!Number.isFinite(amount) || amount < 1 || amount > max) {
    return json({ error: `Amount must be between KES 1 and KES ${max.toLocaleString()}.` }, 400)
  }

  const res = await fetch(`${PAYHERO}/payments`, {
    method: 'POST',
    headers: { Authorization: cfg.auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      phone_number: phone,
      channel_id: cfg.channel,
      provider: 'm-pesa',
      external_reference: clean(body.reference, 40) || `${isAdmin ? 'MANUAL' : 'ORDER'}-${Date.now()}`,
      customer_name: clean(body.name, 60) || undefined,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; reference?: string; error_message?: string; message?: string }

  if (!res.ok || !data.success || !data.reference) {
    console.error('PayHero STK push failed', res.status, data)
    return json({ error: data.error_message || data.message || 'Could not send the M-Pesa prompt. Please try again.' }, 502)
  }
  return json({ reference: data.reference })
}

export async function GET(request: Request) {
  const cfg = config()
  if (!cfg) return json({ error: 'M-Pesa payments are not set up yet.' }, 503)

  const reference = new URL(request.url).searchParams.get('reference')?.trim()
  if (!reference || !/^[\w-]{4,64}$/.test(reference)) return json({ error: 'Missing reference.' }, 400)

  const res = await fetch(`${PAYHERO}/transaction-status?reference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: cfg.auth },
  })
  const data = (await res.json().catch(() => ({}))) as { status?: string; provider_reference?: string }
  if (!res.ok) return json({ status: 'QUEUED' })

  // Only what the page needs: QUEUED, SUCCESS or FAILED, and the M-Pesa code once paid.
  return json({ status: data.status ?? 'QUEUED', mpesaCode: data.status === 'SUCCESS' ? data.provider_reference : undefined })
}
