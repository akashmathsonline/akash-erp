"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Processing...');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (authError) {
      setMessage('Wrong Password! Ya email galat hai.');
      return;
    }

    if (authData.user) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', authData.user.id)
        .single();

      if (tenantData && tenantData.tenant_code !== shopCode.toLowerCase()) {
        await supabase.auth.signOut();
        setMessage('Shop Code galat hai! Kripya sahi code daalein.');
        return;
      }

      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      
      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        
        {/* Left Side: Branding (Mobile me bhi dikhega) */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
             <div className="absolute bottom-10 right-0 w-32 h-32 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            {/* Default Logo Yahan Dikhayein */}
            <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Akash ERP</h1>
            <p className="text-blue-200 text-sm md:text-base">Your Business, Simplified.</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Please login to your account</p>
          </div>

          {message && <p className="text-red-500 text-center mb-4 text-sm font-semibold bg-red-50 p-2 rounded">{message}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1">Shop Code</label>
              <input 
                type="text" 
                required
                value={shopCode} 
                onChange={(e) => setShopCode(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-gray-800" 
                placeholder="e.g. sharma"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-gray-800" 
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-gray-800" 
                placeholder="Enter your password"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all duration-200 mt-4"
            >
              Login to My Account
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">© 2026 Akash ERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}