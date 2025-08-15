const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000'

// Frequency constants matching the backend
export const FREQUENCIES = {
  DAILY: 'daily',
  WEEK: 'week',
  FORTNIGHT: 'fortnight',
  MONTH: 'month',
  TWO_MONTH: '2-month',
  THREE_MONTH: '3-month',
  QUARTER: 'quarter',
  HALF: 'half',
  YEAR: 'year',
  TWO_YEAR: '2-year',
} as const

export type Frequency = typeof FREQUENCIES[keyof typeof FREQUENCIES]

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  [FREQUENCIES.DAILY]: 'Daily',
  [FREQUENCIES.WEEK]: 'Week',
  [FREQUENCIES.FORTNIGHT]: 'Fortnight',
  [FREQUENCIES.MONTH]: 'Month',
  [FREQUENCIES.TWO_MONTH]: '2-Month',
  [FREQUENCIES.THREE_MONTH]: '3-Month',
  [FREQUENCIES.QUARTER]: 'Quarter',
  [FREQUENCIES.HALF]: 'Half',
  [FREQUENCIES.YEAR]: 'Year',
  [FREQUENCIES.TWO_YEAR]: '2-Year',
}

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  categoryId?: string
  categoryName?: string
  notes?: string
  frequency?: string
  monthlyEquivalent?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  flow: 'income' | 'expense' | 's&i'
  color: string
  description: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionData {
  description: string
  amount: number
  date: string
  categoryId?: string
  notes?: string
  frequency: string
}

export interface UpdateTransactionData {
  description?: string
  amount?: number
  date?: string
  categoryId?: string
  notes?: string
  frequency?: string
}

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  transactionCount: number
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    // Handle responses without body (like DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    // Only try to parse JSON if there's content
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return undefined as T
  }

  // Transaction endpoints
  async getTransactions(params?: {
    page?: number
    limit?: number
    type?: 'income' | 'expense'
    categoryId?: string
    startDate?: string
    endDate?: string
  }): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.type) searchParams.append('type', params.type)
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const queryString = searchParams.toString()
    const endpoint = `/api/transactions${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.request(`/api/transactions/${id}`)
  }

  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    return this.request(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    })
  }

  async getTransactionSummary(params?: {
    startDate?: string
    endDate?: string
  }): Promise<TransactionSummary> {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const queryString = searchParams.toString()
    const endpoint = `/api/transactions/summary${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    return this.request('/api/categories')
  }

  async getCategory(id: string): Promise<Category> {
    return this.request(`/api/categories/${id}`)
  }
}

export const apiService = new ApiService()
