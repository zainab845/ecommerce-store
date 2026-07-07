'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: '□' },
    { href: '/admin/products', label: 'Products', icon: '▦' },
    { href: '/admin/categories', label: 'Categories', icon: '📁' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 z-40 overflow-y-auto shadow-2xl lg:shadow-none`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-gray-900 font-bold text-xl">
              E
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">E-Shop</span>
              <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded font-medium">ADMIN</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  pathname === link.href 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Section - Back to Store + Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              ← Back to Store
            </Link>

            <button
              onClick={() => {
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pt-16 lg:pt-8">
          {children}
        </div>
      </div>
    </div>
  );
}