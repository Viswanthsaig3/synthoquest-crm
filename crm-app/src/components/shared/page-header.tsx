'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Search, Plus, Download } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  search?: {
    placeholder: string
    value: string
    onChange: (value: string) => void
  }
  filters?: {
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }[]
  exportData?: boolean
}

export function PageHeader({
  title,
  description,
  action,
  search,
  filters,
  exportData,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {exportData && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} asChild={!!action.href}>
              {action.href ? (
                <Link href={action.href}>
                  <Plus className="h-4 w-4 mr-2" />
                  {action.label}
                </Link>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {action.label}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {(search || filters) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {search && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={search.placeholder}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          {filters?.map((filter, index) => (
            <Select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="">{filter.placeholder || 'All'}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ))}
        </div>
      )}
    </div>
  )
}