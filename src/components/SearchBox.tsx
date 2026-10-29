import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { completion, correct, suggest } from '../lib/search'
import { useProducts } from '../data/catalog'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Classes for the <input>. */
  className?: string
  /** Padding/border classes matching the input's, so the grey completion lines up with the typed text. */
  ghostClassName?: string
  /** Classes for the wrapper; it is the positioning box for the dropdown. */
  wrapperClassName?: string
  'aria-label'?: string
}

/**
 * Search input that completes the word being typed (Tab or → accepts the grey text),
 * lists matching categories, flavours and cakes, and offers a fix for misspellings.
 */
export default function SearchBox({ value, onChange, placeholder, className = '', ghostClassName = '', wrapperClassName = '', ...rest }: Props) {
  const navigate = useNavigate()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)

  const products = useProducts()
  const suggestions = useMemo(() => suggest(value, products), [value, products])
  const ghost = useMemo(() => completion(value, suggestions, products), [value, suggestions, products])
  const fix = useMemo(() => (value.trim().length >= 4 ? correct(value, products) : null), [value, products])
  const showList = open && value.trim() !== '' && (suggestions.length > 0 || !!fix)

  const update = (v: string) => {
    onChange(v)
    setOpen(true)
    setHighlight(-1)
  }

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const atEnd = e.currentTarget.selectionStart === value.length
    if (ghost && atEnd && (e.key === 'Tab' || e.key === 'ArrowRight')) {
      e.preventDefault()
      update(value + ghost)
    } else if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1))
    } else if (e.key === 'Enter' && showList && highlight >= 0) {
      e.preventDefault()
      go(suggestions[highlight].to)
    } else if (e.key === 'Enter') {
      // Let the surrounding form submit, then get out of the way.
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        role="combobox"
        aria-autocomplete="both"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
        autoComplete="off"
        spellCheck={false}
        {...rest}
      />
      {ghost && (
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden text-sm whitespace-pre ${ghostClassName}`}>
          <span className="invisible">{value}</span>
          <span className="text-cocoa-500/45">{ghost}</span>
        </div>
      )}

      {showList && (
        <div
          // Keep focus in the input so a click registers before the list closes.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-3xl bg-white p-2 text-left text-cocoa-800 shadow-2xl ring-1 ring-cream-200"
        >
          {fix && (
            <button
              type="button"
              onClick={() => update(fix)}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm hover:bg-cream-100"
            >
              <Sparkles className="size-4 text-berry-500" />
              <span>Did you mean <strong className="text-berry-600">{fix}</strong>?</span>
            </button>
          )}
          <ul id={listId} role="listbox">
            {suggestions.map((s, i) => (
              <li key={s.to} id={`${listId}-${i}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onClick={() => go(s.to)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm ${i === highlight ? 'bg-cream-100' : ''}`}
                >
                  {s.image ? (
                    <img src={s.image} alt="" className="size-9 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-berry-100 text-xs font-bold text-berry-600">{s.label[0]}</span>
                  )}
                  <span className="flex-1 truncate text-left">{s.label}</span>
                  <span className="text-xs text-cocoa-500">{s.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
