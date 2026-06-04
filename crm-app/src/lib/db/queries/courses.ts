import { createAdminClient } from '../server-client'
import type { Course, CourseStatus, CourseCategory, CreateCourseInput, UpdateCourseInput } from '@/types/course'

interface CourseRow {
  id: string
  name: string
  code: string
  description: string | null
  duration_weeks: number
  default_fee: number
  category: string
  syllabus: string[] | null
  prerequisites: string[] | null
  status: string
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || undefined,
    durationWeeks: row.duration_weeks,
    defaultFee: row.default_fee,
    category: row.category as CourseCategory,
    syllabus: row.syllabus || undefined,
    prerequisites: row.prerequisites || undefined,
    status: row.status as CourseStatus,
    createdBy: row.created_by || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

interface GetCoursesFilters {
  status?: string
  category?: string
}

export async function getCourses(filters?: GetCoursesFilters): Promise<Course[]> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(mapCourseRow)
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapCourseRow(data as CourseRow)
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('code', code)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapCourseRow(data as CourseRow)
}

export async function createCourse(input: CreateCourseInput, createdBy?: string): Promise<Course> {
  const supabase = await createAdminClient()

  const insertData: Record<string, unknown> = {
    name: input.name,
    code: input.code,
    description: input.description || null,
    duration_weeks: input.durationWeeks,
    default_fee: input.defaultFee,
    category: input.category,
    syllabus: input.syllabus || null,
    prerequisites: input.prerequisites || null,
    status: 'active',
    created_by: createdBy || null,
  }

  const { data, error } = await supabase
    .from('courses')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error

  return mapCourseRow(data as CourseRow)
}

export async function updateCourse(id: string, updates: UpdateCourseInput): Promise<Course> {
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.code !== undefined) updateData.code = updates.code
  if (updates.description !== undefined) updateData.description = updates.description || null
  if (updates.durationWeeks !== undefined) updateData.duration_weeks = updates.durationWeeks
  if (updates.defaultFee !== undefined) updateData.default_fee = updates.defaultFee
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.syllabus !== undefined) updateData.syllabus = updates.syllabus || null
  if (updates.prerequisites !== undefined) updateData.prerequisites = updates.prerequisites || null
  if (updates.status !== undefined) updateData.status = updates.status

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Course not found')
    throw error
  }

  return mapCourseRow(data as CourseRow)
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) throw error
}