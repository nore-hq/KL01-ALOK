'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordSalaryAdvance } from '@/app/actions/attendance';
import { Plus, Banknote, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface AdvanceItem {
    id: string;
    amount: number;
    datePaid: string;
    notes?: string | null;
    amountDeducted: number;
    remainingAmount: number;
}

interface AdvanceSectionProps {
    employeeId: string;
    employeeName: string;
    advanceDetails: {
        totalAdvanceTaken: number;
        totalAdvanceDeducted: number;
        remainingAdvance: number;
        advances: AdvanceItem[];
    };
}

export default function AdvanceSection({ employeeId, employeeName, advanceDetails }: AdvanceSectionProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [datePaid, setDatePaid] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Advance amount must be greater than ₹0.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await recordSalaryAdvance({
                employeeId,
                amount: parsedAmount,
                datePaid,
                notes: notes || undefined,
            });

            if (!res.success) {
                setError(res.error || 'Failed to record advance payment.');
            } else {
                setIsModalOpen(false);
                setAmount('');
                setNotes('');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred while adding the advance.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Section Header & Action */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-[#143d30]" /> Salary Advances Ledger
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Track cash advances, payroll deductions, and outstanding balances.</p>
                </div>

                <button
                    onClick={() => {
                        setIsModalOpen(true);
                        setError(null);
                    }}
                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(20,61,48,0.15)] flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Grant Advance
                </button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Advance Taken</div>
                    <div className="text-2xl font-bold text-gray-900 font-mono">₹{advanceDetails.totalAdvanceTaken.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400 mt-1">Cumulative advances issued</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Already Deducted</div>
                    <div className="text-2xl font-bold text-rose-600 font-mono">₹{advanceDetails.totalAdvanceDeducted.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400 mt-1">Deducted from past payrolls</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Remaining Outstanding</div>
                    <div className="text-2xl font-bold text-amber-700 font-mono">₹{advanceDetails.remainingAdvance.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400 mt-1">Carried forward to next salary</div>
                </div>
            </div>

            {/* Advances Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-900">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4">Date Issued</th>
                                <th className="p-4">Original Amount</th>
                                <th className="p-4 text-rose-600">Amount Deducted</th>
                                <th className="p-4 text-amber-700">Remaining Amount</th>
                                <th className="p-4">Notes</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {advanceDetails.advances.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                                        No advance payments recorded for this employee yet.
                                    </td>
                                </tr>
                            ) : (
                                advanceDetails.advances.map((adv) => {
                                    const isFullySettled = adv.remainingAmount === 0;
                                    return (
                                        <tr key={adv.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900">{adv.datePaid}</td>
                                            <td className="p-4 font-semibold text-gray-900 font-mono">₹{adv.amount.toLocaleString()}</td>
                                            <td className="p-4 font-medium text-rose-600 font-mono">- ₹{adv.amountDeducted.toLocaleString()}</td>
                                            <td className="p-4 font-semibold text-amber-700 font-mono">₹{adv.remainingAmount.toLocaleString()}</td>
                                            <td className="p-4 text-gray-600 text-xs">{adv.notes || '—'}</td>
                                            <td className="p-4 text-right">
                                                {isFullySettled ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Fully Deducted
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5" /> Active Outstanding
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grant Advance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_80px_rgba(0,0,0,0.12)] animate-scale-in">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Grant Salary Advance</h2>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Issue cash advance to <span className="font-semibold text-gray-900">{employeeName}</span>.
                        </p>

                        {error && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Advance Amount (₹)</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Date</label>
                                <input
                                    type="date"
                                    required
                                    value={datePaid}
                                    onChange={(e) => setDatePaid(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Festival advance"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-[0_4px_12px_rgba(20,61,48,0.2)] disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Confirm Advance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
