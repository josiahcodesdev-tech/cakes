import { Link } from 'react-router-dom'
import { ArrowRight, Cake } from 'lucide-react'
import { byCategory, getCategory } from '../data/products'
import type { CategoryId } from '../types'
import ProductCard from './ProductCard'

interface Props {
  category: CategoryId
  title?: string
  tinted?: boolean
}

/** A titled row of up to four products from one category, with a "View all" link. */
export default function ProductRow({ category, title, tinted = false }: Props) {
  const cat = getCategory(category)!
  const items = byCategory(category).slice(0, 4)

  return (
    <section className={tinted ? 'bg-cream-100 py-16' : 'py-16'}>
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">{title ?? cat.name}</h2>
            <p className="mt-2 text-sm text-cocoa-700 sm:text-base">{cat.blurb}</p>
            <span className="mt-3 block h-1 w-12 rounded-full bg-berry-500" aria-hidden="true" />
          </div>
          <Link
            to={`/shop?category=${category}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-cocoa-800 px-4 py-2 text-sm font-semibold transition hover:bg-cocoa-800 hover:text-cream-50"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {/* Swipeable on phones, grid from tablet up */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-6">
          {items.map((p) => (
            <div key={p.id} className="w-[70%] shrink-0 snap-start sm:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
          {items.length < 4 && (
            <Link
              to="/custom"
              className="flex w-[70%] shrink-0 snap-start flex-col items-center justify-center gap-3 border-2 border-dashed border-cream-200 p-6 text-center transition hover:border-berry-500 hover:bg-white sm:w-auto"
            >
              <span className="grid size-14 place-items-center bg-berry-100 text-berry-600"><Cake className="size-6" /></span>
              <span className="font-display text-xl font-semibold">Don’t see your design?</span>
              <span className="text-sm text-cocoa-700">Send us a photo and we’ll quote within the hour.</span>
              <span className="mt-1 text-sm font-semibold text-berry-600">Request a custom cake →</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
