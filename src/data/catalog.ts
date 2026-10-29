import { useSyncExternalStore } from 'react'
import type { CategoryId, Product } from '../types'
import { defaultReadyIn, products as builtInProducts } from './products'
import { supabase } from '../lib/supabase'

// The live cake list. Starts from the last list seen (or the built-in one) so pages render instantly,
// then switches to what's in the database once it loads.

export interface ProductRow {
  id: string
  slug: string
  name: string
  category: CategoryId
  description: string
  image: string
  base_price: number
  old_price: number | null
  flavours: string[]
  fixed_size: string | null
  ready_in: string | null
  tags: Product['tags'] | null
  rating: number | string
  active: boolean
  sort_order: number
}

export const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  description: r.description,
  image: r.image,
  basePrice: r.base_price,
  oldPrice: r.old_price ?? undefined,
  flavours: r.flavours.length ? r.flavours : ['Vanilla'],
  fixedSize: r.fixed_size || undefined,
  readyIn: r.ready_in || defaultReadyIn[r.category] || '24 hrs',
  tags: r.tags?.length ? r.tags : undefined,
  rating: Number(r.rating),
})

const CACHE_KEY = 'cake-catalog'

function cached(): Product[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Product[]) : null
  } catch {
    return null
  }
}

let current: Product[] = (supabase && cached()) || builtInProducts
// Without Supabase the built-in list is all there is, so it counts as loaded.
let loaded = !supabase
const listeners = new Set<() => void>()

function set(list: Product[]) {
  current = list
  loaded = true
  listeners.forEach((l) => l())
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)) } catch { /* not persisted */ }
}

/** Reloads cakes from the database (also called after the admin page changes them). */
export async function refreshProducts() {
  if (!supabase) return
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Could not load cakes', error)
    set(current)
    return
  }
  set((data as ProductRow[]).map(rowToProduct))
}

void refreshProducts()

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** All cakes currently on sale. Re-renders when the list changes. */
export const useProducts = () => useSyncExternalStore(subscribe, () => current)
/** False while the first database load is still in flight. */
export const useProductsLoaded = () => useSyncExternalStore(subscribe, () => loaded)

export const findProduct = (list: Product[], slug: string) => list.find((p) => p.slug === slug)
export const inCategory = (list: Product[], id: CategoryId) => list.filter((p) => p.category === id)
