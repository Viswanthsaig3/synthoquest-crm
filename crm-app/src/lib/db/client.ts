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
