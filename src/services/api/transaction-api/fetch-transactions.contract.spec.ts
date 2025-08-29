import { transactionsApi } from '..'
import { TransactionResponseDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Transaction Fetch Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Fetch Transactions', () => {
    describe('Given a successful API response', () => {
      describe('When fetching all transactions', () => {
        it('Then it should return a list of transactions', async () => {
          // Arrange: Mock successful HTTP response
          const mockResponse = [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Monthly Salary',
              expression: '3500',
              amount: 3500,
              categoryId: 'cat-123',
              categoryName: 'Salary',
              notes: 'January 2024 salary',
              frequency: 'month',
              userId: 'user-123',
              createdAt: new Date('2024-01-15T10:00:00Z'),
              updatedAt: new Date('2024-01-15T10:00:00Z'),
              normalizedAmount: 3500
            }
          ]

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerFindAll()

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toEqual(mockResponse)
          expect(result).toHaveLength(1)
          expect(result[0]).toMatchObject({
            id: expect.any(String),
            description: expect.any(String),
            amount: expect.any(Number),
            categoryId: expect.any(String),
            frequency: expect.any(String)
          })
        })
      })

      describe('When fetching a single transaction', () => {
        it('Then it should return the transaction details', async () => {
          // Arrange: Mock successful HTTP response
          const mockTransaction = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            description: 'Monthly Salary',
            expression: '3500',
            amount: 3500,
            categoryId: 'cat-123',
            categoryName: 'Salary',
            notes: 'January 2024 salary',
            frequency: 'month',
            userId: 'user-123',
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
            normalizedAmount: 3500
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockTransaction,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerFindOne({ id: '123e4567-e89b-12d3-a456-426614174000' })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/123e4567-e89b-12d3-a456-426614174000'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toEqual(mockTransaction)
          expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000')
        })
      })
    })

    describe('Given an API error response', () => {
      describe('When fetching transactions fails', () => {
        it('Then it should throw an error with proper message', async () => {
          // Arrange: Mock HTTP error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ message: 'Failed to fetch transactions' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerFindAll()).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions'),
            expect.any(Object)
          )
        })
      })

      describe('When fetching a non-existent transaction', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Transaction not found' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerFindOne({ id: 'non-existent-id' })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/transactions/non-existent-id'),
            expect.any(Object)
          )
        })
      })
    })
  })
})
