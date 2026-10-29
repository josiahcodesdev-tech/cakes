import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { CAKE_IMAGES_BUCKET, supabase } from '../lib/supabase'
import { formatKES } from '../lib/format'
import { categories, defaultReadyIn, slugify } from '../data/products'
import { refreshProducts, type ProductRow } from '../data/catalog'
import type { CategoryId, Product } from '../types'
import { resizeImage } from '../lib/images'
import { Badge, PageTitle } from './ui'

const tagOptions: NonNullable<Product['tags']>[number][] = ['bestseller', 'new', 'eggless', 'sugar-free']

type Draft = {
  id?: string
  slug?: string
  name: string
  category: CategoryId
  description: string
  image: string
  base_price: string
  old_price: string
  flavours: string
  fixed_size: string
  ready_in: string
  tags: string[]
  active: boolean
}

const emptyDraft: Draft = {
  name: '', category: 'birthday', description: '', image: '', base_price: '', old_price: '',
  flavours: 'Vanilla, Chocolate, Red Velvet', fixed_size: '', ready_in: '', tags: [], active: true,
}

const toDraft = (r: ProductRow): Draft => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category, description: r.description, image: r.image,
  base_price: String(r.base_price), old_price: r.old_price ? String(r.old_price) : '', flavours: r.flavours.join(', '),
  fixed_size: r.fixed_size ?? '', ready_in: r.ready_in ?? '', tags: r.tags ?? [], active: r.active,
})

export default function CakesPage() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Draft | null>(null)
  const [category, setCategory] = useState<'all' | CategoryId>('all')

  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('products').select('*').order('sort_order').order('created_at', { ascending: false })
    if (error) return setError(error.message)
    setRows(data as ProductRow[])
  }, [])

  useEffect(() => { void load() }, [load])

  const afterChange = async () => {
    await load()
    await refreshProducts() // so the shop (in this tab) shows the change straight away
  }

  const toggle = async (r: ProductRow) => {
    const { error } = await supabase!.from('products').update({ active: !r.active }).eq('id', r.id)
    if (error) alert(error.message)
    void afterChange()
  }

  const remove = async (r: ProductRow) => {
    if (!window.confirm(`Delete “${r.name}” for good? (Tip: “Hide” keeps it but takes it off the website.)`)) return
    const { error } = await supabase!.from('products').delete().eq('id', r.id)
    if (error) alert(error.message)
    void afterChange()
  }

  const shown = rows.filter((r) => category === 'all' || r.category === category)

  return (
    <div>
      <PageTitle title="Cakes">
        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="input w-auto! rounded-full! py-2!">
          <option value="all">All categories ({rows.length})</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({rows.filter((r) => r.category === c.id).length})</option>)}
        </select>
        <button onClick={() => setEditing({ ...emptyDraft })} className="btn-primary py-2!"><Plus className="size-4" /> Add cake</button>
      </PageTitle>

      {error && <p className="mb-4 rounded-2xl bg-berry-100 p-3 text-sm text-berry-600">{error}</p>}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <li key={r.id} className={`flex gap-3 rounded-3xl bg-white p-3 ring-1 ring-cream-200 ${r.active ? '' : 'opacity-60'}`}>
            <img src={r.image} alt="" className="size-20 shrink-0 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              <p className="text-xs text-cocoa-500">{categories.find((c) => c.id === r.category)?.name}</p>
              <p className="mt-1 text-sm font-bold text-berry-600">
                {formatKES(r.base_price)} {r.old_price && <span className="font-normal text-cocoa-500 line-through">{formatKES(r.old_price)}</span>}
              </p>
              {!r.active && <Badge className="bg-cocoa-500/15 text-cocoa-500">Hidden</Badge>}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEditing(toDraft(r))} className="rounded-xl p-2 hover:bg-cream-100" aria-label={`Edit ${r.name}`}><Pencil className="size-4" /></button>
              <button onClick={() => toggle(r)} className="rounded-xl p-2 hover:bg-cream-100" aria-label={r.active ? `Hide ${r.name}` : `Show ${r.name}`} title={r.active ? 'Hide from website' : 'Show on website'}>
                {r.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button onClick={() => remove(r)} className="rounded-xl p-2 text-berry-600 hover:bg-berry-100" aria-label={`Delete ${r.name}`}><Trash2 className="size-4" /></button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <CakeEditor draft={editing} takenSlugs={rows.map((r) => r.slug)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void afterChange() }} />}
    </div>
  )
}

function CakeEditor({ draft, takenSlugs, onClose, onSaved }: { draft: Draft; takenSlugs: string[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((x) => ({ ...x, [key]: value }))

  const upload = async (file: File) => {
    setBusy('Uploading photo…')
    setError('')
    try {
      const blob = await resizeImage(file)
      const path = `${slugify(d.name || 'cake')}-${Date.now()}.jpg`
      const { error } = await supabase!.storage.from(CAKE_IMAGES_BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      set('image', supabase!.storage.from(CAKE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
    setBusy('')
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!d.image) return setError('Add a photo first.')
    setBusy('Saving…')
    const row = {
      name: d.name.trim(),
      category: d.category,
      description: d.description.trim(),
      image: d.image,
      base_price: Math.round(Number(d.base_price)),
      old_price: d.old_price ? Math.round(Number(d.old_price)) : null,
      flavours: d.flavours.split(',').map((f) => f.trim()).filter(Boolean),
      fixed_size: d.fixed_size.trim() || null,
      ready_in: d.ready_in.trim() || null,
      tags: d.tags,
      active: d.active,
    }
    let result
    if (d.id) {
      // The link (slug) stays the same on edits so links you've already shared keep working.
      result = await supabase!.from('products').update(row).eq('id', d.id)
    } else {
      const base = slugify(row.name) || 'cake'
      let slug = base
      for (let n = 2; takenSlugs.includes(slug); n++) slug = `${base}-${n}`
      result = await supabase!.from('products').insert({ ...row, slug })
    }
    setBusy('')
    if (result.error) return setError(result.error.message)
    onSaved()
  }

  const label = 'block text-xs font-medium text-cocoa-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-[2rem] bg-white p-6 sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{d.id ? 'Edit cake' : 'Add a cake'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-cream-100" aria-label="Close"><X className="size-5" /></button>
        </div>

        <div className="flex gap-4">
          <label className="grid size-32 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-3xl bg-cream-100 text-center text-xs text-cocoa-500 ring-1 ring-cream-200 hover:ring-berry-500">
            {d.image ? <img src={d.image} alt="" className="size-full object-cover" /> : <span><ImagePlus className="mx-auto mb-1 size-6" />Add photo</span>}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          <div className="flex-1 space-y-3">
            <label className={label}>Cake name<input required value={d.name} onChange={(e) => set('name', e.target.value)} className="input mt-1" placeholder="e.g. Unicorn Rainbow Cake" /></label>
            <label className={label}>
              Category
              <select value={d.category} onChange={(e) => set('category', e.target.value as CategoryId)} className="input mt-1">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
        </div>
        <p className="text-xs text-cocoa-500">Tap the square to upload a photo from your phone or computer.</p>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Price (KES)<input required type="number" min={0} value={d.base_price} onChange={(e) => set('base_price', e.target.value)} className="input mt-1" placeholder="3500" /></label>
          <label className={label}>Old price, for “% OFF” (optional)<input type="number" min={0} value={d.old_price} onChange={(e) => set('old_price', e.target.value)} className="input mt-1" /></label>
        </div>

        <label className={label}>Description<textarea required rows={3} value={d.description} onChange={(e) => set('description', e.target.value)} className="input mt-1 resize-none" /></label>
        <label className={label}>Flavours (separate with commas)<input value={d.flavours} onChange={(e) => set('flavours', e.target.value)} className="input mt-1" /></label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Fixed size (optional)
            <input value={d.fixed_size} onChange={(e) => set('fixed_size', e.target.value)} className="input mt-1" placeholder="e.g. Box of 12" />
            <span className="mt-1 block font-normal">Leave empty to offer 1–3 kg sizes.</span>
          </label>
          <label className={label}>
            Ready in (optional)
            <input value={d.ready_in} onChange={(e) => set('ready_in', e.target.value)} className="input mt-1" placeholder={defaultReadyIn[d.category]} />
          </label>
        </div>

        <fieldset className="flex flex-wrap gap-2">
          <legend className={`${label} mb-1`}>Labels</legend>
          {tagOptions.map((t) => (
            <label key={t} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ${d.tags.includes(t) ? 'bg-cocoa-800 text-cream-50 ring-cocoa-800' : 'ring-cream-200'}`}>
              <input type="checkbox" className="sr-only" checked={d.tags.includes(t)} onChange={(e) => set('tags', e.target.checked ? [...d.tags, t] : d.tags.filter((x) => x !== t))} />
              {t}
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} className="size-4 accent-berry-500" />
          Show on the website
        </label>

        {error && <p className="rounded-2xl bg-berry-100 p-3 text-sm text-berry-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn flex-1 bg-cream-100">Cancel</button>
          <button disabled={!!busy} className="btn-primary flex-1">{busy || (d.id ? 'Save changes' : 'Add cake')}</button>
        </div>
      </form>
    </div>
  )
}
