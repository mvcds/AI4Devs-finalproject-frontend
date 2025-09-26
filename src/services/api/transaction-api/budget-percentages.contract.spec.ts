import { transactionsApi, BudgetPercentagesDto } from '..'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Budget Percentages API Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Fetch Budget Percentages', () => {
    describe('Given a successful API response', () => {
      describe('When fetching budget percentages', () => {
        it('Then it should return budget percentages data', async () => {
          // Arrange: Mock successful HTTP response
          const mockResponse: BudgetPercentagesDto = {
            categoryPercentages: [
              {
                categoryId: 'salary-id',
                categoryName: 'Salary',
                categoryColor: '#10B981',
                flow: 'income',
                percentage: 63.8,
                amount: 3000
              },
              {
                categoryId: 'rent-id',
                categoryName: 'Rent',
                categoryColor: '#EF4444',
                flow: 'expense',
                percentage: 25.5,
                amount: 1200
              },
              {
                categoryId: 'savings-id',
                categoryName: 'Savings',
                categoryColor: '#6366F1',
                flow: 's&i',
                percentage: 10.6,
                amount: 500
              }
            ],
            flowPercentages: [
              {
                flow: 'income',
                percentage: 63.8,
                amount: 3000
              },
              {
                flow: 'expense',
                percentage: 25.5,
                amount: 1200
              },
              {
                flow: 's&i',
                percentage: 10.6,
                amount: 500
              }
            ],
            totalAmount: 4700
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerGetBudgetPercentages()

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/transactions/budget-percentages'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toEqual(mockResponse)
          expect(result.categoryPercentages).toHaveLength(3)
          expect(result.flowPercentages).toHaveLength(3)
          expect(result.totalAmount).toBe(4700)
        })
      })
    })

    describe('Given an empty response', () => {
      describe('When fetching budget percentages with no transactions', () => {
        it('Then it should return empty percentages', async () => {
          // Arrange: Mock empty response
          const mockResponse: BudgetPercentagesDto = {
            categoryPercentages: [],
            flowPercentages: [],
            totalAmount: 0
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await transactionsApi.transactionControllerGetBudgetPercentages()

          // Assert: Verify the contract
          expect(result).toEqual(mockResponse)
          expect(result.categoryPercentages).toHaveLength(0)
          expect(result.flowPercentages).toHaveLength(0)
          expect(result.totalAmount).toBe(0)
        })
      })
    })

    describe('Given an API error', () => {
      describe('When the API returns an error', () => {
        it('Then it should throw an error with proper message', async () => {
          // Arrange: Mock error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerGetBudgetPercentages()).rejects.toThrow(
            'Response returned an error code'
          )

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/transactions/budget-percentages'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
        })
      })
    })

    describe('Given network issues', () => {
      describe('When the network request fails', () => {
        it('Then it should throw an error', async () => {
          // Arrange: Mock network error
          mockFetch.mockRejectedValueOnce(new Error('Network error'))

          // Act & Assert: Verify error handling
          await expect(transactionsApi.transactionControllerGetBudgetPercentages()).rejects.toThrow(
            'The request failed and the interceptors did not return an alternative response'
          )
        })
      })
    })
  })
})
