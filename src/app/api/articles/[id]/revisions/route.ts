import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// First, let's add the ArticleRevision model to track changes
// This will need to be added to the Prisma schema later

// GET /api/articles/[id]/revisions - Get article revision history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll return a simplified version history based on updatedAt
    // In a full implementation, we'd have a separate ArticleRevision table
    const { id } = await params
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        status: true
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Mock revision history - in a real implementation, this would come from ArticleRevision table
    const revisions = [
      {
        id: `${article.id}-rev-1`,
        articleId: article.id,
        version: 1,
        title: article.title,
        summary: 'Initial version',
        createdAt: article.createdAt,
        createdBy: session.user.email,
        changeType: 'created'
      },
      {
        id: `${article.id}-rev-2`,
        articleId: article.id,
        version: 2,
        title: article.title,
        summary: 'Last updated',
        createdAt: article.updatedAt,
        createdBy: session.user.email,
        changeType: 'updated'
      }
    ]

    return NextResponse.json(revisions)
  } catch (error) {
    console.error('Error fetching article revisions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article revisions' },
      { status: 500 }
    )
  }
}

// POST /api/articles/[id]/revisions - Create a new revision (save point)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { summary } = await request.json()
    const { id } = await params

    const article = await prisma.article.findUnique({
      where: { id }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // In a full implementation, we would create an ArticleRevision record here
    // For now, we'll just update the article's updatedAt timestamp
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: `${article.id}-rev-${Date.now()}`,
      articleId: article.id,
      version: 'current',
      summary: summary || 'Manual save point',
      createdAt: updatedArticle.updatedAt,
      createdBy: session.user.email,
      changeType: 'revision'
    })
  } catch (error) {
    console.error('Error creating article revision:', error)
    return NextResponse.json(
      { error: 'Failed to create article revision' },
      { status: 500 }
    )
  }
}