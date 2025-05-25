// src/app/inventory/adjust/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Type definitions
interface Material {
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
}

export default function StockAdjustmentPage() {
  const searchParams = useSearchParams();
  const materialParam = searchParams.get('material');

  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'addition' | 'deduction' | 'adjustment' | 'reset'>('addition');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Auto-select material if passed via URL parameter
    if (materialParam && materials.length > 0) {
      const material = materials.find(m => m.id === parseInt(materialParam));
      if (material) {
        setSelectedMaterial(material);
      }
    }
  }, [materialParam, materials]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // Filter materials based on search and low stock filter
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (material.color?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const isLowStock = material.current_stock <= material.min_stock_level;
    
    return matchesSearch && (!showLowStockOnly || isLowStock);
  });

  const handleAdjustment = async () => {
    if (!selectedMaterial || !quantity) return;

    setLoading(true);
    try {
      let response;
      
      if (adjustmentType === 'reset') {
        // Use the reset endpoint for corrupted data
        response = await fetch(`/api/materials/${selectedMaterial.id}/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stock: parseFloat(quantity),
            notes: notes || 'Reset corrupted stock data'
          }),
        });
      } else {
        // Use the regular adjust endpoint
        response = await fetch(`/api/materials/${selectedMaterial.id}/adjust`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adjustment_type: adjustmentType,
            quantity: parseFloat(quantity),
            notes: notes
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();
        
        // Fetch fresh material data to ensure we have the correct values
        await fetchMaterials();
        
        // Find the updated material with fresh data
        const updatedMaterials = await fetch('/api/materials').then(res => res.json());
        const freshMaterial = updatedMaterials.find(m => m.id === selectedMaterial.id);
        
        if (freshMaterial) {
          setMaterials(updatedMaterials);
          // Update selected material with fresh data
          setSelectedMaterial(freshMaterial);
        }

        // Show success message
        const action = adjustmentType === 'addition' ? 'added' : 
                      adjustmentType === 'deduction' ? 'deducted' : 
                      adjustmentType === 'reset' ? 'reset' : 'adjusted';
        setSuccessMessage(`Successfully ${action} stock for ${selectedMaterial.name}. New stock: ${result.new_stock} ${selectedMaterial.unit_type}`);
        
        // Don't reset form immediately so user can see the updated values
        setTimeout(() => {
          setSelectedMaterial(null);
          setQuantity('');
          setNotes('');
        }, 1000);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        alert('Error adjusting stock: ' + error.error);
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock');
    } finally {
      setLoading(false);
    }
  };

  const getAdjustmentDescription = () => {
    if (!selectedMaterial || !quantity) return '';
    
    const quantityNum = parseFloat(quantity);
    const currentStock = selectedMaterial.current_stock;
    
    switch (adjustmentType) {
      case 'addition':
        return `Will increase from ${currentStock} to ${currentStock + quantityNum} ${selectedMaterial.unit_type}`;
      case 'deduction':
        const afterDeduction = Math.max(0, currentStock - quantityNum);
        return `Will decrease from ${currentStock} to ${afterDeduction} ${selectedMaterial.unit_type}`;
      case 'adjustment':
        return `Will set from ${currentStock} to ${quantityNum} ${selectedMaterial.unit_type}`;
      case 'reset':
        return `Will reset corrupted data from ${currentStock} to ${quantityNum} ${selectedMaterial.unit_type}`;
      default:
        return '';
    }
  };

  const getLowStockCount = () => {
    return materials.filter(m => m.current_stock <= m.min_stock_level).length;
  };

  if (pageLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/materials" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Materials
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Stock Adjustment</h1>
        </div>
        <div className="text-sm text-gray-600">
          {getLowStockCount()} items need restocking
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Material</h2>
          
          {/* Search and Filters */}
          <div className="space-y-4 mb-4">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show only low stock items</span>
            </label>
          </div>

          {/* Materials List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMaterials.map(material => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material)}
                className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                  selectedMaterial?.id === material.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : material.current_stock <= material.min_stock_level
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{material.name}</div>
                    <div className="text-sm text-gray-500">
                      {material.brand && `${material.brand} • `}
                      {material.color && (
                        <span className="inline-flex items-center">
                          {material.color}
                          <div 
                            className="w-3 h-3 rounded-full ml-1 border border-gray-300"
                            style={{ backgroundColor: material.color?.toLowerCase() }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      material.current_stock <= material.min_stock_level 
                        ? 'text-yellow-600' 
                        : 'text-gray-900'
                    }`}>
                      {material.current_stock} {material.unit_type}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {material.min_stock_level}
                    </div>
                  </div>
                </div>
                {material.current_stock <= material.min_stock_level && (
                  <div className="mt-1 text-xs text-yellow-600 font-medium">
                    ⚠️ Low Stock
                  </div>
                )}
              </button>
            ))}
            
            {filteredMaterials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <div>No materials found</div>
              </div>
            )}
          </div>
        </div>

        {/* Adjustment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Stock Adjustment</h2>
          
          {selectedMaterial ? (
            <div className="space-y-4">
              {/* Selected Material Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedMaterial.name}</h3>
                <div className="text-sm text-gray-600">
                  {selectedMaterial.brand && `${selectedMaterial.brand} • `}
                  {selectedMaterial.color}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  Current Stock: {selectedMaterial.current_stock} {selectedMaterial.unit_type}
                </div>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'addition' | 'deduction' | 'adjustment' | 'reset')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="addition">Add Stock</option>
                  <option value="deduction">Remove Stock</option>
                  <option value="adjustment">Set Exact Amount</option>
                  <option value="reset">🔧 Reset Corrupted Data</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {adjustmentType === 'adjustment' || adjustmentType === 'reset' ? 'New Stock Level' : 'Quantity'} ({selectedMaterial.unit_type})
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.1"
                  placeholder={adjustmentType === 'adjustment' || adjustmentType === 'reset' ? 'Enter new total' : 'Enter amount'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {adjustmentType === 'reset' && (
                  <div className="mt-1 text-sm text-orange-600">
                    ⚠️ This will reset corrupted floating-point data to a clean value
                  </div>
                )}
                {quantity && (
                  <div className="mt-1 text-sm text-blue-600">
                    {getAdjustmentDescription()}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for adjustment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAdjustment}
                disabled={loading || !quantity}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `${
                  adjustmentType === 'addition' ? 'Add' : 
                  adjustmentType === 'deduction' ? 'Remove' : 
                  adjustmentType === 'reset' ? 'Reset' : 'Set'
                } Stock`}
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Material</h3>
              <p className="text-gray-500">Choose a material from the list to adjust its stock level</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions for Low Stock Items */}
      {getLowStockCount() > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">Quick Restock</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials
              .filter(m => m.current_stock <= m.min_stock_level)
              .map(material => (
                <button
                  key={material.id}
                  onClick={() => {
                    setSelectedMaterial(material);
                    setAdjustmentType('addition');
                    setQuantity((material.min_stock_level * 2).toString());
                  }}
                  className="p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 text-left"
                >
                  <div className="font-medium text-gray-900">{material.name}</div>
                  <div className="text-sm text-gray-600">
                    {material.current_stock} → {material.min_stock_level * 2} {material.unit_type}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}