'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select } from '@/components/ui/select'

import { INTERN_STATUSES, INTERNSHIP_DURATIONS } from '@/lib/constants'
import { formatDate, getErrorMessage, getInitials } from '@/lib/utils'
import { canManageAssignedEmployees, canManageEmployees } from '@/lib/permissions'
import { hasPermission } from '@/lib/client-permissions'
import {
  Briefcase,
  Mail,
  Phone,
  Building,
  Calendar,
  ExternalLink,
  Clock,
  User,
  GraduationCap,
  Code,
  Award,
  ArrowLeft,
  Check,
  X,
  FileText,
  Users,
  Edit2,
  Save,
  Loader2,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { approveIntern, getInternById, rejectIntern, updateIntern } from '@/lib/api/interns'
import { getAssignableUsers, type AssignableUser } from '@/lib/api/employees'
import type { Intern } from '@/types/intern'
import { useToast } from '@/components/ui/toast'
import { ConvertToEmployeeModal } from '@/components/interns/convert-to-employee-modal'

export default function InternDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const internId = params.id as string
  const [intern, setIntern] = useState<Intern | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [managers, setManagers] = useState<AssignableUser[]>([])
  const [editingManager, setEditingManager] = useState(false)
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [savingManager, setSavingManager] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  const canManage =
    (user && canManageEmployees(user)) ||
    (user && canManageAssignedEmployees(user) && intern?.managedBy === user.id)
  const canApprove =
    (user && canManageEmployees(user)) ||
    (user && hasPermission(user, 'interns.approve')) ||
    (user && hasPermission(user, 'interns.manage_all'))
  const canConvert =
    (user && canManageEmployees(user)) ||
    (user && hasPermission(user, 'interns.convert_to_employee'))

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const response = await getInternById(internId)
        setIntern(response.data || null)
        setSelectedManager(response.data?.managedBy || '')
      } catch {
        setIntern(null)
      } finally {
        setLoading(false)
      }
    }

    if (internId) {
      run()
    }
  }, [internId])

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await getAssignableUsers()
        setManagers(res.data || [])
      } catch {
        // ignore
      }
    }

    if (canManage) {
      loadManagers()
    }
  }, [canManage])

  if (!user) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading intern profile...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!intern) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Intern not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!canApprove) return
    try {
      setActionLoading(true)
      const response = await approveIntern(intern.id)
      setIntern(response.data)
      toast({
        title: 'Intern approved',
        description: 'The intern has been approved successfully.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to approve intern'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!canApprove) return
    const reason = window.prompt('Please enter a rejection reason:')
    if (!reason || reason.trim().length < 5) {
      toast({
        title: 'Reason required',
        description: 'Please provide at least 5 characters for rejection reason.',
        variant: 'destructive',
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await rejectIntern(intern.id, reason.trim())
      setIntern(response.data)
      toast({
        title: 'Intern rejected',
        description: 'The intern application has been rejected.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to reject intern'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveManager = async () => {
    try {
      setSavingManager(true)
      const response = await updateIntern(intern.id, { managedBy: selectedManager || null })
      setIntern(response.data)
      setEditingManager(false)
      toast({
        title: 'Manager updated',
        description: selectedManager 
          ? `Assigned to ${managers.find(m => m.id === selectedManager)?.name || 'manager'}`
          : 'Manager assignment removed',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update manager'),
        variant: 'destructive',
      })
    } finally {
      setSavingManager(false)
    }
  }

  const statusConfig = INTERN_STATUSES.find(s => s.value === intern.status)
  const durationConfig = INTERNSHIP_DURATIONS.find(d => d.value === intern.duration)

  const getStatusColor = (color?: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    }
    return colors[color || 'gray'] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.name}`} />
              <AvatarFallback>{getInitials(intern.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{intern.name}</h1>
              <p className="text-muted-foreground">{intern.college} • {intern.degree}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(statusConfig?.color)}>
            {intern.status}
          </Badge>
          {intern.internshipType === 'paid' && intern.stipend && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              ₹{intern.stipend.toLocaleString()}/mo
            </Badge>
          )}
        </div>
      </div>

      {intern.approvalStatus === 'pending' && canApprove && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Pending Approval</span>
                <span className="text-sm text-orange-700">This intern application requires HR approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canConvert && intern && ['active', 'completed'].includes(intern.status) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Ready for Full-Time Role</span>
                <span className="text-sm text-green-700">
                  This intern is eligible to be converted to a full-time employee
                </span>
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowConvertModal(true)}
                disabled={actionLoading}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Convert to Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${intern.email}`} className="text-blue-600 hover:underline">
                      {intern.email}
                    </a>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${intern.phone}`} className="text-blue-600 hover:underline">
                      {intern.phone}
                    </a>
                  </div>
                </div>
                {intern.alternatePhone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Alternate Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{intern.alternatePhone}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {intern.skills.map((skill, i: number) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                {intern.resumeUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Resume</p>
                    <a href={intern.resumeUrl} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <FileText className="h-4 w-4" />
                      View Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {intern.linkedinUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <a href={intern.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {intern.portfolioUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Portfolio</p>
                    <a href={intern.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <ExternalLink className="h-4 w-4" />
                      View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">College/University</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{intern.college}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Degree/Course</p>
                  <span className="font-medium">{intern.degree}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Year</p>
                  <span className="font-medium">
                    {intern.year === 'passed' ? 'Passed Out' : `${intern.year}${intern.year === '1' ? 'st' : intern.year === '2' ? 'nd' : intern.year === '3' ? 'rd' : 'th'} Year`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {intern.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intern.notes}</p>
              </CardContent>
            </Card>
          )}

          {intern.performanceRating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.floor(intern.performanceRating!) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-sm font-medium">{intern.performanceRating}/5</span>
                  </div>
                </div>
                {intern.feedback && (
                  <p className="text-sm text-muted-foreground">{intern.feedback}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Internship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <Badge variant="outline" className="capitalize">{intern.department}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant={intern.internshipType === 'paid' ? 'default' : 'secondary'} className="capitalize">
                    {intern.internshipType}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{durationConfig?.label || intern.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="text-sm capitalize">{intern.source.replace('_', ' ')}</span>
                </div>
                {intern.stipend && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stipend</span>
                    <span className="text-sm font-medium text-green-600">₹{intern.stipend.toLocaleString()}/month</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm">{intern.startDate ? formatDate(intern.startDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expected End</span>
                  <span className="text-sm">{intern.expectedEndDate ? formatDate(intern.expectedEndDate) : '-'}</span>
                </div>
                {intern.actualEndDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Actual End</span>
                    <span className="text-sm">{formatDate(intern.actualEndDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manager/Mentor
                </span>
                {canManage && !editingManager && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingManager(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingManager ? (
                <div className="space-y-3">
                  <Select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                  >
                    <option value="">Not assigned</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSaveManager}
                      disabled={savingManager}
                    >
                      {savingManager ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingManager(false)
                        setSelectedManager(intern.managedBy || '')
                      }}
                      disabled={savingManager}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : intern.managedBy ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${managers.find(m => m.id === intern.managedBy)?.name || 'default'}`} 
                    />
                    <AvatarFallback>
                      {getInitials(managers.find(m => m.id === intern.managedBy)?.name || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {managers.find(m => m.id === intern.managedBy)?.name || 'Unknown Manager'}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {managers.find(m => m.id === intern.managedBy)?.role || ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No manager assigned yet
                </p>
              )}
            </CardContent>
          </Card>

          {intern.supervisorName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supervisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.supervisorName}`} />
                    <AvatarFallback>{getInitials(intern.supervisorName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{intern.supervisorName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{intern.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(intern.createdAt)}</span>
              </div>
              {intern.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-sm">{formatDate(intern.approvedAt)}</span>
                </div>
              )}
              {intern.convertedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm">{formatDate(intern.convertedAt)}</span>
                </div>
              )}
              {intern.leadId && (
                <div className="pt-2">
                  <Link href={`/leads/${intern.leadId}`} className="text-sm text-blue-600 hover:underline">
                    View Original Lead →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Use the management actions above to approve or reject this intern. Full inline edit flow will be
                  enabled in the next phase.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {intern && (
        <ConvertToEmployeeModal
          intern={intern}
          open={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onComplete={(employeeId) => {
            router.push(`/employees/${employeeId}`)
          }}
        />
      )}
    </div>
  )
}
