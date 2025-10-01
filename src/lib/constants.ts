// NGSRN Brand Constants

export const NGSRN_COLORS = {
  primary: '#003366', // Deep Blue
  secondary: '#2E8B57', // Emerald Green
  accent: '#FFD700', // Gold
} as const;

export const RESEARCH_DIVISIONS = [
  {
    id: 'social-sciences-governance',
    name: 'Social Sciences & Governance',
    description: 'Research focused on governance structures, policy analysis, and social systems',
    sdgAlignment: ['SDG 16: Peace, Justice and Strong Institutions', 'SDG 10: Reduced Inequalities'],
    color: NGSRN_COLORS.primary,
    icon: 'users',
  },
  {
    id: 'economics-development',
    name: 'Economics & Development',
    description: 'Economic research and sustainable development strategies',
    sdgAlignment: ['SDG 8: Decent Work and Economic Growth', 'SDG 1: No Poverty'],
    color: NGSRN_COLORS.secondary,
    icon: 'trending-up',
  },
  {
    id: 'environment-climate-sustainability',
    name: 'Environment Climate & Sustainability',
    description: 'Environmental research and climate change mitigation strategies',
    sdgAlignment: ['SDG 13: Climate Action', 'SDG 15: Life on Land', 'SDG 14: Life Below Water'],
    color: NGSRN_COLORS.accent,
    icon: 'leaf',
  },
  {
    id: 'health-human-development',
    name: 'Health & Human Development',
    description: 'Public health research and human development initiatives',
    sdgAlignment: ['SDG 3: Good Health and Well-being', 'SDG 4: Quality Education'],
    color: NGSRN_COLORS.primary,
    icon: 'heart',
  },
  {
    id: 'policy-innovation',
    name: 'Policy & Innovation',
    description: 'Policy research and innovation in governance and technology',
    sdgAlignment: ['SDG 9: Industry, Innovation and Infrastructure', 'SDG 17: Partnerships for the Goals'],
    color: NGSRN_COLORS.secondary,
    icon: 'lightbulb',
  },
];

export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'NextGen Sustainable Research Network',
  shortName: 'NGSRN',
  description: 'Advancing policy-focused research to shape sustainable futures for Africa',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org',
  ogImage: '/og-image.jpg',
  links: {
    linkedin: 'https://www.linkedin.com/company/107658487/',
    email: 'info@ngsrn.org',
  },
} as const;

export const API_ROUTES = {
  articles: '/api/articles',
  authors: '/api/authors',
  search: '/api/search',
  ai: '/api/ai',
  media: '/api/media',
  auth: '/api/auth',
} as const;

export const PAGE_ROUTES = {
  home: '/',
  research: '/research',
  leadership: '/leadership',
  articles: '/articles',
  search: '/search',
  contact: '/contact',
  about: '/about',
  admin: '/admin',
  legal: {
    privacy: '/legal/privacy',
    terms: '/legal/terms',
    usageGuidelines: '/legal/usage-guidelines',
    contact: '/legal/contact',
  },
} as const;