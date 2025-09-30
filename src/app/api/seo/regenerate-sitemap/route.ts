import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // Revalidate the sitemap route to force regeneration
    revalidatePath('/sitemap.xml');
    
    // You could also trigger any additional sitemap generation logic here
    // For example, notifying search engines about the updated sitemap
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sitemap regenerated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error regenerating sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate sitemap' },
      { status: 500 }
    );
  }
}