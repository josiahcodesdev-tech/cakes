import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Clock, Mail, Menu, Phone, Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { site } from '../config'
import { categories, menuFlavours } from '../data/products'
import Logo from './Logo'

const mainLinks = [
  { to: '/shop?category=ready', label: 'Ready Cakes' },
  { to: '/shop?category=birthday', label: 'Birthday' },
  { to: '/shop?category=kids', label: 'Kids' },
  { to: '/shop?category=cupcakes', label: 'Cupcakes' },
  { to: '/shop?category=wedding', label: 'Wedding' },
  { to: '/shop?category=flowers', label: 'Flowers & Cakes' },
]
const occasionIds = ['anniversary', 'graduation', 'baby', 'corporate', 'special', 'signature']
const occasions = categories.filter((c) => occasionIds.includes(c.id))
const pageLinks = [
  { to: '/custom', label: 'Custom Orders' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
]
// The desktop bar has room for fewer links; "Our Story" stays in the footer and mobile menu.
const barPageLinks = pageLinks.filter((l) => l.to !== '/about')

/** Small click-to-open dropdown that closes on outside click or Escape. */
function Dropdown({ label, children, dark = false }: { label: ReactNode; children: ReactNode; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Close after navigating via one of its links.
  const [lastUrl, setLastUrl] = useState(pathname + search)
  if (lastUrl !== pathname + search) {
    setLastUrl(pathname + search)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
          dark ? 'bg-berry-500 text-white hover:bg-berry-600' : 'hover:bg-white/10'
        }`}
      >
        {label} <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-60 rounded-3xl bg-white p-2 text-cocoa-800 shadow-2xl ring-1 ring-cream-200">
          {children}
        </div>
      )}
    </div>
  )
}

const dropdownLink = 'block rounded-2xl px-4 py-2.5 text-sm hover:bg-cream-100 hover:text-berry-600'

export default function Navbar() {
  const { count } = useCart()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const url = pathname + search
  // The mobile menu is open only for the URL it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === url
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (cat !== 'all') params.set('category', cat)
    navigate(`/shop?${params}`)
  }

  const isActive = (to: string) => url === to

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Info bar */}
      <div className="hidden bg-cream-100 text-xs text-cocoa-700 md:block">
        <div className="container-x flex items-center justify-between py-2">
          <div className="flex gap-5">
            <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-berry-600"><Mail className="size-3.5" />{site.email}</a>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-berry-600"><Phone className="size-3.5" />{site.phone}</a>
          </div>
          <p className="flex items-center gap-1.5"><Clock className="size-3.5" />Open today {site.hours[0].time} · Same-day delivery before 3pm</p>
        </div>
      </div>

      {/* Logo, search, cart */}
      <div className="bg-cream-50">
        <div className="container-x flex h-18 items-center justify-between gap-4 lg:gap-8">
          <Link to="/" aria-label={`${site.name} home`} className="shrink-0"><Logo /></Link>

          <form onSubmit={submitSearch} className="hidden max-w-2xl flex-1 items-center rounded-full bg-white p-1.5 ring-1 ring-cream-200 focus-within:ring-2 focus-within:ring-berry-500 md:flex" role="search">
            <label className="flex flex-1 items-center gap-2 pl-3">
              <span className="sr-only">Search cakes</span>
              <Search className="size-4 shrink-0 text-cocoa-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by flavour, design, cartoon…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-cocoa-500/70"
              />
            </label>
            <label className="border-l border-cream-200 px-2">
              <span className="sr-only">Category</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-transparent text-sm text-cocoa-700 outline-none">
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button className="rounded-full bg-berry-500 px-5 py-2 text-sm font-semibold text-white hover:bg-berry-600">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative grid size-11 place-items-center rounded-full bg-cream-100 transition hover:bg-cream-200"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-berry-500 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              className="grid size-11 place-items-center rounded-full bg-cream-100 lg:hidden"
              onClick={() => setOpenOn(open ? null : url)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category bar (desktop) */}
      <nav className="hidden bg-cocoa-800 text-cream-50 lg:block" aria-label="Categories">
        <div className="container-x flex items-center gap-1 py-2">
          <Dropdown label="Shop by flavour" dark>
            <div className="grid grid-cols-2 gap-x-1">
              {menuFlavours.map((f) => (
                <Link key={f} to={`/shop?q=${encodeURIComponent(f)}`} className={dropdownLink}>{f}</Link>
              ))}
            </div>
          </Dropdown>
          {mainLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition xl:px-3.5 ${isActive(l.to) ? 'bg-white/15' : 'hover:bg-white/10'}`}
            >
              {l.label}
            </Link>
          ))}
          <Dropdown label="More occasions">
            {occasions.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.id}`} className={dropdownLink}>{c.name}</Link>
            ))}
          </Dropdown>
          <div className="ml-auto flex gap-1">
            {barPageLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm whitespace-nowrap transition ${isActive ? 'bg-white/15' : 'text-cream-200 hover:bg-white/10 hover:text-cream-50'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-cream-200 bg-cream-50 lg:hidden">
          <div className="container-x space-y-5 py-4">
            <form onSubmit={submitSearch} className="flex gap-2 md:hidden" role="search">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cakes…" className="input rounded-full!" aria-label="Search cakes" />
              <button className="grid size-12 shrink-0 place-items-center rounded-full bg-berry-500 text-white" aria-label="Search"><Search className="size-5" /></button>
            </form>
            <div>
              <p className="eyebrow mb-2">Shop by occasion</p>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <Link key={c.id} to={`/shop?category=${c.id}`} className="rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-cream-100">{c.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Flavours</p>
              <div className="flex flex-wrap gap-2">
                {menuFlavours.map((f) => (
                  <Link key={f} to={`/shop?q=${encodeURIComponent(f)}`} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-cream-200">{f}</Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col border-t border-cream-200 pt-3">
              {[{ to: '/', label: 'Home' }, ...pageLinks].map((l) => (
                <Link key={l.to} to={l.to} className="rounded-2xl px-3 py-2.5 font-medium hover:bg-cream-100">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
