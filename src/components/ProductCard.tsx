import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, Plus, Star } from 'lucide-react'
import type { Product } from '../types'
import { formatKES } from '../lib/format'
import { discountPercent, sizes } from '../data/products'
import { useCart } from '../context/CartContext'

const tagStyles = {
  bestseller: 'bg-butter-400 text-cocoa-900',
  new: 'bg-pistachio-500 text-white',
  eggless: 'bg-white text-cocoa-800',
  'sugar-free': 'bg-white text-cocoa-800',
} as const

const tagLabels = { bestseller: 'Bestseller', new: 'New', eggless: 'Eggless', 'sugar-free': 'Sugar-free' } as const

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const off = discountPercent(product)
  const href = `/cake/${product.slug}`

  // Quick add uses the default size and first flavour; the product page offers full options.
  const quickAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      size: product.fixedSize ?? sizes[0].label,
      flavour: product.flavours[0],
      message: '',
      unitPrice: product.basePrice,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="group flex flex-col bg-white p-2.5 shadow-sm ring-1 ring-cream-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-cocoa-800/10">
      <Link to={href} className="relative block aspect-square overflow-hidden bg-cream-100" tabIndex={-1}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {off > 0 && (
            <span className="bg-berry-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">{off}% OFF</span>
          )}
          {product.tags?.map((t) => (
            <span key={t} className={`px-2.5 py-1 text-[11px] font-bold shadow-sm ${tagStyles[t]}`}>
              {tagLabels[t]}
            </span>
          ))}
        </div>
        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white/90 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
          <Clock className="size-3" /> {product.readyIn}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        <div className="mb-1 flex items-center gap-1 text-xs text-cocoa-500">
          <Star className="size-3.5 fill-butter-400 text-butter-400" /> {product.rating.toFixed(1)}
          {product.fixedSize && <span className="truncate">· {product.fixedSize}</span>}
        </div>
        <h3 className="line-clamp-2 leading-snug font-semibold sm:text-lg">
          <Link to={href} className="hover:text-berry-600">{product.name}</Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="leading-tight">
            {product.oldPrice && (
              <span className="block text-xs text-cocoa-500 line-through">{formatKES(product.oldPrice)}</span>
            )}
            <span className="font-bold text-berry-600">{formatKES(product.basePrice)}</span>
          </p>
          <button
            onClick={quickAdd}
            className={`flex shrink-0 items-center gap-1 px-3.5 py-2 text-xs font-semibold transition ${
              added ? 'bg-pistachio-500 text-white' : 'bg-cocoa-800 text-cream-50 hover:bg-berry-500'
            }`}
            aria-label={`Add ${product.name} to order`}
          >
            {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            <span className="hidden sm:inline">{added ? 'Added' : 'Add to Order'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
