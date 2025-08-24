import { transactionsApi } from '..'
import { UpdateTransactionDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Transaction Edit Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Edit Transaction', () => {
    describe('Given valid update data', () => {
      describe('When updating an existing transaction', () => {
        it('Then it should return the updated transaction', async () => {
          // Arrange: Mock successful HTTP response
          const updateData: UpdateTransactionDto = {
            description: 'Updated Transaction',
            expression: { value: '200' },
            notes: 'Updated notes'
          }

          const mockUpdatedTransaction = {
            id: 'existing-transaction-id',
            description: 'Updated Transaction',
            expression: '200',
            amount: 200,
            categoryId: 'cat-123',
            categoryName: 'Test Category',
            notes: 'Updated notes',
            frequency: 'month',
            userId: 'user-123',
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date(), // Should be updated
            normalizedAmount: 200
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockUpdatedTransaction,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerUpdate({ id: 'existing-transaction-id', updateTransactionDto: updateData })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/existing-transaction-id'),
            expect.objectContaining({
              method: 'PATCH',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: expect.stringContaining('"description":"Updated Transaction"')
            })
          )
          expect(result).toEqual(mockUpdatedTransaction)
          expect(result.description).toBe('Updated Transaction')
          expect(result.notes).toBe('Updated notes')
        })
      })
    })

    describe('Given invalid update data', () => {
      describe('When updating a non-existent transaction', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found error response
          const updateData: UpdateTransactionDto = {
            description: 'Updated Transaction'
          }

          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Transaction not found' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerUpdate({ id: 'non-existent-id', updateTransactionDto: updateData })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/non-existent-id'),
            expect.objectContaining({
              method: 'PATCH',
              body: JSON.stringify(updateData)
            })
          )
        })
      })
    })
  })
})
