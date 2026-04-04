import { createAdminClient } from '../server-client'
import type { LoginLog } from '@/types/auth'

export async function createLoginLog(log: {
  userId: string
  ipAddress: string
  latitude?: number | null
  longitude?: number | null
  city: string
  region: string
  country: string
  userAgent?: string
}): Promise<LoginLog> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('login_logs')
    .insert({
      user_id: log.userId,
      ip_address: log.ipAddress,
      latitude: log.latitude,
      longitude: log.longitude,
      city: log.city,
      region: log.region,
      country: log.country,
      user_agent: log.userAgent,
      login_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as LoginLog
}

export async function getLoginLogsByUserId(userId: string, limit = 10): Promise<LoginLog[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('login_logs')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as LoginLog[]
}

export async function updateLogoutTime(logId: string, sessionDuration: number): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('login_logs')
    .update({
      logout_at: new Date().toISOString(),
      session_duration: sessionDuration,
    })
    .eq('id', logId)

  if (error) throw error
}
