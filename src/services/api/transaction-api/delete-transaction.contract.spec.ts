import { transactionsApi } from '..'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Transaction Delete Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Delete Transaction', () => {
    describe('Given an existing transaction', () => {
      describe('When deleting a transaction', () => {
        it('Then it should successfully delete and return void', async () => {
          // Arrange: Mock successful HTTP response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: async () => undefined,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerRemove({ id: 'existing-transaction-id' })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/existing-transaction-id'),
            expect.objectContaining({
              method: 'DELETE',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toBeUndefined()
        })
      })
    })

    describe('Given a non-existent transaction', () => {
      describe('When attempting to delete', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Transaction not found' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerRemove({ id: 'non-existent-id' })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/non-existent-id'),
            expect.objectContaining({
              method: 'DELETE'
            })
          )
        })
      })
    })
  })
})
