import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 21600; // 6 hours

/**
 * GET /api/properties/[id]/details
 * 
 * Возвращает полные данные для конкретного объекта
 * Пример: /api/properties/BL123456/details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;
    
    // Валидация ID (защита от Path Traversal)
    if (!propertyId || !/^[a-zA-Z0-9_-]+$/.test(propertyId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid property ID format',
          hint: 'ID must contain only alphanumeric characters, underscores, and hyphens'
        },
        { status: 400 }
      );
    }
    
    const heavyPath = path.join(
      process.cwd(), 
      'public/data/properties-heavy',
      `${propertyId}.json`
    );
    
    // Проверяем существование файла
    try {
      await fs.access(heavyPath);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found',
          propertyId,
          hint: 'No detailed data available for this property ID'
        },
        { status: 404 }
      );
    }
    
    // Читаем файл
    const heavyData = await fs.readFile(heavyPath, 'utf-8');
    const property = JSON.parse(heavyData);
    
    console.log('[API] Serving property details:', propertyId);
    
    return NextResponse.json(
      {
        success: true,
        data: property,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=21600, stale-while-revalidate=43200',
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('[API] Error serving property details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load property details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
