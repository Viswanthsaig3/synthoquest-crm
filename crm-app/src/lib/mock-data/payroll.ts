import { PayrollRecord } from '@/types/payroll'

export const mockPayroll: PayrollRecord[] = [
  // Rahul Kumar (usr_5) - Sales Rep
  {
    id: 'pay_1',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    month: 'January',
    year: 2024,
    salary: {
      basic: 30000,
      hra: 9000,
      allowances: 6000,
      deductions: 2000,
      gross: 45000,
      net: 43000,
    },
    daysWorked: 22,
    daysInMonth: 22,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'paid',
    generatedAt: new Date('2024-01-28'),
    paidAt: new Date('2024-01-31'),
  },
  // Sneha Reddy (usr_6) - Sales Rep
  {
    id: 'pay_2',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    month: 'January',
    year: 2024,
    salary: {
      basic: 32000,
      hra: 9600,
      allowances: 6400,
      deductions: 2200,
      gross: 48000,
      net: 45800,
    },
    daysWorked: 21,
    daysInMonth: 22,
    leavesTaken: 1,
    unpaidLeaves: 0,
    status: 'paid',
    generatedAt: new Date('2024-01-28'),
    paidAt: new Date('2024-01-31'),
  },
  // Amit Verma (usr_7) - Employee (Training)
  {
    id: 'pay_3',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    month: 'January',
    year: 2024,
    salary: {
      basic: 35000,
      hra: 10500,
      allowances: 6500,
      deductions: 2500,
      gross: 52000,
      net: 49500,
    },
    daysWorked: 20,
    daysInMonth: 22,
    leavesTaken: 2,
    unpaidLeaves: 0,
    status: 'processed',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // Kavitha Nair (usr_8) - Employee (Marketing)
  {
    id: 'pay_4',
    employeeId: 'usr_8',
    employeeName: 'Kavitha Nair',
    month: 'January',
    year: 2024,
    salary: {
      basic: 31000,
      hra: 9300,
      allowances: 5700,
      deductions: 2100,
      gross: 46000,
      net: 43900,
    },
    daysWorked: 22,
    daysInMonth: 22,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'processed',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // Sanjay Gupta (usr_9) - Employee (Training)
  {
    id: 'pay_5',
    employeeId: 'usr_9',
    employeeName: 'Sanjay Gupta',
    month: 'January',
    year: 2024,
    salary: {
      basic: 33500,
      hra: 10050,
      allowances: 6450,
      deductions: 2400,
      gross: 50000,
      net: 47600,
    },
    daysWorked: 21,
    daysInMonth: 22,
    leavesTaken: 1,
    unpaidLeaves: 0,
    status: 'pending',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // Divya Krishnan (usr_10) - Sales Rep
  {
    id: 'pay_6',
    employeeId: 'usr_10',
    employeeName: 'Divya Krishnan',
    month: 'January',
    year: 2024,
    salary: {
      basic: 29500,
      hra: 8850,
      allowances: 5650,
      deductions: 2000,
      gross: 44000,
      net: 42000,
    },
    daysWorked: 22,
    daysInMonth: 22,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'pending',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // Manish Joshi (usr_11) - Employee (Marketing)
  {
    id: 'pay_7',
    employeeId: 'usr_11',
    employeeName: 'Manish Joshi',
    month: 'January',
    year: 2024,
    salary: {
      basic: 28000,
      hra: 8400,
      allowances: 5600,
      deductions: 1900,
      gross: 42000,
      net: 40100,
    },
    daysWorked: 22,
    daysInMonth: 22,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'pending',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // Pooja Menon (usr_12) - Employee (Training)
  {
    id: 'pay_8',
    employeeId: 'usr_12',
    employeeName: 'Pooja Menon',
    month: 'January',
    year: 2024,
    salary: {
      basic: 32000,
      hra: 9600,
      allowances: 6400,
      deductions: 2200,
      gross: 48000,
      net: 45800,
    },
    daysWorked: 22,
    daysInMonth: 22,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'pending',
    generatedAt: new Date('2024-01-28'),
    paidAt: null,
  },
  // December 2023 records
  {
    id: 'pay_9',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    month: 'December',
    year: 2023,
    salary: {
      basic: 30000,
      hra: 9000,
      allowances: 6000,
      deductions: 2000,
      gross: 45000,
      net: 43000,
    },
    daysWorked: 21,
    daysInMonth: 21,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'paid',
    generatedAt: new Date('2023-12-28'),
    paidAt: new Date('2023-12-31'),
  },
  {
    id: 'pay_10',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    month: 'December',
    year: 2023,
    salary: {
      basic: 32000,
      hra: 9600,
      allowances: 6400,
      deductions: 2200,
      gross: 48000,
      net: 45800,
    },
    daysWorked: 21,
    daysInMonth: 21,
    leavesTaken: 0,
    unpaidLeaves: 0,
    status: 'paid',
    generatedAt: new Date('2023-12-28'),
    paidAt: new Date('2023-12-31'),
  },
]

export function getPayrollByEmployee(employeeId: string): PayrollRecord[] {
  return mockPayroll.filter(p => p.employeeId === employeeId)
}

export function getPayrollById(id: string): PayrollRecord | undefined {
  return mockPayroll.find(p => p.id === id)
}

export function getPayrollByMonth(month: string, year: number): PayrollRecord[] {
  return mockPayroll.filter(p => p.month === month && p.year === year)
}

export function getAllPayroll(): PayrollRecord[] {
  return [...mockPayroll].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
}

export function getPayrollStats(): {
  totalPaid: number
  totalPending: number
  totalProcessed: number
  paidCount: number
  pendingCount: number
  processedCount: number
} {
  const paid = mockPayroll.filter(p => p.status === 'paid')
  const pending = mockPayroll.filter(p => p.status === 'pending')
  const processed = mockPayroll.filter(p => p.status === 'processed')
  
  return {
    totalPaid: paid.reduce((sum, p) => sum + p.salary.net, 0),
    totalPending: pending.reduce((sum, p) => sum + p.salary.net, 0),
    totalProcessed: processed.reduce((sum, p) => sum + p.salary.net, 0),
    paidCount: paid.length,
    pendingCount: pending.length,
    processedCount: processed.length,
  }
}

export function getPendingPayroll(): PayrollRecord[] {
  return mockPayroll.filter(p => p.status === 'pending')
}

export function getProcessedPayroll(): PayrollRecord[] {
  return mockPayroll.filter(p => p.status === 'processed')
}