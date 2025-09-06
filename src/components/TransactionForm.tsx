'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Save, X } from 'lucide-react'
import { categoriesApi, transactionsApi, FREQUENCIES, FREQUENCY_LABELS, TransactionControllerEvaluateExpressionFrequencyEnum, CategoryResponseDto, CreateTransactionDto, CreateTransactionDtoFrequencyEnum, ExpressionResult, TransactionResponseDto } from '@/services/api'
import { ExpressionComponent } from './ExpressionComponent'

export type TransactionFormData = CreateTransactionDto;

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<TransactionFormData>
  isLoading?: boolean
  currentTransactionId?: string
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  currentTransactionId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [expressionEvaluation, setExpressionEvaluation] = useState<ExpressionResult | null>(null)
  const [isEvaluatingExpression, setIsEvaluatingExpression] = useState(false)
  const [availableTransactions, setAvailableTransactions] = useState<TransactionResponseDto[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty, touchedFields },
    setError,
  } = useForm<TransactionFormData>({
    mode: 'onChange', // Validate on change to match our custom validation
    defaultValues: {
      description: initialData?.description || '',
      expression: initialData?.expression || '',
      categoryId: initialData?.categoryId || '',
      notes: initialData?.notes || '',
      frequency: (initialData?.frequency || FREQUENCIES.MONTH) as CreateTransactionDtoFrequencyEnum,
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
          frequency: (initialData.frequency || FREQUENCIES.MONTH) as CreateTransactionDtoFrequencyEnum,
        })
      } else {
        // Create mode: reset form to default values
        reset({
          description: '',
          expression: '',
          categoryId: '',
          notes: '',
          frequency: FREQUENCIES.MONTH as CreateTransactionDtoFrequencyEnum,
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
      const result = await transactionsApi.transactionControllerEvaluateExpression({
        expression,
        frequency: frequency as TransactionControllerEvaluateExpressionFrequencyEnum,
      });
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

  const validateTransactionForm = (data: TransactionFormData): { isValid: boolean; errorMessages: string[] } => {
    const errorMessages: string[] = []
    if (!data.description || data.description.trim().length === 0) errorMessages.push('Description is invalid')
    if (!data.expression || data.expression.trim().length === 0) errorMessages.push('Expression is invalid')
    if (!data.categoryId || data.categoryId.trim().length === 0) errorMessages.push('Category is invalid')
    if (!data.frequency) errorMessages.push('Frequency is invalid')
    return { isValid: errorMessages.length === 0, errorMessages }
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
      
      // Only set errors if validation fails and user has interacted with the form
      if (!validationResult.isValid && validationResult.errorMessages && (isDirty || Object.keys(touchedFields).length > 0)) {
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
  }, [watch, setError, errors, simpleValidation, isDirty, touchedFields])

  const handleFormSubmit = async (data: TransactionFormData) => {
    debugger; // Debug breakpoint
    console.log('handleFormSubmit started with data:', data)
    try {
      setIsSubmitting(true)
      console.log('Form submitting with data:', data)
      console.log('Selected categoryId:', data.categoryId)
      console.log('About to call onSubmit...')
      await onSubmit(data)
      console.log('onSubmit completed successfully')
    } catch (error) {
      // Error is handled by the parent component
      console.error('Submission error:', error)
    } finally {
      console.log('Setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  // Run validation when form values change
  useEffect(() => {
    const runValidation = () => {
      console.log('Running validation...')
      const isValid = validateForm()
      console.log('Validation result:', isValid)
      setIsFormValid(isValid)
    }
    
    // Use a timeout to debounce validation and prevent excessive calls
    const timeoutId = setTimeout(runValidation, 50)
    return () => clearTimeout(timeoutId)
  }, [watchedDescription, watchedExpression, watch('categoryId'), watch('frequency'), validateForm])

  // Run initial validation when form loads - but don't show errors initially
  useEffect(() => {
    if (categories.length > 0) {
      // Set form as initially invalid since required fields are empty
      // This will be updated when user starts filling the form
      setIsFormValid(false)
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

  // Fetch available transactions for ExpressionComponent
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true)
        const fetchedTransactions = await transactionsApi.transactionControllerFindAll()
        setAvailableTransactions(fetchedTransactions)
      } catch (error) {
        console.error('Failed to load transactions:', error)
        setAvailableTransactions([])
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [])

  // Handle expression change from ExpressionComponent
  const handleExpressionChange = (expression: string) => {
    setValue('expression', expression, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <input
            {...register('description', { required: 'Description is required' })}
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
          {/* Hidden input for react-hook-form validation */}
          <input
            {...register('expression', { required: 'Expression is required' })}
            type="hidden"
            value={watchedExpression || ''}
          />
          <ExpressionComponent
            options={availableTransactions}
            value={watchedExpression || ''}
            onChange={handleExpressionChange}
            placeholder="e.g., 5000, -200, $txn-1 * 0.12"
            className={`${errors.expression ? 'border-red-500' : ''}`}
            excludeTransactionId={currentTransactionId}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a number (e.g., 5000 for income, -200 for expense) or an expression with transaction chips (e.g., $salary * 0.12)
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
            {...register('frequency', { required: 'Frequency is required' })}
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
            {...register('categoryId', { required: 'Category is required' })}
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