export type CategoryId =
  | 'ready'
  | 'birthday'
  | 'anniversary'
  | 'kids'
  | 'cupcakes'
  | 'signature'
  | 'special'
  | 'corporate'
  | 'graduation'
  | 'baby'
  | 'flowers'
  | 'wedding'

export interface Category {
  id: CategoryId
  name: string
  /** Short line shown under section titles and on category tiles. */
  blurb: string
  image: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category: CategoryId
  description: string
  image: string
  /** Price in KES for the smallest size; other sizes add their `extra`. */
  basePrice: number
  /** Pre-discount price, shown struck through with a "% OFF" badge. */
  oldPrice?: number
  flavours: string[]
  /** Set for items sold as a unit (cupcake boxes, bundles, tiered showpieces) — hides the size picker. */
  fixedSize?: string
  /** How soon it can be delivered, e.g. "1–2 hrs". */
  readyIn: string
  tags?: ('bestseller' | 'new' | 'eggless' | 'sugar-free')[]
  rating: number
}

export interface Size {
  id: string
  label: string
  serves: string
  extra: number
}

export interface CartItem {
  key: string
  productId: string
  name: string
  image: string
  size: string
  flavour: string
  message: string
  unitPrice: number
  quantity: number
}
