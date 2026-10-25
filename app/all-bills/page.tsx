"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AllBillsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllSales = async () => {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setSales(data);
      setIsLoading(false);
    };
    fetchAllSales();
  }, []);

  // Search Filter Logic (Name aur Phone dono se)
  const filteredSales = sales.filter(sale => 
    sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">All Bills History</h1>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Back to Dashboard
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded shadow-sm border-t-4 border-blue-500 mb-6">
          <input 
            type="text" 
            placeholder="Search by Customer Name or Bill No..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>

        {/* Bills List */}
        <div className="bg-white rounded shadow-sm border p-6">
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredSales.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Koi bill nahi mila.</p>
          ) : (
            <ul className="space-y-3">
              {filteredSales.map((sale) => (
                <li 
                  key={sale.id} 
                  onClick={() => router.push(`/bill?id=${sale.id}`)}
                  className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-3 rounded transition"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{sale.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      Bill: #{sale.id.slice(0, 8).toUpperCase()} | {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600 text-lg">₹{sale.total_amount}</span>
                    <p className="text-xs text-gray-400">{sale.payment_mode}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}