"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewBillPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
  
  // Quick Add ke liye state
  const [quickName, setQuickName] = useState('');
  const [quickRate, setQuickRate] = useState('');
  const [quickQty, setQuickQty] = useState('1');

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  // Inventory se cart mein add karna
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Quick Add (Direct Entry) se cart mein add karna
  const addQuickItem = () => {
    if (!quickName || !quickRate || !quickQty) return alert("Naam, Rate aur Qty daalein");
    
    const qty = Number(quickQty);
    const rate = Number(quickRate);
    const newItem = { 
      id: Date.now().toString(), // unique id
      name: quickName, 
      price: rate, 
      quantity: qty,
      isCustom: true 
    };

    setCart((prev) => [...prev, newItem]);
    
    // Form clear karein
    setQuickName('');
    setQuickRate('');
    setQuickQty('1');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Quantity badhane ke liye
  const increaseQty = (itemId: string) => {
    setCart((prev) => prev.map(item => 
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Quantity kam karne ke liye
  const decreaseQty = (itemId: string) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.id === itemId && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
    });
  };

  // Item ko cart se delete karne ke liye
  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter(item => item.id !== itemId));
  };
    // Direct Quantity type karne ke liye
  const updateQty = (itemId: string, newQty: string) => {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty <= 0) {
      // Agar user 0 ya khali chhodta hai, toh item delete kar dein (ya 1 rakh dein)
      removeItem(itemId); 
      return;
    }
    
    setCart((prev) => prev.map(item => 
      item.id === itemId ? { ...item, quantity: qty } : item
    ));
  };
      const generateBill = async () => {
    if (cart.length === 0) return alert('Cart khali hai!');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const paidAmount = Number(amountPaid) || 0;
    const dueAmount = totalAmount - paidAmount;

    // 1. Agar udhaar hai, toh customer ka khata check karein/create karein
    let customerId = null;
    if (dueAmount > 0) {
      if (!customerPhone) return alert('Udhaar ke liye customer ka phone number daalna zaroori hai!');
      
      // Check karein ki kya is phone number se customer pehle se hai
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .single();

            if (existingCustomer) {
        customerId = existingCustomer.id;
        
        // Agar naam ya phone number update hua hai, toh use update kar dein
        if ((customerName && existingCustomer.name !== customerName) || existingCustomer.phone !== customerPhone) {
          await supabase.from('customers').update({ 
            name: customerName || existingCustomer.name,
            phone: customerPhone
          }).eq('id', customerId);
        }
      } else {
        // Naya customer banayein (Phone ke saath)
        const { data: newCustomer } = await supabase.from('customers').insert({
          user_id: user.id,
          name: customerName || 'Unknown',
          phone: customerPhone,
          current_balance: 0
        }).select().single();
        if (newCustomer) customerId = newCustomer.id;
      }
    }

    // 2. Sale create karein
    const { data: saleData, error: saleError } = await supabase.from('sales').insert({
      user_id: user.id,
      customer_name: customerName || 'Walk-in Customer',
      total_amount: totalAmount,
      payment_mode: paymentMode,
      paid_amount: paidAmount,
      customer_phone: customerPhone
    }).select().single();

    if (saleError) return alert(saleError.message);

    // 3. Sale Items save karein
    const saleItems = cart.map(item => ({
      sale_id: saleData.id,
      product_id: item.isCustom ? null : item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }));
    await supabase.from('sale_items').insert(saleItems);

    // 4. Udhaar update karein
    if (dueAmount > 0 && customerId) {
      await supabase.from('khata_transactions').insert({
        customer_id: customerId,
        user_id: user.id,
        amount: dueAmount,
        type: 'Credit',
        description: `Bill No: ${saleData.id.slice(0, 8)}`
      });

      const { data: custData } = await supabase.from('customers').select('current_balance').eq('id', customerId).single();
      if (custData) {
        await supabase.from('customers').update({
          current_balance: Number(custData.current_balance) + dueAmount
        }).eq('id', customerId);
      }
    }

    // 5. Bill page par bhej dein
    router.push(`/bill?id=${saleData.id}`);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Products List */}
        <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">Select Products (Inventory)</h2>
          <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="border p-3 rounded text-left hover:bg-blue-50 transition">
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-gray-600">₹{p.price} | Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Current Bill */}
        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4">Current Bill</h2>
                    <input 
            type="text" 
            placeholder="Customer Name (Optional)" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
          {/* Naya Phone Number Input */}
          <input 
            type="text" 
            placeholder="Phone Number (Udhaar ke liye zaroori)" 
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          
          <input 
            type="text" 
            placeholder="Customer Name (Optional)" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />

          {/* Quick Add Form with Rate & Qty */}
          <div className="bg-gray-50 p-3 rounded border mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Direct Entry (Bina Stock ke)</p>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Item Name" 
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full border p-1 rounded text-sm"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Rate (₹)" 
                  value={quickRate}
                  onChange={(e) => setQuickRate(e.target.value)}
                  className="w-1/2 border p-1 rounded text-sm"
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={quickQty}
                  onChange={(e) => setQuickQty(e.target.value)}
                  className="w-1/2 border p-1 rounded text-sm"
                />
              </div>
              <button 
                onClick={addQuickItem}
                className="w-full bg-gray-800 text-white p-1.5 rounded text-sm hover:bg-gray-900 mt-1"
              >
                + Add to Bill
              </button>
            </div>
          </div>

                    {/* Cart Items (Editable) */}
          {cart.length > 0 && (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2 text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} x {item.quantity}</p>
                  </div>
                  
                  {/* Quantity Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded bg-white">
                      <button onClick={() => decreaseQty(item.id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-l">-</button>
                                        {/* Quantity Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded bg-white">
                      <button onClick={() => decreaseQty(item.id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-l">-</button>
                      
                      {/* Yahan Editable Input aayega */}
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        className="w-12 text-center border-none focus:outline-none focus:ring-0 p-1 font-semibold"
                      />
                      
                      <button onClick={() => increaseQty(item.id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-r">+</button>
                    </div>
                    
                    <span className="font-bold w-12 text-right">₹{item.price * item.quantity}</span>
                    
                    {/* Delete Button */}
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-lg ml-2" title="Remove Item">
                      🗑️
                    </button>
                  </div>
                      <button onClick={() => increaseQty(item.id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-r">+</button>
                    </div>
                    
                    <span className="font-bold w-12 text-right">₹{item.price * item.quantity}</span>
                    
                    {/* Delete Button */}
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-lg ml-2" title="Remove Item">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Mode & Total */}
          <div className="mt-4 border-t pt-4">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select 
                value={paymentMode} 
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border p-2 rounded text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay/Paytm)</option>
                <option value="Card">Card</option>
                <option value="Credit">Credit (Udhaar)</option>
              </select>
            </div>

            <div className="flex justify-between font-bold text-lg mb-4 mt-2">
                          <div className="flex justify-between font-bold text-lg mb-2 mt-2">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>

            {/* Naya Input Yahan Add Karein */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Amount Received (₹)</label>
              <input 
                type="number" 
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={`Max: ${totalAmount}`}
                className="w-full border p-2 rounded mt-1 text-sm"
              />
              {Number(amountPaid) < totalAmount && Number(amountPaid) > 0 && (
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  Udhaar (Due): ₹{totalAmount - Number(amountPaid)}
                </p>
              )}
            </div>
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
            
            <button onClick={generateBill} className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded font-bold">
              Generate Bill & Print
            </button>
            <button onClick={() => router.push('/billing')} className="w-full mt-2 bg-gray-200 text-gray-800 p-2 rounded">
              Back to Inventory
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}