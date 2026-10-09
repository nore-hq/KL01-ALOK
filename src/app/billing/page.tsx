'use client';

import { useState, useEffect } from 'react';
import { getBills, getUniqueCustomers, createBill, getUniquePaymentModes } from '@/app/actions/billing';
import { Plus, Check, Search, Receipt } from 'lucide-react';

export default function BillingPage() {
    const [bills, setBills] = useState<any[]>([]);
    const [customers, setCustomers] = useState<string[]>([]);
    const [paymentModes, setPaymentModes] = useState<string[]>(['Cash', 'Card', 'UPI', 'Bank Transfer']);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        vehicleNumber: '',
        vehicleModel: '',
        serviceType: '',
        paymentMode: 'CASH',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        setLoading(true);
        const [billsData, customersData, paymentsData] = await Promise.all([
            getBills(),
            getUniqueCustomers(),
            getUniquePaymentModes()
        ]);
        setBills(billsData);
        setCustomers(customersData);
        if (paymentsData.length > 0) {
            // Merge defaults with custom modes
            const defaults = ['Cash', 'Card', 'UPI', 'Bank Transfer'];
            const merged = Array.from(new Set([...defaults, ...paymentsData]));
            setPaymentModes(merged);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerName || !formData.amount || !formData.vehicleNumber) return;
        
        setIsSubmitting(true);

        const res = await createBill({
            ...formData,
            amount: parseFloat(formData.amount)
        });

        if (res.success) {
            setFormData({
                customerName: '',
                vehicleNumber: '',
                vehicleModel: '',
                serviceType: '',
                paymentMode: 'CASH',
                amount: '',
                date: formData.date // keep the selected date
            });
            loadData();
        } else {
            alert('Failed to create bill: ' + res.error);
        }
        setIsSubmitting(false);
    };

    const filteredBills = bills.filter(b => 
        b.customerName.toLowerCase().includes(search.toLowerCase()) || 
        b.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.serialNumber.toString().includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Billing System</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Add new bills directly into the ledger.</p>
                </div>
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search bills by name, vehicle, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 shadow-sm"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Mobile-Friendly Bill Entry Form (Shown on small screens) */}
            <div className="block md:hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#143d30]" /> New Bill Entry
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Quick Add</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Customer Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Customer name..."
                            value={formData.customerName}
                            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Vehicle No.</label>
                            <input
                                type="text"
                                required
                                placeholder="KL 01 AB 1234"
                                value={formData.vehicleNumber}
                                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Model</label>
                            <input
                                type="text"
                                placeholder="e.g. Swift, Creta"
                                value={formData.vehicleModel}
                                onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Service</label>
                            <input
                                type="text"
                                required
                                placeholder="Full Wash, Spa..."
                                value={formData.serviceType}
                                onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Payment</label>
                            <input
                                type="text"
                                required
                                list="mobile-payment-list"
                                placeholder="Cash, UPI..."
                                value={formData.paymentMode}
                                onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                            />
                            <datalist id="mobile-payment-list">
                                {paymentModes.map((p, i) => <option key={i} value={p} />)}
                            </datalist>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#143d30] hover:bg-[#1a4f3f] disabled:bg-[#143d30]/50 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                        {isSubmitting ? 'Saving...' : <><Plus className="w-3.5 h-3.5" /> Submit Bill</>}
                    </button>
                </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <form onSubmit={handleSubmit}>
                        <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap min-w-[1200px]">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-32">Date</th>
                                    <th className="p-4 w-56">Customer Name</th>
                                    <th className="p-4 w-40">Vehicle No.</th>
                                    <th className="p-4 w-56">Model</th>
                                    <th className="p-4 w-56">Service Type</th>
                                    <th className="p-4 w-32">Payment</th>
                                    <th className="p-4 w-32">Amount (₹)</th>
                                    <th className="p-4 w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Desktop Inline Input Row */}
                                <tr className="hidden md:table-row bg-[#E2F898]/10 hover:bg-[#E2F898]/20 transition-colors border-b-2 border-[#143d30]/10">
                                    <td className="p-3">
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                        />
                                    </td>
                                    <td className="p-3 relative">
                                        <textarea
                                            rows={1}
                                            required
                                            placeholder="Name..."
                                            value={formData.customerName}
                                            onFocus={() => setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 placeholder-gray-400 resize-none overflow-hidden"
                                        />
                                        {showDropdown && customers.filter(c => c.toLowerCase().includes(formData.customerName.toLowerCase())).length > 0 && (
                                            <ul className="absolute z-50 left-3 right-3 top-[calc(100%-8px)] bg-white border border-gray-200 shadow-xl rounded-lg max-h-48 overflow-y-auto">
                                                {customers.filter(c => c.toLowerCase().includes(formData.customerName.toLowerCase())).map((c, i) => (
                                                    <li 
                                                        key={i} 
                                                        onClick={() => {
                                                            setFormData({...formData, customerName: c});
                                                            setShowDropdown(false);
                                                        }}
                                                        className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <textarea
                                            rows={1}
                                            required
                                            placeholder="KL-01..."
                                            value={formData.vehicleNumber}
                                            onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 placeholder-gray-400 uppercase resize-none overflow-hidden"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <textarea
                                            rows={1}
                                            required
                                            placeholder="Model..."
                                            value={formData.vehicleModel}
                                            onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 placeholder-gray-400 resize-none overflow-hidden"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <textarea
                                            rows={1}
                                            required
                                            placeholder="Service..."
                                            value={formData.serviceType}
                                            onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 placeholder-gray-400 resize-none overflow-hidden"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            required
                                            list="payment-list"
                                            placeholder="e.g. Cash"
                                            value={formData.paymentMode}
                                            onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                        />
                                        <datalist id="payment-list">
                                            {paymentModes.map((p, i) => <option key={i} value={p} />)}
                                        </datalist>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                        />
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#143d30] hover:bg-[#1a4f3f] disabled:bg-[#143d30]/50 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            {isSubmitting ? '...' : <><Plus className="w-3 h-3" /> Add</>}
                                        </button>
                                    </td>
                                </tr>

                                {/* Historical Data Rows */}
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">Loading bills...</td>
                                    </tr>
                                ) : filteredBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">No past bills found.</td>
                                    </tr>
                                ) : (
                                    filteredBills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-gray-500 font-medium">
                                                {new Date(bill.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900">{bill.customerName}</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">#BL-{bill.serialNumber.toString().padStart(4, '0')}</div>
                                            </td>
                                            <td className="p-4 font-medium text-gray-900 uppercase">
                                                {bill.vehicleNumber}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {bill.vehicleModel}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {bill.serviceType}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">
                                                    {bill.paymentMode}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-gray-900">
                                                ₹{bill.amount.toFixed(2)}
                                            </td>
                                            <td className="p-4"></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>
        </div>
    );
}
