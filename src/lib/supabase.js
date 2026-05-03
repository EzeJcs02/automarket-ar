import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || ''

// Use a fallback URL that is guaranteed to be a valid format for the Supabase client
const fallbackUrl = 'https://abcdefghijklmnopqrst.supabase.co'
const fallbackKey = 'placeholder-key'

export const supabase = createClient(
  SUPABASE_URL.startsWith('http') ? SUPABASE_URL : fallbackUrl,
  SUPABASE_KEY || fallbackKey
)


