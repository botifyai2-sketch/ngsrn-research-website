import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadership = searchParams.get('leadership');

    const where = leadership === 'true' ? { isLeadership: true } : {};

    const authors = await prisma.author.findMany({
      where,
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

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const author = await prisma.author.create({
      data: {
        name: data.name,
        title: data.title,
        bio: data.bio,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        profileImage: data.profileImage,
        isLeadership: data.isLeadership || false
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
      }
    });

    return NextResponse.json(author);
  } catch (error) {
    console.error('Error creating author:', error);
    return NextResponse.json(
      { error: 'Failed to create author' },
      { status: 500 }
    );
  }
}