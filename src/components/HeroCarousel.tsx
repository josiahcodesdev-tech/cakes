import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { findProduct, useProducts } from '../data/catalog'
import { formatKES } from '../lib/format'
import type { Product } from '../types'

// Cakes featured in the hero, in display order. Edit this list to change what rotates.
const featuredSlugs = [
  'chocolate-fudge-swirl',
  'confetti-birthday-bash',
  'macaron-dream-tall-cake',
  'blueberry-cheesecake',
  'rainbow-sprinkle-surprise',
  'garden-rose-three-tier',
]
const INTERVAL_MS = 3500

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const products = useProducts()
  const featured = featuredSlugs.map((s) => findProduct(products, s)).filter((p): p is Product => Boolean(p))
  // Featured cakes that were removed in the admin page fall back to the newest cakes.
  const slides = featured.length ? featured : products.slice(0, 6)

  useEffect(() => {
    if (paused || slides.length < 2) return
    // Respect users who prefer less motion: they can still switch with the dots.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, slides.length])

  const current = slides[index % slides.length]
  if (!current) return null

  return (
    <div
      className="relative mx-auto w-full max-w-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured cakes"
    >
      <div className="relative">
      {/* Layered blobs behind the photo, morphing out of step with it */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 translate-x-4 translate-y-3 rotate-12 rounded-[34%_66%_62%_38%/46%_68%_32%_54%] bg-butter-400/70" />
        <div className="absolute -inset-3 -rotate-6 rounded-[58%_42%_30%_70%/70%_34%_66%_30%] border-2 border-dashed border-berry-500/40" />
        <span className="absolute -top-2 left-8 size-3 rounded-full bg-berry-500" />
        <span className="absolute top-1/3 -left-4 size-2 rounded-full bg-pistachio-500" />
        <span className="absolute -bottom-1 left-1/3 size-4 rounded-full bg-white shadow" />
        <span className="absolute right-6 bottom-10 size-2.5 rounded-full bg-cocoa-800" />
      </div>

      <Link
        to={`/cake/${current.slug}`}
        className="relative block aspect-square overflow-hidden rounded-[68%_32%_44%_56%/58%_36%_64%_42%] bg-cream-100 shadow-2xl ring-6 shadow-cocoa-800/25 ring-white"
      >
        {slides.map((p, i) => (
          <img
            key={p.id}
            src={p.image}
            alt={i === index ? p.name : ''}
            aria-hidden={i !== index}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 size-full object-cover transition-all duration-1000 ease-out ${
              i === index ? 'scale-100 rotate-0 opacity-100' : 'scale-110 rotate-6 opacity-0'
            }`}
          />
        ))}
      </Link>

      </div>

      {/* Price tag: re-keyed per slide so it pops in fresh each time */}
      <Link
        key={current.id}
        to={`/cake/${current.slug}`}
        className="absolute top-2 -right-2 max-w-48 animate-pop rounded-3xl bg-cocoa-800 px-4 py-3 text-cream-50 shadow-xl transition hover:bg-berry-600 sm:-right-6"
        aria-live="polite"
      >
        <span className="block truncate text-xs text-cream-200">{current.name}</span>
        <span className="block font-display text-xl font-bold whitespace-nowrap">{formatKES(current.basePrice)}</span>
        {current.oldPrice && (
          <span className="block text-xs whitespace-nowrap text-cream-200/70">
            was <span className="line-through">{formatKES(current.oldPrice)}</span>
          </span>
        )}
      </Link>

      <div className="mt-5 flex justify-center gap-2">
        {slides.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${p.name}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-berry-500' : 'w-2 bg-cocoa-800/20 hover:bg-cocoa-800/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
