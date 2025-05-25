// src/app/layout.tsx
import { initializeDatabase } from '@/lib/database';
import './globals.css'
import Link from 'next/link';

// Initialize database on app start
initializeDatabase();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                    Nail Inventory
                  </Link>
                  <div className="hidden md:flex space-x-4">
                    <Link 
                      href="/" 
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/materials" 
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Materials
                    </Link>
		    <Link
                      href="/services"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Services
                    </Link>                  
                  </div>
                </div>
                <div className="flex items-center">
                  <Link
                    href="/materials/add"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    + Add Material
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
