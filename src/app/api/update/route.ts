import { NextResponse } from 'next/server';
import { fetchCalgaryProperties } from '@/lib/calgaryApi';
import { transformCalgaryData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Starting data update from Calgary Open Data...');
    
    const rawData = await fetchCalgaryProperties();
    const properties = transformCalgaryData(rawData);
    
    console.log(`Successfully updated ${properties.length} properties`);
    
    return NextResponse.json({
      success: true,
      updated: properties.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update properties' },
      { status: 500 }
    );
  }
}
