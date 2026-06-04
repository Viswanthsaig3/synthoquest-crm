import { createAdminClient } from '../server-client'
import type { 
  Student, 
  Enrollment, 
  StudentPayment,
  StudentPaymentMethod,
  StudentPaymentSummary,
  CreateStudentPaymentInput,
  UpdateStudentPaymentInput,
  CreateEnrollmentInput,
  CreateStudentInput,
  GetStudentsFilters
} from '@/types/student'

interface StudentProfileRow {
  user_id: string
  alternate_phone: string | null
  qualification: string | null
  occupation: string | null
  company: string | null
  experience: string | null
  college: string | null
  graduation_year: string | null
  student_type: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  status: string
  source: string
  lead_id: string | null
  converted_from: string | null
  converted_at: string | null
  converted_by: string | null
  notes: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface EnrollmentRow {
  id: string
  student_id: string
  course_id: string
  batch_id: string | null
  enrollment_fee: number
  course_fee: number
  discount: number
  total_fee: number
  paid_amount: number
  remaining_balance: number
  payment_plan: string
  status: string
  enrolled_at: string
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  progress: number
  certificate_id: string | null
  instructor_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  courses?: { name: string; code: string } | null
  users?: { name: string } | null
}

interface PaymentRow {
  id: string
  enrollment_id: string
  amount: number
  payment_method: StudentPaymentMethod
  payment_date: string
  receipt_number: string | null
  notes: string | null
  collected_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  users?: { name: string } | null
}

interface StudentWithProfileRow {
  id: string
  email: string
  name: string
  phone: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  student_profiles?: StudentProfileRow | StudentProfileRow[] | null
}

function mapStudentRow(row: StudentWithProfileRow, enrollments: Enrollment[] = []): Student {
  const profileData = Array.isArray(row.student_profiles) 
    ? row.student_profiles[0] 
    : row.student_profiles as StudentProfileRow | null

  if (!profileData || profileData.deleted_at) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: 'active',
      source: 'organic',
      notes: '',
      enrollments: [],
      totalPaid: 0,
      totalDue: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  const totalPaid = enrollments.reduce((sum, e) => sum + e.paidAmount, 0)
  const totalDue = enrollments.reduce((sum, e) => sum + e.dueAmount, 0)

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    alternatePhone: profileData.alternate_phone || undefined,
    address: profileData.address || undefined,
    city: profileData.city || undefined,
    state: profileData.state || undefined,
    pincode: profileData.pincode || undefined,
    qualification: profileData.qualification || undefined,
    occupation: profileData.occupation || undefined,
    company: profileData.company || undefined,
    experience: profileData.experience || undefined,
    college: profileData.college || undefined,
    graduationYear: profileData.graduation_year || undefined,
    studentType: (profileData.student_type as Student['studentType']) || undefined,
    status: profileData.status as Student['status'],
    source: profileData.source,
    leadId: profileData.lead_id || undefined,
    convertedFrom: profileData.converted_from || undefined,
    convertedAt: profileData.converted_at ? new Date(profileData.converted_at) : undefined,
    convertedBy: profileData.converted_by || undefined,
    notes: profileData.notes || '',
    enrollments,
    totalPaid,
    totalDue,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapEnrollmentRow(row: EnrollmentRow): Enrollment {
  const courseData = Array.isArray(row.courses) 
    ? row.courses[0] 
    : row.courses as { name: string; code: string } | null
  
  const instructorData = Array.isArray(row.users)
    ? row.users[0]
    : row.users as { name: string } | null

  return {
    id: row.id,
    studentId: row.student_id,
    courseId: row.course_id,
    courseName: courseData?.name || 'Unknown Course',
    courseCode: courseData?.code || undefined,
    batchId: row.batch_id || undefined,
    batchName: undefined,
    status: row.status as Enrollment['status'],
    enrolledAt: new Date(row.enrolled_at),
    enrollmentFee: row.enrollment_fee,
    courseFee: row.course_fee,
    discount: row.discount,
    totalFee: row.total_fee,
    paidAmount: row.paid_amount,
    dueAmount: row.remaining_balance,
    remainingBalance: row.remaining_balance,
    paymentPlan: row.payment_plan as Enrollment['paymentPlan'],
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    expectedEndDate: row.expected_end_date ? new Date(row.expected_end_date) : undefined,
    actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
    instructorId: row.instructor_id || undefined,
    instructorName: instructorData?.name || undefined,
    progress: row.progress,
    certificateIssued: !!row.certificate_id,
    certificateId: row.certificate_id || undefined,
    notes: row.notes || undefined,
  }
}

function mapPaymentRow(row: PaymentRow): StudentPayment {
  const collectorData = Array.isArray(row.users)
    ? row.users[0]
    : row.users as { name: string } | null

  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    paymentDate: new Date(row.payment_date),
    receiptNumber: row.receipt_number || undefined,
    notes: row.notes || undefined,
    collectedBy: row.collected_by || undefined,
    collectedByName: collectorData?.name || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getStudents(filters?: GetStudentsFilters): Promise<{ data: Student[]; total: number }> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, name, phone, created_at, updated_at, deleted_at,
      student_profiles!student_profiles_user_id_fkey (*)
    `)
    .eq('role', 'student')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const validRows = (data || []).filter(row => {
    const profile = Array.isArray(row.student_profiles) 
      ? row.student_profiles[0] 
      : row.student_profiles
    return profile && !profile.deleted_at
  })

  const students = await Promise.all(validRows.map(async (row) => {
    const enrollments = await getStudentEnrollments(row.id)
    return mapStudentRow(row as StudentWithProfileRow, enrollments)
  }))

  let filtered = students
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    const searchTerm = filters.search
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      s.phone.includes(searchTerm)
    )
  }
  if (filters?.status) {
    filtered = filtered.filter(s => s.status === filters.status)
  }
  if (filters?.course) {
    filtered = filtered.filter(s => 
      s.enrollments.some(e => e.courseName === filters.course || e.courseId === filters.course)
    )
  }

  return { data: filtered, total: filtered.length }
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, name, phone, created_at, updated_at, deleted_at,
      student_profiles!student_profiles_user_id_fkey (*)
    `)
    .eq('id', id)
    .eq('role', 'student')
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const profile = Array.isArray(data.student_profiles) 
    ? data.student_profiles[0] 
    : data.student_profiles

  if (!profile || profile.deleted_at) return null

  const enrollments = await getStudentEnrollments(id)
  
  const student = mapStudentRow(data as StudentWithProfileRow, enrollments)

  if (student.convertedBy) {
    const { data: convertedByUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', student.convertedBy as string)
      .single()
    
    if (convertedByUser) {
      student.convertedByName = convertedByUser.name
    }
  }

  return student
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('student_enrollments')
    .select(`
      *,
      courses (name, code),
      users!student_enrollments_instructor_id_fkey (name)
    `)
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('enrolled_at', { ascending: false })

  if (error) throw error

  return (data || []).map(mapEnrollmentRow)
}

export async function createStudent(input: CreateStudentInput, convertedBy?: string): Promise<Student> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email: input.email,
      name: input.name,
      phone: input.phone,
      role: 'student',
      password_hash: 'temporary',
    })
    .select('id, email, name, phone, created_at, updated_at')
    .single()

  if (userError) throw userError

  const { error: profileError } = await supabase
    .from('student_profiles')
    .insert({
      user_id: user.id,
      alternate_phone: input.alternatePhone || null,
      qualification: input.qualification || null,
      occupation: input.occupation || null,
      company: input.company || null,
      experience: input.experience || null,
      college: input.college || null,
      graduation_year: input.graduationYear || null,
      student_type: input.studentType || 'passed_out',
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      status: 'active',
      source: input.source || 'organic',
      lead_id: input.leadId || null,
      converted_from: 'manual',
      converted_at: now,
      converted_by: convertedBy || null,
      notes: input.notes || '',
    })

  if (profileError) {
    await supabase.from('users').delete().eq('id', user.id)
    throw profileError
  }

  return getStudentById(user.id) as Promise<Student>
}

export async function updateStudent(id: string, updates: Partial<CreateStudentInput>): Promise<Student> {
  const supabase = await createAdminClient()

  const userUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) userUpdates.name = updates.name
  if (updates.email !== undefined) userUpdates.email = updates.email
  if (updates.phone !== undefined) userUpdates.phone = updates.phone

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', id)

    if (userError) throw userError
  }

  const profileUpdates: Record<string, unknown> = {}
  if (updates.alternatePhone !== undefined) profileUpdates.alternate_phone = updates.alternatePhone || null
  if (updates.qualification !== undefined) profileUpdates.qualification = updates.qualification || null
  if (updates.occupation !== undefined) profileUpdates.occupation = updates.occupation || null
  if (updates.company !== undefined) profileUpdates.company = updates.company || null
  if (updates.experience !== undefined) profileUpdates.experience = updates.experience || null
  if (updates.college !== undefined) profileUpdates.college = updates.college || null
  if (updates.graduationYear !== undefined) profileUpdates.graduation_year = updates.graduationYear || null
  if (updates.studentType !== undefined) profileUpdates.student_type = updates.studentType || null
  if (updates.address !== undefined) profileUpdates.address = updates.address || null
  if (updates.city !== undefined) profileUpdates.city = updates.city || null
  if (updates.state !== undefined) profileUpdates.state = updates.state || null
  if (updates.pincode !== undefined) profileUpdates.pincode = updates.pincode || null
  if (updates.notes !== undefined) profileUpdates.notes = updates.notes || ''

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('student_profiles')
      .update(profileUpdates)
      .eq('user_id', id)

    if (profileError) throw profileError
  }

  return getStudentById(id) as Promise<Student>
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()

  const { error: profileError } = await supabase
    .from('student_profiles')
    .update({ deleted_at: now })
    .eq('user_id', id)

  if (profileError) throw profileError

  const { error: userError } = await supabase
    .from('users')
    .update({ deleted_at: now })
    .eq('id', id)

  if (userError) throw userError
}

export async function createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
  const supabase = await createAdminClient()

  const insertData: Record<string, unknown> = {
    student_id: input.studentId,
    course_id: input.courseId,
    batch_id: input.batchId || null,
    enrollment_fee: input.enrollmentFee || 0,
    course_fee: input.courseFee,
    discount: input.discount || 0,
    total_fee: input.totalFee,
    payment_plan: input.paymentPlan || 'full',
    start_date: input.startDate || null,
    expected_end_date: input.expectedEndDate || null,
    instructor_id: input.instructorId || null,
    notes: input.notes || null,
  }

  const { data, error } = await supabase
    .from('student_enrollments')
    .insert(insertData)
    .select(`
      *,
      courses (name, code),
      users!student_enrollments_instructor_id_fkey (name)
    `)
    .single()

  if (error) throw error

  return mapEnrollmentRow(data as EnrollmentRow)
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment> {
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = {}

  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.progress !== undefined) updateData.progress = updates.progress
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate
  if (updates.expectedEndDate !== undefined) updateData.expected_end_date = updates.expectedEndDate
  if (updates.actualEndDate !== undefined) updateData.actual_end_date = updates.actualEndDate
  if (updates.notes !== undefined) updateData.notes = updates.notes

  const { data, error } = await supabase
    .from('student_enrollments')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select(`
      *,
      courses (name, code),
      users!student_enrollments_instructor_id_fkey (name)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Enrollment not found')
    throw error
  }

  return mapEnrollmentRow(data as EnrollmentRow)
}

export async function deleteEnrollment(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('student_enrollments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) throw error
}

export async function getStudentPayments(enrollmentId: string): Promise<StudentPayment[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('student_payments')
    .select(`
      *,
      users!student_payments_collected_by_fkey (name)
    `)
    .eq('enrollment_id', enrollmentId)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  if (error) throw error

  return (data || []).map(mapPaymentRow)
}

export async function getStudentPaymentById(paymentId: string): Promise<StudentPayment | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('student_payments')
    .select(`
      *,
      users!student_payments_collected_by_fkey (name)
    `)
    .eq('id', paymentId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapPaymentRow(data as PaymentRow)
}

export async function createStudentPayment(
  enrollmentId: string,
  input: CreateStudentPaymentInput,
  collectedBy?: string
): Promise<StudentPayment> {
  const supabase = await createAdminClient()

  const insertData: Record<string, unknown> = {
    enrollment_id: enrollmentId,
    amount: input.amount,
    payment_method: input.paymentMethod,
    payment_date: input.paymentDate || new Date().toISOString().split('T')[0],
    receipt_number: input.receiptNumber || null,
    notes: input.notes || null,
    collected_by: collectedBy || null,
  }

  const { data, error } = await supabase
    .from('student_payments')
    .insert(insertData)
    .select(`
      *,
      users!student_payments_collected_by_fkey (name)
    `)
    .single()

  if (error) throw error

  return mapPaymentRow(data as PaymentRow)
}

export async function updateStudentPayment(
  paymentId: string,
  input: UpdateStudentPaymentInput
): Promise<StudentPayment> {
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = {}

  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.paymentMethod !== undefined) updateData.payment_method = input.paymentMethod
  if (input.paymentDate !== undefined) updateData.payment_date = input.paymentDate
  if (input.receiptNumber !== undefined) updateData.receipt_number = input.receiptNumber || null
  if (input.notes !== undefined) updateData.notes = input.notes || null

  const { data, error } = await supabase
    .from('student_payments')
    .update(updateData)
    .eq('id', paymentId)
    .is('deleted_at', null)
    .select(`
      *,
      users!student_payments_collected_by_fkey (name)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Payment not found')
    throw error
  }

  return mapPaymentRow(data as PaymentRow)
}

export async function deleteStudentPayment(paymentId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('student_payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) throw error
}

export async function getStudentPaymentSummary(enrollmentId: string): Promise<StudentPaymentSummary> {
  const supabase = await createAdminClient()

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('student_enrollments')
    .select('total_fee, paid_amount, remaining_balance')
    .eq('id', enrollmentId)
    .is('deleted_at', null)
    .single()

  if (enrollmentError && enrollmentError.code !== 'PGRST116') throw enrollmentError

  const payments = await getStudentPayments(enrollmentId)

  return {
    totalFee: enrollment?.total_fee || 0,
    totalPaid: enrollment?.paid_amount || 0,
    remainingBalance: enrollment?.remaining_balance || 0,
    payments,
  }
}

export async function updateEnrollmentTotalFee(enrollmentId: string, totalFee: number): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('student_enrollments')
    .update({ total_fee: totalFee })
    .eq('id', enrollmentId)
    .is('deleted_at', null)

  if (error) throw error
}