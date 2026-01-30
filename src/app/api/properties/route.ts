import { NextRequest, NextResponse } from 'next/server';
import { fetchCalgaryProperties, searchPropertiesByAddress } from '@/lib/calgaryApi';
import { transformCalgaryData } from '@/lib/utils';
import { PropertyMarker } from '@/types/property';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for debugging
export const maxDuration = 60; // Allow up to 60 seconds

type CachedPayload = {
  timestamp: number;
  rawData: any[];
};

// In-memory cache (per server process). Keeps the app responsive while still being accurate.
let cache: CachedPayload | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting properties fetch...');
    
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const businessType = searchParams.get('type');
    const status = searchParams.get('status');
    const bbox = searchParams.get('bbox'); // minLng,minLat,maxLng,maxLat

    let rawData;
    
    if (address) {
      console.log('[API] Searching by address:', address);
      rawData = await searchPropertiesByAddress(address);
    } else {
      console.log('[API] Fetching all properties...');
      const now = Date.now();
      if (cache && now - cache.timestamp < CACHE_TTL_MS) {
        console.log('[API] Using cached dataset');
        rawData = cache.rawData;
      } else {
        rawData = await fetchCalgaryProperties();
        cache = { timestamp: now, rawData };
      }
    }

    console.log('[API] Raw data count:', rawData.length);

    let properties: PropertyMarker[] = transformCalgaryData(rawData);
    console.log('[API] Transformed properties:', properties.length);

    // Apply bbox filter (after transform) to reduce payload size.
    if (bbox) {
      const parts = bbox.split(',').map(v => Number(v.trim()));
      if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        properties = properties.filter(p => {
          const [lng, lat] = p.coordinates;
          return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
        });
      }
    }

    // Apply filters
    if (businessType) {
      properties = properties.filter(p => p.type === businessType);
    }
    if (status) {
      properties = properties.filter(p => p.status === status);
    }

    console.log('[API] Final properties count:', properties.length);

    return NextResponse.json({
      success: true,
      count: properties.length,
      data: properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch properties',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
