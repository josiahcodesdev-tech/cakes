import { useEffect } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Cake, ExternalLink, LogOut, ReceiptText, Smartphone, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import { useAdmin } from './useAdmin'
import { Login, NotAdmin, SetNewPassword } from './Login'
import OrdersPage from './OrdersPage'
import CakesPage from './CakesPage'
import AccountsPage from './AccountsPage'
import RequestPayment from './RequestPayment'

const tabs = [
  { to: '/admin/orders', label: 'Orders', Icon: ReceiptText },
  { to: '/admin/cakes', label: 'Cakes', Icon: Cake },
  { to: '/admin/accounts', label: 'Accounts', Icon: Wallet },
  { to: '/admin/payments', label: 'Request payment', Icon: Smartphone },
]

/** The shop owner's area at /admin: log in with email and password, then manage orders, cakes and money. */
export default function AdminApp() {
  const admin = useAdmin()

  useEffect(() => {
    // Keep the admin pages out of search results.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  if (admin.status === 'loading') return <div className="grid min-h-screen place-items-center text-cocoa-500">Loading…</div>
  if (admin.status === 'signed-out') return <Login />
  if (admin.status === 'recovering') return <SetNewPassword />
  if (admin.status === 'not-admin') return <NotAdmin email={admin.email} />

  const token = admin.session.access_token

  return (
    <div className="min-h-screen bg-cream-50 lg:flex">
      <aside className="border-b border-cream-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between p-4 lg:block">
          <Link to="/admin"><Logo /></Link>
          <p className="hidden truncate pt-3 text-xs text-cocoa-500 lg:block">{admin.session.user.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-cocoa-800 text-cream-50' : 'hover:bg-cream-100'}`
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
          <a href="/" target="_blank" rel="noopener" className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm hover:bg-cream-100">
            <ExternalLink className="size-4" /> View website
          </a>
          <button onClick={() => supabase?.auth.signOut()} className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-berry-600 hover:bg-berry-100">
            <LogOut className="size-4" /> Log out
          </button>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <Routes>
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders" element={<OrdersPage token={token} />} />
          <Route path="cakes" element={<CakesPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="payments" element={<RequestPayment token={token} />} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Routes>
      </main>
    </div>
  )
}
