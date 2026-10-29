import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { categories, getCategory, products } from '../data/products'
import ProductCard from '../components/ProductCard'
import SearchBox from '../components/SearchBox'
import { correct, productScore } from '../lib/search'
import type { Product } from '../types'

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'deals'

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category') ?? 'all'
  const query = params.get('q') ?? ''
  const [sort, setSort] = useState<SortKey>('popular')
  const category = getCategory(active)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    // Typo-tolerant: "weding cakse" still finds wedding cakes.
    const scored = products
      .filter((p) => active === 'all' || p.category === active)
      .map((p) => ({ p, score: productScore(p, query) }))
      .filter((x) => x.score > 0)
    const saving = (p: Product) => (p.oldPrice ?? p.basePrice) - p.basePrice
    // With a search term, better matches (e.g. by name) come before weaker ones.
    return scored.sort((x, y) => {
      if (x.score !== y.score) return y.score - x.score
      const a = x.p
      const b = y.p
      if (sort === 'price-asc') return a.basePrice - b.basePrice
      if (sort === 'price-desc') return b.basePrice - a.basePrice
      if (sort === 'deals') return saving(b) - saving(a)
      return b.rating - a.rating
    }).map((x) => x.p)
  }, [active, query, sort])
  const fix = useMemo(() => correct(query), [query])

  const chips = [{ id: 'all', name: 'All cakes' }, ...categories]

  return (
    <div className="container-x py-10">
      <header className="mb-8 rounded-[2.5rem] bg-berry-100 px-6 py-10 text-center sm:py-14">
        <p className="eyebrow mb-3">{category ? 'Category' : 'The menu'}</p>
        <h1 className="text-4xl font-bold sm:text-5xl">{category?.name ?? 'Shop all cakes'}</h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa-700">
          {category?.blurb ?? 'Every cake is baked to order. Pick your size and flavour on the next page.'}
        </p>
      </header>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setParam('category', c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active === c.id ? 'bg-cocoa-800 text-cream-50' : 'bg-white ring-1 ring-cream-200 hover:bg-cream-100'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-cocoa-500">
          {filtered.length} {filtered.length === 1 ? 'cake' : 'cakes'}
          {query && <> for “<strong className="text-cocoa-800">{query}</strong>”</>}
          {fix && (
            <>
              {' · '}Did you mean{' '}
              <button onClick={() => setParam('q', fix)} className="font-semibold text-berry-600 underline underline-offset-2">{fix}</button>?
            </>
          )}
        </p>
        <div className="flex gap-3">
          <label className="relative flex-1 sm:w-64">
            <span className="sr-only">Search cakes</span>
            <Search className="absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-cocoa-500" />
            <SearchBox
              value={query}
              onChange={(v) => setParam('q', v)}
              placeholder="Search flavour or design…"
              className="input rounded-full! px-10!"
              ghostClassName="border border-transparent pl-10"
            />
            {query && (
              <button onClick={() => setParam('q', '')} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-cocoa-500" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input w-auto! rounded-full!">
              <option value="popular">Most popular</option>
              <option value="deals">Best deals</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-cocoa-500">No cakes match your search. Try another flavour!</p>
          <button onClick={() => setParams({}, { replace: true })} className="btn-outline mt-5">Show all cakes</button>
        </div>
      )}
    </div>
  )
}
