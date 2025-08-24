import { categoriesApi } from '..'
import { CreateCategoryDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Category Create Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Create Category', () => {
    describe('Given valid category data', () => {
      describe('When creating a new category', () => {
        it('Then it should return the created category', async () => {
          // Arrange: Mock successful HTTP response
          const createData: CreateCategoryDto = {
            name: 'New Category',
            color: '#3B82F6',
            flow: 'income'
          }

          const mockCreatedCategory = {
            id: 'new-category-id',
            name: 'New Category',
            color: '#3B82F6',
            flow: 'income',
            description: 'New category description',
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: async () => mockCreatedCategory,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await categoriesApi.categoryControllerCreate({ createCategoryDto: createData })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories'),
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: expect.stringContaining('"name":"New Category"')
            })
          )
          expect(result).toEqual(mockCreatedCategory)
          expect(result.id).toBe('new-category-id')
          expect(result.name).toBe('New Category')
          expect(result.color).toBe('#3B82F6')
        })
      })
    })

    describe('Given invalid category data', () => {
      describe('When creating a category with missing required fields', () => {
        it('Then it should throw a validation error', async () => {
          // Arrange: Mock HTTP validation error response
          const invalidData = {
            name: '', // Missing required field
            color: '#3B82F6'
          } as CreateCategoryDto

          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({ message: 'Validation failed: name is required' })
          })

          // Act & Assert: Verify error handling
          await expect(categoriesApi.categoryControllerCreate({ createCategoryDto: invalidData })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories'),
            expect.objectContaining({
              method: 'POST',
              body: JSON.stringify(invalidData)
            })
          )
        })
      })
    })
  })
})
