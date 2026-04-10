'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { getInitials } from '@/lib/utils'
import { getRoleConfig, AVATAR_CONFIG, HIERARCHY_LAYOUT } from '@/config/hierarchy'
import type { HierarchyNode } from '@/lib/db/queries/users'
import { 
  ChevronDown, 
  ChevronRight,
  ArrowRightLeft,
  Users,
  UserCircle,
  Plus,
  Check,
  X,
  AlertCircle
} from 'lucide-react'

interface SimpleOrgChartProps {
  data: HierarchyNode[]
  allEmployees: HierarchyNode[]
  onReassign: (userId: string, newManagerId: string | null) => Promise<void>
  canEdit: boolean
  loading?: boolean
}

interface TreeNodeProps {
  node: HierarchyNode
  level: number
  allEmployees: HierarchyNode[]
  onReassign: (userId: string, newManagerId: string | null) => Promise<void>
  canEdit: boolean
  expanded: Set<string>
  onToggle: (id: string) => void
  refreshData: () => void
}

function TreeNode({ 
  node, 
  level, 
  allEmployees, 
  onReassign, 
  canEdit, 
  expanded, 
  onToggle,
  refreshData 
}: TreeNodeProps) {
  const isExpanded = expanded.has(node.id)
  const hasReports = node.reports.length > 0
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedManager, setSelectedManager] = useState('')
  const [isMoving, setIsMoving] = useState(false)

  const roleConfig = useMemo(() => getRoleConfig(node.role), [node.role])

  const handleMove = async () => {
    if (!selectedManager) return
    try {
      setIsMoving(true)
      await onReassign(node.id, selectedManager === 'root' ? null : selectedManager)
      setShowMoveDialog(false)
      setSelectedManager('')
      refreshData()
    } catch (error) {
      console.error('Move failed:', error)
    } finally {
      setIsMoving(false)
    }
  }

  // Get potential managers (everyone except current node)
  const potentialManagers = useMemo(() => 
    allEmployees.filter(emp => emp.id !== node.id),
    [allEmployees, node.id]
  )

  const indentStyle = { marginLeft: level * HIERARCHY_LAYOUT.indentSize }

  return (
    <div className="select-none">
      {/* Node Card */}
      <div 
        className={`
          group flex items-center gap-3 p-3 rounded-lg border-2 bg-white
          hover:shadow-md transition-all duration-200
          ${level === 0 ? 'border-l-4 border-l-indigo-500' : 'border-gray-200'}
          ${hasReports ? 'bg-gradient-to-r from-white to-gray-50' : ''}
        `}
        style={indentStyle}
      >
        {/* Expand/Collapse */}
        {hasReports ? (
          <button
            onClick={() => onToggle(node.id)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-8" />
        )}

        {/* Avatar */}
        <Avatar 
          className="shrink-0 border-2 border-white shadow-md"
          style={{ width: HIERARCHY_LAYOUT.avatarSize, height: HIERARCHY_LAYOUT.avatarSize }}
        >
          <AvatarImage src={AVATAR_CONFIG.getUrl(node.name)} />
          <AvatarFallback className="text-sm font-medium">
            {getInitials(node.name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{node.name}</p>
            {node.reportCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.reportCount} reports
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${roleConfig.bgColor} ${roleConfig.textColor} ${roleConfig.borderColor}`}
            >
              {roleConfig.label}
            </Badge>
            <span className="text-xs text-gray-500 capitalize">{node.department}</span>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              className={`h-9 ${roleConfig.textColor} border-current hover:bg-opacity-10`}
              style={{ 
                borderColor: roleConfig.hexBorder,
                backgroundColor: 'transparent'
              }}
              onClick={() => setShowMoveDialog(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Move
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasReports && isExpanded && (
        <div 
          className="mt-2 space-y-2"
          style={{ marginLeft: HIERARCHY_LAYOUT.nodeGap }}
        >
          {/* Add Member Button */}
          {canEdit && (
            <div 
              className="flex items-center gap-3 py-3 px-4 rounded-lg border-2 border-dashed border-green-300 bg-green-50/50 hover:bg-green-50 hover:border-green-400 cursor-pointer transition-all"
              style={{ marginLeft: HIERARCHY_LAYOUT.indentSize }}
              onClick={() => setShowMoveDialog(true)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">
                Add team member under {node.name}
              </span>
            </div>
          )}
          
          {/* Child Nodes */}
          {node.reports.map((report) => (
            <TreeNode
              key={report.id}
              node={report}
              level={level + 1}
              allEmployees={allEmployees}
              onReassign={onReassign}
              canEdit={canEdit}
              expanded={expanded}
              onToggle={onToggle}
              refreshData={refreshData}
            />
          ))}
        </div>
      )}

      {/* Move/Assign Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" style={{ color: roleConfig.hexBorder }} />
              {hasReports ? 'Add Team Member' : 'Change Manager'}
            </DialogTitle>
            <DialogDescription>
              {hasReports 
                ? `Select an employee to report to ${node.name}` 
                : `Select who ${node.name} should report to`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {hasReports ? 'Select Employee' : 'Select Manager'}
              </label>
              <Select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full"
              >
                <option value="">Choose employee...</option>
                {!hasReports && (
                  <option value="root">No manager (Root level)</option>
                )}
                {potentialManagers.map((emp) => {
                  const empConfig = getRoleConfig(emp.role)
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {empConfig.label}
                    </option>
                  )
                })}
              </Select>
            </div>
            
            {selectedManager && (
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: roleConfig.hexBg,
                  color: roleConfig.hexText 
                }}
              >
                {selectedManager === 'root' ? (
                  <><strong>{node.name}</strong> will become a root-level employee</>
                ) : hasReports ? (
                  <>
                    <strong>{potentialManagers.find(e => e.id === selectedManager)?.name}</strong> 
                    will report to <strong>{node.name}</strong>
                  </>
                ) : (
                  <>
                    <strong>{node.name}</strong> will report to 
                    <strong> {potentialManagers.find(e => e.id === selectedManager)?.name}</strong>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMove} 
              disabled={!selectedManager || isMoving}
              style={{ 
                backgroundColor: roleConfig.hexBorder,
                color: 'white'
              }}
            >
              {isMoving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SimpleOrgChart({ data, allEmployees, onReassign, canEdit, loading }: SimpleOrgChartProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const allIds = new Set<string>()
    const collectIds = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id)
        if (node.reports.length > 0) {
          collectIds(node.reports)
        }
      })
    }
    collectIds(data)
    setExpanded(allIds)
  }, [data])

  const collapseAll = useCallback(() => {
    setExpanded(new Set())
  }, [])

  const refreshData = useCallback(() => {
    window.location.reload()
  }, [])

  const totalEmployees = useMemo(() => {
    let count = 0
    const countAll = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        count++
        if (node.reports.length > 0) {
          countAll(node.reports)
        }
      })
    }
    countAll(data)
    return count
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <UserCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
        <p className="text-gray-500 mb-6">Add employees to start building your hierarchy</p>
      </div>
    )
  }

  // Check if everyone is at root level
  const allAtRoot = data.length === totalEmployees

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4 mr-1" />
            Collapse All
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {totalEmployees} employees total
        </div>
      </div>

      {/* Alert if all at root */}
      {allAtRoot && canEdit && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                All employees are at root level
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Click the <strong>&quot;Move&quot;</strong> button on any employee to assign them to a manager and build your hierarchy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree */}
      <div className="space-y-3">
        {data.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            allEmployees={allEmployees}
            onReassign={onReassign}
            canEdit={canEdit}
            expanded={expanded}
            onToggle={toggleExpand}
            refreshData={refreshData}
          />
        ))}
      </div>
    </div>
  )
}