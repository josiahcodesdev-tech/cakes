import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { site } from '../config'
import { whatsappLink } from '../lib/format'
import { WhatsAppIcon } from '../components/BrandIcons'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = `${form.message}\n\n— ${form.name} (${form.email})`
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent('Website enquiry')}&body=${encodeURIComponent(body)}`
  }

  const cards = [
    { Icon: Phone, label: 'Call us', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}` },
    { Icon: WhatsAppIcon, label: 'WhatsApp', value: 'Chat with a baker', href: whatsappLink('Hi!') },
    { Icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { Icon: MapPin, label: 'Visit', value: site.address, href: `https://maps.google.com/?q=${encodeURIComponent(site.address)}` },
  ]

  return (
    <div className="container-x py-12">
      <header className="mb-12 text-center">
        <p className="eyebrow mb-3">Get in touch</p>
        <h1 className="text-4xl font-bold sm:text-6xl">We’d love to hear from you</h1>
      </header>

      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-[2rem] bg-white p-6 ring-1 ring-cream-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-berry-100 text-berry-600">
              <Icon className="size-5" />
            </span>
            <span className="block text-sm text-cocoa-500">{label}</span>
            <span className="block font-semibold break-words">{value}</span>
          </a>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4 rounded-[2.5rem] bg-white p-6 ring-1 ring-cream-200 sm:p-10">
          <h2 className="text-2xl font-bold">Send a message</h2>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="input" />
          <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" className="input resize-none" />
          <button className="btn-primary w-full">Send message</button>
        </form>

        <div className="flex flex-col gap-6">
          <iframe
            title="Bakery location"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&z=14&output=embed`}
            className="min-h-72 w-full flex-1 rounded-[2.5rem] border-0"
            loading="lazy"
          />
          <div className="rounded-[2rem] bg-cocoa-800 p-6 text-cream-50">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Clock className="size-5 text-butter-400" /> Opening hours</h2>
            {site.hours.map((h) => (
              <p key={h.days} className="flex justify-between border-b border-cocoa-700 py-2 last:border-0">
                <span>{h.days}</span><span className="text-cream-200">{h.time}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
