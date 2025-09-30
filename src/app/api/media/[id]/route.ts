import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/storage-server';

// GET /api/media/[id] - Get specific media file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id }
    });

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json(mediaFile);
  } catch (error) {
    console.error('Error fetching media file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media file' },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id] - Update media file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alt } = await request.json();
    const { id } = await params;

    const mediaFile = await prisma.mediaFile.update({
      where: { id },
      data: { alt }
    });

    return NextResponse.json(mediaFile);
  } catch (error) {
    console.error('Error updating media file:', error);
    return NextResponse.json(
      { error: 'Failed to update media file' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get media file info
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id }
    });

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Check if file is being used in any articles
    const articleUsage = await prisma.articleMedia.findFirst({
      where: { mediaFileId: id }
    });

    if (articleUsage) {
      return NextResponse.json(
        { error: 'Cannot delete file that is being used in articles' },
        { status: 400 }
      );
    }

    // Delete from storage
    try {
      await deleteFile(mediaFile.filename);
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}