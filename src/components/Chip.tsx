'use client'

import React, { useState } from 'react'
import { TransactionResponseDto } from '@/services/api'

interface ChipProps {
  transaction: TransactionResponseDto
  value: string // Transaction ID
  className?: string
}

export const Chip: React.FC<ChipProps> = ({ 
  transaction, 
  value, 
  className = '' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount)
    if (amount === 0) {
      return `$${absAmount.toFixed(2)}`
    }
    const sign = amount > 0 ? '+' : '-'
    return `${sign}$${absAmount.toFixed(2)}`
  }

  const isIncome = transaction.amount > 0
  const isExpense = transaction.amount < 0

  // Color classes based on transaction type
  const getColorClasses = () => {
    if (isIncome) {
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
    } else if (isExpense) {
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
          transition-colors duration-200 cursor-default
          ${getColorClasses()}
          ${className}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        data-testid="transaction-chip"
        data-transaction-id={value}
      >
        {transaction.description}
      </div>

      {/* Tooltip showing normalized amount */}
      {showTooltip && transaction.normalizedAmount !== undefined && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap"
          data-testid="chip-tooltip"
        >
          <div className="text-center">
            <div className="font-medium">Monthly Equivalent</div>
            <div className={`font-semibold ${
              transaction.normalizedAmount > 0 
                ? 'text-green-400' 
                : transaction.normalizedAmount < 0 
                ? 'text-red-400' 
                : 'text-gray-400'
            }`}>
              {formatAmount(transaction.normalizedAmount)}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}
