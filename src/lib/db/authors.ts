import { prisma } from '@/lib/prisma'
import { Author } from '@/types'

// Mock data for simple deployment when database is disabled
const mockAuthors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Director of Sustainable Energy Research',
    bio: 'Dr. Sarah Johnson is a leading expert in renewable energy systems with over 15 years of experience in sustainable technology development. She holds a Ph.D. in Environmental Engineering from MIT and has published over 50 peer-reviewed papers on solar energy optimization and grid integration.',
    email: 'sarah.johnson@ngsrn.org',
    linkedinUrl: 'https://linkedin.com/in/sarah-johnson-energy',
    profileImage: '/images/team/sarah-johnson.jpg',
    isLeadership: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
    researchDivisions: [],
    articles: []
  },
  {
    id: '2',
    name: 'Prof. Michael Chen',
    title: 'Head of Climate Science Division',
    bio: 'Professor Michael Chen is a renowned climate scientist specializing in atmospheric modeling and climate change mitigation strategies. He has been instrumental in developing innovative approaches to carbon capture and has advised multiple international organizations on climate policy.',
    email: 'michael.chen@ngsrn.org',
    linkedinUrl: 'https://linkedin.com/in/michael-chen-climate',
    profileImage: '/images/team/michael-chen.jpg',
    isLeadership: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
    researchDivisions: [],
    articles: []
  }
];

// Check if database features are enabled
const isDatabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_CMS === 'true' || process.env.DATABASE_URL;

export async function getAllAuthors(): Promise<Author[]> {
  if (!isDatabaseEnabled) {
    return mockAuthors as Author[];
  }
  
  try {
    return await prisma.author.findMany({
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
    });
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockAuthors as Author[];
  }
}

export async function getLeadershipTeam(): Promise<Author[]> {
  if (!isDatabaseEnabled) {
    return mockAuthors.filter(author => author.isLeadership) as Author[];
  }
  
  try {
    return await prisma.author.findMany({
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
    });
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockAuthors.filter(author => author.isLeadership) as Author[];
  }
}

export async function getAuthorById(id: string): Promise<Author | null> {
  if (!isDatabaseEnabled) {
    return mockAuthors.find(author => author.id === id) as Author || null;
  }
  
  try {
    return await prisma.author.findUnique({
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
    });
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockAuthors.find(author => author.id === id) as Author || null;
  }
}

export async function getAuthorsByDivision(divisionId: string): Promise<Author[]> {
  if (!isDatabaseEnabled) {
    // In mock mode, return all authors since we don't have division relationships
    return mockAuthors as Author[];
  }
  
  try {
    return await prisma.author.findMany({
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
    });
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockAuthors as Author[];
  }
}