import { site } from '../config'

export const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
