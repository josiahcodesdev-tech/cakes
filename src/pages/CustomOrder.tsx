import { useState, type FormEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { sizes } from '../data/products'
import { whatsappLink } from '../lib/format'
import { newOrderId, orderCode, ordersEnabled, saveOrder } from '../lib/orders'
import { resizeImage } from '../lib/images'
import { supabase } from '../lib/supabase'
import { WhatsAppIcon } from '../components/BrandIcons'

const MAX_PHOTOS = 4

type Photo = { key: string; preview: string; url?: string; error?: string }

const occasions = ['Birthday', 'Wedding', 'Baby shower', 'Graduation', 'Anniversary', 'Corporate', 'Other']
const today = new Date().toISOString().split('T')[0]

export default function CustomOrder() {
  const [form, setForm] = useState({
    name: '', phone: '', occasion: occasions[0], size: sizes[1].label, date: today, theme: '', budget: '', photos: '',
  })
  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Photos upload as soon as they're picked, so sending on WhatsApp can open straight from the click.
  const [photos, setPhotos] = useState<Photo[]>([])
  const uploading = photos.some((p) => !p.url && !p.error)
  const photoLinks = photos.flatMap((p) => (p.url ? [p.url] : []))

  const addPhotos = (files: FileList | null) => {
    if (!files || !supabase) return
    for (const file of [...files].slice(0, MAX_PHOTOS - photos.length)) {
      const key = crypto.randomUUID()
      setPhotos((list) => [...list, { key, preview: URL.createObjectURL(file) }])
      const done = (changes: Partial<Photo>) => setPhotos((list) => list.map((p) => (p.key === key ? { ...p, ...changes } : p)))
      resizeImage(file)
        .then(async (blob) => {
          // Stored by our server function (api/upload.ts), which checks it's a real photo.
          const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
          const data = (await res.json().catch(() => ({}))) as { url?: string }
          if (!res.ok || !data.url) throw new Error('Upload failed')
          done({ url: data.url })
        })
        .catch(() => done({ error: 'Upload failed' }))
    }
  }

  const removePhoto = (key: string) => setPhotos((list) => list.filter((p) => p.key !== key))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (uploading) return
    const id = newOrderId()
    const pictures = [
      ...photoLinks.map((url, n) => `Photo ${n + 1}: ${url}`),
      form.photos.trim() && `Reference links: ${form.photos.trim()}`,
    ]
    // Saved for the admin page; not awaited so the WhatsApp window opens straight from the click.
    void saveOrder(id, {
      kind: 'custom',
      customer_name: form.name,
      phone: form.phone,
      delivery_date: form.date,
      notes: [
        `Occasion: ${form.occasion}`,
        `Size: ${form.size}`,
        form.budget && `Budget: KES ${form.budget}`,
        `Design idea: ${form.theme}`,
        ...pictures,
      ].filter(Boolean).join('\n'),
      total: Number(form.budget.replace(/\D/g, '')) || 0,
    })
    const message = [
      '🎂 *Custom cake request*',
      ordersEnabled() && `Request #${orderCode(id)}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Occasion: ${form.occasion}`,
      `Size: ${form.size}`,
      `Date needed: ${form.date}`,
      form.budget && `Budget: KES ${form.budget}`,
      `Design idea: ${form.theme}`,
      ...pictures,
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
          {supabase && (
            <div>
              <p className="mb-1 text-xs font-medium text-cocoa-500">Photos of the cake you want (optional, up to {MAX_PHOTOS})</p>
              <div className="flex flex-wrap gap-3">
                {photos.map((p) => (
                  <div key={p.key} className="relative size-20 overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                    <img src={p.preview} alt="" className={`size-full object-cover ${p.url ? '' : 'opacity-50'}`} />
                    {!p.url && !p.error && <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-cocoa-800" />}
                    {p.error && <span className="absolute inset-x-0 bottom-0 bg-berry-600 py-0.5 text-center text-[10px] font-semibold text-white">{p.error}</span>}
                    <button type="button" onClick={() => removePhoto(p.key)} className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 shadow" aria-label="Remove photo">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="grid size-20 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-cream-200 text-center text-[11px] text-cocoa-500 hover:border-berry-500 hover:text-berry-600">
                    <span><ImagePlus className="mx-auto mb-0.5 size-5" />Add photo</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                  </label>
                )}
              </div>
            </div>
          )}
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
          <button type="submit" disabled={uploading} className="btn w-full bg-[#25D366] text-white hover:bg-[#1fb857]">
            {uploading ? <><Loader2 className="size-4 animate-spin" /> Uploading photo…</> : <><WhatsAppIcon /> Send request on WhatsApp</>}
          </button>
          <p className="text-center text-xs text-cocoa-500">Please order custom cakes at least 48 hours in advance.</p>
        </form>
      </div>
    </div>
  )
}
