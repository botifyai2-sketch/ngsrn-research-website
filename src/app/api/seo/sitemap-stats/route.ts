import { NextResponse } from 'next/server';
import { getAllPublishedArticles } from '@/lib/db/articles';
import { getAllDivisions } from '@/lib/db/divisions';
import { getAllAuthors } from '@/lib/db/authors';

export async function GET() {
  try {
    // Fetch all data needed for sitemap stats
    const [articles, divisions, authors] = await Promise.all([
      getAllPublishedArticles(),
      getAllDivisions(),
      getAllAuthors()
    ]);

    const leadershipAuthors = authors.filter(author => author.isLeadership);
    const staticPages = 5; // Home, Research, Leadership, About, Contact

    const stats = {
      totalUrls: articles.length + divisions.length + leadershipAuthors.length + staticPages,
      lastGenerated: new Date().toISOString(),
      articles: articles.length,
      divisions: divisions.length,
      authors: leadershipAuthors.length,
      static: staticPages,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching sitemap stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sitemap statistics' },
      { status: 500 }
    );
  }
}