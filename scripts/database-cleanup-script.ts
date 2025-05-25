// scripts/cleanup-database.js
// Run this script to clean up floating point precision issues

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './data/inventory.db';
const db = new Database(dbPath);

console.log('Starting database cleanup...');

// Get all materials with their current stock
const materials = db.prepare('SELECT id, name, current_stock FROM materials').all();

console.log(`Found ${materials.length} materials to check`);

let updatedCount = 0;

// Clean up each material's stock to remove floating point errors
for (const material of materials) {
  const currentStock = material.current_stock;
  
  // Round to 2 decimal places to remove floating point errors
  const cleanStock = Math.round(currentStock * 100) / 100;
  
  if (currentStock !== cleanStock) {
    console.log(`Fixing ${material.name}: ${currentStock} -> ${cleanStock}`);
    
    db.prepare(`
      UPDATE materials 
      SET current_stock = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(cleanStock, material.id);
    
    updatedCount++;
  }
}

console.log(`Cleanup complete. Updated ${updatedCount} materials.`);

// Also clean up any transactions that might have floating point issues
const transactions = db.prepare('SELECT id, quantity_change FROM inventory_transactions').all();
let transactionUpdates = 0;

for (const transaction of transactions) {
  const currentChange = transaction.quantity_change;
  const cleanChange = Math.round(currentChange * 100) / 100;
  
  if (currentChange !== cleanChange) {
    db.prepare(`
      UPDATE inventory_transactions 
      SET quantity_change = ? 
      WHERE id = ?
    `).run(cleanChange, transaction.id);
    
    transactionUpdates++;
  }
}

console.log(`Cleaned up ${transactionUpdates} transaction records.`);

db.close();
console.log('Database cleanup finished!');