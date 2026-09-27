import { WhatsAppIcon } from './BrandIcons'
import { whatsappLink } from '../lib/format'

export default function FloatingWhatsApp() {
  return (
    <a
      href={whatsappLink('Hi! I would like to order a cake 🎂')}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-black/20 transition hover:pr-5 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="hidden max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-all group-hover:max-w-40 sm:inline">
        Order on WhatsApp
      </span>
    </a>
  )
}
