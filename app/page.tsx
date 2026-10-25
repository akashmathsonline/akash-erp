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

    // Pehle user ko login karein
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (authError) {
      setMessage('Wrong Password! Ya email galat hai.');
      return;
    }

    // Login success ke baad Shop Code check karein
    if (authData.user) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', authData.user.id)
        .single();

      if (tenantData && tenantData.tenant_code !== shopCode.toLowerCase()) {
        // Agar code galat hai, toh logout kar dein
        await supabase.auth.signOut();
        setMessage('Shop Code galat hai! Kripya sahi code daalein.');
        return;
      }

      // Sab sahi hai, toh dashboard par bhej dein
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f0fe] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl h-[550px] overflow-hidden">
        
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-[#f4f7fc] p-8 text-center border-r border-gray-100">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Akash ERP</h1>
          <p className="text-gray-500 mb-8">Your Business, Simplified.</p>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Login" className="w-48 opacity-80" />
          <p className="text-sm text-gray-400 mt-8">Powered by Akash Math Online</p>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Please login to your account</p>
          </div>

          {message && <p className="text-red-500 text-center mb-4 text-sm font-semibold">{message}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1">Shop Code</label>
              <input 
                type="text" 
                required
                value={shopCode} 
                onChange={(e) => setShopCode(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition" 
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition" 
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition" 
                placeholder="Enter your password"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg transition duration-200 mt-2"
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