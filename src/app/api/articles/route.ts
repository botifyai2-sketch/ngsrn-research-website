import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withApiCache, apiCacheConfigs } from '@/lib/api-cache'
import { cacheInvalidation } from '@/lib/api-cache'

// Schema for article creation/update
const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().min(1, 'Summary is required'),
  divisionId: z.string().min(1, 'Division is required'),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  scheduledFor: z.string().optional(),
})

// GET /api/articles - Get all articles (with filters for CMS)
async function getArticles(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const divisionId = searchParams.get('divisionId')
    const authorId = searchParams.get('authorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (divisionId) {
      where.divisionId = divisionId
    }
    
    if (authorId) {
      where.authors = {
        some: {
          authorId
        }
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          division: true,
          authors: {
            include: {
              author: true
            }
          },
          mediaFiles: {
            include: {
              mediaFile: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = articleSchema.parse(body)

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this title already exists' },
        { status: 400 }
      )
    }

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = validatedData.content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200)

    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug,
        content: validatedData.content,
        summary: validatedData.summary,
        divisionId: validatedData.divisionId,
        tags: JSON.stringify(validatedData.tags),
        seoTitle: validatedData.seoTitle,
        seoDescription: validatedData.seoDescription,
        seoKeywords: JSON.stringify(validatedData.seoKeywords),
        status: validatedData.status,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        readTime,
        authors: {
          create: validatedData.authorIds.map((authorId, index) => ({
            authorId,
            order: index
          }))
        }
      },
      include: {
        division: true,
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    // Invalidate article caches
    await cacheInvalidation.invalidateArticles();
    
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

// Apply caching to GET requests
export const GET = withApiCache(getArticles, {
  ttl: apiCacheConfigs.articles.ttl,
  keyGenerator: (req: NextRequest) => {
    const url = new URL(req.url);
    const params = url.searchParams;
    return `articles:${params.get('status')}:${params.get('divisionId')}:${params.get('authorId')}:${params.get('page')}:${params.get('limit')}`;
  },
  skipCache: (req: NextRequest) => {
    // Skip cache for authenticated CMS requests that might need real-time data
    const url = new URL(req.url);
    return url.searchParams.has('nocache');
  },
});