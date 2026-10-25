"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomerDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopName, setShopName] = useState('My Shop');
  
  // Form ke liye states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'Credit' | 'Payment'>('Credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // WhatsApp Reminder ke liye states
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderNumber, setReminderNumber] = useState('');

  const fetchCustomerData = async () => {
    if (!customerId) return;

    // 1. Customer detail
    const { data: cData } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (cData) setCustomer(cData);

    // 2. Transactions
    const { data: tData } = await supabase.from('khata_transactions').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (tData) setTransactions(tData);

    // 3. Shop Name
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: shopData } = await supabase.from('shop_settings').select('shop_name').eq('user_id', userData.user.id).single();
      if (shopData) setShopName(shopData.shop_name);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !amount) return;

    const amt = Number(amount);

    // 1. Transaction table mein entry
    const { error: tError } = await supabase.from('khata_transactions').insert({
      customer_id: customerId,
      user_id: user.id,
      amount: amt,
      type: formType,
      description: description || (formType === 'Credit' ? 'Udhaar Diya' : 'Payment Mila')
    });

    if (tError) return alert(tError.message);

    // 2. Customer ka balance update
    const newBalance = formType === 'Credit' 
      ? Number(customer.current_balance) + amt 
      : Number(customer.current_balance) - amt;

    await supabase.from('customers').update({ current_balance: newBalance }).eq('id', customerId);

    // Reset and refresh
    setAmount('');
    setDescription('');
    setIsFormOpen(false);
    fetchCustomerData();
  };

  const sendWhatsAppReminder = () => {
    if (!reminderNumber) return alert('Kripya customer ka WhatsApp number daalein.');
    
    let cleanNumber = reminderNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    const message = `Namaste ${customer.name} ji,\n\nAapka *${shopName}* mein kul udhaar *₹${customer.current_balance}* baki hai.\n\nKripya samay par bhugtan karne ki kripa karein, taaki aapko koi asuvidha na ho.\n\nDhanyawad,\n*${shopName}*`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setReminderOpen(false);
  };

  if (!customer) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push('/khata')} className="text-gray-600 hover:text-gray-900 font-semibold">← Back to List</button>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-500 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
            <p className="text-gray-500">{customer.phone || 'No phone number'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className={`text-3xl font-bold ${customer.current_balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
              ₹{customer.current_balance}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-4">
          <button onClick={() => { setFormType('Credit'); setIsFormOpen(true); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold shadow-md">
            + Udhaar Diya (Credit)
          </button>
          <button onClick={() => { setFormType('Payment'); setIsFormOpen(true); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold shadow-md">
            - Payment Mila (Paid)
          </button>
        </div>

        {/* WhatsApp Reminder Button */}
        <div className="mb-6">
          <button 
            onClick={() => {
              setReminderNumber(customer.phone || '');
              setReminderOpen(true);
            }} 
            className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white p-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2"
          >
            💬 WhatsApp par Udhaar Reminder Bhejein
          </button>
        </div>

        {/* Transaction Form */}
        {isFormOpen && (
          <div className={`p-6 rounded shadow-sm border-t-4 mb-6 ${formType === 'Credit' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            <h2 className="text-lg font-semibold mb-4">{formType === 'Credit' ? 'Naya Udhaar (Credit)' : 'Payment Receive'}</h2>
            <form onSubmit={handleAddTransaction} className="space-y-3">
              <input 
                type="number" 
                required 
                placeholder="Amount (₹)" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full border p-2 rounded" 
              />
              <input 
                type="text" 
                placeholder="Description (e.g. Notebooks, Pen)" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full border p-2 rounded" 
              />
              <div className="flex gap-2">
                <button type="submit" className={`flex-1 text-white p-2 rounded font-bold ${formType === 'Credit' ? 'bg-red-600' : 'bg-green-600'}`}>
                  Save Entry
                </button>
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 bg-gray-300 rounded font-bold">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white p-6 rounded shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">Abhi koi transaction nahi hai.</p>
          ) : (
            <ul className="space-y-2">
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{t.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold ${t.type === 'Credit' ? 'text-red-500' : 'text-green-600'}`}>
                    {t.type === 'Credit' ? '+' : '-'} ₹{t.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* WhatsApp Reminder Popup */}
      {reminderOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Send Udhaar Reminder</h3>
            <p className="text-sm text-gray-500 mb-2">WhatsApp Number</p>
            <input 
              type="tel" 
              value={reminderNumber}
              onChange={(e) => setReminderNumber(e.target.value)}
              className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReminderOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={sendWhatsAppReminder} className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded font-bold">Send Message</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <CustomerDetailContent />
    </Suspense>
  );
}