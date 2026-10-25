"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    receipt_footer: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('shop_settings').select('*').eq('user_id', user.id).single();
      if (data) {
        setFormData({
          shop_name: data.shop_name || '',
          shop_address: data.shop_address || '',
          shop_phone: data.shop_phone || '',
          receipt_footer: data.receipt_footer || ''
        });
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('shop_settings').upsert({
      user_id: user.id,
      ...formData
    }, { onConflict: 'user_id' });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Settings Saved Successfully!');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Shop Settings</h1>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border-t-4 border-blue-500">
          {message && (
            <div className={`p-3 mb-6 rounded text-sm font-semibold ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">🏪 Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Name *</label>
                  <input type="text" required value={formData.shop_name} onChange={(e) => setFormData({...formData, shop_name: e.target.value})} className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Sharma Stationery" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="text" value={formData.shop_phone} onChange={(e) => setFormData({...formData, shop_phone: e.target.value})} className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 9876543210" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" value={formData.shop_address} onChange={(e) => setFormData({...formData, shop_address: e.target.value})} className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Main Market, Bettiah" />
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">🧾 Receipt Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Footer Text (Bill ke neeche)</label>
                  <input type="text" value={formData.receipt_footer} onChange={(e) => setFormData({...formData, receipt_footer: e.target.value})} className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Thank you! Visit Again." />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold disabled:bg-gray-400">
                {isLoading ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}