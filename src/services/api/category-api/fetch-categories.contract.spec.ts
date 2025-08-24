import { categoriesApi } from '..'
import { CategoryResponseDto } from 'ai4devs-api-client'

// Mock fetch globally to intercept HTTP calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Category Fetch Operations Contract Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Fetch Categories', () => {
    describe('Given a successful API response', () => {
      describe('When fetching all categories', () => {
        it('Then it should return a list of categories', async () => {
          // Arrange: Mock successful HTTP response
          const mockCategories = [
            {
              id: 'cat-123',
              name: 'Salary',
              color: '#10B981',
              flow: 'income',
              description: 'Salary and income category',
              parentId: null,
              createdAt: new Date('2024-01-15T10:00:00Z'),
              updatedAt: new Date('2024-01-15T10:00:00Z')
            }
          ]

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockCategories,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await categoriesApi.categoryControllerFindAll()

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toEqual(mockCategories)
          expect(result).toHaveLength(1)
          expect(result[0]).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            color: expect.any(String),
            flow: expect.any(String)
          })
        })
      })

      describe('When fetching a single category', () => {
        it('Then it should return the category details', async () => {
          // Arrange: Mock successful HTTP response
          const mockCategory = {
            id: 'cat-123',
            name: 'Salary',
            color: '#10B981',
            flow: 'income',
            description: 'Salary and income category',
            parentId: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z')
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockCategory,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })

          // Act: Call the API
          const result = await categoriesApi.categoryControllerFindOne({ id: 'cat-123' })

          // Assert: Verify the contract
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/cat-123'),
            expect.objectContaining({
              method: 'GET',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              })
            })
          )
          expect(result).toEqual(mockCategory)
          expect(result.id).toBe('cat-123')
          expect(result.name).toBe('Salary')
        })
      })
    })

    describe('Given an API error response', () => {
      describe('When fetching categories fails', () => {
        it('Then it should throw an error with proper message', async () => {
          // Arrange: Mock HTTP error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ message: 'Failed to fetch categories' })
          })

          // Act & Assert: Verify error handling
          await expect(categoriesApi.categoryControllerFindAll()).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories'),
            expect.any(Object)
          )
        })
      })

      describe('When fetching a non-existent category', () => {
        it('Then it should throw a not found error', async () => {
          // Arrange: Mock HTTP not found error response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ message: 'Category not found' })
          })

          // Act & Assert: Verify error handling
          await expect(categoriesApi.categoryControllerFindOne({ id: 'non-existent-id' })).rejects.toThrow()
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories/non-existent-id'),
            expect.any(Object)
          )
        })
      })
    })
  })
})
