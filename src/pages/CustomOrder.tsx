import { useState, type FormEvent } from 'react'
import { sizes } from '../data/products'
import { whatsappLink } from '../lib/format'
import { WhatsAppIcon } from '../components/BrandIcons'

const occasions = ['Birthday', 'Wedding', 'Baby shower', 'Graduation', 'Anniversary', 'Corporate', 'Other']
const today = new Date().toISOString().split('T')[0]

export default function CustomOrder() {
  const [form, setForm] = useState({
    name: '', phone: '', occasion: occasions[0], size: sizes[1].label, date: today, theme: '', budget: '', photos: '',
  })
  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const message = [
      '🎂 *Custom cake request*',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Occasion: ${form.occasion}`,
      `Size: ${form.size}`,
      `Date needed: ${form.date}`,
      form.budget && `Budget: KES ${form.budget}`,
      `Design idea: ${form.theme}`,
      form.photos.trim() && `Reference pictures: ${form.photos.trim()}`,
    ]
      .filter(Boolean)
      .join('\n')
    window.open(whatsappLink(message), '_blank', 'noopener')
  }

  return (
    <div className="container-x py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Custom orders</p>
          <h1 className="text-4xl leading-tight font-bold sm:text-6xl">Let’s design your dream cake together.</h1>
          <p className="mt-5 max-w-lg text-lg text-cocoa-700">
            Tell us about your celebration and we’ll send a sketch and a quote on WhatsApp, usually within an hour.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {['1535141192574-5d4897c12636', '1464349095431-e9a21285b5f3', '1621303837174-89787a7d4729', '1602351447937-745cb720612f'].map((id, i) => (
              <img
                key={id}
                src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=500&q=80`}
                alt=""
                loading="lazy"
                className={`aspect-square w-full rounded-[2rem] object-cover ${i % 2 ? 'translate-y-6' : ''}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="h-fit space-y-4 rounded-[2.5rem] bg-white p-6 ring-1 ring-cream-200 sm:p-10">
          <h2 className="text-2xl font-bold">
            Request a quote
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required value={form.name} onChange={update('name')} placeholder="Your name" className="input" autoComplete="name" />
            <input required value={form.phone} onChange={update('phone')} placeholder="Phone number" type="tel" className="input" autoComplete="tel" />
            <label className="text-xs font-medium text-cocoa-500">
              Occasion
              <select value={form.occasion} onChange={update('occasion')} className="input mt-1">
                {occasions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-cocoa-500">
              Approximate size
              <select value={form.size} onChange={update('size')} className="input mt-1">
                {sizes.map((s) => <option key={s.id} value={s.label}>{s.label} ({s.serves})</option>)}
                <option>Tiered (40+ people)</option>
              </select>
            </label>
            <label className="text-xs font-medium text-cocoa-500">
              Date needed
              <input required type="date" min={today} value={form.date} onChange={update('date')} className="input mt-1" />
            </label>
            <label className="text-xs font-medium text-cocoa-500">
              Budget in KES (optional)
              <input value={form.budget} onChange={update('budget')} inputMode="numeric" placeholder="e.g. 5,000" className="input mt-1" />
            </label>
          </div>
          <textarea
            required
            value={form.theme}
            onChange={update('theme')}
            rows={5}
            placeholder="Describe your design: theme, colours, characters, flavours, message…"
            className="input resize-none"
          />
          <label className="block text-xs font-medium text-cocoa-500">
            Links to reference pictures (optional)
            <input
              value={form.photos}
              onChange={update('photos')}
              placeholder="Paste links from Pinterest, Instagram, Google…"
              className="input mt-1"
              inputMode="url"
            />
          </label>
          <button type="submit" className="btn w-full bg-[#25D366] text-white hover:bg-[#1fb857]">
            <WhatsAppIcon /> Send request on WhatsApp
          </button>
          <p className="text-center text-xs text-cocoa-500">Please order custom cakes at least 48 hours in advance.</p>
        </form>
      </div>
    </div>
  )
}
