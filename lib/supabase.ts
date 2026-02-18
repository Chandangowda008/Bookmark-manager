/**
 * Supabase Client Configuration
 * 
 * This file creates a reusable Supabase client for browser use.
 * It uses environment variables for security and flexibility.
 * 
 * IMPORTANT: This client runs on the browser (client-side).
 * Do NOT use this for server-side operations that require service_role access.
 */

'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized Supabase client to defer creation until runtime
let supabaseClient: SupabaseClient | null = null

/**
 * Get or create Supabase client
 * Defers client creation to runtime to avoid build-time errors
 */
function initSupabase(): SupabaseClient {
  // Get environment variables (Set at build time by Next.js)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.production or Vercel environment variables.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Persist session in localStorage for cross-tab consistency
      persistSession: true,
      // Auto-refresh tokens before they expire
      autoRefreshToken: true,
    },
  })
}

/**
 * Lazy-loaded Supabase client
 * Initialize on first access to avoid build-time errors
 */
export const supabase = new Proxy<SupabaseClient>(
  {} as SupabaseClient,
  {
    get: (target, prop: string | symbol) => {
      if (!supabaseClient) {
        supabaseClient = initSupabase()
      }
      return (supabaseClient as any)[prop]
    },
  }
)

/**
 * Type definition for bookmark data structure
 * Matches the Supabase table schema
 */
export type Bookmark = {
  id: string
  user_id: string
  title: string
  url: string
  created_at: string
}
