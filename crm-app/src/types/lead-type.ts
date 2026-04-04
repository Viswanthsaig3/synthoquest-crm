export type LeadTypeCode = 'student' | 'intern' | 'custom'

export type FieldType = 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'date' | 'textarea' | 'url' | 'number' | 'checkbox'

export type ConversionTarget = 'student' | 'intern' | 'employee' | 'partnership' | 'none'

export interface LeadTypeFieldOption {
  value: string
  label: string
}

export interface LeadTypeField {
  id: string
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required: boolean
  options?: LeadTypeFieldOption[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
  defaultValue?: string | number | boolean | string[]
  order: number
}

export interface LeadTypeStatus {
  id: string
  value: string
  label: string
  color: string
  description?: string
  order: number
  isInitial?: boolean
  isFinal?: boolean
  allowedTransitions?: string[]
}

export interface LeadTypeSource {
  id: string
  value: string
  label: string
  description?: string
}

export interface LeadType {
  id: string
  code: LeadTypeCode
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
  isSystem: boolean
  fields: LeadTypeField[]
  statuses: LeadTypeStatus[]
  sources: LeadTypeSource[]
  conversionTarget: ConversionTarget
  approvalRequired: boolean
  approverRoles: string[]
  assignToRoles: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface LeadTypeSummary {
  id: string
  name: string
  code: LeadTypeCode
  icon: string
  color: string
  totalLeads: number
  activeLeads: number
  convertedLeads: number
}

export type CustomFieldValue = string | number | boolean | string[] | null | undefined

export interface CustomFieldsData {
  [fieldId: string]: CustomFieldValue
}