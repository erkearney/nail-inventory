// src/app/api/materials/[id]/adjust/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { materialQueries } from '@/lib/database';

interface StockAdjustmentRequest {
  adjustment_type: 'addition' | 'deduction' | 'adjustment';
  quantity: number;
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const materialId = parseInt(id);
    const data: StockAdjustmentRequest = await request.json();
    
    // Validate and clean the numbers
    if (isNaN(data.quantity) || data.quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid quantity provided' },
        { status: 400 }
      );
    }
    
    // Get current material - force fresh read
    let material = await materialQueries.getById(materialId);
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }
    
    console.log('Initial material fetch:', material.current_stock);
    
    // Force a fresh read by re-querying
    material = await materialQueries.getById(materialId);
    console.log('Second material fetch:', material.current_stock);
    
    // Clean up floating point precision and ensure we have numbers
    const currentStock = Math.round((Number(material.current_stock) || 0) * 100) / 100;
    const adjustmentQuantity = Math.round((Number(data.quantity) || 0) * 100) / 100;
    
    console.log('Cleaned currentStock:', currentStock, 'adjustmentQuantity:', adjustmentQuantity);
    
    let newStock: number;
    let quantityChange: number;
    
    // Calculate new stock and quantity change with proper rounding
    switch (data.adjustment_type) {
      case 'addition':
        newStock = Math.round((currentStock + adjustmentQuantity) * 100) / 100;
        quantityChange = adjustmentQuantity;
        console.log('Addition calculation:', currentStock, '+', adjustmentQuantity, '=', newStock);
        break;
      case 'deduction':
        newStock = Math.max(0, Math.round((currentStock - adjustmentQuantity) * 100) / 100);
        quantityChange = -(Math.min(adjustmentQuantity, currentStock));
        console.log('Deduction calculation:', currentStock, '-', adjustmentQuantity, '=', newStock);
        break;
      case 'adjustment':
        newStock = adjustmentQuantity;
        quantityChange = Math.round((adjustmentQuantity - currentStock) * 100) / 100;
        console.log('Adjustment calculation: setting to', adjustmentQuantity, 'change is', quantityChange);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid adjustment type' },
          { status: 400 }
        );
    }
    
    // Update material stock
    console.log(`Updating material ${materialId} from ${currentStock} to ${newStock}`);
    const updateResult = await materialQueries.updateStock(materialId, newStock);
    console.log('Update result:', updateResult);
    
    // Verify the update worked
    const updatedMaterial = await materialQueries.getById(materialId);
    console.log('Material after update:', updatedMaterial.current_stock);
    
    // Record inventory transaction with clean numbers
    await materialQueries.addTransaction({
      material_id: materialId,
      transaction_type: data.adjustment_type,
      quantity_change: Math.round(quantityChange * 100) / 100,
      notes: data.notes || `Manual ${data.adjustment_type}`
    });
    
    return NextResponse.json({
      message: 'Stock adjusted successfully',
      old_stock: currentStock,
      new_stock: newStock,
      quantity_change: Math.round(quantityChange * 100) / 100
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}