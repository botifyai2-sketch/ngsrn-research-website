import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ArticleEditor from '@/components/cms/ArticleEditor'

export default async function NewArticlePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to create articles
  if ((session.user as any).role === 'VIEWER') {
    redirect('/cms')
  }

  // Fetch divisions and authors for the editor
  const [divisions, authors] = await Promise.all([
    prisma.researchDivision.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.author.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  // Transform divisions to match expected type
  const transformedDivisions = divisions.map(division => ({
    ...division,
    sdgAlignment: typeof division.sdgAlignment === 'string' ? JSON.parse(division.sdgAlignment || '[]') : division.sdgAlignment,
  }));

  return (
    <div>
      <ArticleEditor 
        divisions={transformedDivisions}
        authors={authors}
      />
    </div>
  )
}