// src/app/api/client-services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientServiceQueries } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { client_id, service_type, notes, materials } = data;
    
    if (!client_id || !materials || materials.length === 0) {
      return NextResponse.json(
        { error: 'Client ID and materials are required' },
        { status: 400 }
      );
    }
    
    // Create the service record
    const serviceResult = clientServiceQueries.create({
      client_id,
      service_type,
      notes
    });
    
    const serviceId = serviceResult.lastInsertRowid;
    
    // Add each material to the service
    for (const material of materials) {
      clientServiceQueries.addMaterial(
        serviceId as number,
        material.material_id,
        material.quantity_used
      );
    }
    
    // Deduct materials from inventory
    clientServiceQueries.deductInventory(serviceId as number);
    
    return NextResponse.json({ 
      id: serviceId, 
      message: 'Service completed and inventory updated' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to complete service' }, 
      { status: 500 }
    );
  }
}