import { Certificate, CertificationRecord } from '@/types/certificate'
import { generateId } from '@/lib/utils'

export const mockCertificates: Certificate[] = [
  {
    id: 'cert_1',
    certificateNumber: 'SQ-CERT-2024-001',
    studentId: 'stu_4',
    studentName: 'Vikram Rathore',
    enrollmentId: 'enr_4',
    courseName: 'Network Security',
    batchName: 'NS-2023-B2',
    type: 'completion',
    status: 'issued',
    issueDate: new Date('2024-01-05'),
    grade: 'A',
    score: 92,
    instructorId: 'usr_3',
    instructorName: 'Vikram Singh',
    verificationCode: 'SQ-2024-NS-001-VF3K9',
    certificateUrl: '/certificates/SQ-CERT-2024-001.pdf',
    issuedBy: 'usr_1',
    createdAt: new Date('2024-01-05'),
  },
  {
    id: 'cert_2',
    certificateNumber: 'SQ-CERT-2024-002',
    studentId: 'stu_9',
    studentName: 'Divya Chandran',
    enrollmentId: 'enr_10',
    courseName: 'CompTIA Security+',
    batchName: 'CompTIA-2023-B3',
    type: 'completion',
    status: 'issued',
    issueDate: new Date('2024-01-15'),
    grade: 'A+',
    score: 95,
    instructorId: 'usr_1',
    instructorName: 'Arjun Sharma',
    verificationCode: 'SQ-2024-CS-002-VF7M2',
    certificateUrl: '/certificates/SQ-CERT-2024-002.pdf',
    issuedBy: 'usr_1',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'cert_3',
    certificateNumber: 'SQ-CERT-2024-003',
    studentId: 'stu_1',
    studentName: 'Meera Krishnan',
    enrollmentId: 'enr_1',
    courseName: 'Ethical Hacking',
    batchName: 'EH-2024-B1',
    type: 'excellence',
    status: 'issued',
    issueDate: new Date('2024-03-15'),
    grade: 'A+',
    score: 98,
    instructorId: 'usr_4',
    instructorName: 'Ananya Iyer',
    verificationCode: 'SQ-2024-EH-003-VF2P8',
    issuedBy: 'usr_1',
    createdAt: new Date('2024-03-15'),
  },
]

export const mockCertificationRecords: CertificationRecord[] = [
  {
    id: 'crec_1',
    studentId: 'stu_5',
    studentName: 'Priya Nair',
    externalCertification: 'AWS Solutions Architect',
    issuingAuthority: 'Amazon Web Services',
    certificateNumber: 'AWS-SA-123456',
    issueDate: new Date('2023-06-15'),
    expiryDate: new Date('2026-06-15'),
    verificationUrl: 'https://aws.amazon.com/verification/123456',
    addedAt: new Date('2024-01-08'),
  },
  {
    id: 'crec_2',
    studentId: 'stu_2',
    studentName: 'Rajesh Kumar',
    externalCertification: 'Microsoft Azure Administrator',
    issuingAuthority: 'Microsoft',
    certificateNumber: 'MS-AZ104-789012',
    issueDate: new Date('2023-09-20'),
    expiryDate: new Date('2024-09-20'),
    verificationUrl: 'https://learn.microsoft.com/verify/789012',
    addedAt: new Date('2024-01-15'),
  },
  {
    id: 'crec_3',
    studentId: 'stu_8',
    studentName: 'Karthik Suresh',
    externalCertification: 'CCNA Security',
    issuingAuthority: 'Cisco',
    certificateNumber: 'CISCO-SEC-456789',
    issueDate: new Date('2022-12-10'),
    expiryDate: new Date('2025-12-10'),
    addedAt: new Date('2024-01-05'),
  },
]

export function getCertificatesByStudent(studentId: string): Certificate[] {
  return mockCertificates.filter(cert => cert.studentId === studentId)
}

export function getCertificateByEnrollment(enrollmentId: string): Certificate | undefined {
  return mockCertificates.find(cert => cert.enrollmentId === enrollmentId)
}

export function getExternalCertsByStudent(studentId: string): CertificationRecord[] {
  return mockCertificationRecords.filter(rec => rec.studentId === studentId)
}

export function getRecentCertificates(limit: number = 10): Certificate[] {
  return [...mockCertificates]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, limit)
}

export function verifyCertificate(verificationCode: string): Certificate | undefined {
  return mockCertificates.find(cert => cert.verificationCode === verificationCode)
}