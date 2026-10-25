"use client";
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shopName, setShopName] = useState('My Shop');
  const [shopLogo, setShopLogo] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
   // Service Worker Register karein
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.log('SW error:', err));
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        if (user.email === 'srivastvaakash2020@gmail.com') {
          setIsSuperAdmin(true);
        }
        const { data } = await supabase.from('shop_settings').select('*').eq('user_id', user.id).single();
        if (data) {
          setShopName(data.shop_name);
          setShopLogo(data.logo_url || '');
        }
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
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  if (pathname === '/' || !isLoggedIn) {
    return (
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#ea580c" />
          {shopLogo && <link rel="icon" href={shopLogo} />}
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />
        {shopLogo && <link rel="icon" href={shopLogo} />}
      </head>
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          
          {/* Mobile Top Bar */}
          <div className="md:hidden fixed top-0 w-full bg-gray-900 text-white p-4 flex justify-between items-center z-50 shadow-md">
            <div className="flex items-center gap-2">
              {shopLogo ? (
                <img src={shopLogo} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : null}
              <h1 className="font-bold text-orange-400">{shopName}</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl">
              ☰
            </button>
          </div>

          {/* Sidebar */}
          <aside className={`
            fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex-col shadow-xl print:hidden transition-transform duration-300
            ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 md:flex hidden'}
          `}>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {shopLogo ? (
                  <img src={shopLogo} alt="Logo" className="w-10 h-10 object-contain rounded" />
                ) : null}
                <div>
                  <h1 className="text-xl font-bold truncate text-orange-400">{shopName}</h1>
                  <p className="text-xs text-gray-400 mt-1">ERP System</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 md:mt-0">
              {menuItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-orange-500 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Super Admin Button */}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    router.push('/superadmin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 border border-purple-500 ${
                    pathname === '/superadmin' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:bg-purple-900'
                  }`}
                >
                  <span className="text-xl">👑</span>
                  <span>Super Admin Panel</span>
                </button>
              )}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold">
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden pt-16 md:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}