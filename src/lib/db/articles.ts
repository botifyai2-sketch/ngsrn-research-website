import { prisma } from '@/lib/prisma'
import { ArticleWithRelations } from '@/types'
import { unstable_cache } from 'next/cache'

// Mock data for simple deployment when database is disabled
const mockArticles: ArticleWithRelations[] = [];

// Check if database features are enabled
const isDatabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_CMS === 'true' || process.env.DATABASE_URL;

export async function getAllPublishedArticles(): Promise<ArticleWithRelations[]> {
  if (!isDatabaseEnabled) {
    return mockArticles;
  }
  
  try {
    return await prisma.article.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        division: true,
        authors: {
          include: {
            author: {
              include: {
                researchDivisions: {
                  include: {
                    division: true
                  }
                }
              }
            }
          }
        },
        mediaFiles: {
          include: {
            mediaFile: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    }) as any;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockArticles;
  }
}

export const getPublishedArticles = unstable_cache(
  async (): Promise<ArticleWithRelations[]> => {
    if (!isDatabaseEnabled) {
      return mockArticles;
    }
    
    try {
      return await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            lte: new Date()
          }
        },
        include: {
          division: true,
          authors: {
            include: {
            author: {
              include: {
                researchDivisions: {
                  include: {
                    division: true
                  }
                }
              }
            }
          }
        },
        mediaFiles: {
          include: {
            mediaFile: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    }) as any;
    } catch (error) {
      console.warn('Database not available, using mock data:', error);
      return mockArticles;
    }
  },
  ['published-articles'],
  { 
    revalidate: 300, // Cache for 5 minutes
    tags: ['articles']
  }
)

export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  if (!isDatabaseEnabled) {
    return null;
  }
  
  try {
    return await prisma.article.findUnique({
    where: { slug },
    include: {
      division: true,
      authors: {
        include: {
          author: {
            include: {
              researchDivisions: {
                include: {
                  division: true
                }
              }
            }
          }
        }
      },
      mediaFiles: {
        include: {
          mediaFile: true
        }
      }
    }
  }) as any;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return null;
  }
}

export async function getArticlesByDivision(divisionId: string): Promise<ArticleWithRelations[]> {
  if (!isDatabaseEnabled) {
    return mockArticles;
  }
  
  try {
    return await prisma.article.findMany({
      where: {
        divisionId,
        status: 'PUBLISHED',
        publishedAt: {
        lte: new Date()
      }
    },
    include: {
      division: true,
      authors: {
        include: {
          author: {
            include: {
              researchDivisions: {
                include: {
                  division: true
                }
              }
            }
          }
        }
      },
      mediaFiles: {
        include: {
          mediaFile: true
        }
      }
    },
    orderBy: {
      publishedAt: 'desc'
    }
  }) as any;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockArticles;
  }
}

export async function getArticlesByAuthor(authorId: string): Promise<ArticleWithRelations[]> {
  if (!isDatabaseEnabled) {
    return mockArticles;
  }
  
  try {
    return await prisma.article.findMany({
    where: {
      authors: {
        some: {
          authorId
        }
      },
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date()
      }
    },
    include: {
      division: true,
      authors: {
        include: {
          author: {
            include: {
              researchDivisions: {
                include: {
                  division: true
                }
              }
            }
          }
        }
      },
      mediaFiles: {
        include: {
          mediaFile: true
        }
      }
    },
    orderBy: {
      publishedAt: 'desc'
    }
  }) as any;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockArticles;
  }
}

export async function searchArticles(query: string, filters?: {
  divisionIds?: string[]
  authorIds?: string[]
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
}): Promise<ArticleWithRelations[]> {
  if (!isDatabaseEnabled) {
    return mockArticles;
  }
  
  try {
    return await prisma.article.findMany({
    where: {
      AND: [
        {
          status: 'PUBLISHED',
          publishedAt: {
            lte: new Date()
          }
        },
        {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { summary: { contains: query } }
          ]
        },
        ...(filters?.divisionIds ? [{ divisionId: { in: filters.divisionIds } }] : []),
        ...(filters?.authorIds ? [{ authors: { some: { authorId: { in: filters.authorIds } } } }] : []),
        ...(filters?.dateFrom ? [{ publishedAt: { gte: filters.dateFrom } }] : []),
        ...(filters?.dateTo ? [{ publishedAt: { lte: filters.dateTo } }] : [])
      ]
    },
    include: {
      division: true,
      authors: {
        include: {
          author: {
            include: {
              researchDivisions: {
                include: {
                  division: true
                }
              }
            }
          }
        }
      },
      mediaFiles: {
        include: {
          mediaFile: true
        }
      }
    },
    orderBy: {
      publishedAt: 'desc'
    }
  }) as any;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockArticles;
  }
}