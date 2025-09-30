import { createMocks } from 'node-mocks-http'
import handler from '../search/route'

// Mock the search service
jest.mock('@/lib/search', () => ({
  searchArticles: jest.fn(),
  getSearchSuggestions: jest.fn(),
}))

// Mock the database
jest.mock('@/lib/db', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles GET request with search query', async () => {
    const { searchArticles } = require('@/lib/search')
    
    const mockResults = [
      {
        id: '1',
        title: 'Test Article',
        summary: 'Test summary',
        authors: [{ name: 'John Doe' }],
        division: { name: 'Social Sciences' },
        publishedAt: new Date(),
        relevanceScore: 0.95,
      },
    ]
    
    searchArticles.mockResolvedValue(mockResults)
    
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        q: 'sustainability',
        limit: '10',
        offset: '0',
      },
    })

    await handler.GET(req)
    
    expect(searchArticles).toHaveBeenCalledWith({
      query: 'sustainability',
      limit: 10,
      offset: 0,
      filters: {},
    })
  })

  it('handles search with filters', async () => {
    const { searchArticles } = require('@/lib/search')
    
    searchArticles.mockResolvedValue([])
    
    const { req } = createMocks({
      method: 'GET',
      query: {
        q: 'policy',
        divisions: 'social-sciences,economics',
        authors: 'john-doe',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      },
    })

    await handler.GET(req)
    
    expect(searchArticles).toHaveBeenCalledWith({
      query: 'policy',
      limit: 20,
      offset: 0,
      filters: {
        divisions: ['social-sciences', 'economics'],
        authors: ['john-doe'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      },
    })
  })

  it('returns 400 for missing query parameter', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: {},
    })

    const response = await handler.GET(req)
    
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Query parameter is required')
  })

  it('handles search service errors', async () => {
    const { searchArticles } = require('@/lib/search')
    
    searchArticles.mockRejectedValue(new Error('Search service unavailable'))
    
    const { req } = createMocks({
      method: 'GET',
      query: {
        q: 'test',
      },
    })

    const response = await handler.GET(req)
    
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Search failed')
  })

  it('validates query length limits', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: {
        q: 'a'.repeat(1001), // Exceeds 1000 character limit
      },
    })

    const response = await handler.GET(req)
    
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Query too long')
  })

  it('handles pagination parameters', async () => {
    const { searchArticles } = require('@/lib/search')
    
    searchArticles.mockResolvedValue([])
    
    const { req } = createMocks({
      method: 'GET',
      query: {
        q: 'test',
        limit: '50',
        offset: '100',
      },
    })

    await handler.GET(req)
    
    expect(searchArticles).toHaveBeenCalledWith({
      query: 'test',
      limit: 50,
      offset: 100,
      filters: {},
    })
  })

  it('enforces maximum limit', async () => {
    const { searchArticles } = require('@/lib/search')
    
    searchArticles.mockResolvedValue([])
    
    const { req } = createMocks({
      method: 'GET',
      query: {
        q: 'test',
        limit: '200', // Exceeds max limit of 100
      },
    })

    await handler.GET(req)
    
    expect(searchArticles).toHaveBeenCalledWith({
      query: 'test',
      limit: 100, // Should be capped at 100
      offset: 0,
      filters: {},
    })
  })
})