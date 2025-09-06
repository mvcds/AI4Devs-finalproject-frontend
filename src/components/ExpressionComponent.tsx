'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Chip } from './Chip'
import { TransactionResponseDto } from '@/services/api'

interface ExpressionComponentProps {
  options: TransactionResponseDto[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  excludeTransactionId?: string
}

interface ParsedSegment {
  type: 'text' | 'chip'
  content: string
  transactionId?: string
}

export const ExpressionComponent: React.FC<ExpressionComponentProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Type expression...',
  className = '',
  excludeTransactionId
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [localValue, setLocalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Parse the value string into segments (text and chips)
  const parseValue = (val: string): ParsedSegment[] => {
    const segments: ParsedSegment[] = []
    const chipRegex = /\$([a-zA-Z0-9-]+)/g
    let lastIndex = 0
    let match

    while ((match = chipRegex.exec(val)) !== null) {
      // Add text before the chip
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: val.substring(lastIndex, match.index)
        })
      }

      // Add the chip
      segments.push({
        type: 'chip',
        content: match[0], // The full match like "$ID_1"
        transactionId: match[1] // Just the ID part
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < val.length) {
      segments.push({
        type: 'text',
        content: val.substring(lastIndex)
      })
    }

    return segments
  }

  // Convert segments back to string
  const segmentsToString = (segments: ParsedSegment[]): string => {
    return segments.map(segment => segment.content).join('')
  }

  // Get transaction by ID
  const getTransactionById = (id: string): TransactionResponseDto | undefined => {
    return options.find(option => option.id === id)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    setLocalValue(newValue)
    onChange(newValue)
    setCursorPosition(cursorPos)

    // Check if user typed "$" and show dropdown
    if (newValue.endsWith('$') && !showDropdown) {
      setShowDropdown(true)
      setSelectedIndex(0)
    } else if (!newValue.includes('$') && showDropdown) {
      setShowDropdown(false)
    }
  }

  // Handle chip selection
  const handleChipSelect = (transaction: TransactionResponseDto) => {
    const currentValue = localValue
    const lastDollarIndex = currentValue.lastIndexOf('$')
    
    if (lastDollarIndex !== -1) {
      // Replace the "$" with "$ID"
      const newValue = currentValue.substring(0, lastDollarIndex) + `$${transaction.id}` + currentValue.substring(lastDollarIndex + 1)
      setLocalValue(newValue)
      onChange(newValue)
      
      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = lastDollarIndex + transaction.id.length + 1 // +1 for the "$"
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
    
    setShowDropdown(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredOptions[selectedIndex]) {
            handleChipSelect(filteredOptions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowDropdown(false)
          break
      }
    }
  }

  // Handle chip deletion (backspace on chip)
  const handleKeyDownWithChipDeletion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const cursorPos = e.currentTarget.selectionStart || 0
      const segments = parseValue(localValue)
      let currentPos = 0
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const segmentEnd = currentPos + segment.content.length
        
        if (cursorPos >= currentPos && cursorPos <= segmentEnd) {
          if (segment.type === 'chip') {
            // Delete the entire chip
            e.preventDefault()
            const newSegments = segments.filter((_, index) => index !== i)
            const newValue = segmentsToString(newSegments)
            setLocalValue(newValue)
            onChange(newValue)
            
            // Set cursor position after deletion
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.setSelectionRange(currentPos, currentPos)
              }
            }, 0)
            return
          }
        }
        
        currentPos = segmentEnd
      }
    }
    
    handleKeyDown(e)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const segments = parseValue(value)

  // Filter out the excluded transaction from options
  const filteredOptions = excludeTransactionId 
    ? options.filter(option => option.id !== excludeTransactionId)
    : options

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input for actual value - completely hidden */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownWithChipDeletion}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="absolute opacity-0 pointer-events-none w-full px-3 py-2"
        data-testid="expression-input"
      />

      {/* Visual representation with chips - now interactive */}
      <div 
        className={`w-full px-3 py-2 border rounded-md min-h-[42px] cursor-text transition-colors ${
          isFocused 
            ? 'border-blue-500 ring-2 ring-blue-500' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {segments.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {segments.map((segment, index) => {
              if (segment.type === 'chip') {
                const transaction = getTransactionById(segment.transactionId || '')
                if (transaction) {
                  return (
                    <Chip
                      key={index}
                      transaction={transaction}
                      value={segment.transactionId || ''}
                      className="pointer-events-none"
                    />
                  )
                }
              }
              return (
                <span key={index} className="whitespace-pre">
                  {segment.content}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Transaction dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 w-full"
          data-testid="transaction-dropdown"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No transactions available</div>
          ) : (
            filteredOptions.map((transaction, index) => (
              <button
                key={transaction.id}
                onClick={() => handleChipSelect(transaction)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                data-testid={`transaction-option-${transaction.id}`}
              >
                <div className="font-medium text-sm">{transaction.description}</div>
                {transaction.normalizedAmount !== undefined && (
                  <div className="text-xs text-gray-500">
                    ${Math.abs(transaction.normalizedAmount).toFixed(2)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}