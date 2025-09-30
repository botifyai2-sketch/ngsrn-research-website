import { Article, ResearchDivision, Author } from '@/types';
import { Metadata } from 'next';

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

/**
 * Generate SEO-friendly URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate Next.js Metadata object from SEO data
 */
export function generateMetadata(seoData: SEOData, baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'): Metadata {
  const {
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType = 'article',
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags
  } = seoData;

  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : undefined;
  const fullOgImage = ogImage ? `${baseUrl}${ogImage}` : `${baseUrl}/images/og-default.jpg`;

  return {
    title,
    description,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : (typeof keywords === 'string' ? keywords : ''),
    authors: authors?.map(author => ({ name: author })),
    category: section,
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: fullCanonicalUrl,
      siteName: 'NextGen Sustainable Research Network',
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: ogType as any,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
      ...(section && { section }),
      ...(tags && { tags }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImage],
      creator: '@NGSRN_Africa',
      site: '@NGSRN_Africa',
    },

    // Additional metadata
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical URL
    ...(fullCanonicalUrl && { alternates: { canonical: fullCanonicalUrl } }),
  };
}

/**
 * Generate SEO data for an article
 */
export function generateArticleSEO(article: Article, division: ResearchDivision, authors: Author[]): SEOData {
  const authorNames = authors.map(author => author.name);
  
  // Use custom SEO fields if available, otherwise generate from content
  const title = article.seoTitle || `${article.title} | NGSRN Research`;
  const description = article.seoDescription || article.summary;
  // Handle tags - they might be a JSON string or array
  const articleTags = Array.isArray(article.tags) 
    ? article.tags 
    : (typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : []);
  
  const keywords = article.seoKeywords || [
    ...articleTags,
    division.name,
    'research',
    'Africa',
    'sustainable development',
    ...authorNames
  ];

  return {
    title,
    description,
    keywords,
    canonicalUrl: `/articles/${article.slug}`,
    ogType: 'article',
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
    authors: authorNames,
    section: division.name,
    tags: articleTags,
  };
}

/**
 * Generate SEO data for research division pages
 */
export function generateDivisionSEO(division: ResearchDivision): SEOData {
  return {
    title: `${division.name} Research | NGSRN`,
    description: `Explore ${division.name.toLowerCase()} research and publications from the NextGen Sustainable Research Network. ${division.description}`,
    keywords: [
      division.name,
      'research',
      'Africa',
      'sustainable development',
      'policy',
      ...division.sdgAlignment.map(sdg => `SDG ${sdg}`)
    ],
    canonicalUrl: `/research/${division.id}`,
    section: division.name,
  };
}

/**
 * Generate SEO data for author/leadership pages
 */
export function generateAuthorSEO(author: Author, divisions: ResearchDivision[]): SEOData {
  const divisionNames = divisions.map(d => d.name);
  
  return {
    title: `${author.name} | NGSRN Leadership`,
    description: `Learn about ${author.name}, ${author.title} at NextGen Sustainable Research Network. ${author.bio.substring(0, 150)}...`,
    keywords: [
      author.name,
      author.title,
      'leadership',
      'research',
      'Africa',
      ...divisionNames
    ],
    canonicalUrl: `/leadership/${author.id}`,
    section: 'Leadership',
  };
}

/**
 * Generate structured data (JSON-LD) for articles
 */
export function generateArticleStructuredData(
  article: Article, 
  division: ResearchDivision, 
  authors: Author[],
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    image: article.downloadUrl ? `${baseUrl}${article.downloadUrl}` : `${baseUrl}/images/og-default.jpg`,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: authors.map(author => ({
      '@type': 'Person',
      name: author.name,
      jobTitle: author.title,
      affiliation: {
        '@type': 'Organization',
        name: 'NextGen Sustainable Research Network'
      },
      ...(author.linkedinUrl && { sameAs: author.linkedinUrl })
    })),
    publisher: {
      '@type': 'Organization',
      name: 'NextGen Sustainable Research Network',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/articles/${article.slug}`
    },
    articleSection: division.name,
    keywords: (() => {
      const tags = Array.isArray(article.tags) 
        ? article.tags 
        : (typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : []);
      return tags.join(', ');
    })(),
    wordCount: article.content.split(' ').length,
    timeRequired: `PT${article.readTime}M`,
    about: {
      '@type': 'Thing',
      name: division.name,
      description: division.description
    }
  };
}

/**
 * Generate structured data for the organization
 */
export function generateOrganizationStructuredData(baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NextGen Sustainable Research Network',
    alternateName: 'NGSRN',
    description: 'Advancing policy-focused research to shape sustainable futures for Africa',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'General Inquiries',
      email: 'info@ngsrn.org'
    },
    sameAs: [
      'https://linkedin.com/company/ngsrn'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Africa'
    }
  };
}

/**
 * Extract keywords from content using simple text analysis
 */
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Remove HTML tags and normalize text
  const cleanText = content
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  // Count word frequency
  const wordCount = new Map<string, number>();
  const words = cleanText.split(' ').filter(word => 
    word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word)
  );

  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Validate SEO data completeness and quality
 */
export function validateSEO(seoData: SEOData): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Title validation
  if (!seoData.title) {
    issues.push('Title is required');
  } else if (seoData.title.length < 30) {
    issues.push('Title should be at least 30 characters');
  } else if (seoData.title.length > 60) {
    issues.push('Title should be less than 60 characters');
  }

  // Description validation
  if (!seoData.description) {
    issues.push('Description is required');
  } else if (seoData.description.length < 120) {
    issues.push('Description should be at least 120 characters');
  } else if (seoData.description.length > 160) {
    issues.push('Description should be less than 160 characters');
  }

  // Keywords validation
  if (!seoData.keywords || seoData.keywords.length === 0) {
    issues.push('At least one keyword is required');
  } else if (seoData.keywords.length > 10) {
    issues.push('Too many keywords (max 10 recommended)');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}