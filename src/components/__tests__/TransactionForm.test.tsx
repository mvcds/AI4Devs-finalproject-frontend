import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TransactionForm } from '../TransactionForm'
import { apiService } from '../../services/api'

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getCategories: jest.fn(),
  },
}))

const mockApiService = apiService as jest.Mocked<typeof apiService>

// Mock the onSubmit and onCancel functions
const mockOnSubmit = jest.fn()
const mockOnCancel = jest.fn()

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful categories fetch by default
    mockApiService.getCategories.mockResolvedValue([
      { id: '1', name: 'Salary', flow: 'income', color: '#00ff00', description: 'Salary income', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', name: 'Food', flow: 'expense', color: '#ff0000', description: 'Food expenses', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ])
  })

  it('renders the form with all required fields', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

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

    expect(mockApiService.getCategories).toHaveBeenCalledTimes(1)
    
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching categories', () => {
    mockApiService.getCategories.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
  })

  it('shows error state when categories fail to load', async () => {
    mockApiService.getCategories.mockRejectedValue(new Error('API Error'))
    
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
    
    // Test negative amount (expense)
    fireEvent.change(amountInput, { target: { value: '-150.50' } })
    expect(screen.getByText('-$150.50')).toBeInTheDocument()
    expect(screen.getByText('Expense')).toBeInTheDocument()

    // Test positive amount (income)
    fireEvent.change(amountInput, { target: { value: '200.75' } })
    expect(screen.getByText('+$200.75')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Transaction' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/date/i), {
      target: { value: '2024-01-15' },
    })

    await waitFor(() => {
      const submitButton = screen.getByText('Save Transaction')
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('calls onSubmit with form data when submitted', async () => {
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
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Transaction' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/date/i), {
      target: { value: '2024-01-15' },
    })

    // Wait for form to be valid
    await waitFor(() => {
      const submitButton = screen.getByText('Save Transaction')
      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByText('Save Transaction')
    
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Test Transaction',
        amount: 100,
        date: '2024-01-15',
        categoryId: '',
        notes: '',
      })
    })
  })
})
