export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  courseId?: string
  batchId?: string
  instructorId?: string
  source?: string
  status?: string
}

export interface ConversionReport {
  period: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  lostLeads: number
  pendingLeads: number
  bySource: SourceConversion[]
  byCourse: CourseConversion[]
}

export interface SourceConversion {
  source: string
  total: number
  converted: number
  rate: number
}

export interface CourseConversion {
  course: string
  total: number
  converted: number
  rate: number
  revenue: number
}

export interface RevenueReport {
  period: string
  totalRevenue: number
  totalCollected: number
  totalPending: number
  byCourse: CourseRevenue[]
  byMonth: MonthlyRevenue[]
  byPaymentMethod: PaymentMethodRevenue[]
}

export interface CourseRevenue {
  course: string
  enrolled: number
  totalFee: number
  collected: number
  pending: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  collected: number
  pending: number
}

export interface PaymentMethodRevenue {
  method: string
  count: number
  amount: number
}

export interface BatchReport {
  batchId: string
  batchName: string
  course: string
  instructor: string
  enrolled: number
  capacity: number
  occupancyRate: number
  startDate: Date
  endDate: Date
  status: string
}

export interface StudentReport {
  totalStudents: number
  activeStudents: number
  completedStudents: number
  droppedStudents: number
  byCourse: CourseEnrollment[]
  byStatus: StatusCount[]
}

export interface CourseEnrollment {
  course: string
  enrolled: number
  completed: number
  dropped: number
}

export interface StatusCount {
  status: string
  count: number
}