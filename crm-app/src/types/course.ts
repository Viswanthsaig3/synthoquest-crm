export type CourseStatus = 'active' | 'inactive' | 'archived'
export type CourseCategory = 'cyber_security' | 'ai_ml' | 'certification' | 'cloud' | 'network' | 'other'

export interface Course {
  id: string
  name: string
  code: string
  description?: string
  durationWeeks: number
  defaultFee: number
  category: CourseCategory
  syllabus?: string[]
  prerequisites?: string[]
  status: CourseStatus
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCourseInput {
  name: string
  code: string
  description?: string
  durationWeeks: number
  defaultFee: number
  category: CourseCategory
  syllabus?: string[]
  prerequisites?: string[]
}

export interface UpdateCourseInput {
  name?: string
  code?: string
  description?: string
  durationWeeks?: number
  defaultFee?: number
  category?: CourseCategory
  syllabus?: string[]
  prerequisites?: string[]
  status?: CourseStatus
}