import { categoriesApi } from '..'
import { UpdateCategoryDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Category Edit Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Edit Category', () => {
    describe('Given valid update data', () => {
      describe('When updating an existing category', () => {
        it('Then it should return the updated category', async () => {
          // Arrange: Mock successful HTTP response
          const updateData: UpdateCategoryDto = {
            name: 'Updated Category',
            color: '#EF4444'
          }

          const mockUpdatedCategory = {
            id: 'existing-category-id',
            name: 'Updated Category',
            color: '#EF4444',
            flow: 'expense',
            description: 'Updated category description',
            parentId: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date() // Should be updated
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockUpdatedCategory,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await categoriesApi.categoryControllerUpdate({ id: 'existing-category-id', updateCategoryDto: updateData })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/existing-category-id'),
            expect.objectContaining({
              method: 'PATCH',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify(updateData)
            })
          )
          expect(result).toEqual(mockUpdatedCategory)
          expect(result.name).toBe('Updated Category')
          expect(result.color).toBe('#EF4444')
        })
      })
    })

    describe('Given invalid update data', () => {
      describe('When updating a non-existent category', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found error response
          const updateData: UpdateCategoryDto = {
            name: 'Updated Category'
          }

          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Category not found' })
          })

          // Act & Assert: Verify error handling
          await expect(categoriesApi.categoryControllerUpdate({ id: 'non-existent-id', updateCategoryDto: updateData })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/non-existent-id'),
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
