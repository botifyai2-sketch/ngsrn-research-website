import { prisma } from '@/lib/prisma'
import { ResearchDivision } from '@/types'
import { transformResearchDivision } from './transforms'
import { unstable_cache } from 'next/cache'

export const getAllDivisions = unstable_cache(
  async (): Promise<ResearchDivision[]> => {
    const divisions = await prisma.researchDivision.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    return divisions.map(transformResearchDivision)
  },
  ['all-divisions'],
  { 
    revalidate: 600, // Cache for 10 minutes
    tags: ['divisions']
  }
)

export async function getDivisionById(id: string): Promise<ResearchDivision | null> {
  const division = await prisma.researchDivision.findUnique({
    where: { id }
  })
  return division ? transformResearchDivision(division) : null
}

export async function getDivisionByName(name: string): Promise<ResearchDivision | null> {
  const division = await prisma.researchDivision.findUnique({
    where: { name }
  })
  return division ? transformResearchDivision(division) : null
}

export async function getDivisionWithStats(id: string) {
  const division = await prisma.researchDivision.findUnique({
    where: { id },
    include: {
      articles: {
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            lte: new Date()
          }
        }
      },
      authors: {
        include: {
          author: true
        }
      }
    }
  })

  if (!division) return null

  // Transform the division to match our type expectations
  const transformedDivision = transformResearchDivision(division)

  return {
    ...transformedDivision,
    articles: division.articles,
    authors: division.authors,
    articleCount: division.articles.length,
    authorCount: division.authors.length
  }
}