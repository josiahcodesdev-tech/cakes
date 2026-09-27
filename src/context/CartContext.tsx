import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '../types'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'key'>) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'bakery-cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — cart just won't persist */
    }
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      // Same product with the same options merges into one line.
      const key = [item.productId, item.size, item.flavour, item.message].join('|')
      setItems((prev) => {
        if (prev.some((i) => i.key === key)) {
          return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i))
        }
        return [...prev, { ...item, key }]
      })
    }
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
      addItem,
      updateQuantity: (key, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
        ),
      removeItem: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
