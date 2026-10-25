"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  
  // Naya product database mein save karne ke liye
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock)
    });

    if (error) {
      alert('Error adding product: ' + error.message);
    } else {
      alert('Product Added!');
      setNewProduct({ name: '', price: '', stock: '' });
      fetchProducts(); // List ko refresh karein
    }
  };

  // Database se products laane ke liye
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Billing & Inventory</h1>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Add Product Form */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <form onSubmit={addProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. A4 Paper Rim" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Qty</label>
                  <input type="number" required value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="0" />
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold">Add Product</button>
            </form>
          </div>

          {/* Products List */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4">My Inventory</h2>
            {products.length === 0 ? (
              <p className="text-gray-500 text-sm">Koi product nahi hai. Pehle product add karein.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((p) => (
                  <li key={p.id} className="flex justify-between items-center border p-2 rounded bg-gray-50">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">Stock: {p.stock}</p>
                    </div>
                    <span className="font-bold text-green-600">₹{p.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Chota sa button bill banane ke liye (Agli baar isko banayenge) */}
                <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/new-bill')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-md"
          >
            Go to Billing Counter →
          </button>
        </div>

      </div>
    </div>
  );
}