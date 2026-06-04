import { apiFetch } from '@/lib/api/client'
import type { Course, CreateCourseInput, UpdateCourseInput } from '@/types/course'

export async function getCourses(filters?: { status?: string; category?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.category) params.append('category', filters.category)
  const query = params.toString()
  return apiFetch<{ data: Course[] }>(`/courses${query ? `?${query}` : ''}`)
}

export async function getCourseById(id: string) {
  return apiFetch<{ data: Course }>(`/courses/${id}`)
}

export async function createCourse(data: CreateCourseInput) {
  return apiFetch<{ data: Course }>(`/courses`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCourse(id: string, data: UpdateCourseInput) {
  return apiFetch<{ data: Course }>(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCourse(id: string) {
  return apiFetch<{ message: string }>(`/courses/${id}`, { method: 'DELETE' })
}