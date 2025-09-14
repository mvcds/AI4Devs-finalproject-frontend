'use client'

import React, { useState, useEffect } from 'react'
import { CategoryForm, CategoryFormData } from '../../components/CategoryForm'
import { CategoryList } from '../../components/CategoryList'
import { categoriesApi, CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from '@/services/api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDto | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const categoriesData = await categoriesApi.categoryControllerFindAll()
        setCategories(categoriesData)
      } catch (error: any) {
        console.error('Failed to load categories:', error)
        
        // Extract the error message from the API response
        let errorMessage = 'Failed to load categories. Please try again.'
        
        try {
          // Check if it's a ResponseError from the API client
          if (error?.name === 'ResponseError' && error?.response) {
            const errorData = await error.response.json()
            if (errorData?.message) {
              errorMessage = errorData.message
            }
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error?.message) {
            errorMessage = error.message
          }
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError)
        }
        
        alert(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      setIsLoading(true)
      const newCategory = await categoriesApi.categoryControllerCreate({
        createCategoryDto: data as CreateCategoryDto
      })
      
      setCategories(prev => [newCategory, ...prev])
      setShowForm(false)
    } catch (error: any) {
      console.error('Failed to create category:', error)
      
      // Extract the error message from the API response
      let errorMessage = 'Failed to create category. Please try again.'
      
      try {
        // Check if it's a ResponseError from the API client
        if (error?.name === 'ResponseError' && error?.response) {
          const errorData = await error.response.json()
          if (errorData?.message) {
            errorMessage = errorData.message
          }
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.message) {
          errorMessage = error.message
        }
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError)
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = async (data: CategoryFormData) => {
    if (!editingCategoryId) return

    try {
      setIsLoading(true)
      const updatedCategory = await categoriesApi.categoryControllerUpdate({
        id: editingCategoryId,
        updateCategoryDto: data as UpdateCategoryDto
      })
      
      setCategories(prev => 
        prev.map(cat => cat.id === editingCategoryId ? updatedCategory : cat)
      )
      
      setShowForm(false)
      setEditingCategory(null)
      setEditingCategoryId(null)
    } catch (error: any) {
      console.error('Failed to update category:', error)
      
      // Extract the error message from the API response
      let errorMessage = 'Failed to update category. Please try again.'
      
      try {
        // Check if it's a ResponseError from the API client
        if (error?.name === 'ResponseError' && error?.response) {
          const errorData = await error.response.json()
          if (errorData?.message) {
            errorMessage = errorData.message
          }
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.message) {
          errorMessage = error.message
        }
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError)
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      await categoriesApi.categoryControllerRemove({ id: categoryId })
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      
      // Extract the error message from the API response
      let errorMessage = 'Failed to delete category. Please try again.'
      
      try {
        // Check if it's a ResponseError from the API client
        if (error?.name === 'ResponseError' && error?.response) {
          const errorData = await error.response.json()
          if (errorData?.message) {
            errorMessage = errorData.message
          }
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.message) {
          errorMessage = error.message
        }
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError)
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (category: CategoryResponseDto) => {
    setEditingCategory(category)
    setEditingCategoryId(category.id)
    setShowForm(true)
  }

  const handleCreateNew = () => {
    setEditingCategory(null)
    setEditingCategoryId(null)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setEditingCategoryId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Organize your transactions with custom categories
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="back-to-transactions-button"
              >
                ← Back to Transactions
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {showForm ? (
            <CategoryForm
              onSubmit={editingCategoryId ? handleEditCategory : handleCreateCategory}
              onCancel={handleCancelForm}
              initialData={editingCategory ? {
                name: editingCategory.name,
                flow: editingCategory.flow,
                color: editingCategory.color,
                description: editingCategory.description,
              } : undefined}
              currentCategoryId={editingCategoryId}
              isLoading={isLoading}
            />
          ) : (
            <CategoryList
              categories={categories}
              onEdit={handleEditClick}
              onDelete={handleDeleteCategory}
              onCreateNew={handleCreateNew}
              isLoading={isLoading}
            />
          )}
        </div>

      </div>
    </div>
  )
}
