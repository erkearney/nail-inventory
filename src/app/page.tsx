// src/app/page.tsx
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <Link
          href="/materials/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add Material
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Materials</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
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
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/materials"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 text-blue-600 mb-2">💄</div>
              <h4 className="font-medium text-gray-900">Manage Materials</h4>
              <p className="text-sm text-gray-600">Add, edit, and organize your nail supplies</p>
            </Link>
            
            <Link
              href="/services"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 text-green-600 mb-2">✨</div>
              <h4 className="font-medium text-gray-900">Services</h4>
              <p className="text-sm text-gray-600">Configure nail services and material usage</p>
            </Link>

            <Link
              href="/inventory"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 text-purple-600 mb-2">📊</div>
              <h4 className="font-medium text-gray-900">Inventory Report</h4>
              <p className="text-sm text-gray-600">View stock levels and usage reports</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Getting Started</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add your nail materials</h4>
                <p className="text-sm text-gray-600">Start by adding your polishes, tools, and supplies to the inventory</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Set up your services</h4>
                <p className="text-sm text-gray-400">Configure which materials are used for each nail service</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Connect Square appointments</h4>
                <p className="text-sm text-gray-400">Automatically track material usage from completed appointments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}