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

import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anonymous key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Create and export Supabase client
 * 
 * This client handles:
 * - Authentication (Google OAuth)
 * - Database queries (CRUD operations)
 * - Realtime subscriptions
 * 
 * Security is enforced via Row Level Security (RLS) policies in Supabase,
 * not in this client code.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Persist session in localStorage for cross-tab consistency
      persistSession: true,
      // Auto-refresh tokens before they expire
      autoRefreshToken: true,
    },
  }
)

/**
 * Validate that Supabase environment variables are configured
 * Call this function when you need to use the Supabase client
 */
export function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file or Vercel environment variables.'
    )
  }
}

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
