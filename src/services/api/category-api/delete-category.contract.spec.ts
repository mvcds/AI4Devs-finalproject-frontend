import { categoriesApi } from '..'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Category Delete Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Delete Category', () => {
    describe('Given an existing category', () => {
      describe('When deleting a category', () => {
        it('Then it should successfully delete and return void', async () => {
          // Arrange: Mock successful HTTP response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: async () => undefined,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await categoriesApi.categoryControllerRemove({ id: 'existing-category-id' })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/existing-category-id'),
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

    describe('Given a non-existent category', () => {
      describe('When attempting to delete', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Category not found' })
          })

          // Act & Assert: Verify error handling
          await expect(categoriesApi.categoryControllerRemove({ id: 'non-existent-id' })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/non-existent-id'),
            expect.objectContaining({
              method: 'DELETE'
            })
          )
        })
      })
    })
  })
})
