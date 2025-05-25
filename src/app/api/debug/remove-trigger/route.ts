// src/app/api/debug/remove-trigger/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST() {
  try {
    // Remove the problematic trigger
    db.exec('DROP TRIGGER IF EXISTS update_material_stock');
    
    console.log('Removed update_material_stock trigger');
    
    return NextResponse.json({
      message: 'Trigger removed successfully',
      success: true
    });
    
  } catch (error) {
    console.error('Error removing trigger:', error);
    return NextResponse.json({ error: 'Failed to remove trigger' }, { status: 500 });
  }
}