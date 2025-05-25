// lib/types.ts
export interface Material {
  id?: number;
  name: string;
  brand?: string;
  color?: string;
  category?: string;
  unit_type: string;
  current_stock: number;
  min_stock_level: number;
  cost_per_unit?: number;
  supplier?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id?: number;
  material_id: number;
  transaction_type: 'addition' | 'deduction' | 'adjustment';
  quantity_change: number;
  notes?: string;
  created_at?: string;
}


export interface Client {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  last_visit_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientService {
  id?: number;
  client_id: number;
  service_date?: string;
  service_type?: string;
  notes?: string;
  total_cost?: number;
  materials_deducted: boolean;
  created_at?: string;
}

export interface ClientServiceMaterial {
  id?: number;
  client_service_id: number;
  material_id: number;
  quantity_used: number;
  notes?: string;
  created_at?: string;
  // Additional fields from joins
  material_name?: string;
  material_brand?: string;
  material_color?: string;
  unit_type?: string;
}

export interface ServiceMaterialSelection
{
  material_id: number;
  material_name: string;
  material_brand?: string;
  material_color?: string;
  unit_type: string;
  quantity_used: number;
  current_stock: number;
}
  
export const MATERIAL_CATEGORIES = [
  'base_coat',
  'color_polish', 
  'top_coat',
  'nail_art',
  'tools',
  'decorations',
  'supplies',
  'other'
] as const;

export const UNIT_TYPES = [
  'ml',
  'pieces',
  'bottles',
  'grams',
  'sets',
  'tubes',
  'tips'
] as const;


export const SERVICE_TYPES = [
  'Basic Manicure',
  'Gel Manicure',
  'Basic Pedicure',
  'Gel Pedicure',
  'Nail Art',
  'Polish Change',
  'French Manicure',
  'Acrylic Nails',
  'Nail Repair',
  'Other'
] as const;
