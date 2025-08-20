import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionForm } from '../TransactionForm'
import { categoriesApi } from '@/services/api'

// Mock the API service
jest.mock('@/services/api', () => ({
  categoriesApi: {
    categoryControllerFindAll: jest.fn(),
  },
  FREQUENCIES: {
    DAILY: 'daily',
    WEEK: 'week',
    FORTNIGHT: 'fortnight',
    MONTH: 'month',
    TWO_MONTH: '2-month',
    THREE_MONTH: '3-month',
    QUARTER: 'quarter',
    HALF: 'half',
    YEAR: 'year',
    TWO_YEAR: '2-year',
  },
  FREQUENCY_LABELS: {
    'daily': 'Daily',
    'week': 'Week',
    'fortnight': 'Fortnight',
    'month': 'Month',
    '2-month': '2-Month',
    '3-month': '3-Month',
    'quarter': 'Quarter',
    'half': 'Half Year',
    'year': 'Year',
    '2-year': '2-Year',
  },
}))

const mockCategoriesApi = categoriesApi as jest.Mocked<typeof categoriesApi>

// Mock the onSubmit and onCancel functions
const mockOnSubmit = jest.fn()
const mockOnCancel = jest.fn()

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful categories fetch by default
    mockCategoriesApi.categoryControllerFindAll.mockResolvedValue([
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Salary', flow: 'income', color: '#00ff00', description: 'Salary income', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Food', flow: 'expense', color: '#ff0000', description: 'Food expenses', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ])
  })

  it('renders the form with all required fields', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load to avoid act() warnings
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('fetches categories on mount', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(mockCategoriesApi.categoryControllerFindAll).toHaveBeenCalledTimes(1)
    
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching categories', async () => {
    mockCategoriesApi.categoryControllerFindAll.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for the loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Loading categories...')).toBeInTheDocument()
    })
  })

  it('shows error state when categories fail to load', async () => {
    mockCategoriesApi.categoryControllerFindAll.mockRejectedValue(new Error('API Error'))
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Error loading categories')).toBeInTheDocument()
      expect(screen.getByText('Failed to load categories')).toBeInTheDocument()
    })
  })

  it('populates form with initial data when editing', async () => {
    const initialData = {
      description: 'Test Transaction',
      amount: 100,
      date: '2024-01-15',
      notes: 'Test notes',
    }

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Test Transaction')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('shows amount preview based on amount', async () => {
    const user = userEvent.setup()
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    const amountInput = screen.getByLabelText(/amount/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const dateInput = screen.getByLabelText(/date/i)
    const categorySelect = screen.getByLabelText(/category/i)
    const frequencySelect = screen.getByLabelText(/frequency/i)
    
    // Fill required fields first
    await user.type(descriptionInput, 'Test Transaction')
    await user.clear(dateInput)
    await user.type(dateInput, '2024-01-15')
    
    // Select category and frequency using fireEvent for select elements
    fireEvent.change(categorySelect, { target: { value: '550e8400-e29b-41d4-a716-446655440000' } })
    fireEvent.change(frequencySelect, { target: { value: 'month' } })
    
    // Test negative amount (expense)
    await user.clear(amountInput)
    await user.type(amountInput, '-150.50')
    await waitFor(() => {
      expect(screen.getByText('-$150.50')).toBeInTheDocument()
      expect(screen.getByText('Expense')).toBeInTheDocument()
    })

    // Test positive amount (income)
    await user.clear(amountInput)
    await user.type(amountInput, '200.75')
    await waitFor(() => {
      expect(screen.getByText('+$200.75')).toBeInTheDocument()
      expect(screen.getByText('Income')).toBeInTheDocument()
    })
  })

  it('disables submit button when form is invalid', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Save Transaction')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when form is valid', async () => {
    const user = userEvent.setup()
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    // Fill in required fields
    await user.type(screen.getByLabelText(/description/i), 'Test Transaction')
    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), '2024-01-15')
    
    // Select category and frequency using fireEvent for select elements
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '550e8400-e29b-41d4-a716-446655440000' } })
    fireEvent.change(screen.getByLabelText(/frequency/i), { target: { value: 'month' } })

    await waitFor(() => {
      const submitButton = screen.getByText('Save Transaction')
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup()
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    // Fill in required fields
    await user.type(screen.getByLabelText(/description/i), 'Test Transaction')
    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), '2024-01-15')
    
    // Select category and frequency using fireEvent for select elements
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '550e8400-e29b-41d4-a716-446655440000' } })
    fireEvent.change(screen.getByLabelText(/frequency/i), { target: { value: 'month' } })

    // Wait for form to be valid
    await waitFor(() => {
      const submitButton = screen.getByText('Save Transaction')
      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByText('Save Transaction')
    
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Test Transaction',
        amount: 100,
        date: '2024-01-15',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        frequency: 'month',
        notes: '',
      })
    })
  })
})
