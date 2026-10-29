import { site } from '../config'

export const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`

/** Full link to a cake's page on this site, for sharing. */
export const cakeUrl = (slug: string) => `${window.location.origin}/cake/${slug}`

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
