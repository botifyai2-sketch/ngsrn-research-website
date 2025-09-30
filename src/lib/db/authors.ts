import { prisma } from '@/lib/prisma'
import { Author } from '@/types'

export async function getAllAuthors(): Promise<Author[]> {
  return prisma.author.findMany({
    include: {
      researchDivisions: {
        include: {
          division: true
        }
      },
      articles: {
        include: {
          article: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getLeadershipTeam(): Promise<Author[]> {
  return prisma.author.findMany({
    where: {
      isLeadership: true
    },
    include: {
      researchDivisions: {
        include: {
          division: true
        }
      },
      articles: {
        include: {
          article: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getAuthorById(id: string): Promise<Author | null> {
  return prisma.author.findUnique({
    where: { id },
    include: {
      researchDivisions: {
        include: {
          division: true
        }
      },
      articles: {
        include: {
          article: true
        }
      }
    }
  })
}

export async function getAuthorsByDivision(divisionId: string): Promise<Author[]> {
  return prisma.author.findMany({
    where: {
      researchDivisions: {
        some: {
          divisionId
        }
      }
    },
    include: {
      researchDivisions: {
        include: {
          division: true
        }
      },
      articles: {
        include: {
          article: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}