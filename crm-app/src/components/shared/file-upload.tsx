'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileIcon, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  existingFiles?: { id: string; fileName: string; fileSize: number }[]
  onRemoveExisting?: (id: string) => void
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
}

export function FileUpload({
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setError(null)

    const totalFiles = files.length + existingFiles.length + selectedFiles.length
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed ${Math.round(maxSize / 1024 / 1024)}MB limit`)
      return
    }

    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)
    onFilesChange(newFiles)
    
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      
      <label
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "border-gray-300 hover:border-primary hover:bg-muted/50"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
          </p>
        </div>
      </label>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {(existingFiles.length > 0 || files.length > 0) && (
        <div className="space-y-2">
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(file.fileSize)})
                </span>
              </div>
              {onRemoveExisting && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExisting(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}