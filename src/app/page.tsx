'use client'

import React, { useState, useEffect } from 'react'
import { TransactionForm, TransactionFormData } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { SummaryCards } from '../components/SummaryCards'
import { transactionsApi, categoriesApi, TransactionResponseDto, CreateTransactionDto, UpdateTransactionDto, CategoryResponseDto, TransactionSummaryDto } from '@/services/api'

export default function Home() {
  const [transactions, setTransactions] = useState<TransactionResponseDto[]>([])
  const [summary, setSummary] = useState<import('../components/SummaryCards').TransactionSummary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormData | null>(null)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])


  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [transactionsData, summaryData, categoriesData] = await Promise.all([
          transactionsApi.transactionControllerFindAll(),
          transactionsApi.transactionControllerGetSummary(),
          categoriesApi.categoryControllerFindAll(),
        ])
        setTransactions(transactionsData)
        setSummary(summaryData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to empty state
        setTransactions([])
        setSummary({
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          count: 0,
        })
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCreateTransaction = async (data: TransactionFormData) => {
    try {
      setIsLoading(true)
      const newTransaction = await transactionsApi.transactionControllerCreate({ 
        createTransactionDto: {
          ...data,
          frequency: data.frequency as CreateTransactionDto['frequency']
        }
      })
      
      // Ensure the new transaction has categoryName populated
      const category = categories.find(cat => cat.id === newTransaction.categoryId)
      const transactionWithCategory = {
        ...newTransaction,
        categoryName: category?.name || 'Unknown Category'
      }
      
      setTransactions(prev => [transactionWithCategory, ...prev])
      
      // Refresh summary
      const summaryData = await transactionsApi.transactionControllerGetSummary()
      setSummary(summaryData)
      
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTransaction = async (data: TransactionFormData) => {
    if (!editingTransactionId) return

    try {
      setIsLoading(true)
      
      const updatedTransaction = await transactionsApi.transactionControllerUpdate({ 
        id: editingTransactionId, 
        updateTransactionDto: {
          ...data,
          frequency: data.frequency as UpdateTransactionDto['frequency']
        }
      })
      
      // Ensure the updated transaction has categoryName populated
      const category = categories.find(cat => cat.id === updatedTransaction.categoryId)
      const transactionWithCategory = {
        ...updatedTransaction,
        categoryName: category?.name || 'Unknown Category'
      }
      
      setTransactions(prev => 
        prev.map(t => t.id === editingTransactionId ? transactionWithCategory : t)
      )
      
      // Refresh summary
      const summaryData = await transactionsApi.transactionControllerGetSummary()
      setSummary(summaryData)
      
      setEditingTransaction(null)
      setEditingTransactionId(null)
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
      await transactionsApi.transactionControllerRemove({ id })
      
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      // Refresh summary
      const summaryData = await transactionsApi.transactionControllerGetSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      alert('Failed to delete transaction. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (transaction: TransactionResponseDto) => {
    // Convert TransactionResponseDto to TransactionFormData format
    const formData: TransactionFormData = {
      description: transaction.description,
      expression: typeof transaction.expression === 'string' ? transaction.expression : transaction.expression.toString(),
      categoryId: transaction.categoryId,
      notes: transaction.notes || '',
      frequency: transaction.frequency
    }
    setEditingTransaction(formData)
    setEditingTransactionId(transaction.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTransaction(null)
    setEditingTransactionId(null)
  }

  const handleCreateNew = () => {
    setEditingTransaction(null)
    setEditingTransactionId(null)
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
              categories={categories}
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
