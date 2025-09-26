'use client'

import React, { useState, useEffect } from 'react'
import { CategoryResponseDto, CategoryResponseDtoFlowEnum, transactionsApi, BudgetPercentagesDto } from '@/services/api'

interface CategoryListProps {
  categories: CategoryResponseDto[]
  onEdit: (category: CategoryResponseDto) => void
  onDelete: (categoryId: string) => void
  onCreateNew: () => void
  isLoading?: boolean
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [flowFilter, setFlowFilter] = useState<'all' | CategoryResponseDtoFlowEnum>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [budgetPercentages, setBudgetPercentages] = useState<BudgetPercentagesDto | null>(null)
  const [percentagesLoading, setPercentagesLoading] = useState(false)

  // Fetch budget percentages when component mounts
  useEffect(() => {
    const fetchBudgetPercentages = async () => {
      try {
        setPercentagesLoading(true)
        const data = await transactionsApi.transactionControllerGetBudgetPercentages()
        setBudgetPercentages(data)
      } catch (error) {
        console.error('Failed to fetch budget percentages:', error)
        // Don't show error to user, just don't display percentages
      } finally {
        setPercentagesLoading(false)
      }
    }

    fetchBudgetPercentages()
  }, [])

  // Filter categories based on search term and flow filter
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFlow = flowFilter === 'all' || category.flow === flowFilter
    return matchesSearch && matchesFlow
  })

  // Group categories by flow for better organization
  const categoriesByFlow = filteredCategories.reduce((acc, category) => {
    if (!acc[category.flow]) {
      acc[category.flow] = []
    }
    acc[category.flow].push(category)
    return acc
  }, {} as Record<CategoryResponseDtoFlowEnum, CategoryResponseDto[]>)

  const getFlowLabel = (flow: CategoryResponseDtoFlowEnum) => {
    switch (flow) {
      case CategoryResponseDtoFlowEnum.Expense:
        return 'Expenses'
      case CategoryResponseDtoFlowEnum.Income:
        return 'Income'
      case CategoryResponseDtoFlowEnum.Si:
        return 'Savings & Investments'
      default:
        return flow
    }
  }

  const getFlowColor = (flow: CategoryResponseDtoFlowEnum) => {
    switch (flow) {
      case CategoryResponseDtoFlowEnum.Expense:
        return 'text-red-600 bg-red-50'
      case CategoryResponseDtoFlowEnum.Income:
        return 'text-green-600 bg-green-50'
      case CategoryResponseDtoFlowEnum.Si:
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Helper function to get percentage for a category
  const getCategoryPercentage = (categoryId: string): number | null => {
    if (!budgetPercentages) return null
    const categoryPercentage = budgetPercentages.categoryPercentages.find(cp => cp.categoryId === categoryId)
    return categoryPercentage ? categoryPercentage.percentage : null
  }

  // Helper function to get percentage for a flow
  const getFlowPercentage = (flow: CategoryResponseDtoFlowEnum): number | null => {
    if (!budgetPercentages) return null
    const flowPercentage = budgetPercentages.flowPercentages.find(fp => fp.flow === flow)
    return flowPercentage ? flowPercentage.percentage : null
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your transaction categories ({filteredCategories.length} of {categories.length})
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="create-category-button"
          >
            + Add Category
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="category-search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="filter-toggle-button"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={flowFilter}
                  onChange={(e) => setFlowFilter(e.target.value as 'all' | CategoryResponseDtoFlowEnum)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="flow-filter"
                >
                  <option value="all">All Types</option>
                  <option value={CategoryResponseDtoFlowEnum.Expense}>Expenses</option>
                  <option value={CategoryResponseDtoFlowEnum.Income}>Income</option>
                  <option value={CategoryResponseDtoFlowEnum.Si}>Savings & Investments</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories List */}
      <div className="p-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || flowFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first category to get started'
              }
            </p>
            {!searchTerm && flowFilter === 'all' && (
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="create-first-category-button"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categoriesByFlow).map(([flow, flowCategories]) => {
              const flowPercentage = getFlowPercentage(flow as CategoryResponseDtoFlowEnum)
              return (
                <div key={flow}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {getFlowLabel(flow as CategoryResponseDtoFlowEnum)}
                    <span className="ml-2 text-sm text-gray-500">({flowCategories.length})</span>
                    {flowPercentage !== null && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {flowPercentage}%
                      </span>
                    )}
                  </h3>
                <div className="grid gap-3">
                  {flowCategories.map((category) => {
                    const categoryPercentage = getCategoryPercentage(category.id)
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        data-testid={`category-item-${category.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                            data-testid={`category-color-${category.id}`}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900" data-testid={`category-name-${category.id}`}>
                              {category.name}
                              {categoryPercentage !== null && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {categoryPercentage}%
                                </span>
                              )}
                            </h4>
                            {category.description && (
                              <p className="text-sm text-gray-500" data-testid={`category-description-${category.id}`}>
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEdit(category)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          data-testid={`edit-category-${category.id}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(category.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                          data-testid={`delete-category-${category.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
