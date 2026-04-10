'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { canViewAllBugs, canManageBugs, canDeleteBugScreenshot } from '@/lib/client-permissions'
import { getBugs, updateBugStatus, deleteBugScreenshot, deleteBug } from '@/lib/api/bugs'
import { getErrorMessage } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Bug, Loader2, Trash2, X, ExternalLink, User, Clock, AlertTriangle } from 'lucide-react'
import type { Bug as BugType, BugStatus, BugSeverity } from '@/types/bug'

const STATUS_COLORS: Record<BugStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}

const STATUS_LABELS: Record<BugStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

const SEVERITY_COLORS: Record<BugSeverity, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-500 text-white',
}

const SEVERITY_LABELS: Record<BugSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export default function BugsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bugs, setBugs] = useState<BugType[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '' as BugStatus | '',
    severity: '' as BugSeverity | '',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Check permissions
  const canView = user && canViewAllBugs(user)
  const canManage = user && canManageBugs(user)
  const canDeleteScreenshot = user && canDeleteBugScreenshot(user)

  useEffect(() => {
    if (canView) {
      fetchBugs()
    }
  }, [filters.status, filters.severity, pagination.page])

  const fetchBugs = async () => {
    try {
      setLoading(true)
      const result = await getBugs({
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        search: filters.search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      setBugs(result.data)
      setPagination((prev) => ({ ...prev, total: result.pagination.total, totalPages: result.pagination.totalPages }))
    } catch (error) {
      toast({
        title: 'Failed to load bugs',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    try {
      await updateBugStatus(bugId, newStatus)
      toast({ title: 'Status updated' })
      fetchBugs()
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    }
  }

  const handleDeleteScreenshot = async (bugId: string) => {
    if (!confirm('Delete this screenshot to save storage?')) return
    try {
      await deleteBugScreenshot(bugId)
      toast({ title: 'Screenshot deleted' })
      fetchBugs()
    } catch (error) {
      toast({
        title: 'Failed to delete screenshot',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm('Delete this bug report?')) return
    try {
      await deleteBug(bugId)
      toast({ title: 'Bug deleted' })
      fetchBugs()
    } catch (error) {
      toast({
        title: 'Failed to delete bug',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    }
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view bug reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bug Reports</h1>
          <p className="text-muted-foreground">Manage and track bug reports from users</p>
        </div>
        <button
          onClick={() => fetchBugs()}
          className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as BugStatus | '' })}
          className="h-10 px-3 border rounded-md text-sm"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value as BugSeverity | '' })}
          className="h-10 px-3 border rounded-md text-sm"
        >
          <option value="">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && fetchBugs()}
          placeholder="Search bugs..."
          className="h-10 px-3 border rounded-md text-sm w-64"
        />

        <button
          onClick={() => {
            setFilters({ status: '', severity: '', search: '' })
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          className="h-10 px-4 text-sm border rounded-md hover:bg-muted transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <div className="text-center">
            <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No bugs found</h3>
            <p className="text-muted-foreground">No bug reports match your filters.</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {bugs.map((bug) => (
            <div key={bug.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title and badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[bug.status]}`}
                    >
                      {STATUS_LABELS[bug.status]}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${SEVERITY_COLORS[bug.severity]}`}
                    >
                      {SEVERITY_LABELS[bug.severity]}
                    </span>
                    {bug.screenshotUrl && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                        Screenshot
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-medium mb-1">{bug.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {bug.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {bug.reporterName || bug.reporterEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(bug.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{bug.pageUrl}</span>
                    </div>
                    {bug.assignedToName && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Assigned:</span>
                        {bug.assignedToName}
                      </div>
                    )}
                  </div>

                  {/* Error context */}
                  {bug.errorContext && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      <span className="font-medium">Error:</span> {bug.errorContext}
                    </div>
                  )}

                  {/* Screenshot preview */}
                  {bug.screenshotUrl && (
                    <div className="mt-2">
                      <img
                        src={bug.screenshotUrl}
                        alt="Bug screenshot"
                        className="max-h-40 rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(bug.screenshotUrl!, '_blank')}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {canManage && (
                    <select
                      value={bug.status}
                      onChange={(e) => handleStatusChange(bug.id, e.target.value as BugStatus)}
                      className="h-8 px-2 border rounded text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  )}
                  {canDeleteScreenshot && bug.screenshotUrl && (
                    <button
                      onClick={() => handleDeleteScreenshot(bug.id)}
                      className="h-8 px-2 text-xs border rounded hover:bg-muted flex items-center gap-1"
                      title="Delete screenshot"
                    >
                      <X className="h-3 w-3" />
                      Screenshot
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => handleDeleteBug(bug.id)}
                      className="h-8 px-2 text-xs border rounded hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}