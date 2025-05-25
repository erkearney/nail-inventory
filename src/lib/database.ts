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

  // Services table
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

  // Client services table
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

  // Service materials used
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
    const stmt = db.prepare(`
      SELECT * FROM materials WHERE id = ?
    `);
    const result = stmt.get(id);
    console.log(`Fresh fetch of material ${id}:`, result?.current_stock);
    return result;
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
  },

  updateStock: (id: number, newStock: number) => {
    const stmt = db.prepare(`
      UPDATE materials 
      SET current_stock = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(Number(newStock), id);
    console.log(`Updated material ${id} stock to ${newStock}, changes: ${result.changes}`);
    return result;
  },

  addTransaction: (transaction: {
    material_id: number;
    transaction_type: string;
    quantity_change: number;
    notes?: string;
  }) => {
    console.log('Adding transaction:', transaction);
    const stmt = db.prepare(`
      INSERT INTO inventory_transactions 
      (material_id, transaction_type, quantity_change, notes)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      transaction.material_id,
      transaction.transaction_type,
      transaction.quantity_change,
      transaction.notes || null
    );
    
    console.log('Transaction added with ID:', result.lastInsertRowid);
    return result;
  },

  getTransactions: (materialId?: number, limit = 50) => {
    if (materialId) {
      const stmt = db.prepare(`
        SELECT it.*, m.name as material_name, m.unit_type
        FROM inventory_transactions it
        JOIN materials m ON it.material_id = m.id
        WHERE it.material_id = ?
        ORDER BY it.created_at DESC
        LIMIT ?
      `);
      return stmt.all(materialId, limit);
    } else {
      const stmt = db.prepare(`
        SELECT it.*, m.name as material_name, m.unit_type
        FROM inventory_transactions it
        JOIN materials m ON it.material_id = m.id
        ORDER BY it.created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    }
  },

  getLowStockItems: () => {
    return db.prepare(`
      SELECT * FROM materials 
      WHERE is_active = 1 
      AND current_stock <= min_stock_level
      ORDER BY (current_stock / min_stock_level) ASC
    `).all();
  },

  getStockSummary: () => {
    const total = db.prepare(`
      SELECT COUNT(*) as total_materials FROM materials WHERE is_active = 1
    `).get();
    
    const lowStock = db.prepare(`
      SELECT COUNT(*) as low_stock_count FROM materials 
      WHERE is_active = 1 AND current_stock <= min_stock_level
    `).get();
    
    const totalValue = db.prepare(`
      SELECT SUM(current_stock * COALESCE(cost_per_unit, 0)) as total_value 
      FROM materials WHERE is_active = 1
    `).get();
    
    return {
      total_materials: total.total_materials,
      low_stock_count: lowStock.low_stock_count,
      total_value: totalValue.total_value || 0
    };
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
    const service = db.prepare(`
      SELECT * FROM client_services 
      WHERE client_id = ?
      ORDER BY service_date DESC
      LIMIT 1
    `).get(clientId);
    
    if (service) {
      const materials = db.prepare(`
        SELECT csm.*, m.name as material_name, m.brand as material_brand, 
               m.color as material_color, m.unit_type
        FROM client_service_materials csm
        JOIN materials m ON csm.material_id = m.id
        WHERE csm.client_service_id = ?
      `).all(service.id);
      
      service.materials = JSON.stringify(materials);
    }
    
    return service;
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
      SET current_stock = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const markDeducted = db.prepare(`
      UPDATE client_services 
      SET materials_deducted = 1 
      WHERE id = ?
    `);
    
    const addTransaction = db.prepare(`
      INSERT INTO inventory_transactions 
      (material_id, transaction_type, quantity_change, notes)
      VALUES (?, 'deduction', ?, 'Client service deduction')
    `);
    
    // Get current stock for each material
    const getMaterial = db.prepare(`
      SELECT current_stock FROM materials WHERE id = ?
    `);
    
    // Use transaction for consistency
    const transaction = db.transaction(() => {
      for (const material of materials) {
        const currentMaterial = getMaterial.get(material.material_id);
        const currentStock = Number(currentMaterial.current_stock) || 0;
        const newStock = Math.max(0, currentStock - Number(material.quantity_used));
        
        updateStock.run(newStock, material.material_id);
        addTransaction.run(material.material_id, -Number(material.quantity_used));
      }
      markDeducted.run(serviceId);
    });
    
    return transaction();
  }
};