// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientQueries } from '@/lib/database';

export async function GET() {
  try {
    const clients = clientQueries.getAll();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const result = clientQueries.create(data);
    
    return NextResponse.json({ 
      id: result.lastInsertRowid, 
      message: 'Client created successfully' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create client' }, 
      { status: 500 }
    );
  }
}