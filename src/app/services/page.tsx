// src/app/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client, Material, ServiceMaterialSelection, SERVICE_TYPES } from '@/lib/types';

export default function ClientServicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<ServiceMaterialSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    fetchClients();
    fetchMaterials();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    
    // Fetch last service materials for this client
    try {
      const response = await fetch(`/api/clients/${client.id}/last-service`);
      if (response.ok) {
        const lastService = await response.json();
        if (lastService && lastService.materials) {
          const materialsData = JSON.parse(lastService.materials);
          const validMaterials = materialsData.filter((m: any) => m.material_id !== null);
          
          const materialSelections: ServiceMaterialSelection[] = validMaterials.map((m: any) => ({
            material_id: m.material_id,
            material_name: m.material_name,
            material_brand: m.material_brand,
            material_color: m.material_color,
            unit_type: m.unit_type,
            quantity_used: m.quantity_used,
            current_stock: materials.find(mat => mat.id === m.material_id)?.current_stock || 0
          }));
          
          setSelectedMaterials(materialSelections);
          setServiceType(lastService.service_type || '');
        }
      }
    } catch (error) {
      console.error('Error fetching last service:', error);
    }
  };

  const addMaterial = (material: Material) => {
    const existing = selectedMaterials.find(m => m.material_id === material.id);
    if (existing) {
      setSelectedMaterials(prev => 
        prev.map(m => 
          m.material_id === material.id 
            ? { ...m, quantity_used: m.quantity_used + 0.1 }
            : m
        )
      );
    } else {
      setSelectedMaterials(prev => [...prev, {
        material_id: material.id!,
        material_name: material.name,
        material_brand: material.brand,
        material_color: material.color,
        unit_type: material.unit_type,
        quantity_used: 0.1,
        current_stock: material.current_stock
      }]);
    }
  };

  const updateMaterialQuantity = (materialId: number, quantity: number) => {
    setSelectedMaterials(prev =>
      prev.map(m =>
        m.material_id === materialId ? { ...m, quantity_used: quantity } : m
      )
    );
  };

  const removeMaterial = (materialId: number) => {
    setSelectedMaterials(prev => prev.filter(m => m.material_id !== materialId));
  };

  const createNewClient = async () => {
    if (!newClientName.trim()) return;
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName.trim() })
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchClients();
        setNewClientName('');
        setShowNewClientForm(false);
        
        // Auto-select the new client
        const newClient = clients.find(c => c.id === result.id);
        if (newClient) {
          setSelectedClient(newClient);
        }
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const completeService = async () => {
    if (!selectedClient || selectedMaterials.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/client-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          service_type: serviceType,
          notes: serviceNotes,
          materials: selectedMaterials
        })
      });
      
      if (response.ok) {
        // Reset form
        setSelectedClient(null);
        setServiceType('');
        setServiceNotes('');
        setSelectedMaterials([]);
        await fetchMaterials(); // Refresh materials to show updated stock
        alert('Service completed and inventory updated!');
      } else {
        alert('Error completing service');
      }
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Error completing service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Client Services</h1>
        <Link href="/clients" className="text-blue-600 hover:text-blue-800">
          Manage Clients
        </Link>
      </div>

      {/* Client Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Client</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {clients.map(client => (
            <button
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className={`p-3 text-left border rounded-lg hover:bg-blue-50 transition-colors ${
                selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-900">{client.name}</div>
              {client.last_visit_date && (
                <div className="text-sm text-gray-500">
                  Last visit: {new Date(client.last_visit_date).toLocaleDateString()}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* New Client */}
        {!showNewClientForm ? (
          <button
            onClick={() => setShowNewClientForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add New Client
          </button>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Client name"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createNewClient()}
            />
            <button
              onClick={createNewClient}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewClientForm(false)}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {selectedClient && (
        <>
          {/* Service Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Service for {selectedClient.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Service notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Materials Used */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Materials Used</h2>
            
            {/* Selected Materials */}
            {selectedMaterials.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Selected Materials</h3>
                <div className="space-y-2">
                  {selectedMaterials.map(material => (
                    <div key={material.material_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{material.material_name}</span>
                        {material.material_brand && <span className="text-gray-500"> • {material.material_brand}</span>}
                        {material.material_color && <span className="text-gray-500"> • {material.material_color}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={material.quantity_used}
                          onChange={(e) => updateMaterialQuantity(material.material_id, parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500 w-12">{material.unit_type}</span>
                        <button
                          onClick={() => removeMaterial(material.material_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Materials */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Add Materials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {materials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => addMaterial(material)}
                    className="p-2 text-left border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{material.name}</div>
                    <div className="text-xs text-gray-500">
                      {material.brand && `${material.brand} • `}
                      Stock: {material.current_stock} {material.unit_type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Service */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Complete Service</h3>
                <p className="text-sm text-gray-500">
                  This will deduct the selected materials from inventory
                </p>
              </div>
              <button
                onClick={completeService}
                disabled={loading || selectedMaterials.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete Service'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}