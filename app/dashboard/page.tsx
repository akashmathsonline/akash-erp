"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [shopName, setShopName] = useState('My Shop');
  const [sales, setSales] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUserEmail(user.email || '');

      // Shop Name fetch karein
      const { data: shopData } = await supabase.from('shop_settings').select('shop_name').eq('user_id', user.id).single();
      if (shopData) setShopName(shopData.shop_name);

      // Aaj ki sales fetch karein (Sirf 5)
      const today = new Date().toISOString().split('T')[0];
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(5);

      if (salesData) {
        setSales(salesData);
        const total = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
        setTotalSales(total);
      }
    };
    fetchUserData();
  }, [router]);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-xl shadow-lg mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, {shopName} 👋</h1>
            <p className="text-blue-100 mt-1">Aaj ka din shubh ho! Apna business manage karein.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-blue-200">Logged in as</p>
            <p className="font-semibold">{userEmail}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-medium">Aaj ki Total Sales</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{totalSales}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">Total Bills Aaj Ke</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{sales.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-500 font-medium">Shop Name</p>
            <p className="text-xl font-bold text-gray-800 mt-2 truncate">{shopName}</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button onClick={() => router.push('/new-bill')} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🛒</span>
            <span className="font-semibold text-gray-700">New Bill</span>
            <span className="text-xs text-gray-500">Billing Counter</span>
          </button>
          <button onClick={() => router.push('/billing')} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">📦</span>
            <span className="font-semibold text-gray-700">Inventory</span>
            <span className="text-xs text-gray-500">Products Stock</span>
          </button>
          <button onClick={() => router.push('/khata')} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">📒</span>
            <span className="font-semibold text-gray-700">Khata</span>
            <span className="text-xs text-gray-500">Customer Udhaar</span>
          </button>
          <button onClick={() => router.push('/printing')} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🖨️</span>
            <span className="font-semibold text-gray-700">Print Jobs</span>
            <span className="text-xs text-gray-500">Printing Orders</span>
          </button>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Recent Bills</h2>
            <button onClick={() => router.push('/all-bills')} className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          {sales.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aaj koi bill nahi bana hai.</p>
          ) : (
            <ul className="space-y-3">
              {sales.map((sale) => (
                <li 
                  key={sale.id} 
                  onClick={() => router.push(`/bill?id=${sale.id}`)}
                  className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                >
                  <div>
                    <p className="font-medium text-gray-800">{sale.customer_name}</p>
                    <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="font-bold text-green-600">₹{sale.total_amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}