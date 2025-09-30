import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await prisma.author.findUnique({
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

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;
    
    const author = await prisma.author.update({
      where: { id },
      data: {
        name: data.name,
        title: data.title,
        bio: data.bio,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        profileImage: data.profileImage,
        isLeadership: data.isLeadership
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
    console.error('Error updating author:', error);
    return NextResponse.json(
      { error: 'Failed to update author' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.author.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json(
      { error: 'Failed to delete author' },
      { status: 500 }
    );
  }
}