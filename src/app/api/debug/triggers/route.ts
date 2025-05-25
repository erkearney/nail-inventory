// src/app/api/debug/triggers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // Get all triggers in the database
    const triggers = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type = 'trigger'
    `).all();
    
    // Get recent transactions for material 2
    const recentTransactions = db.prepare(`
      SELECT * FROM inventory_transactions 
      WHERE material_id = 2 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    // Get current material 2 data
    const material = db.prepare(`
      SELECT * FROM materials WHERE id = 2
    `).get();
    
    return NextResponse.json({
      triggers,
      recentTransactions,
      material
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}