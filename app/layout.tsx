"use client";
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shopName, setShopName] = useState('My Shop');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data } = await supabase.from('shop_settings').select('shop_name').eq('user_id', user.id).single();
        if (data) setShopName(data.shop_name);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkUser();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Billing (POS)', path: '/new-bill', icon: '🛒' },
    { name: 'Inventory', path: '/billing', icon: '📦' },
    { name: 'Print Jobs', path: '/printing', icon: '🖨️' },
    { name: 'Customer Khata', path: '/khata', icon: '📒' },
  ];

  // Agar login page hai ya user logged in nahi hai, toh bina sidebar ke dikhayein
  if (pathname === '/' || !isLoggedIn) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white flex-col shadow-xl print:hidden hidden md:flex">
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-xl font-bold truncate text-orange-400">{shopName}</h1>
              <p className="text-xs text-gray-400 mt-1">ERP System</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-orange-500 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold">
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}