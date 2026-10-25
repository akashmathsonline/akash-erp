"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PrintingJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    job_details: '',
    total_amount: '',
    advance_payment: '',
    delivery_date: ''
  });

  const fetchJobs = async () => {
    const { data } = await supabase.from('printing_jobs').select('*').order('created_at', { ascending: false });
    if (data) setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('printing_jobs').insert({
      user_id: user.id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      job_details: formData.job_details,
      total_amount: Number(formData.total_amount),
      advance_payment: Number(formData.advance_payment),
      delivery_date: formData.delivery_date || null,
      status: 'Pending'
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Printing Job Added!');
      setFormData({ customer_name: '', customer_phone: '', job_details: '', total_amount: '', advance_payment: '', delivery_date: '' });
      fetchJobs();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('printing_jobs').update({ status: newStatus }).eq('id', id);
    fetchJobs();
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Printing Jobs</h1>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Add New Job Form */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-purple-500 h-fit">
            <h2 className="text-xl font-semibold mb-4">New Print Order</h2>
            <form onSubmit={handleAddJob} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. Rahul" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Details</label>
                <textarea required value={formData.job_details} onChange={(e) => setFormData({...formData, job_details: e.target.value})} className="w-full border p-2 rounded mt-1" placeholder="e.g. 10 pages color print, 5 lamination" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount (₹)</label>
                  <input type="number" required value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Advance (₹)</label>
                  <input type="number" value={formData.advance_payment} onChange={(e) => setFormData({...formData, advance_payment: e.target.value})} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                <input type="date" value={formData.delivery_date} onChange={(e) => setFormData({...formData, delivery_date: e.target.value})} className="w-full border p-2 rounded mt-1" />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded font-semibold mt-2">Add Order</button>
            </form>
          </div>

          {/* Jobs List */}
          <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4">All Orders</h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-sm">Koi print order nahi hai.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {jobs.map(job => (
                  <div key={job.id} className="border p-4 rounded-lg bg-gray-50 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{job.customer_name} <span className="text-sm font-normal text-gray-500">({job.customer_phone})</span></p>
                      <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Work:</span> {job.job_details}</p>
                      <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Delivery:</span> {job.delivery_date || 'N/A'}</p>
                      <div className="flex gap-4 mt-2 text-sm font-medium">
                        <span className="text-blue-600">Total: ₹{job.total_amount}</span>
                        <span className="text-green-600">Adv: ₹{job.advance_payment}</span>
                        <span className="text-red-500">Bal: ₹{job.total_amount - job.advance_payment}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        job.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        job.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {job.status}
                      </span>
                      <div className="mt-3 flex flex-col gap-1">
                        <select 
                          value={job.status} 
                          onChange={(e) => updateStatus(job.id, e.target.value)}
                          className="text-xs border p-1 rounded bg-white cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}