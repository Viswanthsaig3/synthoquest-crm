import { apiFetch } from '@/lib/api/client'

export type BatchListItem = {
  id: string
  name: string
  courseName: string
  instructorName: string
  mode: string
  status: string
  startDate: string | null
  endDate: string | null
  maxCapacity: number
  enrolledCount: number
  availableSeats: number
  fee: number
  discount: number
  description: string
}

export async function getBatchesForCourse(courseName: string): Promise<{ data: BatchListItem[] }> {
  const params = new URLSearchParams({ courseName })
  return apiFetch(`/batches?${params.toString()}`)
}
