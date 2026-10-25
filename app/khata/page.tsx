"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KhataPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

      const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check karein ki kya is naam ka customer pehle se hai
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('name', formData.name);

    if (existing && existing.length > 0) {
      // 2. Agar naam same hai, toh check karein ki phone number bhi same hai ya nahi
      const phoneMatch = existing.find(c => c.phone === formData.phone);
      
      if (phoneMatch) {
        // Agar naam aur phone dono same hain, toh entry rok dein
        return alert(`"${formData.name}" naam aur is phone number (${formData.phone}) wala customer pehle se majood hai! Kripya phone number check karein ya customer par click karke uski detail dekhein.`);
      } else {
        // Agar naam same hai par phone alag hai, toh warning dein
        const confirmAdd = confirm(`"${formData.name}" naam ka customer pehle se hai, lekin uske phone number alag hain. Kya aap is naye Ramesh ko add karna chahte hain?`);
        if (!confirmAdd) return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('customers').insert({
      user_id: user.id,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      current_balance: 0
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setFormData({ name: '', phone: '', address: '' });
      setIsAdding(false);
      fetchCustomers();
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Customer Khata</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold">
              {isAdding ? 'Cancel' : '+ New Customer'}
            </button>
            <button onClick={() => router.push('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Back
            </button>
          </div>
        </div>

        {/* Add Customer Form */}
        {isAdding && (
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-500 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <input type="text" required placeholder="Customer Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" />
              <input type="text" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded" />
              <input type="text" placeholder="Address (Optional)" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded" />
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-bold">Save Customer</button>
            </form>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-purple-500">
          <h2 className="text-xl font-semibold mb-4">All Customers</h2>
                    <input 
            type="text" 
            placeholder="Search customer by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border p-2 rounded mb-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
          />
          {customers.length === 0 ? (
            <p className="text-gray-500 text-sm">Koi customer nahi hai. Naya add karein.</p>
          ) : (
            <ul className="space-y-2">
                            {customers
                .filter(c => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (c.phone && c.phone.includes(searchQuery))
                )
                .map((c) => (
                <li 
  key={c.id} 
  onClick={() => router.push(`/khata/detail?id=${c.id}`)}
  className="flex justify-between items-center border p-3 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
>
                                    <div>
                    <p className="font-bold text-lg text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-600 font-medium">📞 {c.phone || 'No phone number'}</p>
                    {c.address && <p className="text-xs text-gray-400">📍 {c.address}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${c.current_balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {c.current_balance > 0 ? `Udhaar: ₹${c.current_balance}` : 'No Udhaar'}
                    </p>
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