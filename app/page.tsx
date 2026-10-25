"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Processing...');
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Signup successful! Ab aap login kar sakte hain.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.push('/dashboard'); 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isSignUp ? 'Create Shop Account' : 'Login to Akash ERP'}
        </h1>
        
        {message && <p className="text-blue-600 mb-4 text-center text-sm">{message}</p>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full border p-2 rounded mt-1" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full border p-2 rounded mt-1" 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-semibold">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        
        <p 
          onClick={() => setIsSignUp(!isSignUp)} 
          className="text-center text-sm mt-4 cursor-pointer text-blue-500 hover:underline"
        >
          {isSignUp ? 'Already have an account? Login' : 'New shop? Sign up'}
        </p>
      </div>
    </div>
  );
}