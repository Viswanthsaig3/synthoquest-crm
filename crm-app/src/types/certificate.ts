export type CertificateStatus = 'issued' | 'revoked'
export type CertificateType = 'completion' | 'excellence' | 'attendance' | 'participation'

export interface Certificate {
  id: string
  certificateNumber: string
  studentId: string
  studentName: string
  enrollmentId: string
  courseName: string
  batchName: string
  type: CertificateType
  status: CertificateStatus
  issueDate: Date
  validUntil?: Date
  grade?: string
  score?: number
  instructorId: string
  instructorName: string
  verificationCode: string
  certificateUrl?: string
  issuedBy: string
  createdAt: Date
  revokedAt?: Date
  revokeReason?: string
}

export interface CertificationRecord {
  id: string
  studentId: string
  studentName: string
  externalCertification: string
  issuingAuthority: string
  certificateNumber: string
  issueDate: Date
  expiryDate?: Date
  verificationUrl?: string
  documentUrl?: string
  addedAt: Date
}