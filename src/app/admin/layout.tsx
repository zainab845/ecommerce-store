'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  // Skip the sidebar layout entirely for the admin login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Poll for chat unread count every 30 seconds
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/admin/chat/unread');
        const data = await res.json();
        setChatUnread(data.count ?? 0);
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/admin',              label: 'Dashboard',        icon: '□'  },
    { href: '/admin/products',     label: 'Products',         icon: '▦'  },
    { href: '/admin/categories',   label: 'Categories',       icon: '📁' },
    { href: '/admin/orders',       label: 'Orders',           icon: '📦' },
    { href: '/admin/users',        label: 'Users',            icon: '👥' },
    { href: '/admin/reviews',      label: 'Reviews',          icon: '⭐' },
    { href: '/admin/coupons',      label: 'Coupons',          icon: '🏷️' },
    { href: '/admin/subscribers',  label: 'Subscribers',      icon: '💎' },
    { href: '/admin/contact',      label: 'Contact Messages', icon: '✉️' },
    { href: '/admin/chat',         label: 'Chat',             icon: '💬', badge: chatUnread },
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // ── Logout — must call the API to clear the httpOnly cookie ──────────────
  // document.cookie cannot touch httpOnly cookies, so JS-only logout never works
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the fetch fails, redirect so the user isn't stuck
    }
    router.push('/admin/login');
    router.refresh(); // clear Next.js router cache so /admin is no longer accessible
  };

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
      <div className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-gray-900 text-white
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 z-40
        shadow-2xl lg:shadow-none
        flex flex-col          /* ← flex column so footer stays at bottom */
      `}>

        {/* Brand — fixed height */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-gray-900 font-bold text-xl">
              E
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">E-Shop</span>
              <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded font-medium">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Nav links — scrollable, takes remaining height */}
        <nav className="flex-1 overflow-y-auto px-6 pb-4 space-y-1 min-h-0">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive(link.href)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{link.icon}</span>
                <span className="truncate">{link.label}</span>
              </span>

              {/* Unread badge for chat */}
              {link.badge !== undefined && link.badge > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer — fixed at bottom, never overlaps nav */}
        <div className="flex-shrink-0 px-6 pb-6 pt-3 border-t border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span className="text-lg">🏪</span>
            Back to Store
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
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