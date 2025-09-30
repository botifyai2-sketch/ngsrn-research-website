import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage-server';

// GET /api/media - List all media files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (type) {
      where.mimeType = {
        startsWith: type
      };
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.mediaFile.count({ where })
    ]);

    return NextResponse.json({
      files: mediaFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

// POST /api/media - Upload new media files
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 50MB.` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;

      try {
        // Upload to S3 (or local storage in development)
        const url = await uploadFile(file, filename);

        // Save to database
        const mediaFile = await prisma.mediaFile.create({
          data: {
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url
          }
        });

        uploadedFiles.push(mediaFile);
      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}