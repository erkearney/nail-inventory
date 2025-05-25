// src/app/api/materials/[id]/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { materialQueries } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const materialId = parseInt(id);
    
    const material = await materialQueries.getById(materialId);
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: material.id,
      name: material.name,
      current_stock: material.current_stock,
      current_stock_type: typeof material.current_stock,
      current_stock_raw: JSON.stringify(material.current_stock),
      min_stock_level: material.min_stock_level,
      updated_at: material.updated_at
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}