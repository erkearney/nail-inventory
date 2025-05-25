// src/app/api/clients/[id]/last-service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientQueries } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);
    const lastService = clientQueries.getLastService(clientId);
    
    return NextResponse.json(lastService);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last service' }, 
      { status: 500 }
    );
  }
}