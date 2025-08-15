'use client'

import React, { useState, useEffect } from 'react'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { SummaryCards } from '../components/SummaryCards'
import { apiService, Transaction, CreateTransactionData, UpdateTransactionData } from '../services/api'

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<import('../components/SummaryCards').TransactionSummary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [transactionsData, summaryData] = await Promise.all([
          apiService.getTransactions(),
          apiService.getTransactionSummary(),
        ])
        setTransactions(transactionsData.transactions)
        setSummary(summaryData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to empty state
        setTransactions([])
        setSummary({
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          transactionCount: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      setIsLoading(true)
      const newTransaction = await apiService.createTransaction(data)
      setTransactions(prev => [newTransaction, ...prev])
      
      // Refresh summary
      const summaryData = await apiService.getTransactionSummary()
      setSummary(summaryData)
      
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTransaction = async (data: UpdateTransactionData) => {
    if (!editingTransaction) return

    try {
      setIsLoading(true)
      const updatedTransaction = await apiService.updateTransaction(editingTransaction.id, data)
      
      setTransactions(prev => 
        prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t)
      )
      
      // Refresh summary
      const summaryData = await apiService.getTransactionSummary()
      setSummary(summaryData)
      
      setEditingTransaction(null)
    } catch (error) {
      console.error('Failed to update transaction:', error)
      alert('Failed to update transaction. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      setIsLoading(true)
      await apiService.deleteTransaction(id)
      
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      // Refresh summary
      const summaryData = await apiService.getTransactionSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      alert('Failed to delete transaction. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  const handleCreateNew = () => {
    setEditingTransaction(null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Personal Finance Manager</h1>
          <p className="mt-2 text-gray-600">
            Track your income and expenses with ease
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction List */}
          <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <TransactionList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDeleteTransaction}
              onCreateNew={handleCreateNew}
              isLoading={isLoading}
            />
          </div>

          {/* Transaction Form - Right Side */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <TransactionForm
                  onSubmit={editingTransaction ? handleEditTransaction : handleCreateTransaction}
                  onCancel={handleCancel}
                  initialData={editingTransaction || undefined}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
