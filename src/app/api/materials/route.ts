// src/app/api/materials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { materialQueries } from '@/lib/database';
import { Material } from '@/lib/types';

// GET - Fetch all materials
export async function GET() {
  try {
    const materials = materialQueries.getAll();
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' }, 
      { status: 500 }
    );
  }
}

// POST - Create new material
export async function POST(request: NextRequest) {
  try {
    const data: Omit<Material, 'id'> = await request.json();
    
    // Validate required fields
    if (!data.name || !data.unit_type) {
      return NextResponse.json(
        { error: 'Name and unit type are required' },
        { status: 400 }
      );
    }
    
    const result = materialQueries.create(data);
    
    return NextResponse.json({ 
      id: result.lastInsertRowid, 
      message: 'Material created successfully' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create material' }, 
      { status: 500 }
    );
  }
}