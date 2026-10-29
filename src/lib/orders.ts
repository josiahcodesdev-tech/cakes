import { supabase } from './supabase'

export type OrderStatus = 'new' | 'confirmed' | 'baking' | 'ready' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid'

export interface OrderItem {
  name: string
  quantity: number
  size: string
  flavour: string
  message?: string
  unitPrice: number
  link?: string
}

export interface Order {
  id: string
  created_at: string
  kind: 'order' | 'custom' | 'manual'
  customer_name: string
  phone: string
  address: string | null
  delivery_date: string | null
  zone: string | null
  items: OrderItem[]
  notes: string | null
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  amount_requested: number | null
  amount_paid: number
  mpesa_code: string | null
  payment_reference: string | null
  paid_at: string | null
}

export type NewOrder = Pick<Order, 'kind' | 'customer_name' | 'phone'> &
  Partial<Pick<Order, 'address' | 'delivery_date' | 'zone' | 'items' | 'notes' | 'subtotal' | 'delivery_fee' | 'total'>>

/**
 * Saves a customer's order so it shows up in the admin page. The caller makes the id
 * (see `newOrderId`) because customers can't read orders back. Returns null if Supabase
 * isn't set up or the save failed — ordering on WhatsApp still works either way.
 */
export async function saveOrder(id: string, order: NewOrder): Promise<string | null> {
  if (!supabase) return null
  const { error } = await supabase.from('orders').insert({ id, ...order })
  if (error) {
    console.error('Could not save order', error)
    return null
  }
  return id
}

export const newOrderId = () => crypto.randomUUID()

/** Short code for an order, quoted in WhatsApp messages and shown in the admin page. */
export const orderCode = (id: string) => id.slice(0, 6).toUpperCase()

/** Whether orders are being saved (Supabase is set up). */
export const ordersEnabled = () => supabase !== null
