import { prisma } from '@/lib/prisma'
import { ArticleWithRelations } from '@/types'
import { unstable_cache } from 'next/cache'

export async function getAllPublishedArticles(): Promise<ArticleWithRelations[]> {
  return prisma.article.findMany({
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
  }) as any
}

export const getPublishedArticles = unstable_cache(
  async (): Promise<ArticleWithRelations[]> => {
    return prisma.article.findMany({
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
    }) as any
  },
  ['published-articles'],
  { 
    revalidate: 300, // Cache for 5 minutes
    tags: ['articles']
  }
)

export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  return prisma.article.findUnique({
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
  }) as any
}

export async function getArticlesByDivision(divisionId: string): Promise<ArticleWithRelations[]> {
  return prisma.article.findMany({
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
  }) as any
}

export async function getArticlesByAuthor(authorId: string): Promise<ArticleWithRelations[]> {
  return prisma.article.findMany({
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
  }) as any
}

export async function searchArticles(query: string, filters?: {
  divisionIds?: string[]
  authorIds?: string[]
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
}): Promise<ArticleWithRelations[]> {
  return prisma.article.findMany({
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
  }) as any
}