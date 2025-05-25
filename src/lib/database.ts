// lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/inventory.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Initialize tables
export function initializeDatabase() {
  // Materials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      color TEXT,
      category TEXT,
      unit_type TEXT NOT NULL DEFAULT 'pieces',
      current_stock REAL NOT NULL DEFAULT 0,
      min_stock_level REAL NOT NULL DEFAULT 0,
      cost_per_unit REAL,
      supplier TEXT,
      notes TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Services table (for future use)
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Service materials junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER REFERENCES services(id),
      material_id INTEGER REFERENCES materials(id),
      quantity_used REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inventory transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER REFERENCES materials(id),
      transaction_type TEXT NOT NULL,
      quantity_change REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      notes TEXT,
      last_visit_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Client services table - records each visit
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id),
      service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      service_type TEXT,
      notes TEXT,
      total_cost REAL,
      materials_deducted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Service materials used - junction table for materials used in each service
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_service_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_service_id INTEGER REFERENCES client_services(id),
      material_id INTEGER REFERENCES materials(id),
      quantity_used REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trigger to update material stock
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_material_stock 
    AFTER INSERT ON inventory_transactions
    BEGIN
      UPDATE materials 
      SET current_stock = current_stock + NEW.quantity_change,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.material_id;
    END
  `);

  // Trigger to update client's last visit date
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_client_last_visit 
    AFTER INSERT ON client_services
    BEGIN
      UPDATE clients 
      SET last_visit_date = NEW.service_date,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.client_id;
    END
  `);

  console.log('Database initialized successfully');
}

// Helper functions for materials
export const materialQueries = {
  getAll: () => {
    return db.prepare(`
      SELECT * FROM materials 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();
  },
  
  getById: (id: number) => {
    return db.prepare(`
      SELECT * FROM materials WHERE id = ?
    `).get(id);
  },
  
  create: (material: any) => {
    const stmt = db.prepare(`
      INSERT INTO materials (
        name, brand, color, category, unit_type, 
        current_stock, min_stock_level, cost_per_unit, 
        supplier, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      material.name,
      material.brand || null,
      material.color || null,
      material.category || null,
      material.unit_type,
      material.current_stock,
      material.min_stock_level,
      material.cost_per_unit || null,
      material.supplier || null,
      material.notes || null,
      material.is_active ? 1 : 0
    );
  },
  
  update: (id: number, material: any) => {
    const stmt = db.prepare(`
      UPDATE materials SET
        name = ?, brand = ?, color = ?, category = ?, 
        unit_type = ?, min_stock_level = ?, cost_per_unit = ?,
        supplier = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      material.name,
      material.brand || null,
      material.color || null,
      material.category || null,
      material.unit_type,
      material.min_stock_level,
      material.cost_per_unit || null,
      material.supplier || null,
      material.notes || null,
      id
    );
  }
};

// Helper functions for clients
export const clientQueries = {
  getAll: () => {
    return db.prepare(`
      SELECT * FROM clients 
      ORDER BY last_visit_date DESC, name ASC
    `).all();
  },
  
  getById: (id: number) => {
    return db.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).get(id);
  },
  
  create: (client: any) => {
    const stmt = db.prepare(`
      INSERT INTO clients (name, phone, email, notes)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(client.name, client.phone || null, client.email || null, client.notes || null);
  },
  
  getLastService: (clientId: number) => {
    return db.prepare(`
      SELECT cs.*, 
             json_group_array(
               json_object(
                 'material_id', csm.material_id,
                 'material_name', m.name,
                 'material_brand', m.brand,
                 'material_color', m.color,
                 'quantity_used', csm.quantity_used,
                 'unit_type', m.unit_type
               )
             ) as materials
      FROM client_services cs
      LEFT JOIN client_service_materials csm ON cs.id = csm.client_service_id
      LEFT JOIN materials m ON csm.material_id = m.id
      WHERE cs.client_id = ?
      GROUP BY cs.id
      ORDER BY cs.service_date DESC
      LIMIT 1
    `).get(clientId);
  }
};

// Helper functions for client services
export const clientServiceQueries = {
  create: (clientService: any) => {
    const stmt = db.prepare(`
      INSERT INTO client_services (client_id, service_type, notes, total_cost)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
      clientService.client_id,
      clientService.service_type || null,
      clientService.notes || null,
      clientService.total_cost || null
    );
  },
  
  addMaterial: (serviceId: number, materialId: number, quantity: number, notes?: string) => {
    const stmt = db.prepare(`
      INSERT INTO client_service_materials (client_service_id, material_id, quantity_used, notes)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(serviceId, materialId, quantity, notes || null);
  },
  
  deductInventory: (serviceId: number) => {
    // Get all materials used in this service
    const materials = db.prepare(`
      SELECT material_id, quantity_used 
      FROM client_service_materials 
      WHERE client_service_id = ?
    `).all(serviceId);
    
    // Deduct each material from inventory
    const updateStock = db.prepare(`
      UPDATE materials 
      SET current_stock = current_stock - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const markDeducted = db.prepare(`
      UPDATE client_services 
      SET materials_deducted = 1 
      WHERE id = ?
    `);
    
    // Use transaction for consistency
    const transaction = db.transaction(() => {
      for (const material of materials) {
        updateStock.run(material.quantity_used, material.material_id);
        
        // Also add inventory transaction record
        db.prepare(`
          INSERT INTO inventory_transactions 
          (material_id, transaction_type, quantity_change, notes)
          VALUES (?, 'deduction', ?, 'Client service deduction')
        `).run(material.material_id, -material.quantity_used);
      }
      markDeducted.run(serviceId);
    });
    
    return transaction();
  }
};