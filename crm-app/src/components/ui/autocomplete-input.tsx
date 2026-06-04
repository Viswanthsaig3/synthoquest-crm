'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { getAutocompleteSuggestions, saveAutocompleteValue } from '@/lib/api/autocomplete'
import type { AutocompleteFieldType } from '@/lib/db/queries/autocomplete'

interface AutocompleteInputProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  fieldType: AutocompleteFieldType
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function AutocompleteInput({
  id,
  name,
  value,
  onChange,
  fieldType,
  placeholder,
  required,
  className,
  disabled,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load suggestions when value changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true)
          const res = await getAutocompleteSuggestions(fieldType, value)
          setSuggestions(res.data.map(s => s.value))
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Failed to load suggestions:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }, 200)
    } else {
      // Load top suggestions when empty
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true)
          const res = await getAutocompleteSuggestions(fieldType)
          setSuggestions(res.data.map(s => s.value))
          setShowSuggestions(true)
        } catch (error) {
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }, 100)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, fieldType])

  // Hide suggestions on blur (with delay to allow click)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      // Save the value when user finishes typing
      if (value.trim().length >= 2) {
        saveAutocompleteValue(fieldType, value.trim()).catch(console.error)
      }
    }, 200)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      onChange(suggestions[selectedIndex])
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0 || value.length >= 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={className}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}