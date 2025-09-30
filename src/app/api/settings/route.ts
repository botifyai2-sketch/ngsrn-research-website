import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/settings - Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const setting = await prisma.siteSettings.findUnique({
        where: { key }
      });
      
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json({
        key: setting.key,
        value: JSON.parse(setting.value),
        description: setting.description
      });
    } else {
      // Get all settings
      const settings = await prisma.siteSettings.findMany();
      
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = {
          value: JSON.parse(setting.value),
          description: setting.description
        };
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json(settingsMap);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update setting
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        description: description || null
      },
      create: {
        key,
        value: JSON.stringify(value),
        description: description || null
      }
    });

    return NextResponse.json({
      key: setting.key,
      value: JSON.parse(setting.value),
      description: setting.description
    });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}