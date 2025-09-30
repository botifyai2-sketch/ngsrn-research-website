import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllDivisions } from '@/lib/db/divisions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const divisions = await getAllDivisions();
    return NextResponse.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}