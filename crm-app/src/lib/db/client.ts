/**
 * @deprecated Use '@/lib/db/server-client' instead for all server-side operations.
 * 
 * This file creates a simple Supabase client without SSR cookie handling.
 * For proper Next.js App Router compatibility, use server-client.ts which
 * handles cookies via @supabase/ssr.
 * 
 * Kept for potential edge cases, but not recommended for production use.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getServerEnv } from '@/lib/env'

const env = getServerEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

export function createClient() {
  return createSupabaseClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
