import { 
  Article as PrismaArticle, 
  ResearchDivision as PrismaResearchDivision 
} from '@prisma/client'
import { Article, ResearchDivision } from '@/types'

// Transform Prisma article to typed article with parsed JSON fields
export function transformArticle(prismaArticle: PrismaArticle): Article {
  return {
    ...prismaArticle,
    tags: prismaArticle.tags ? JSON.parse(prismaArticle.tags) : [],
    seoKeywords: prismaArticle.seoKeywords ? JSON.parse(prismaArticle.seoKeywords) : []
  }
}

// Transform Prisma research division to typed division with parsed JSON fields
export function transformResearchDivision(prismaDiv: PrismaResearchDivision): ResearchDivision {
  return {
    ...prismaDiv,
    sdgAlignment: prismaDiv.sdgAlignment ? JSON.parse(prismaDiv.sdgAlignment) : []
  }
}

// Transform typed article to Prisma format with JSON strings
export function toPrismaArticle(article: Partial<Article>): Partial<PrismaArticle> {
  const { tags, seoKeywords, ...rest } = article
  return {
    ...rest,
    tags: tags ? JSON.stringify(tags) : undefined,
    seoKeywords: seoKeywords ? JSON.stringify(seoKeywords) : undefined
  }
}

// Transform typed division to Prisma format with JSON strings
export function toPrismaResearchDivision(division: Partial<ResearchDivision>): Partial<PrismaResearchDivision> {
  const { sdgAlignment, ...rest } = division
  return {
    ...rest,
    sdgAlignment: sdgAlignment ? JSON.stringify(sdgAlignment) : undefined
  }
}