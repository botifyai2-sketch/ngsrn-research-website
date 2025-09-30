import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ArticleManager from '@/components/cms/ArticleManager'

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Fetch initial articles data (excluding archived articles)
  const articles = await prisma.article.findMany({
    where: {
      status: {
        not: 'ARCHIVED'
      }
    },
    include: {
      division: true,
      authors: {
        include: {
          author: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return <ArticleManager initialArticles={articles as any} />
}