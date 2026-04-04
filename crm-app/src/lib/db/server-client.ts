import { createServerClient, createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createClient() {
  const { cookies: nextCookies } = await import('next/headers')
  const cookieStore = await nextCookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from Server Component, ignore
        }
      },
    },
  })
}

export async function createAdminClient() {
  const { cookies: nextCookies } = await import('next/headers')
  const cookieStore = await nextCookies()
  
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from Server Component, ignore
        }
      },
    },
  })
}

export function createBrowserClientInstance() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
