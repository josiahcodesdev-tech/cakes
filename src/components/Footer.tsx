import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Gift, Mail, MapPin, Phone } from 'lucide-react'
import { site } from '../config'
import { categories } from '../data/products'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './BrandIcons'
import Logo from './Logo'
import { whatsappLink } from '../lib/format'

const payments = ['M-Pesa', 'Visa', 'Mastercard', 'Airtel Money']

export default function Footer() {
  const [name, setName] = useState('')

  const socials = [
    { href: site.socials.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: site.socials.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: site.socials.tiktok, label: 'TikTok', Icon: TikTokIcon },
    { href: whatsappLink('Hi! I have a question.'), label: 'WhatsApp', Icon: WhatsAppIcon },
  ]

  // No backend yet: subscribing opens WhatsApp so the bakery can add the customer to a broadcast list.
  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    window.open(whatsappLink(`Hi, I'm ${name.trim()}. Please add me to your offers & new designs list 🎂`), '_blank', 'noopener')
  }

  const linkCls = 'hover:text-berry-500'

  return (
    <footer className="mt-24">
      {/* Offers signup */}
      <div className="container-x relative z-10 -mb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-[2.5rem] bg-berry-500 p-8 text-white shadow-xl shadow-berry-500/30 sm:p-10 lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-white/20 sm:grid"><Gift className="size-7" /></span>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Get 10% off your first order</h2>
              <p className="text-sm text-white/85">Join our WhatsApp list for weekly deals and new designs. No spam.</p>
            </div>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2 rounded-full bg-white p-1.5">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              aria-label="Your first name"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-cocoa-800 outline-none"
            />
            <button className="flex shrink-0 items-center gap-2 rounded-full bg-cocoa-800 px-5 py-3 text-sm font-semibold hover:bg-cocoa-900">
              <WhatsAppIcon className="size-4" /> Join
            </button>
          </form>
        </div>
      </div>

      <div className="relative bg-cocoa-900 pt-16 text-cream-200">
        <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div className="space-y-4">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed text-cream-200/80">
              Small-batch cakes made from scratch every morning with real butter, free-range eggs and a lot of love.
            </p>
            <div className="flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="grid size-10 place-items-center rounded-full bg-cocoa-800 transition hover:bg-berry-500 hover:text-white">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-cream-50">Shop</h3>
            <ul className="space-y-2 text-sm">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`/shop?category=${c.id}`} className={linkCls}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-cream-50">Occasions</h3>
            <ul className="space-y-2 text-sm">
              {categories.slice(6).map((c) => (
                <li key={c.id}><Link to={`/shop?category=${c.id}`} className={linkCls}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-cream-50">Get in touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-berry-500" />{site.address}</li>
              <li className="flex gap-3"><Phone className="size-4 shrink-0 text-berry-500" />
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className={linkCls}>{site.phone}</a></li>
              <li className="flex gap-3"><Mail className="size-4 shrink-0 text-berry-500" />
                <a href={`mailto:${site.email}`} className={`break-all ${linkCls}`}>{site.email}</a></li>
              {site.hours.map((h) => (
                <li key={h.days} className="flex gap-3"><Clock className="size-4 shrink-0 text-berry-500" />
                  <span><span className="font-semibold text-cream-50">{h.days}</span> · {h.time}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cocoa-800">
          <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-cream-200/60 lg:flex-row">
            <p>© {new Date().getFullYear()} {site.name} Bakery. All rights reserved. Prices in Kenya Shillings (KES).</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span>We accept</span>
              {payments.map((p) => (
                <span key={p} className="rounded-lg bg-cream-50 px-2.5 py-1 font-bold text-cocoa-800">{p}</span>
              ))}
            </div>
            <div className="flex gap-4">
              <Link to="/about" className={linkCls}>Our story</Link>
              <Link to="/contact" className={linkCls}>Contact</Link>
              <Link to="/custom" className={linkCls}>Custom orders</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
