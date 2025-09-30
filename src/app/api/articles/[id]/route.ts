import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const articleUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  summary: z.string().min(1, 'Summary is required').optional(),
  divisionId: z.string().min(1, 'Division is required').optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required').optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  scheduledFor: z.string().optional().nullable(),
})

// GET /api/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        division: true,
        authors: {
          include: {
            author: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        mediaFiles: {
          include: {
            mediaFile: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = articleUpdateSchema.parse(body)

    const { id } = await params
    
    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.title) {
      updateData.title = validatedData.title
      // Update slug if title changed
      if (validatedData.title !== existingArticle.title) {
        const newSlug = validatedData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        
        // Check if new slug already exists
        const slugExists = await prisma.article.findFirst({
          where: {
            slug: newSlug,
            id: { not: id }
          }
        })

        if (slugExists) {
          return NextResponse.json(
            { error: 'An article with this title already exists' },
            { status: 400 }
          )
        }

        updateData.slug = newSlug
      }
    }

    if (validatedData.content) {
      updateData.content = validatedData.content
      // Recalculate read time
      const wordCount = validatedData.content.split(/\s+/).length
      updateData.readTime = Math.ceil(wordCount / 200)
    }

    if (validatedData.summary) updateData.summary = validatedData.summary
    if (validatedData.divisionId) updateData.divisionId = validatedData.divisionId
    if (validatedData.tags) updateData.tags = JSON.stringify(validatedData.tags)
    if (validatedData.seoTitle !== undefined) updateData.seoTitle = validatedData.seoTitle
    if (validatedData.seoDescription !== undefined) updateData.seoDescription = validatedData.seoDescription
    if (validatedData.seoKeywords) updateData.seoKeywords = JSON.stringify(validatedData.seoKeywords)

    // Handle status changes
    if (validatedData.status) {
      updateData.status = validatedData.status
      
      if (validatedData.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date()
      } else if (validatedData.status === 'SCHEDULED') {
        if (validatedData.scheduledFor) {
          updateData.scheduledFor = new Date(validatedData.scheduledFor)
        }
      } else if (validatedData.status === 'DRAFT') {
        updateData.scheduledFor = null
      }
    }

    // Handle scheduled publication
    if (validatedData.scheduledFor !== undefined) {
      updateData.scheduledFor = validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        division: true,
        authors: {
          include: {
            author: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        mediaFiles: {
          include: {
            mediaFile: true
          }
        }
      }
    })

    // Update authors if provided
    if (validatedData.authorIds) {
      // Remove existing author relationships
      await prisma.articleAuthor.deleteMany({
        where: { articleId: id }
      })

      // Create new author relationships
      await prisma.articleAuthor.createMany({
        data: validatedData.authorIds.map((authorId, index) => ({
          articleId: id,
          authorId,
          order: index
        }))
      })

      // Fetch updated article with new authors
      const updatedArticle = await prisma.article.findUnique({
        where: { id },
        include: {
          division: true,
          authors: {
            include: {
              author: true
            },
            orderBy: {
              order: 'asc'
            }
          },
          mediaFiles: {
            include: {
              mediaFile: true
            }
          }
        }
      })

      return NextResponse.json(updatedArticle)
    }

    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const article = await prisma.article.findUnique({
      where: { id }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}