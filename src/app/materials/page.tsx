// src/app/materials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Material } from '@/lib/types';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = () => {
    return materials.filter(material => 
      material.current_stock <= material.min_stock_level
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
        <div className="flex space-x-3">
          <Link
            href="/inventory/adjust"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Adjust Stock
          </Link>
          <Link
            href="/materials/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Add Material
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Materials</p>
              <p className="text-2xl font-semibold text-gray-900">{materials.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">{getLowStockItems().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${materials.reduce((sum, m) => sum + (m.current_stock * (m.cost_per_unit || 0)), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The following items are running low:</p>
                <ul className="list-disc list-inside mt-1">
                  {getLowStockItems().map(material => (
                    <li key={material.id}>
                      {material.name} ({material.current_stock} {material.unit_type} remaining)
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <Link
                    href="/inventory/adjust"
                    className="text-yellow-800 underline hover:text-yellow-900"
                  >
                    Adjust stock levels →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Materials</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your nail supplies and inventory levels
          </p>
        </div>
        
        {materials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first material</p>
            <Link
              href="/materials/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Your First Material
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materials.map((material) => (
                  <tr key={material.id} className={material.current_stock <= material.min_stock_level ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.brand && `${material.brand} • `}
                            {material.color && (
                              <span className="inline-flex items-center">
                                {material.color}
                                <div 
                                  className="w-3 h-3 rounded-full ml-1 border border-gray-300"
                                  style={{ backgroundColor: material.color.toLowerCase() }}
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.current_stock} {material.unit_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: {material.min_stock_level} {material.unit_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {material.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.cost_per_unit ? `$${material.cost_per_unit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/materials/${material.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/inventory/adjust?material=${material.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}