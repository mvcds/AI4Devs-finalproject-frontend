'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Save, X } from 'lucide-react'
import { categoriesApi, FREQUENCIES, FREQUENCY_LABELS, evaluateExpression } from '@/services/api'

// Form validation using backend validation utilities
export interface TransactionFormData {
  description: string
  expression: string
  categoryId: string
  notes?: string
  frequency: string
}

// Local validation types and functions since ai4devs-api-client is not available locally
//TODO: use from class validator
interface ValidationResult {
  isValid: boolean;
  errors: any[];
  errorMessages: string[];
}

// Local category interface
interface CategoryResponseDto {
  id: string;
  name: string;
  flow: string;
  color?: string;
  description?: string;
  parentId?: string;
}

// Expression evaluation result interface
interface ExpressionEvaluation {
  amount: number;
  type: 'income' | 'expense';
  normalizedAmount: number;
  isValid: boolean;
}

// Simple local validation function
const validateTransactionForm = (data: TransactionFormData): ValidationResult => {
  const errors: string[] = []
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required')
  }
  
  if (!data.expression || data.expression.trim().length === 0) {
    errors.push('Expression is required')
  }
  
  if (!data.categoryId) {
    errors.push('Category is required')
  }
  
  if (!data.frequency) {
    errors.push('Frequency is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors: [],
    errorMessages: errors
  }
}

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
  const [expressionEvaluation, setExpressionEvaluation] = useState<ExpressionEvaluation | null>(null)
  const [isEvaluatingExpression, setIsEvaluatingExpression] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty, touchedFields },
    setError,
    clearErrors,
  } = useForm<TransactionFormData>({
    mode: 'onBlur', // Only validate on blur, not on change
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
  const watchedFrequency = watch('frequency')

  // Evaluate expression using backend endpoint
  const evaluateExpressionValue = useCallback(async (expression: string, frequency: string) => {
    if (!expression || !expression.trim()) {
      setExpressionEvaluation(null)
      return
    }

    // Don't evaluate if expression is just a symbol or incomplete
    const trimmedExpression = expression.trim()
    if (trimmedExpression === '-' || trimmedExpression === '+' || trimmedExpression === '*' || trimmedExpression === '/' || trimmedExpression === '.') {
      setExpressionEvaluation(null)
      return
    }

    // Don't evaluate if expression ends with an operator (incomplete)
    if (/[+\-*/.=]$/.test(trimmedExpression)) {
      setExpressionEvaluation(null)
      return
    }

    try {
      setIsEvaluatingExpression(true)
      const result = await evaluateExpression(expression, frequency)
      setExpressionEvaluation(result)
    } catch (error) {
      console.error('Failed to evaluate expression:', error)
      setExpressionEvaluation(null)
    } finally {
      setIsEvaluatingExpression(false)
    }
  }, [])

  // Evaluate expression when expression or frequency changes
  useEffect(() => {
    if (watchedExpression && watchedFrequency) {
      const timeoutId = setTimeout(() => {
        evaluateExpressionValue(watchedExpression, watchedFrequency)
      }, 300) // Debounce evaluation

      return () => clearTimeout(timeoutId)
    } else {
      setExpressionEvaluation(null)
    }
  }, [watchedExpression, watchedFrequency, evaluateExpressionValue])

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

  //TODO: we should not use a fallback, just the backend validation
  // Simple fallback validation for E2E tests - ensures form works even if backend validation fails
  const simpleValidation = (data: TransactionFormData): boolean => {
    const isValid = !!(data.description && 
              data.expression && 
              data.categoryId && 
              data.frequency &&
              data.description.trim().length > 0 &&
              data.expression.trim().length > 0)
    
    console.log('Simple validation result:', isValid, data)
    return isValid
  }

  // Custom validation check since react-hook-form isValid might not work as expected
  const [isFormValid, setIsFormValid] = useState(false)

  // Simplified validation function - more robust for E2E tests
  const validateForm = useCallback(() => {
    const formData = {
      description: watch('description'),
      expression: watch('expression'),
      categoryId: watch('categoryId'),
      notes: watch('notes'),
      frequency: watch('frequency')
    }
    
    console.log('Validating form data:', formData)
    
    try {
      const validationResult = validateTransactionForm(formData)
      console.log('Validation result:', validationResult)
      
      // Don't clear errors here to prevent infinite loops
      // Only set errors if validation fails and they don't already exist
      if (!validationResult.isValid && validationResult.errorMessages) {
        // Generic error handling - don't rely on specific error message text
        if (validationResult.errorMessages.some((m: string) => m.toLowerCase().includes('description')) && !errors.description) {
          setError('description', { message: 'Description is required and must be valid' })
        }
        if (validationResult.errorMessages.some((m: string) => m.toLowerCase().includes('expression')) && !errors.expression) {
          setError('expression', { message: 'Expression is required and must be valid' })
        }
        if (validationResult.errorMessages.some((m: string) => m.toLowerCase().includes('category')) && !errors.categoryId) {
          setError('categoryId', { message: 'Category is required and must be valid' })
        }
        if (validationResult.errorMessages.some((m: string) => m.toLowerCase().includes('frequency')) && !errors.frequency) {
          setError('frequency', { message: 'Frequency is required and must be valid' })
        }
      }
      
      return validationResult.isValid
    } catch (error) {
      console.error('Validation error:', error)
      // Fallback validation - check if required fields have values
      return simpleValidation(formData)
    }
  }, [watch, setError, errors, simpleValidation])

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      // Ensure form is valid before submitting
      if (!isFormValid) {
        console.warn('Form is not valid, preventing submission.')
        return;
      }

      setIsSubmitting(true)
      console.log('Form submitting with data:', data)
      console.log('Selected categoryId:', data.categoryId)
      await onSubmit(data)
    } catch (error) {
      // Error is handled by the parent component
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Run validation when form values change - only after user interaction
  useEffect(() => {
    // Only run validation if the user has interacted with the form
    if (isDirty || Object.keys(touchedFields).length > 0) {
      const runValidation = () => {
        console.log('Running validation...')
        const isValid = validateForm()
        console.log('Validation result:', isValid)
        setIsFormValid(isValid)
      }
      
      // Use a timeout to debounce validation and prevent excessive calls
      const timeoutId = setTimeout(runValidation, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [watchedDescription, watchedExpression, watch('categoryId'), watch('frequency'), validateForm, isDirty, touchedFields])

  // Run initial validation when form loads - but don't show errors initially
  useEffect(() => {
    if (categories.length > 0) {
      // Set form as initially valid to prevent showing errors on mount
      setIsFormValid(true)
    }
  }, [categories])

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
        <div className="md:col-span-2">
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
          
          {/* Amount Preview - moved below the value field */}
          <div className="mt-3 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Amount Preview:</p>
            {watchedExpression && watchedExpression.trim() ? (
              <>
                {isEvaluatingExpression ? (
                  <p className="text-sm text-gray-500">Evaluating expression...</p>
                ) : expressionEvaluation ? (
                  <>
                    <p className={`text-lg font-semibold ${expressionEvaluation.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {expressionEvaluation.type === 'income' ? '+' : '-'}${Math.abs(expressionEvaluation.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {expressionEvaluation.type === 'income' ? 'Income' : 'Expense'}
                    </p>
                    
                    {/* Monthly Equivalent Preview - All transactions are recurring */}
                    {expressionEvaluation.normalizedAmount !== 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Monthly Equivalent:</p>
                        <p className="text-md font-medium text-blue-600">
                          ${Math.abs(expressionEvaluation.normalizedAmount).toFixed(2)} per month
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Expression needs to be completed</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {watchedExpression.trim() === '-' && 'Add a number after the minus sign (e.g., -100)'}
                      {watchedExpression.trim() === '+' && 'Add a number after the plus sign (e.g., +100)'}
                      {watchedExpression.trim() === '*' && 'Add numbers before and after the multiplication (e.g., 100 * 2)'}
                      {watchedExpression.trim() === '/' && 'Add numbers before and after the division (e.g., 100 / 2)'}
                      {watchedExpression.trim() === '.' && 'Add numbers before and after the decimal (e.g., 100.50)'}
                      {/[+\-*/.=]$/.test(watchedExpression.trim()) && 'Complete the expression by adding numbers'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Enter a value to see preview</p>
            )}
          </div>
        </div>
      </div>

      {/* Frequency and Category Fields - moved to be side by side */}
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
          data-form-valid={isFormValid}
          data-submitting={isSubmitting}
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