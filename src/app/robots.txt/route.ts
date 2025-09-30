import { NextResponse } from 'next/server';
import { generateRobotsTxt } from '@/lib/sitemap';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org';
  const robotsTxt = generateRobotsTxt(baseUrl);

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}