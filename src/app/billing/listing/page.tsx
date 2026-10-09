'use client';

import { useState, useEffect } from 'react';
import { getBills, deleteBill, updateBill, getUniquePaymentModes } from '@/app/actions/billing';
import { Search, Trash2, Edit2, Check, X, Calendar as CalendarIcon, Filter, Receipt, Printer } from 'lucide-react';

export default function BillListingPage() {
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [filterDay, setFilterDay] = useState(''); // YYYY-MM-DD
    const [paymentModes, setPaymentModes] = useState<string[]>(['Cash', 'Card', 'UPI', 'Bank Transfer']);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    
    const loadData = async () => {
        setLoading(true);
        const [billsData, paymentsData] = await Promise.all([
            getBills(),
            getUniquePaymentModes()
        ]);
        setBills(billsData);
        if (paymentsData.length > 0) {
            const defaults = ['Cash', 'Card', 'UPI', 'Bank Transfer'];
            setPaymentModes(Array.from(new Set([...defaults, ...paymentsData])));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic
    const filteredBills = bills.filter(b => {
        const matchesSearch = b.customerName.toLowerCase().includes(search.toLowerCase()) || 
                              b.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
                              b.serialNumber.toString().includes(search);
                              
        const matchesMonth = filterMonth ? b.date.startsWith(filterMonth) : true;
        const matchesDay = filterDay ? b.date === filterDay : true;
        
        return matchesSearch && (filterDay ? matchesDay : matchesMonth);
    });

    // Aggregates
    const totalRevenue = filteredBills.reduce((sum, b) => sum + b.amount, 0);
    const revenueByMode = filteredBills.reduce((acc, b) => {
        const mode = b.paymentMode.toUpperCase();
        acc[mode] = (acc[mode] || 0) + b.amount;
        return acc;
    }, {} as Record<string, number>);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
        const res = await deleteBill(id);
        if (res.success) {
            loadData();
        } else {
            alert('Failed to delete bill: ' + res.error);
        }
    };

    const startEdit = (bill: any) => {
        setEditingId(bill.id);
        setEditForm({
            customerName: bill.customerName,
            vehicleNumber: bill.vehicleNumber,
            vehicleModel: bill.vehicleModel,
            serviceType: bill.serviceType,
            paymentMode: bill.paymentMode,
            amount: bill.amount,
            date: bill.date
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id: string) => {
        const res = await updateBill(id, {
            ...editForm,
            amount: parseFloat(editForm.amount)
        });
        if (res.success) {
            setEditingId(null);
            loadData();
        } else {
            alert('Failed to update: ' + res.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Bill Listing & Reports</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 print:hidden">View, filter, edit, and analyze your billing history.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="print:hidden w-full sm:w-auto justify-center bg-[#143d30] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a4f3f] transition-colors flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
            </div>

            {/* Filter Bar */}
            <div className="print:hidden bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-4 items-stretch sm:items-center">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 self-start">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
                </div>
                
                <div className="grid grid-cols-2 sm:flex gap-2">
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(''); }}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-medium"
                    />
                    
                    <input
                        type="date"
                        value={filterDay}
                        onChange={(e) => { setFilterDay(e.target.value); if(e.target.value) setFilterMonth(''); }}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-medium"
                    />
                </div>

                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search bills..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                
                {(filterMonth || filterDay || search) && (
                    <button 
                        onClick={() => { setFilterMonth(new Date().toISOString().slice(0, 7)); setFilterDay(''); setSearch(''); }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg text-center"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                <div className="bg-[#143d30] text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm col-span-2 sm:col-span-1">
                    <div className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Total Revenue</div>
                    <div className="text-xl sm:text-2xl font-black">₹{totalRevenue.toFixed(2)}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{filteredBills.length} bills found</div>
                </div>
                
                {(Object.entries(revenueByMode) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([mode, amount]) => (
                    <div key={mode} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">{mode}</div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900">₹{(amount as number).toFixed(2)}</div>
                    </div>
                ))}
            </div>

            {/* Editable List Table */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap min-w-[1200px]">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-24">Bill ID</th>
                                <th className="p-4 w-32">Date</th>
                                <th className="p-4 w-48">Customer Name</th>
                                <th className="p-4 w-32">Vehicle No.</th>
                                <th className="p-4 w-40">Model</th>
                                <th className="p-4 w-48">Service Type</th>
                                <th className="p-4 w-32">Payment</th>
                                <th className="p-4 w-32 text-right">Amount (₹)</th>
                                <th className="print:hidden p-4 w-24 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">Loading billing data...</td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">No bills found for this filter.</td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const isEditing = editingId === bill.id;
                                    return (
                                        <tr key={bill.id} className={`${isEditing ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                                            <td className="p-4 font-mono font-bold text-gray-400 text-xs">
                                                #BL-{bill.serialNumber.toString().padStart(4, '0')}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs" />
                                                ) : (
                                                    <span className="text-gray-600 font-medium">{new Date(bill.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <textarea rows={1} value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs resize-none" />
                                                ) : (
                                                    <span className="font-semibold">{bill.customerName}</span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <textarea rows={1} value={editForm.vehicleNumber} onChange={e => setEditForm({...editForm, vehicleNumber: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs resize-none uppercase" />
                                                ) : (
                                                    <span className="font-semibold uppercase">{bill.vehicleNumber}</span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <textarea rows={1} value={editForm.vehicleModel} onChange={e => setEditForm({...editForm, vehicleModel: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs resize-none" />
                                                ) : (
                                                    <span className="text-gray-600">{bill.vehicleModel}</span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <textarea rows={1} value={editForm.serviceType} onChange={e => setEditForm({...editForm, serviceType: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs resize-none" />
                                                ) : (
                                                    <span className="text-gray-600">{bill.serviceType}</span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <>
                                                        <input type="text" list="edit-payment-list" value={editForm.paymentMode} onChange={e => setEditForm({...editForm, paymentMode: e.target.value})} className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs" />
                                                        <datalist id="edit-payment-list">
                                                            {paymentModes.map((p, i) => <option key={i} value={p} />)}
                                                        </datalist>
                                                    </>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">
                                                        {bill.paymentMode}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full text-right bg-white border border-gray-200 rounded p-1.5 text-xs font-bold" />
                                                ) : (
                                                    <span className="font-bold text-gray-900">₹{bill.amount.toFixed(2)}</span>
                                                )}
                                            </td>
                                            
                                            <td className="print:hidden p-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => saveEdit(bill.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Save">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(bill)} className="p-1.5 text-gray-400 hover:text-[#143d30] hover:bg-[#143d30]/10 rounded-lg transition-colors" title="Edit">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(bill.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
