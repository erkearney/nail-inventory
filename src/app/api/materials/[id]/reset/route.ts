// src/app/api/materials/[id]/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { materialQueries } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const materialId = parseInt(id);
    const data = await request.json();
    
    // Validate input
    if (typeof data.stock !== 'number' || data.stock < 0) {
      return NextResponse.json(
        { error: 'Valid stock amount is required' },
        { status: 400 }
      );
    }
    
    // Get current material
    const material = await materialQueries.getById(materialId);
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }
    
    const cleanStock = Math.round(data.stock * 100) / 100;
    const oldStock = Math.round((Number(material.current_stock) || 0) * 100) / 100;
    
    console.log(`Resetting material ${materialId} from ${oldStock} to ${cleanStock}`);
    
    // Update material stock
    const updateResult = await materialQueries.updateStock(materialId, cleanStock);
    console.log('Update result:', updateResult);
    
    // Verify the update worked by fetching the material again
    const updatedMaterial = await materialQueries.getById(materialId);
    console.log('Material after update:', updatedMaterial.current_stock);
    
    // Record inventory transaction
    await materialQueries.addTransaction({
      material_id: materialId,
      transaction_type: 'adjustment',
      quantity_change: cleanStock - oldStock,
      notes: data.notes || 'Stock reset to clean value'
    });
    
    return NextResponse.json({
      message: 'Stock reset successfully',
      old_stock: oldStock,
      new_stock: cleanStock,
      quantity_change: cleanStock - oldStock
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to reset stock' },
      { status: 500 }
    );
  }
}