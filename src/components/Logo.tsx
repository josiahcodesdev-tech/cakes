import { site } from '../config'

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-10" />
      <span className="leading-none">
        <span className={`block font-display text-xl font-bold ${light ? 'text-cream-50' : 'text-cocoa-800'}`}>
          {site.name}
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${light ? 'text-cream-200' : 'text-berry-500'}`}>
          Bakery · Nairobi
        </span>
      </span>
    </span>
  )
}
