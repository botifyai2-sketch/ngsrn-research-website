import { NextResponse } from 'next/server';
import { 
  generateSitemapXML, 
  generateStaticSitemapUrls,
  generateArticleSitemapUrls,
  generateDivisionSitemapUrls,
  generateAuthorSitemapUrls,
  type SitemapUrl
} from '@/lib/sitemap';
import { getAllPublishedArticles } from '@/lib/db/articles';
import { getAllDivisions } from '@/lib/db/divisions';
import { getAllAuthors } from '@/lib/db/authors';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org';
    
    // Fetch all data needed for sitemap
    const [articles, divisions, authors] = await Promise.all([
      getAllPublishedArticles(),
      getAllDivisions(),
      getAllAuthors()
    ]);

    // Generate all sitemap URLs
    const sitemapUrls: SitemapUrl[] = [
      ...generateStaticSitemapUrls(baseUrl),
      ...generateArticleSitemapUrls(articles, baseUrl),
      ...generateDivisionSitemapUrls(divisions, baseUrl),
      ...generateAuthorSitemapUrls(authors, baseUrl),
    ];

    // Generate XML sitemap
    const sitemapXML = generateSitemapXML(sitemapUrls);

    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';