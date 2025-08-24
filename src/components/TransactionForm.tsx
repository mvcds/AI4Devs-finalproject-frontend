'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, X } from 'lucide-react'
import { categoriesApi, CategoryResponseDto, FREQUENCIES, FREQUENCY_LABELS } from '@/services/api'

// Form validation schema
const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  expression: z.string().min(1, 'Expression is required').max(1000, 'Expression too long'),
  categoryId: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  frequency: z.string().min(1, 'Frequency is required')
})

export type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<TransactionFormData>
  isLoading?: boolean
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      description: initialData?.description || '',
      expression: initialData?.expression || '',
      categoryId: initialData?.categoryId || '',
      notes: initialData?.notes || '',
      frequency: initialData?.frequency || FREQUENCIES.MONTH,
    },
  })

  // Reset form when initialData changes (for edit mode) or when switching to create mode
  // Wait for categories to be loaded before resetting to ensure categoryId is properly set
  useEffect(() => {
    if (categories.length > 0) {
      if (initialData) {
        // Edit mode: populate form with transaction data
        reset({
          description: initialData.description || '',
          expression: initialData.expression || '',
          categoryId: initialData.categoryId || '',
          notes: initialData.notes || '',
          frequency: initialData.frequency || FREQUENCIES.MONTH,
        })
      } else {
        // Create mode: reset form to default values
        reset({
          description: '',
          expression: '',
          categoryId: '',
          notes: '',
          frequency: FREQUENCIES.MONTH,
        })
      }
    }
  }, [initialData, categories, reset])

  const watchedExpression = watch('expression')
  const watchedDescription = watch('description')

  // Calculate monthly equivalent for recurring transactions
  const calculatenormalizedAmount = (amount: number, frequency: string): number => {
    // Ensure amount is a valid number
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return 0;
    }
    
    // Safety check for invalid frequency
    if (!frequency || typeof frequency !== 'string') {
      return numAmount;
    }

    switch (frequency) {
      case FREQUENCIES.DAILY:
        return numAmount * 30 // Approximate days in month
      case FREQUENCIES.WEEK:
        return numAmount * 4.33 // Average weeks per month (52/12)
      case FREQUENCIES.FORTNIGHT:
        return numAmount * 2.17 // Average fortnights per month (26/12)
      case FREQUENCIES.MONTH:
        return numAmount
      case FREQUENCIES.TWO_MONTH:
        return numAmount / 2
      case FREQUENCIES.THREE_MONTH:
        return numAmount / 3
      case FREQUENCIES.QUARTER:
        return numAmount / 3
      case FREQUENCIES.HALF:
        return numAmount / 6
      case FREQUENCIES.YEAR:
        return numAmount / 12
      case FREQUENCIES.TWO_YEAR:
        return numAmount / 24
      default:
        return numAmount
    }
  }

  // Custom validation check since react-hook-form isValid might not work as expected
  const isFormValid = watchedDescription && watchedDescription.trim().length > 0 && 
                     watchedExpression && watchedExpression.trim().length > 0 && 
                     watch('categoryId') && watch('categoryId').trim().length > 0 &&
                     watch('frequency') && watch('frequency').trim().length > 0

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true)
      console.log('Form submitting with data:', data)
      console.log('Selected categoryId:', data.categoryId)
      await onSubmit(data)
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  // Parse expression to determine if it's income or expense
  const expressionValue = parseFloat(watchedExpression || '0') || 0
  const isIncome = expressionValue > 0
  const displayAmount = Math.abs(expressionValue)

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        setCategoriesError(null)
        const fetchedCategories = await categoriesApi.categoryControllerFindAll()
        setCategories(fetchedCategories)
      } catch (error) {
        setCategoriesError('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <input
            {...register('description')}
            type="text"
            id="description"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter transaction description"
            data-testid="description-input"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600" data-testid="error-message">{errors.description.message}</p>
          )}
        </div>

        {/* Expression */}
        <div>
          <label htmlFor="expression" className="block text-sm font-medium text-gray-700 mb-2">
            Value *
          </label>
          <input
            {...register('expression')}
            type="text"
            id="expression"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expression ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 5000, -200, @salary_id * 0.12"
            data-testid="expression-input"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a number (e.g., 5000 for income, -200 for expense) or an expression (e.g., @salary * 0.12)
          </p>
          {errors.expression && (
            <p className="mt-1 text-sm text-red-600" data-testid="error-message">{errors.expression.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register('categoryId')}
            id="categoryId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingCategories}
            data-testid="category-select"
          >
            <option value="">Select a category</option>
            {isLoadingCategories ? (
              <option disabled>Loading categories...</option>
            ) : categoriesError ? (
              <option disabled>Error loading categories</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          {categoriesError && (
            <p className="mt-1 text-sm text-red-600">{categoriesError}</p>
          )}
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600" data-testid="error-message">{errors.categoryId.message}</p>
          )}
        </div>

      </div>

      {/* Frequency Fields - All transactions are recurring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
            Frequency *
          </label>
          <select
            {...register('frequency')}
            id="frequency"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="frequency-select"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600" data-testid="error-message">{errors.frequency.message}</p>
          )}
        </div>


      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          {...register('notes')}
          id="notes"
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Add any additional notes..."
          data-testid="notes-input"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600" data-testid="error-message">{errors.notes.message}</p>
        )}
      </div>

      {/* Amount Preview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-sm text-gray-600 mb-2">Amount Preview:</p>
        <p className={`text-lg font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}${displayAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {isIncome ? 'Income' : 'Expense'}
        </p>
        
        {/* Monthly Equivalent Preview - All transactions are recurring */}
        {watchedExpression && watchedExpression.trim() && !isNaN(expressionValue) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Monthly Equivalent:</p>
            <p className="text-md font-medium text-blue-600">
              ${(() => {
                const freq = watch('frequency') || FREQUENCIES.MONTH;
                const result = calculatenormalizedAmount(expressionValue, freq);
                return (typeof result === 'number' ? result : 0).toFixed(2);
              })()} per month
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 inline mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isFormValid && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!isFormValid || isSubmitting}
          data-testid="submit-button"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 inline mr-2" />
              Save Transaction
            </>
          )}
        </button>
      </div>
    </form>
  )
}