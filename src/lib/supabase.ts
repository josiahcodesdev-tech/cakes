import { createClient } from '@supabase/supabase-js'

// These two are safe to be public: what visitors can do is limited by the rules in supabase/setup.sql.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null until Supabase is set up; the site then falls back to the built-in cake list. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const CAKE_IMAGES_BUCKET = 'cake-images'
