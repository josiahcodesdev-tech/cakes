// Vercel serverless function: sends M-Pesa STK push prompts through PayHero, reports their status,
// and records payments against orders in Supabase.
// Secrets live only in Vercel's environment variables, never in the website code:
//   PAYHERO_AUTH_TOKEN          the "Basic ..." token from the PayHero dashboard
//   PAYHERO_CHANNEL_ID          your payment channel ID (PayHero → Payment Channels → My Payment Channels)
//   SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API keys → service_role (secret)
//   VITE_SUPABASE_URL           Supabase project URL (also used by the website)
//
// POST /api/payhero  { phone, amount, name?, orderId? }                        → client paying at checkout
// POST /api/payhero  same plus { reference? }, "Authorization: Bearer <login>"  → admin requesting a payment
// GET  /api/payhero?reference=...                                              → payment status (marks the order paid)
// POST /api/payhero?callback=1                                                 → PayHero's callback when a payment finishes

const PAYHERO = 'https://backend.payhero.co.ke/api/v2'
// Checkout payments are capped so the public endpoint can't be used for huge requests.
const MAX_CHECKOUT = 150_000
const MAX_ADMIN = 500_000

const json = (body: unknown, status = 200) => Response.json(body, { status })

function payhero() {
  const token = process.env.PAYHERO_AUTH_TOKEN?.trim()
  const channel = Number(process.env.PAYHERO_CHANNEL_ID)
  if (!token || !channel) return null
  return { auth: token.startsWith('Basic ') ? token : `Basic ${token}`, channel }
}

// ---- Supabase (optional: without it, payments still work but aren't recorded) ----

const dbUrl = () => (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
const dbKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY

async function db<T = unknown>(path: string, init: RequestInit = {}): Promise<T | null> {
  const url = dbUrl()
  const key = dbKey()
  if (!url || !key) return null
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...init.headers },
  })
  if (!res.ok) {
    console.error('Supabase request failed', path, res.status, await res.text().catch(() => ''))
    return null
  }
  return (await res.json().catch(() => null)) as T | null
}

/** The logged-in admin's email, or null if the token isn't a valid admin login. */
async function adminEmail(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = dbUrl()
  const key = dbKey()
  if (!token || !url || !key) return null
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const user = (await res.json()) as { email?: string }
  if (!user.email) return null
  const rows = await db<{ email: string }[]>(`admins?select=email&email=ilike.${encodeURIComponent(user.email)}`)
  return rows?.length ? user.email : null
}

const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s)

/** Accepts 07.., 01.., 7.., +2547.., 2547.. and returns the 07XXXXXXXX form PayHero expects, or null. */
function normalizePhone(raw: unknown) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  const local = digits.replace(/^254/, '').replace(/^0/, '')
  return /^[17]\d{8}$/.test(local) ? `0${local}` : null
}

const clean = (s: unknown, max: number) => String(s ?? '').replace(/[^\w .,'&#/-]/g, '').trim().slice(0, max)

export async function POST(request: Request) {
  const cfg = payhero()
  if (!cfg) return json({ error: 'M-Pesa payments are not set up yet.' }, 503)
  if (new URL(request.url).searchParams.has('callback')) return callback(request, cfg)

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return json({ error: 'Invalid request.' }, 400)

  const isAdmin = request.headers.has('authorization')
  if (isAdmin && !(await adminEmail(request))) return json({ error: 'Please log in again.' }, 401)

  const phone = normalizePhone(body.phone)
  if (!phone) return json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' }, 400)

  const amount = Math.round(Number(body.amount))
  const max = isAdmin ? MAX_ADMIN : MAX_CHECKOUT
  if (!Number.isFinite(amount) || amount < 1 || amount > max) {
    return json({ error: `Amount must be between KES 1 and KES ${max.toLocaleString()}.` }, 400)
  }

  const name = clean(body.name, 60)
  let orderId = isUuid(body.orderId) ? body.orderId : null
  // A payment the admin requests without an existing order gets recorded as a new "manual" order.
  if (isAdmin && !orderId) {
    const created = await db<{ id: string }[]>('orders', {
      method: 'POST',
      body: JSON.stringify({ kind: 'manual', customer_name: name, phone, total: amount, subtotal: amount, notes: clean(body.reference, 80) || null }),
    })
    orderId = created?.[0]?.id ?? null
  }

  const res = await fetch(`${PAYHERO}/payments`, {
    method: 'POST',
    headers: { Authorization: cfg.auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      phone_number: phone,
      channel_id: cfg.channel,
      provider: 'm-pesa',
      external_reference: orderId ?? `ORDER-${Date.now()}`,
      customer_name: name || undefined,
      // PayHero calls this when the client pays or cancels, so the order is updated even if they close the page.
      callback_url: `${new URL(request.url).origin}/api/payhero?callback=1`,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; reference?: string; error_message?: string; message?: string }

  if (!res.ok || !data.success || !data.reference) {
    console.error('PayHero STK push failed', res.status, data)
    return json({ error: data.error_message || data.message || 'Could not send the M-Pesa prompt. Please try again.' }, 502)
  }

  if (orderId) {
    await db(`orders?id=eq.${orderId}&payment_status=neq.paid`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: 'pending', payment_reference: data.reference, amount_requested: amount }),
    })
  }
  return json({ reference: data.reference, orderId })
}

type PayHeroConfig = NonNullable<ReturnType<typeof payhero>>

/**
 * PayHero's callback. Anyone could post to this URL, so its contents are only a hint: we look up the
 * order it names and ask PayHero ourselves (with the reference we stored) whether it was really paid.
 */
async function callback(request: Request, cfg: PayHeroConfig) {
  const body = (await request.json().catch(() => null)) as { response?: { ExternalReference?: string } } | null
  const orderId = body?.response?.ExternalReference
  if (isUuid(orderId)) {
    const rows = await db<{ payment_reference: string | null }[]>(`orders?select=payment_reference&id=eq.${orderId}&payment_status=eq.pending`)
    const reference = rows?.[0]?.payment_reference
    if (reference) await recordOutcome(reference, cfg)
  }
  // Always acknowledge, so PayHero doesn't keep retrying.
  return json({ received: true })
}

/** Asks PayHero for a payment's status and records the outcome on its order. */
async function recordOutcome(reference: string, cfg: PayHeroConfig) {
  const res = await fetch(`${PAYHERO}/transaction-status?reference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: cfg.auth },
  })
  const data = (await res.json().catch(() => ({}))) as { status?: string; provider_reference?: string }
  if (!res.ok) return { status: 'QUEUED' }
  const status = data.status ?? 'QUEUED'

  // Record the outcome on the order. Only PayHero's answer is trusted, never the caller's.
  if (status === 'SUCCESS' || status === 'FAILED') {
    type Row = { id: string; total: number; amount_paid: number; amount_requested: number | null; mpesa_code: string | null; payment_status: string }
    const orders = await db<Row[]>(
      `orders?select=id,total,amount_paid,amount_requested,mpesa_code,payment_status&payment_reference=eq.${encodeURIComponent(reference)}`,
    )
    const order = orders?.[0]
    // "pending" means this reference hasn't been recorded yet, so a payment is never counted twice.
    if (order && order.payment_status === 'pending') {
      let changes: Record<string, unknown> = { payment_status: 'unpaid' }
      if (status === 'SUCCESS') {
        const paid = order.amount_paid + (order.amount_requested ?? 0)
        changes = {
          payment_status: paid >= order.total ? 'paid' : 'unpaid', // a deposit leaves a balance
          amount_paid: paid,
          mpesa_code: [order.mpesa_code, data.provider_reference].filter(Boolean).join(', ') || null,
          paid_at: new Date().toISOString(),
        }
      }
      await db(`orders?id=eq.${order.id}&payment_status=eq.pending`, { method: 'PATCH', body: JSON.stringify(changes) })
    }
  }

  return { status, mpesaCode: status === 'SUCCESS' ? data.provider_reference : undefined }
}

export async function GET(request: Request) {
  const cfg = payhero()
  if (!cfg) return json({ error: 'M-Pesa payments are not set up yet.' }, 503)

  const reference = new URL(request.url).searchParams.get('reference')?.trim()
  if (!reference || !/^[\w-]{4,64}$/.test(reference)) return json({ error: 'Missing reference.' }, 400)

  // Only what the page needs: QUEUED, SUCCESS or FAILED, and the M-Pesa code once paid.
  return json(await recordOutcome(reference, cfg))
}
