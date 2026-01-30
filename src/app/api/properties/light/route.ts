import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';
export const revalidate = 43200; // Revalidate every 12 hours

/**
 * GET /api/properties/light
 * 
 * Возвращает лёгкий GeoJSON со всеми 21k+ объектами
 * Размер: ~2-3 MB
 * Кэширование: 12 часов
 */
export async function GET() {
  try {
    const lightPath = path.join(process.cwd(), 'public/data/properties-light.json');
    
    // Проверяем существование файла
    try {
      await fs.access(lightPath);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Light GeoJSON not found. Please run: node scripts/split-geojson.js',
          hint: 'Data file does not exist yet. Run the split-geojson script first.'
        },
        { status: 404 }
      );
    }
    
    // Читаем файл
    const lightData = await fs.readFile(lightPath, 'utf-8');
    const geojson = JSON.parse(lightData);
    
    console.log('[API] Serving light GeoJSON:', geojson.count, 'features');
    
    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=43200, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('[API] Error serving light GeoJSON:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load light GeoJSON',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
