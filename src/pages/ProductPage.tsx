import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Minus, Plus, Share2, ShieldCheck, Star, Truck } from 'lucide-react'
import { discountPercent, getCategory, sizes } from '../data/products'
import { findProduct, useProducts, useProductsLoaded } from '../data/catalog'
import { useCart } from '../context/CartContext'
import { cakeUrl, formatKES } from '../lib/format'
import { WhatsAppIcon } from '../components/BrandIcons'
import ProductCard from '../components/ProductCard'
import NotFound from './NotFound'
import type { Product } from '../types'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const products = useProducts()
  const loaded = useProductsLoaded()
  const product = findProduct(products, slug)
  if (!product && !loaded) return <div className="container-x py-32 text-center text-cocoa-500">Loading cake…</div>
  // Key by slug so option state resets when navigating between cakes.
  return product ? <ProductDetail key={slug} product={product} products={products} /> : <NotFound />
}

function ProductDetail({ product, products }: { product: Product; products: Product[] }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  // Boxes, bundles and tiered showpieces come in one fixed size.
  const sized = !product.fixedSize
  const [sizeId, setSizeId] = useState(sizes[0].id)
  const [flavour, setFlavour] = useState(product.flavours[0])
  const [message, setMessage] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const size = sizes.find((s) => s.id === sizeId)!
  const extra = sized ? size.extra : 0
  const unitPrice = product.basePrice + extra
  const off = discountPercent(product)
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  // A direct link to this cake; shared links show the cake's photo, name and price as a preview.
  const link = cakeUrl(product.slug)
  const [copied, setCopied] = useState(false)
  const share = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', link)
    }
  }

  const add = (goToCart: boolean) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      size: product.fixedSize ?? size.label,
      flavour,
      message: message.trim(),
      unitPrice,
      quantity: qty,
    })
    if (goToCart) navigate('/cart')
    else {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  return (
    <div className="container-x py-10">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-medium hover:text-berry-500">
        <ArrowLeft className="size-4" /> Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden bg-cream-100 lg:sticky lg:top-32 lg:self-start">
          <img src={product.image.replace('w=800', 'w=1200')} alt={product.name} className="aspect-square size-full object-cover" />
        </div>

        <div>
          <p className="eyebrow mb-2">{getCategory(product.category)?.name}</p>
          <h1 className="text-4xl font-bold sm:text-5xl">{product.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-cocoa-500">
            <Star className="size-4 fill-butter-400 text-butter-400" /> {product.rating.toFixed(1)}
            <span aria-hidden="true">·</span>
            <Clock className="size-4" /> Ready in {product.readyIn}
          </p>
          <p className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-berry-600">{formatKES(unitPrice)}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-cocoa-500 line-through">{formatKES(product.oldPrice + extra)}</span>
                <span className="rounded-full bg-berry-500 px-2.5 py-1 text-xs font-bold text-white">{off}% OFF</span>
              </>
            )}
          </p>
          {product.fixedSize && <p className="mt-2 text-sm font-medium text-cocoa-700">Size: {product.fixedSize}</p>}
          <p className="mt-4 leading-relaxed text-cocoa-700">{product.description}</p>

          <div className="mt-8 space-y-7">
            {sized && (
              <fieldset>
                <legend className="mb-3 font-semibold">Size</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {sizes.map((s) => (
                    <label
                      key={s.id}
                      className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition has-focus-visible:ring-4 has-focus-visible:ring-berry-100 ${
                        sizeId === s.id ? 'border-berry-500 bg-berry-100' : 'border-cream-200 bg-white hover:border-cocoa-500'
                      }`}
                    >
                      <input type="radio" name="size" value={s.id} checked={sizeId === s.id} onChange={() => setSizeId(s.id)} className="sr-only" />
                      <span className="block font-semibold">{s.label}</span>
                      <span className="text-xs text-cocoa-500">{s.serves}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="mb-3 font-semibold">Flavour</legend>
              <div className="flex flex-wrap gap-2">
                {product.flavours.map((f) => (
                  <label
                    key={f}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition has-focus-visible:ring-4 has-focus-visible:ring-berry-100 ${
                      flavour === f ? 'bg-cocoa-800 text-cream-50' : 'bg-white ring-1 ring-cream-200 hover:bg-cream-100'
                    }`}
                  >
                    <input type="radio" name="flavour" value={f} checked={flavour === f} onChange={() => setFlavour(f)} className="sr-only" />
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-3 block font-semibold">
                Message on cake <span className="font-normal text-cocoa-500">(optional)</span>
              </span>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={40}
                placeholder="e.g. Happy 30th Njeri!"
                className="input"
              />
              <span className="mt-1 block text-right text-xs text-cocoa-500">{message.length}/40</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full bg-white ring-1 ring-cream-200">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center" aria-label="Decrease quantity">
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid size-12 place-items-center" aria-label="Increase quantity">
                  <Plus className="size-4" />
                </button>
              </div>
              <button onClick={() => add(false)} className="btn-dark flex-1">
                {added ? (<><Check className="size-4" /> Added!</>) : 'Add to cart'}
              </button>
              <button onClick={() => add(true)} className="btn-primary flex-1">
                Buy now
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              // No number in the link, so WhatsApp asks which chat to share it to.
              href={`https://wa.me/?text=${encodeURIComponent(`${product.name} – ${formatKES(product.basePrice)}\n${link}`)}`}
              target="_blank"
              rel="noopener"
              className="btn bg-[#25D366]/10 px-4! py-2! text-[#128C4B] hover:bg-[#25D366]/20"
            >
              <WhatsAppIcon /> Share on WhatsApp
            </a>
            <button onClick={share} className="btn bg-cream-100 px-4! py-2! hover:bg-cream-200">
              {copied ? <><Check className="size-4" /> Link copied</> : <><Share2 className="size-4" /> Copy link</>}
            </button>
          </div>

          <ul className="mt-8 grid gap-3 rounded-3xl bg-cream-100 p-5 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-3"><Truck className="size-5 text-berry-500" /> Same-day delivery in Nairobi</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-berry-500" /> Pay securely with M-Pesa</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl font-bold">You may also love</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
