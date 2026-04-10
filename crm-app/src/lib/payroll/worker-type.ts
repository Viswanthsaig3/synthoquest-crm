import type { User } from '@/types/user'
import type { WorkerType, WorkerClassification } from '@/types/payroll'

export function classifyWorker(user: User): WorkerClassification {
  const isIntern = user.role === 'intern'
  const isPaid = user.compensationType === 'paid' && (user.compensationAmount ?? 0) > 0

  let workerType: WorkerType
  let label: string

  if (isIntern && isPaid) {
    workerType = 'paid_intern'
    label = 'Paid Intern'
  } else if (isIntern && !isPaid) {
    workerType = 'unpaid_intern'
    label = 'Unpaid Intern'
  } else if (!isIntern && isPaid) {
    workerType = 'paid_employee'
    label = 'Paid Employee'
  } else {
    workerType = 'unpaid_employee'
    label = 'Unpaid Employee'
  }

  return {
    workerType,
    isPaid,
    isIntern,
    label,
  }
}

export function isWorkerPayrollEligible(user: User): boolean {
  const { isPaid } = classifyWorker(user)
  return isPaid && user.status === 'active'
}
