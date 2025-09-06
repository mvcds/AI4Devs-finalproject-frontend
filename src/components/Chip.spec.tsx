import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Chip } from './Chip'
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

describe('Chip Component', () => {
  describe('Transaction Display', () => {
    describe('Given a transaction with positive amount', () => {
      describe('When rendering the chip', () => {
        describe('Then it should display income styling', () => {
          it('shows green background for income transaction', () => {
            const transaction = createMockTransaction({
              amount: 1000,
              description: 'Salary'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
            expect(chip).toHaveTextContent('Salary')
          })
        })
      })
    })

    describe('Given a transaction with negative amount', () => {
      describe('When rendering the chip', () => {
        describe('Then it should display expense styling', () => {
          it('shows red background for expense transaction', () => {
            const transaction = createMockTransaction({
              amount: -500,
              description: 'Rent'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
            expect(chip).toHaveTextContent('Rent')
          })
        })
      })
    })

    describe('Given a transaction with zero amount', () => {
      describe('When rendering the chip', () => {
        describe('Then it should display neutral styling', () => {
          it('shows gray background for zero amount transaction', () => {
            const transaction = createMockTransaction({
              amount: 0,
              description: 'Zero Transaction'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200')
            expect(chip).toHaveTextContent('Zero Transaction')
          })
        })
      })
    })
  })

  describe('Hover Functionality', () => {
    describe('Given a transaction with normalized amount', () => {
      describe('When hovering over the chip', () => {
        describe('Then it should show tooltip with normalized amount', () => {
          it('displays tooltip with positive normalized amount', () => {
            const transaction = createMockTransaction({
              amount: 1000,
              normalizedAmount: 1000,
              description: 'Salary'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toBeInTheDocument()
            expect(tooltip).toHaveTextContent('Monthly Equivalent')
            expect(tooltip).toHaveTextContent('+$1000.00')
            
            // Check for the colored amount text within the tooltip
            const amountText = tooltip.querySelector('.text-green-400')
            expect(amountText).toBeInTheDocument()
            expect(amountText).toHaveTextContent('+$1000.00')
          })

          it('displays tooltip with negative normalized amount', () => {
            const transaction = createMockTransaction({
              amount: -500,
              normalizedAmount: -500,
              description: 'Rent'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toBeInTheDocument()
            expect(tooltip).toHaveTextContent('Monthly Equivalent')
            expect(tooltip).toHaveTextContent('-$500.00')
            
            // Check for the colored amount text within the tooltip
            const amountText = tooltip.querySelector('.text-red-400')
            expect(amountText).toBeInTheDocument()
            expect(amountText).toHaveTextContent('-$500.00')
          })

          it('displays tooltip with zero normalized amount', () => {
            const transaction = createMockTransaction({
              amount: 0,
              normalizedAmount: 0,
              description: 'Zero Transaction'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toBeInTheDocument()
            expect(tooltip).toHaveTextContent('Monthly Equivalent')
            expect(tooltip).toHaveTextContent('$0.00')
            
            // Check for the colored amount text within the tooltip
            const amountText = tooltip.querySelector('.text-gray-400')
            expect(amountText).toBeInTheDocument()
            expect(amountText).toHaveTextContent('$0.00')
          })
        })
      })

      describe('When mouse leaves the chip', () => {
        describe('Then tooltip should be hidden', () => {
          it('hides tooltip when mouse leaves', () => {
            const transaction = createMockTransaction({
              amount: 1000,
              normalizedAmount: 1000,
              description: 'Salary'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            expect(screen.getByTestId('chip-tooltip')).toBeInTheDocument()
            
            fireEvent.mouseLeave(chip)
            expect(screen.queryByTestId('chip-tooltip')).not.toBeInTheDocument()
          })
        })
      })
    })

    describe('Given a transaction without normalized amount', () => {
      describe('When hovering over the chip', () => {
        describe('Then tooltip should not be shown', () => {
          it('does not show tooltip when normalized amount is undefined', () => {
            const transaction = createMockTransaction({
              amount: 1000,
              normalizedAmount: undefined,
              description: 'Salary'
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            expect(screen.queryByTestId('chip-tooltip')).not.toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Component Props', () => {
    describe('Given a transaction and value prop', () => {
      describe('When rendering the chip', () => {
        describe('Then it should use the value as transaction ID', () => {
          it('sets data-transaction-id attribute with value prop', () => {
            const transaction = createMockTransaction()
            const customValue = 'custom-transaction-id'

            render(<Chip transaction={transaction} value={customValue} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveAttribute('data-transaction-id', customValue)
          })
        })
      })
    })

    describe('Given custom className prop', () => {
      describe('When rendering the chip', () => {
        describe('Then it should apply custom styling', () => {
          it('applies custom className to chip', () => {
            const transaction = createMockTransaction()
            const customClass = 'custom-chip-style'

            render(<Chip transaction={transaction} value={transaction.id} className={customClass} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveClass(customClass)
          })
        })
      })
    })
  })

  describe('Accessibility', () => {
    describe('Given a transaction chip', () => {
      describe('When rendering', () => {
        describe('Then it should be accessible', () => {
          it('has proper test id for testing', () => {
            const transaction = createMockTransaction()

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toBeInTheDocument()
          })

          it('has cursor-default styling indicating non-interactive', () => {
            const transaction = createMockTransaction()

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            expect(chip).toHaveClass('cursor-default')
          })
        })
      })
    })
  })

  describe('Amount Formatting', () => {
    describe('Given different amount values', () => {
      describe('When displaying in tooltip', () => {
        describe('Then amounts should be formatted correctly', () => {
          it('formats positive amounts with plus sign', () => {
            const transaction = createMockTransaction({
              amount: 1234.56,
              normalizedAmount: 1234.56
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toHaveTextContent('+$1234.56')
          })

          it('formats negative amounts with minus sign', () => {
            const transaction = createMockTransaction({
              amount: -987.65,
              normalizedAmount: -987.65
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toHaveTextContent('-$987.65')
          })

          it('formats zero amounts without sign', () => {
            const transaction = createMockTransaction({
              amount: 0,
              normalizedAmount: 0
            })

            render(<Chip transaction={transaction} value={transaction.id} />)
            
            const chip = screen.getByTestId('transaction-chip')
            fireEvent.mouseEnter(chip)
            
            const tooltip = screen.getByTestId('chip-tooltip')
            expect(tooltip).toHaveTextContent('$0.00')
          })
        })
      })
    })
  })
})
