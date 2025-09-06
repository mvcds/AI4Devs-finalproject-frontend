import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ExpressionComponent } from './ExpressionComponent'
import { TransactionResponseDto } from '@/services/api'

// Mock transaction data for testing
const createMockTransaction = (overrides: Partial<TransactionResponseDto> = {}): TransactionResponseDto => ({
  id: 'test-id',
  description: 'Test Transaction',
  expression: { toString: () => '100' } as any,
  amount: 100,
  normalizedAmount: 100,
  categoryId: 'cat-1',
  categoryName: 'Test Category',
  notes: 'Test notes',
  frequency: 'month' as any,
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

const mockTransactions: TransactionResponseDto[] = [
  createMockTransaction({ id: 'txn-1', description: 'Salary', amount: 1000, normalizedAmount: 1000 }),
  createMockTransaction({ id: 'txn-2', description: 'Rent', amount: -500, normalizedAmount: -500 }),
  createMockTransaction({ id: 'txn-3', description: 'Freelance', amount: 800, normalizedAmount: 800 })
]

describe('ExpressionComponent', () => {
  const defaultProps = {
    options: mockTransactions,
    value: '',
    onChange: jest.fn(),
    placeholder: 'Type expression...'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    describe('Given an empty expression', () => {
      describe('When rendering the component', () => {
        describe('Then it should display placeholder', () => {
          it('shows placeholder text when value is empty', () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            expect(input).toBeInTheDocument()
            expect(input).toHaveValue('')
            expect(screen.getByText('Type expression...')).toBeInTheDocument()
          })
        })
      })
    })

    describe('Given a custom placeholder', () => {
      describe('When rendering the component', () => {
        describe('Then it should use custom placeholder', () => {
          it('shows custom placeholder text', () => {
            render(<ExpressionComponent {...defaultProps} placeholder="Enter math expression..." />)
            
            expect(screen.getByText('Enter math expression...')).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Text Input', () => {
    describe('Given a text input', () => {
      describe('When user types text', () => {
        describe('Then it should call onChange with new value', () => {
          it('calls onChange when typing text', () => {
            const onChange = jest.fn()
            render(<ExpressionComponent {...defaultProps} onChange={onChange} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '100 + 50' } })
            
            expect(onChange).toHaveBeenCalledWith('100 + 50')
          })
        })
      })
    })
  })

  describe('Chip Insertion', () => {
    describe('Given user types "$"', () => {
      describe('When dropdown appears', () => {
        describe('Then it should show transaction options', () => {
          it('shows dropdown when typing $', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Salary')).toBeInTheDocument()
            expect(screen.getByText('Rent')).toBeInTheDocument()
            expect(screen.getByText('Freelance')).toBeInTheDocument()
          })
        })
      })
    })

    describe('Given dropdown is open', () => {
      describe('When user clicks on a transaction', () => {
        describe('Then it should insert chip and close dropdown', () => {
          it('inserts chip when clicking transaction', async () => {
            const onChange = jest.fn()
            render(<ExpressionComponent {...defaultProps} onChange={onChange} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            const salaryOption = screen.getByTestId('transaction-option-txn-1')
            fireEvent.click(salaryOption)
            
            // The onChange should be called with the chip ID
            expect(onChange).toHaveBeenCalledWith('$txn-1')
            expect(screen.queryByTestId('transaction-dropdown')).not.toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Keyboard Navigation', () => {
    describe('Given dropdown is open', () => {
      describe('When user presses arrow keys', () => {
        describe('Then it should navigate through options', () => {
          it('navigates down with arrow down key', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            fireEvent.keyDown(input, { key: 'ArrowDown' })
            
            const rentOption = screen.getByTestId('transaction-option-txn-2')
            expect(rentOption).toHaveClass('bg-blue-50')
          })

          it('navigates up with arrow up key', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            // Navigate down first
            fireEvent.keyDown(input, { key: 'ArrowDown' })
            fireEvent.keyDown(input, { key: 'ArrowDown' })
            
            // Then navigate up
            fireEvent.keyDown(input, { key: 'ArrowUp' })
            
            const rentOption = screen.getByTestId('transaction-option-txn-2')
            expect(rentOption).toHaveClass('bg-blue-50')
          })
        })
      })

      describe('When user presses Enter', () => {
        describe('Then it should select highlighted option', () => {
          it('selects option with Enter key', async () => {
            const onChange = jest.fn()
            render(<ExpressionComponent {...defaultProps} onChange={onChange} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            fireEvent.keyDown(input, { key: 'Enter' })
            
            // The onChange should be called with the chip ID
            expect(onChange).toHaveBeenCalledWith('$txn-1')
            expect(screen.queryByTestId('transaction-dropdown')).not.toBeInTheDocument()
          })
        })
      })

      describe('When user presses Escape', () => {
        describe('Then it should close dropdown', () => {
          it('closes dropdown with Escape key', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            fireEvent.keyDown(input, { key: 'Escape' })
            
            expect(screen.queryByTestId('transaction-dropdown')).not.toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Chip Display', () => {
    describe('Given expression with chips', () => {
      describe('When rendering the component', () => {
        describe('Then it should display chips visually', () => {
          it('displays chips in visual overlay', () => {
            render(<ExpressionComponent {...defaultProps} value="100 + $txn-1 + 50" />)
            
            // Check that chips are rendered in the visual overlay
            expect(screen.getByText('Salary')).toBeInTheDocument()
            expect(screen.getByText('100 +')).toBeInTheDocument()
            expect(screen.getByText('+ 50')).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Chip Deletion', () => {
    describe('Given expression with chips', () => {
      describe('When user presses Backspace on chip', () => {
        describe('Then it should delete entire chip', () => {
          it('deletes chip with backspace', async () => {
            const onChange = jest.fn()
            render(<ExpressionComponent {...defaultProps} value="100 + $txn-1" onChange={onChange} />)
            
            const input = screen.getByTestId('expression-input')
            
            // Set cursor position after the chip (position 10 is after "$txn-1")
            input.setSelectionRange(10, 10)
            fireEvent.keyDown(input, { key: 'Backspace' })
            
            // The onChange should be called with the chip removed
            expect(onChange).toHaveBeenCalledWith('100 + ')
          })
        })
      })
    })
  })

  describe('Expression Parsing', () => {
    describe('Given complex expression with multiple chips', () => {
      describe('When rendering the component', () => {
        describe('Then it should parse and display correctly', () => {
          it('parses complex expression with multiple chips', () => {
            const value = '($txn-1 - $txn-2) * 0.8 + $txn-3'
            render(<ExpressionComponent {...defaultProps} value={value} />)
            
            // Check that all chips are displayed
            expect(screen.getByText('Salary')).toBeInTheDocument()
            expect(screen.getByText('Rent')).toBeInTheDocument()
            expect(screen.getByText('Freelance')).toBeInTheDocument()
            
            // Check that text parts are displayed
            expect(screen.getByText('(')).toBeInTheDocument()
            expect(screen.getByText('-')).toBeInTheDocument()
            expect(screen.getByText(') * 0.8 +')).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Empty Options', () => {
    describe('Given empty transaction options', () => {
      describe('When user types "$"', () => {
        describe('Then it should show no options message', () => {
          it('shows no options message when options are empty', async () => {
            render(<ExpressionComponent {...defaultProps} options={[]} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            expect(screen.getByText('No transactions available')).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Click Outside', () => {
    describe('Given dropdown is open', () => {
      describe('When user clicks outside', () => {
        describe('Then it should close dropdown', () => {
          it('closes dropdown when clicking outside', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            // Click outside
            fireEvent.mouseDown(document.body)
            
            expect(screen.queryByTestId('transaction-dropdown')).not.toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Custom Styling', () => {
    describe('Given custom className', () => {
      describe('When rendering the component', () => {
        describe('Then it should apply custom styling', () => {
          it('applies custom className', () => {
            const { container } = render(
              <ExpressionComponent {...defaultProps} className="custom-expression" />
            )
            
            const wrapper = container.firstChild
            expect(wrapper).toHaveClass('custom-expression')
          })
        })
      })
    })
  })

  describe('Transaction Amount Display', () => {
    describe('Given transactions with different amounts', () => {
      describe('When displaying in dropdown', () => {
        describe('Then it should show normalized amounts', () => {
          it('shows normalized amounts in dropdown options', async () => {
            render(<ExpressionComponent {...defaultProps} />)
            
            const input = screen.getByTestId('expression-input')
            fireEvent.change(input, { target: { value: '$' } })
            
            await waitFor(() => {
              expect(screen.getByTestId('transaction-dropdown')).toBeInTheDocument()
            })
            
            // Check that amounts are displayed
            expect(screen.getByText('$1000.00')).toBeInTheDocument()
            expect(screen.getByText('$500.00')).toBeInTheDocument()
            expect(screen.getByText('$800.00')).toBeInTheDocument()
          })
        })
      })
    })
  })
})
