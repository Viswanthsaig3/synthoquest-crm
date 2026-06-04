export function exportToCSV(data: any[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Auto-generate columns from first row if not provided
  const exportColumns = columns || Object.keys(data[0]).map(key => ({
    key,
    label: formatLabel(key),
  }))

  // Create CSV header
  const header = exportColumns.map(col => col.label).join(',')

  // Create CSV rows
  const rows = data.map(row => 
    exportColumns.map(col => {
      const value = row[col.key]
      // Handle special cases
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }).join(',')
  )

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateForExport(date: Date | string): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}