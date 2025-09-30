import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /cms/
Disallow: /_next/
Disallow: /admin/

# Allow specific public API endpoints
Allow: /api/sitemap
Allow: /api/robots
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}