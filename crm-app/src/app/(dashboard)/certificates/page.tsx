'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockCertificates, mockStudents } from '@/lib/mock-data'
import { CERTIFICATE_TYPES, CERTIFICATE_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { canViewAllCertificates, canIssueCertificate } from '@/lib/permissions'
import { Award, Eye, Download, Plus, Search, ExternalLink, Shield } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

export default function CertificatesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  if (!user) return null

  const canIssue = canIssueCertificate(user)

  const filteredCertificates = useMemo(() => {
    return mockCertificates.filter(cert => {
      const matchesSearch = cert.studentName.toLowerCase().includes(search.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(search.toLowerCase())
      const matchesType = !typeFilter || cert.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter])

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      completion: 'bg-blue-100 text-blue-800',
      excellence: 'bg-yellow-100 text-yellow-800',
      attendance: 'bg-green-100 text-green-800',
      participation: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <PermissionGuard check={canViewAllCertificates} fallbackMessage="You don't have permission to view certificates.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Certificates</h1>
            <p className="text-muted-foreground">{filteredCertificates.length} certificates issued</p>
          </div>
          {canIssue && (
            <Link href="/certificates/issue">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Issue Certificate
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {CERTIFICATE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {filteredCertificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates found"
            description="Certificates will appear here after they are issued."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <Badge className={getTypeColor(cert.type)}>{cert.type}</Badge>
                    </div>
                    {cert.grade && (
                      <Badge className="bg-green-100 text-green-800">{cert.grade}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{cert.studentName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{cert.courseName}</p>
                    <p className="text-xs text-muted-foreground">{cert.batchName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Certificate #</p>
                      <p className="font-mono text-xs">{cert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issued</p>
                      <p>{formatDate(cert.issueDate)}</p>
                    </div>
                  </div>

                  {cert.score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <span className="font-medium">{cert.score}%</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/certificates/${cert.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Shield className="h-3 w-3" />
                    <span className="font-mono">{cert.verificationCode}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}