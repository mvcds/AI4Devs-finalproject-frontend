'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { categoriesApi, CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto, CategoryResponseDtoFlowEnum } from '@/services/api'

export interface CategoryFormData {
  name: string
  flow: CategoryResponseDtoFlowEnum
  color?: string
  description?: string
}

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  initialData?: CategoryFormData
  currentCategoryId?: string
  isLoading?: boolean
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  currentCategoryId,
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CategoryFormData>({
    mode: 'onChange',
    defaultValues: {
      name: initialData?.name || '',
      flow: initialData?.flow || CategoryResponseDtoFlowEnum.Expense,
      color: initialData?.color || '#3B82F6',
      description: initialData?.description || '',
    },
  })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])


  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const flowOptions = [
    { value: CategoryResponseDtoFlowEnum.Expense, label: 'Expense' },
    { value: CategoryResponseDtoFlowEnum.Income, label: 'Income' },
    { value: CategoryResponseDtoFlowEnum.Si, label: 'Savings & Investments' },
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {currentCategoryId ? 'Edit Category' : 'Create Category'}
      </h2>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            {...register('name', { 
              required: 'Category name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name must be less than 100 characters' }
            })}
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter category name"
            data-testid="category-name-input"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600" data-testid="name-error">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Category Flow */}
        <div>
          <label htmlFor="flow" className="block text-sm font-medium text-gray-700 mb-1">
            Category Type *
          </label>
          <select
            {...register('flow', { required: 'Category type is required' })}
            id="flow"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="category-flow-select"
          >
            {flowOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.flow && (
            <p className="mt-1 text-sm text-red-600" data-testid="flow-error">
              {errors.flow.message}
            </p>
          )}
        </div>

        {/* Color */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              {...register('color')}
              type="color"
              id="color"
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              data-testid="category-color-input"
            />
            <input
              {...register('color')}
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter category description (optional)"
            data-testid="category-description-input"
          />
        </div>


        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-button"
          >
            {isSubmitting ? 'Saving...' : (currentCategoryId ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </div>
  )
}
