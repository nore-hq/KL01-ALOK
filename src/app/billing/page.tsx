'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBills, createBill, PaymentMode } from '@/app/actions/billing';
import { Search, Plus, Printer, AlertCircle, FileText, Check } from 'lucide-react';

export default function BillingPage() {
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('ALL');

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [customerName, setCustomerName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [service, setService] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

    const loadBills = async () => {
        setLoading(true);
        const data = await getBills(searchQuery, selectedPaymentMode);
        setBills(data);
        setLoading(false);
    };

    useEffect(() => {
        loadBills();
    }, [searchQuery, selectedPaymentMode]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError('Please enter a valid positive bill amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createBill({
                customerName,
                vehicleNumber,
                vehicleModel,
                service,
                amount: parsedAmount,
                paymentMode,
            });

            if (!res.success) {
                setFormError(res.error || 'Failed to create bill.');
            } else {
                setIsModalOpen(false);
                setCustomerName('');
                setVehicleNumber('');
                setVehicleModel('');
                setService('');
                setAmount('');
                setPaymentMode('CASH');
                loadBills();
            }
        } catch (err) {
            setFormError('An error occurred while creating the bill.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPaymentBadge = (mode: string) => {
        switch (mode) {
            case 'UPI':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'CARD':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'BANK_TRANSFER':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'CASH':
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                        <FileText className="w-7 h-7 text-[#143d30]" /> Customer Invoices & Billing
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Record service invoices, issue receipts, and track daily car spa revenue.</p>
                </div>

                <button
                    onClick={() => {
                        setIsModalOpen(true);
                        setFormError(null);
                    }}
                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_8px_20px_rgba(20,61,48,0.15)] flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Create New Bill
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[4px_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by customer, vehicle no, bill no..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 placeholder-gray-400"
                    />
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Payment Mode:</label>
                    <select
                        value={selectedPaymentMode}
                        onChange={(e) => setSelectedPaymentMode(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 w-full sm:w-44"
                    >
                        <option value="ALL">All Payment Modes</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Sl No / Bill No</th>
                                <th className="p-5">Customer Name</th>
                                <th className="p-5">Vehicle No</th>
                                <th className="p-5">Vehicle Model</th>
                                <th className="p-5">Service</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Payment Mode</th>
                                <th className="p-5">Date</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">Loading bills...</td>
                                </tr>
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-400">
                                        No billing records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 font-bold font-mono text-[#143d30]">
                                            {bill.billNumber}
                                        </td>
                                        <td className="p-5 font-semibold text-gray-900">
                                            {bill.customerName}
                                        </td>
                                        <td className="p-5 font-mono uppercase text-gray-700 bg-gray-50/80 px-2.5 py-1 rounded-md border border-gray-200/60 inline-block my-3">
                                            {bill.vehicleNumber}
                                        </td>
                                        <td className="p-5 text-gray-700 font-medium">
                                            {bill.vehicleModel}
                                        </td>
                                        <td className="p-5 text-gray-600 max-w-xs truncate">
                                            {bill.service}
                                        </td>
                                        <td className="p-5 font-bold text-gray-900 font-mono">
                                            ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${getPaymentBadge(bill.paymentMode)}`}>
                                                {bill.paymentMode.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-5 text-xs text-gray-500 font-medium">
                                            {new Date(bill.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="p-5 text-right">
                                            <Link
                                                href={`/billing/${bill.id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143d30] hover:text-[#1a4f3f] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                                            >
                                                <Printer className="w-3.5 h-3.5" /> View Receipt
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Bill Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-[0_24px_80px_rgba(0,0,0,0.12)] animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Service Bill</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Generate a new customer service invoice.</p>
                            </div>
                        </div>

                        {formError && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        placeholder="e.g. KL-01-CB-4567"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Model *</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehicleModel}
                                        onChange={(e) => setVehicleModel(e.target.value)}
                                        placeholder="e.g. Mahindra Thar"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Mode *</label>
                                    <select
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Service Rendered *</label>
                                <input
                                    type="text"
                                    required
                                    value={service}
                                    onChange={(e) => setService(e.target.value)}
                                    placeholder="e.g. Full Body Foam Wash + Interior Polish"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bill Amount (₹) *</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g. 1500"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono text-base font-semibold"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_4px_12px_rgba(20,61,48,0.2)] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Save Bill</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
