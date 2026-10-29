import { useEffect, useRef, useState } from 'react'

export type PaymentState = 'idle' | 'sending' | 'waiting' | 'paid' | 'failed'

interface PromptRequest {
  phone: string
  amount: number
  name?: string
  reference?: string
}

const POLL_EVERY_MS = 3000
// M-Pesa prompts expire after about a minute; give the customer a little longer to finish.
const GIVE_UP_AFTER_MS = 120_000

/**
 * Sends an M-Pesa STK push via /api/payhero, then checks every few seconds until it's paid, fails or times out.
 * Pass `adminPassword` to send from the private admin page (higher amount limit).
 */
export function useMpesaPayment() {
  const [state, setState] = useState<PaymentState>('idle')
  const [error, setError] = useState('')
  const [mpesaCode, setMpesaCode] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const poll = (reference: string, startedAt: number) => {
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/payhero?reference=${encodeURIComponent(reference)}`)
        const data = (await res.json()) as { status?: string; mpesaCode?: string }
        if (data.status === 'SUCCESS') {
          setMpesaCode(data.mpesaCode ?? '')
          setState('paid')
          return
        }
        if (data.status === 'FAILED') {
          setError('The payment was cancelled or failed. You can try again.')
          setState('failed')
          return
        }
      } catch {
        // A dropped connection shouldn't end the wait; try again next tick.
      }
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        setError('We didn’t get a confirmation in time. If you paid, send us your M-Pesa message and we’ll confirm.')
        setState('failed')
      } else {
        poll(reference, startedAt)
      }
    }, POLL_EVERY_MS)
  }

  const start = async (req: PromptRequest, adminPassword?: string) => {
    window.clearTimeout(timer.current)
    setError('')
    setMpesaCode('')
    setState('sending')
    try {
      const res = await fetch('/api/payhero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(adminPassword !== undefined && { 'x-admin-password': adminPassword }) },
        body: JSON.stringify(req),
      })
      const data = (await res.json().catch(() => ({}))) as { reference?: string; error?: string }
      if (!res.ok || !data.reference) throw new Error(data.error || 'Could not send the M-Pesa prompt.')
      setState('waiting')
      poll(data.reference, Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the M-Pesa prompt.')
      setState('failed')
    }
  }

  const reset = () => {
    window.clearTimeout(timer.current)
    setState('idle')
    setError('')
    setMpesaCode('')
  }

  return { state, error, mpesaCode, start, reset }
}
