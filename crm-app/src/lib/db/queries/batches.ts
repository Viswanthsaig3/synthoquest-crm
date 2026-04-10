import { createAdminClient } from '@/lib/db/server-client'

export type BatchRow = {
  id: string
  name: string
  course_name: string
  instructor_name: string | null
  mode: string
  status: string
  start_date: string | null
  end_date: string | null
  max_capacity: number
  enrolled_count: number
  fee: number
  discount: number
  description: string | null
}

export async function listBatchesForCourse(courseName: string): Promise<BatchRow[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('course_name', courseName)
    .in('status', ['upcoming', 'ongoing'])
    .is('deleted_at', null)
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data || []) as BatchRow[]
}
