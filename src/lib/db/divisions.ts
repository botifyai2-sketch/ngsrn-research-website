import { prisma } from '@/lib/prisma'
import { ResearchDivision } from '@/types'
import { transformResearchDivision } from './transforms'
import { unstable_cache } from 'next/cache'

// Mock data for simple deployment when database is disabled
const mockDivisions = [
  {
    id: '1',
    name: 'Sustainable Energy',
    description: 'Research focused on renewable energy technologies, energy storage solutions, and grid optimization for a sustainable future.',
    sdgAlignment: ['SDG 7: Affordable and Clean Energy', 'SDG 13: Climate Action'],
    color: '#003366',
    icon: 'energy',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Climate Science',
    description: 'Advanced climate modeling, atmospheric research, and development of climate change mitigation and adaptation strategies.',
    sdgAlignment: ['SDG 13: Climate Action', 'SDG 14: Life Below Water', 'SDG 15: Life on Land'],
    color: '#2E8B57',
    icon: 'climate',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Sustainable Agriculture',
    description: 'Innovative farming techniques, precision agriculture, and sustainable food systems for global food security.',
    sdgAlignment: ['SDG 2: Zero Hunger', 'SDG 6: Clean Water and Sanitation', 'SDG 15: Life on Land'],
    color: '#8B4513',
    icon: 'agriculture',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: 'Water Resources',
    description: 'Water conservation technologies, purification systems, and sustainable water management for communities worldwide.',
    sdgAlignment: ['SDG 6: Clean Water and Sanitation', 'SDG 14: Life Below Water'],
    color: '#4682B4',
    icon: 'water',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Check if database features are enabled
const isDatabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_CMS === 'true' || process.env.DATABASE_URL;

export const getAllDivisions = unstable_cache(
  async (): Promise<ResearchDivision[]> => {
    if (!isDatabaseEnabled) {
      return mockDivisions as ResearchDivision[];
    }
    
    try {
      const divisions = await prisma.researchDivision.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      return divisions.map(transformResearchDivision);
    } catch (error) {
      console.warn('Database not available, using mock data:', error);
      return mockDivisions as ResearchDivision[];
    }
  },
  ['all-divisions'],
  { 
    revalidate: 600, // Cache for 10 minutes
    tags: ['divisions']
  }
)

export async function getDivisionById(id: string): Promise<ResearchDivision | null> {
  if (!isDatabaseEnabled) {
    return mockDivisions.find(div => div.id === id) as ResearchDivision || null;
  }
  
  try {
    const division = await prisma.researchDivision.findUnique({
      where: { id }
    });
    return division ? transformResearchDivision(division) : null;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockDivisions.find(div => div.id === id) as ResearchDivision || null;
  }
}

export async function getDivisionByName(name: string): Promise<ResearchDivision | null> {
  if (!isDatabaseEnabled) {
    return mockDivisions.find(div => div.name === name) as ResearchDivision || null;
  }
  
  try {
    const division = await prisma.researchDivision.findUnique({
      where: { name }
    });
    return division ? transformResearchDivision(division) : null;
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    return mockDivisions.find(div => div.name === name) as ResearchDivision || null;
  }
}

export async function getDivisionWithStats(id: string) {
  if (!isDatabaseEnabled) {
    const division = mockDivisions.find(div => div.id === id);
    if (!division) return null;
    
    return {
      ...division,
      articles: [],
      authors: [],
      articleCount: 0,
      authorCount: 0
    };
  }
  
  try {
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
    });

    if (!division) return null;

    // Transform the division to match our type expectations
    const transformedDivision = transformResearchDivision(division);

    return {
      ...transformedDivision,
      articles: division.articles,
      authors: division.authors,
      articleCount: division.articles.length,
      authorCount: division.authors.length
    };
  } catch (error) {
    console.warn('Database not available, using mock data:', error);
    const division = mockDivisions.find(div => div.id === id);
    if (!division) return null;
    
    return {
      ...division,
      articles: [],
      authors: [],
      articleCount: 0,
      authorCount: 0
    };
  }
}