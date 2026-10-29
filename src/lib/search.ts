import type { Product } from '../types'
import { categories, getCategory, menuFlavours } from '../data/products'

// Typo-tolerant search over the site's own words (cake names, categories, flavours),
// so "weding cakse" still finds wedding cakes and "wedd" can be completed to "Wedding Cakes".

export interface Suggestion {
  label: string
  kind: 'Category' | 'Flavour' | 'Cake'
  to: string
  image?: string
}

// Words too common to narrow anything down; ignored unless they're all the user typed.
const stopwords = new Set(['cake', 'cakes', 'and', 'with', 'the', 'a', 'of', 'for'])

export const tokenize = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(Boolean)

/** Edit distance counting a swap of two neighbouring letters ("cakse") as one typo. */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const allowedTypos = (term: string) => (term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0)

/** How well one typed term matches one word: 0 = not at all, higher = better. */
function termScore(term: string, word: string) {
  if (word === term) return 3
  if (word.startsWith(term)) return 2
  const max = allowedTypos(term)
  if (!max) return 0
  // A misspelt whole word, e.g. "weding" → "wedding".
  if (Math.abs(word.length - term.length) <= max && distance(term, word) <= max) return 1.5
  // A misspelt word still being typed, e.g. "wedf" → "wedding".
  for (const len of [term.length - 1, term.length, term.length + 1]) {
    if (len > 0 && len < word.length && distance(term, word.slice(0, len)) <= max) return 1
  }
  return 0
}

const searchTerms = (query: string) => {
  const all = tokenize(query)
  const meaningful = all.filter((t) => !stopwords.has(t))
  return meaningful.length ? meaningful : all
}

/**
 * Scores words against a query; every typed term has to match something.
 * `extra` words (e.g. a cake's category or flavours) count, but less than `words`.
 */
function score(terms: string[], words: string[], extra: string[] = []) {
  if (!terms.length) return 0
  let total = 0
  for (const t of terms) {
    const best = Math.max(0, ...words.map((w) => termScore(t, w)), ...extra.map((w) => termScore(t, w) * 0.6))
    if (!best) return 0
    total += best
  }
  return total
}

// ---- Suggestions for the search box ----

type Entry = Suggestion & { words: string[]; extra: string[]; rank: number }

// The search index is rebuilt only when the cake list changes.
const indexes = new WeakMap<Product[], { entries: Entry[]; vocabulary: string[] }>()

function indexFor(products: Product[]) {
  const hit = indexes.get(products)
  if (hit) return hit
  const flavourList = [...new Set([...menuFlavours, ...products.flatMap((p) => p.flavours)])]
  const entries: Entry[] = [
  ...categories.map((c) => ({
    label: c.name, kind: 'Category' as const, to: `/shop?category=${c.id}`, image: c.image,
    words: tokenize(c.name), extra: tokenize(c.id), rank: 0,
  })),
  ...flavourList.map((f) => ({
    label: f, kind: 'Flavour' as const, to: `/shop?q=${encodeURIComponent(f)}`,
    words: tokenize(f), extra: [], rank: 1,
  })),
  ...products.map((p) => ({
    label: p.name, kind: 'Cake' as const, to: `/cake/${p.slug}`, image: p.image,
    words: tokenize(p.name), extra: tokenize(getCategory(p.category)?.name ?? ''), rank: 2,
  })),
  ]
  const vocabulary = [...new Set(entries.flatMap((e) => [...e.words, ...e.extra]).concat([...stopwords]))]
  const index = { entries, vocabulary }
  indexes.set(products, index)
  return index
}

export function suggest(query: string, products: Product[], limit = 7): Suggestion[] {
  const terms = searchTerms(query)
  if (!terms.length) return []
  return indexFor(products).entries
    .map((e) => ({ e, s: score(terms, e.words, e.extra) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.rank - b.e.rank || a.e.label.length - b.e.label.length)
    .slice(0, limit)
    .map(({ e }) => ({ label: e.label, kind: e.kind, to: e.to, image: e.image }))
}

/**
 * The rest of the word(s) the user is probably typing, shown as grey text after the cursor:
 * "wedd" → "ing Cakes". Only offered when a suggestion starts with exactly what was typed.
 */
export function completion(query: string, suggestions: Suggestion[], products: Product[]) {
  if (!query.trim()) return ''
  const typed = query.toLowerCase()
  const hit = suggestions.find((s) => s.label.toLowerCase().startsWith(typed))
    ?? indexFor(products).entries.find((e) => e.label.toLowerCase().startsWith(typed))
  return hit ? hit.label.slice(query.length) : ''
}

// ---- Spelling correction ----

/** The query with misspelt words replaced by the closest site word, or null if nothing changed. */
export function correct(query: string, products: Product[]) {
  const { vocabulary } = indexFor(products)
  const terms = tokenize(query)
  let changed = false
  const fixed = terms.map((t) => {
    if (vocabulary.some((w) => w === t || w.startsWith(t))) return t
    const max = allowedTypos(t)
    let best = t
    let bestDist = max + 1
    for (const w of vocabulary) {
      const d = distance(t, w)
      if (d < bestDist) { best = w; bestDist = d }
    }
    if (best !== t) changed = true
    return best
  })
  return changed ? fixed.join(' ') : null
}

// ---- Matching products on the shop page ----

/** Relevance of a product to the query (0 = hide it). Name hits beat category, flavour or description hits. */
export function productScore(p: Product, query: string) {
  const terms = searchTerms(query)
  if (!terms.length) return 1
  const name = tokenize(p.name)
  const other = tokenize([getCategory(p.category)?.name ?? '', p.category, ...p.flavours, p.description, ...(p.tags ?? [])].join(' '))
  return score(terms, name, other)
}
