"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { createNewTenant } from '../actions/admin'; // Server Action import

export default function SuperAdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    shop_name: '',
    tenant_code: ''
  });

  const fetchTenants = async () => {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (data) setTenants(data);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

    const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result: any = await createNewTenant(formData);

      if (result.error) {
        alert('Error: ' + result.error);
      } else {
        alert('Naya Dukan Successfully Add Ho Gaya!');
        setFormData({ email: '', password: '', shop_name: '', tenant_code: '' });
        
        // List ko turant refresh karein
        setTimeout(() => {
          fetchTenants();
        }, 500);
      }
    } catch (err: any) {
      alert('System Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-500 text-white px-4 py-2 rounded">
            Go to ERP
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Add Tenant Form */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-purple-500 h-fit">
            <h2 className="text-xl font-semibold mb-4">Add New Shop (Tenant)</h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Shop Name</label>
                <input type="text" required value={formData.shop_name} onChange={(e) => setFormData({...formData, shop_name: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. Sharma Stationery" />
              </div>
              <div>
                <label className="block text-sm font-medium">Shop Code</label>
                <input type="text" required value={formData.tenant_code} onChange={(e) => setFormData({...formData, tenant_code: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium">Owner Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. 123456" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded font-bold">
                {isLoading ? 'Creating...' : 'Create Shop'}
              </button>
            </form>
          </div>

          {/* Tenants List */}
          <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4">All Active Shops</h2>
            {tenants.length === 0 ? (
              <p className="text-gray-500 text-sm">Koi shop nahi hai.</p>
            ) : (
              <ul className="space-y-3">
                {tenants.map((t) => (
                  <li key={t.id} className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{t.shop_name}</p>
                      <p className="text-sm text-gray-500">Code: {t.tenant_code}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}