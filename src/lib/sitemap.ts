import { Article, ResearchDivision, Author } from '@/types';

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate sitemap URLs for all articles
 */
export function generateArticleSitemapUrls(
  articles: Article[],
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
): SitemapUrl[] {
  return articles
    .filter(article => article.status === 'PUBLISHED')
    .map(article => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
}

/**
 * Generate sitemap URLs for research divisions
 */
export function generateDivisionSitemapUrls(
  divisions: ResearchDivision[],
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
): SitemapUrl[] {
  return divisions.map(division => ({
    url: `${baseUrl}/research/${division.id}`,
    lastModified: division.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}

/**
 * Generate sitemap URLs for leadership/author pages
 */
export function generateAuthorSitemapUrls(
  authors: Author[],
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
): SitemapUrl[] {
  return authors
    .filter(author => author.isLeadership)
    .map(author => ({
      url: `${baseUrl}/leadership/${author.id}`,
      lastModified: author.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
}

/**
 * Generate static page sitemap URLs
 */
export function generateStaticSitemapUrls(
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
): SitemapUrl[] {
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/research`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leadership`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}

/**
 * Generate complete sitemap data
 */
export async function generateSitemapData(): Promise<SitemapUrl[]> {
  // This would typically fetch from your database
  // For now, we'll return static URLs and let the actual sitemap.xml route handle the data fetching
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org';
  
  return [
    ...generateStaticSitemapUrls(baseUrl),
    // Dynamic URLs will be added by the sitemap route
  ];
}

/**
 * Generate XML sitemap string
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls.map(({ url, lastModified, changeFrequency, priority }) => {
    const lastModString = lastModified ? lastModified.toISOString().split('T')[0] : '';
    
    return `  <url>
    <loc>${url}</loc>${lastModString ? `
    <lastmod>${lastModString}</lastmod>` : ''}${changeFrequency ? `
    <changefreq>${changeFrequency}</changefreq>` : ''}${priority ? `
    <priority>${priority}</priority>` : ''}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
): string {
  return `User-agent: *
Allow: /

# Disallow CMS and admin areas
Disallow: /cms/
Disallow: /api/
Disallow: /admin/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;
}