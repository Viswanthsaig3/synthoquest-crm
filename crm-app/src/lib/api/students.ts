import { apiFetch } from '@/lib/api/client'
import type { 
  Student, 
  StudentPaymentSummary,
  CreateStudentInput,
  CreateEnrollmentInput,
  CreateStudentPaymentInput,
  UpdateStudentPaymentInput,
  GetStudentsFilters
} from '@/types/student'

export async function getStudents(filters?: GetStudentsFilters) {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.course) params.append('course', filters.course)
  const query = params.toString()
  return apiFetch<{ data: Student[]; pagination: { total: number } }>(`/students${query ? `?${query}` : ''}`)
}

export async function getStudentById(id: string) {
  return apiFetch<{ data: Student }>(`/students/${id}`)
}

export async function createStudent(data: CreateStudentInput) {
  return apiFetch<{ data: Student }>(`/students`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStudent(id: string, data: Partial<CreateStudentInput>) {
  return apiFetch<{ data: Student }>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteStudent(id: string) {
  return apiFetch<{ message: string }>(`/students/${id}`, { method: 'DELETE' })
}

export async function getStudentEnrollments(studentId: string) {
  return apiFetch<{ data: any[] }>(`/students/${studentId}/enrollments`)
}

export async function createEnrollment(studentId: string, data: CreateEnrollmentInput) {
  return apiFetch<{ data: any }>(`/students/${studentId}/enrollments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getStudentPaymentSummary(studentId: string, enrollmentId: string) {
  return apiFetch<{ data: StudentPaymentSummary }>(`/students/${studentId}/enrollments/${enrollmentId}/payments?summary=true`)
}

export async function createStudentPayment(studentId: string, enrollmentId: string, data: CreateStudentPaymentInput) {
  return apiFetch<{ data: any }>(`/students/${studentId}/enrollments/${enrollmentId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteStudentPayment(studentId: string, enrollmentId: string, paymentId: string) {
  return apiFetch<{ message: string }>(`/students/${studentId}/enrollments/${enrollmentId}/payments/${paymentId}`, { method: 'DELETE' })
}