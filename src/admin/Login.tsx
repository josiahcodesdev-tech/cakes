import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-[2rem] bg-white p-8 ring-1 ring-cream-200">
        <Logo />
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Lock className="size-5 text-berry-500" /> {title}</h1>
        {children}
      </div>
    </div>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  if (!supabase) {
    return (
      <Card title="Admin">
        <p className="text-sm text-cocoa-700">The admin page isn’t connected yet. Add the Supabase keys to Vercel (see the setup steps) and redeploy.</p>
      </Card>
    )
  }

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setMessage({ text: error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message, error: true })
  }

  const forgot = async () => {
    if (!email) return setMessage({ text: 'Type your email first, then tap “Forgot password”.', error: true })
    setBusy(true)
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin` })
    setBusy(false)
    setMessage(error ? { text: error.message, error: true } : { text: 'Check your email for a link to set a new password.' })
  }

  return (
    <Card title="Admin login">
      <form onSubmit={signIn} className="space-y-3">
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" autoComplete="email" />
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input" autoComplete="current-password" />
        {message && <p className={`text-sm ${message.error ? 'text-berry-600' : 'text-pistachio-500'}`}>{message.text}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Please wait…' : 'Log in'}</button>
        <button type="button" onClick={forgot} disabled={busy} className="w-full text-sm text-cocoa-500 hover:text-berry-600">Forgot password?</button>
      </form>
    </Card>
  )
}

/** Shown after following a "reset password" email link. */
export function SetNewPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase!.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <Card title="Set a new password">
      <form onSubmit={save} className="space-y-3">
        <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" className="input" autoComplete="new-password" />
        {error && <p className="text-sm text-berry-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </Card>
  )
}

export function NotAdmin({ email }: { email: string }) {
  return (
    <Card title="No access">
      <p className="text-sm text-cocoa-700"><strong>{email}</strong> isn’t on the admin list. Add it to the <code>admins</code> table in Supabase, then log in again.</p>
      <button onClick={() => supabase?.auth.signOut()} className="btn-outline w-full">Log out</button>
    </Card>
  )
}
