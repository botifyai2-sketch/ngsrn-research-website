import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ArticleEditor from '@/components/cms/ArticleEditor'

interface EditArticlePageProps {
  params: {
    id: string
  }
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to edit articles
  if ((session.user as any).role === 'VIEWER') {
    redirect('/cms')
  }

  // Fetch the article and related data
  const [article, divisions, authors] = await Promise.all([
    prisma.article.findUnique({
      where: { id: params.id },
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
    }),
    prisma.researchDivision.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.author.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  if (!article) {
    notFound()
  }

  // Transform divisions to match expected type
  const transformedDivisions = divisions.map(division => ({
    ...division,
    sdgAlignment: typeof division.sdgAlignment === 'string' ? JSON.parse(division.sdgAlignment || '[]') : division.sdgAlignment,
  }));

  return (
    <div>
      <ArticleEditor 
        article={article}
        divisions={transformedDivisions}
        authors={authors}
      />
    </div>
  )
}