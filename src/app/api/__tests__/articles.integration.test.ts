import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock the database
const mockPrisma = {
  article: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock authentication
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/articles Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/articles', () => {
    it('returns paginated articles', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article 1',
          slug: 'test-article-1',
          summary: 'Test summary 1',
          content: 'Test content 1',
          publishedAt: new Date(),
          authors: [{ name: 'John Doe' }],
          division: { name: 'Social Sciences' },
          tags: ['policy'],
        },
        {
          id: '2',
          title: 'Test Article 2',
          slug: 'test-article-2',
          summary: 'Test summary 2',
          content: 'Test content 2',
          publishedAt: new Date(),
          authors: [{ name: 'Jane Smith' }],
          division: { name: 'Economics' },
          tags: ['development'],
        },
      ]

      mockPrisma.article.findMany.mockResolvedValue(mockArticles)

      const request = new NextRequest('http://localhost:3000/api/articles?page=1&limit=10')
      const { GET } = await import('../articles/route')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.articles).toHaveLength(2)
      expect(data.articles[0].title).toBe('Test Article 1')
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { status: 'published' },
        include: {
          authors: true,
          division: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
      })
    })

    it('handles division filter', async () => {
      mockPrisma.article.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/articles?division=social-sciences')
      const { GET } = await import('../articles/route')
      
      await GET(request)

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          status: 'published',
          division: { slug: 'social-sciences' },
        },
        include: {
          authors: true,
          division: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
      })
    })

    it('handles author filter', async () => {
      mockPrisma.article.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/articles?author=john-doe')
      const { GET } = await import('../articles/route')
      
      await GET(request)

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          status: 'published',
          authors: {
            some: { slug: 'john-doe' },
          },
        },
        include: {
          authors: true,
          division: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
      })
    })
  })

  describe('POST /api/articles', () => {
    it('creates new article with authentication', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      })

      const mockArticle = {
        id: '1',
        title: 'New Article',
        slug: 'new-article',
        content: 'Article content',
        summary: 'Article summary',
        status: 'draft',
      }

      mockPrisma.article.create.mockResolvedValue(mockArticle)

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Article',
          content: 'Article content',
          summary: 'Article summary',
          divisionId: '1',
          authorIds: ['1'],
          tags: ['policy'],
        }),
      })

      const { POST } = await import('../articles/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.article.title).toBe('New Article')
      expect(mockPrisma.article.create).toHaveBeenCalled()
    })

    it('returns 401 without authentication', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Article',
          content: 'Article content',
        }),
      })

      const { POST } = await import('../articles/route')
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('validates required fields', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      })

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      })

      const { POST } = await import('../articles/route')
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Database error handling', () => {
    it('handles database connection errors', async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/articles')
      const { GET } = await import('../articles/route')
      
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('handles validation errors', async () => {
      mockPrisma.article.create.mockRejectedValue(new Error('Validation failed'))

      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      })

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Article',
          content: 'Article content',
          summary: 'Article summary',
          divisionId: '1',
          authorIds: ['1'],
        }),
      })

      const { POST } = await import('../articles/route')
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})