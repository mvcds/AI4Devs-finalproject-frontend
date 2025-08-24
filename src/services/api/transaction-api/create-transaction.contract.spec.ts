import { transactionsApi } from '..'
import { CreateTransactionDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Transaction Create Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Create Transaction', () => {
    describe('Given valid transaction data', () => {
      describe('When creating a new transaction', () => {
        it('Then it should return the created transaction', async () => {
          // Arrange: Mock successful HTTP response
          const createData: CreateTransactionDto = {
            description: 'New Transaction',
            expression: { value: '100' },
            categoryId: 'cat-123',
            notes: 'Test transaction',
            frequency: 'month'
          }

          const mockCreatedTransaction = {
            id: 'new-transaction-id',
            description: 'New Transaction',
            expression: '100',
            amount: 100,
            categoryId: 'cat-123',
            categoryName: 'Test Category',
            notes: 'Test transaction',
            frequency: 'month',
            userId: 'user-123',
            createdAt: new Date(),
            updatedAt: new Date(),
            normalizedAmount: 100
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: async () => mockCreatedTransaction,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerCreate({ createTransactionDto: createData })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions'),
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: expect.stringContaining('"description":"New Transaction"')
            })
          )
          expect(result).toEqual(mockCreatedTransaction)
          expect(result.id).toBe('new-transaction-id')
          expect(result.description).toBe('New Transaction')
          expect(result.amount).toBe(100)
        })
      })
    })

    describe('Given invalid transaction data', () => {
      describe('When creating a transaction with missing required fields', () => {
        it('Then it should throw a validation error', async () => {
          // Arrange: Mock HTTP validation error response
          const invalidData = {
            description: '', // Missing required field
            expression: { value: '100' },
            categoryId: 'cat-123',
            frequency: 'month'
          } as CreateTransactionDto

          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({ message: 'Validation failed: description is required' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerCreate({ createTransactionDto: invalidData })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions'),
            expect.objectContaining({
              method: 'POST',
              body: expect.stringContaining('"description":""')
            })
          )
        })
      })
    })
  })
})
