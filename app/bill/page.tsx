"use client";
import { useEffect, useState, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';

function BillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get('id');
  const billRef = useRef<HTMLDivElement>(null);

  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  
  // Shop Settings ke liye naye states
  const [shopName, setShopName] = useState('My Shop');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('Thank you! Visit Again.');

  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    const fetchBill = async () => {
      if (!saleId) return;

      // 1. Sale Data
      const { data: saleData } = await supabase.from('sales').select('*').eq('id', saleId).single();
      if (saleData) setSale(saleData);

      // 2. Items Data
      const { data: itemsData } = await supabase.from('sale_items').select('*').eq('sale_id', saleId);
      if (itemsData) setItems(itemsData);

      // 3. Shop Settings Data
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: shopData } = await supabase.from('shop_settings').select('*').eq('user_id', userData.user.id).single();
        if (shopData) {
          setShopName(shopData.shop_name || 'My Shop');
          setShopAddress(shopData.shop_address || '');
          setShopPhone(shopData.shop_phone || '');
          setReceiptFooter(shopData.receipt_footer || 'Thank you! Visit Again.');
        }
      }
    };
    fetchBill();
  }, [saleId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!billRef.current) return;
    try {
      const dataUrl = await toPng(billRef.current, { 
        cacheBust: true, 
        backgroundColor: '#ffffff',
        pixelRatio: 2 
      });
      const link = document.createElement('a');
      link.download = `Bill-${sale.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image download failed', err);
      alert('Image download me error aaya.');
    }
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappNumber) return alert('Kripya customer ka WhatsApp number daalein.');
    
    await handleDownloadImage();

    let cleanNumber = whatsappNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    const itemsList = items.map(item => `- ${item.product_name} x ${item.quantity}: ₹${item.total}`).join('\n');
    const billNo = sale.id.slice(0, 8).toUpperCase();

    const message = `Namaste ${sale.customer_name},\n\n*${shopName}* se aapka bill:\nBill No: #${billNo}\n\n${itemsList}\n\n*Grand Total: ₹${sale.total_amount}*\nPayment Mode: ${sale.payment_mode}\n\n${receiptFooter}\n\nDhanyawad,\n*${shopName}*`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setIsWhatsAppOpen(false);
    setWhatsappNumber('');
  };

  if (!sale) return <div className="p-10 text-center text-xl font-semibold">Loading Receipt...</div>;

  const dueAmount = sale.total_amount - (sale.paid_amount || sale.total_amount);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      
      {/* Buttons */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap justify-between gap-2 print:hidden">
        <button onClick={() => router.push('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          ← Dashboard
        </button>
        
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold shadow-md">
            🖨️ Print
          </button>
          <button onClick={() => setIsWhatsAppOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow-md">
            💬 WhatsApp
          </button>
          <button onClick={handleDownloadImage} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold shadow-md">
            📥 Image
          </button>
        </div>
      </div>

      {/* WHATSAPP POPUP */}
      {isWhatsAppOpen && (
        <div className="max-w-2xl mx-auto mb-4 bg-green-50 p-4 rounded border border-green-200 shadow-sm print:hidden">
          <h3 className="text-lg font-bold mb-2 text-green-800">Send Bill on WhatsApp</h3>
          <p className="text-sm text-gray-600 mb-2">Number daalte hi Bill Image download hogi aur WhatsApp khulega.</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input 
              type="tel" 
              placeholder="e.g. 9876543210" 
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="flex-1 border border-green-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={handleSendWhatsApp} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-md">
              Send & Download
            </button>
            <button onClick={() => setIsWhatsAppOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 bg-white hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ASLI BILL */}
      <div ref={billRef} className="max-w-2xl mx-auto bg-white p-10 rounded shadow-md border">
        
        {/* Header with Address & Phone */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-3xl font-extrabold text-gray-800 uppercase tracking-wide">{shopName}</h1>
          {shopAddress && <p className="text-sm text-gray-600 mt-1">{shopAddress}</p>}
          {shopPhone && <p className="text-sm text-gray-600">📞 {shopPhone}</p>}
        </div>

        {/* Bill Info */}
        <div className="flex justify-between mb-6 text-sm text-gray-700">
          <div>
            <p><span className="font-semibold">Customer:</span> {sale.customer_name}</p>
            {sale.customer_phone && <p><span className="font-semibold">Phone:</span> {sale.customer_phone}</p>}
            <p><span className="font-semibold">Bill No:</span> {sale.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Date:</span> {new Date(sale.created_at).toLocaleDateString()}</p>
            <p><span className="font-semibold">Time:</span> {new Date(sale.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-400 bg-gray-50">
              <th className="py-2 px-2">Item Name</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Price</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 px-2">{item.product_name}</td>
                <td className="py-2 px-2 text-center">{item.quantity}</td>
                <td className="py-2 px-2 text-right">₹{item.price}</td>
                <td className="py-2 px-2 text-right font-medium">₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand Total */}
        <div className="border-t-2 border-gray-400 pt-4 flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="text-lg font-bold text-gray-800">Grand Total:</span>
          <span className="text-2xl font-extrabold text-green-600">₹{sale.total_amount}</span>
        </div>

        {/* Paid Amount & Due */}
        <div className="flex justify-between text-sm mt-3 px-2">
          <span className="text-gray-600">Paid Amount:</span>
          <span className="font-semibold text-gray-800">₹{sale.paid_amount || sale.total_amount}</span>
        </div>
        
        {dueAmount > 0 && (
          <div className="flex justify-between text-sm mt-1 px-2 py-1 bg-red-50 rounded">
            <span className="text-red-600 font-semibold">Udhaar (Due):</span>
            <span className="font-bold text-red-600">₹{dueAmount}</span>
          </div>
        )}

        {/* Footer with Custom Message */}
        <div className="text-center mt-10 text-xs text-gray-500">
          <p><span className="font-semibold">Payment Mode:</span> {sale.payment_mode}</p>
          <p className="mt-2 text-sm font-medium">{receiptFooter}</p>
          <p className="mt-1 font-bold text-gray-700">{shopName}</p>
        </div>
      </div>
    </div>
  );
}

export default function BillViewPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xl font-semibold">Loading Receipt...</div>}>
      <BillContent />
    </Suspense>
  );
}