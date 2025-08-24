import React from 'react'

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  transactionCount: number
}

interface SummaryCardsProps {
  summary: TransactionSummary | null
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="dashboard">
      <div className="bg-white p-6 rounded-lg shadow" data-testid="income-summary">
        <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          ${summary.totalIncome.toFixed(2)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow" data-testid="expenses-summary">
        <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
        <p className="mt-2 text-3xl font-bold text-red-600">
          -${summary.totalExpenses.toFixed(2)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow" data-testid="net-summary">
        <h3 className="text-sm font-medium text-gray-500">Net Amount</h3>
        <p className={`mt-2 text-3xl font-bold ${
          summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {summary.netAmount >= 0 ? '+' : ''}${summary.netAmount.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
