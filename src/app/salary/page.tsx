'use client';

import { useState, useEffect } from 'react';
import { getMonthlySalaryReport } from '@/app/actions/salary';
import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';

export default function SalaryPage() {
    // Default to current month (YYYY-MM format)
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            const data = await getMonthlySalaryReport(selectedMonth);
            setReport(data);
            setLoading(false);
        };
        loadReport();
    }, [selectedMonth]);

    return (
        <div className="space-y-8">

            {/* Header & Month Selector */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Final Salary Calculation</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 print:hidden">Automated monthly payroll sheet based on attendance and advances.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full sm:w-auto print:hidden">
                    <div className="flex flex-col w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Select Month</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="w-full sm:w-auto justify-center bg-[#143d30] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a4f3f] transition-colors flex items-center gap-2 h-[42px]"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>

            {/* Salary Ledger Table */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Employee</th>
                                <th className="p-5">Daily Rate</th>
                                <th className="p-5">Present / Half Days</th>
                                <th className="p-5 text-emerald-600">Overtime Pay</th>
                                <th className="p-5 text-rose-600">Advances & Fines</th>
                                <th className="p-5 text-right text-[#143d30]">Net Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Calculating payroll...</td>
                                </tr>
                            ) : report.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No active staff found for this month.</td>
                                </tr>
                            ) : (
                                report.map(({ employee, stats }) => (
                                    <tr 
                                        key={employee.id}
                                        onClick={() => router.push(`/salary/${employee.id}?month=${selectedMonth}`)}
                                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-5">
                                            <div className="font-semibold text-gray-900 group-hover:text-[#143d30] transition-colors">{employee.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{employee.position}</div>
                                        </td>
                                        <td className="p-5 font-medium text-gray-600">₹{employee.dailySalary}</td>
                                        <td className="p-5">
                                            <div className="font-medium text-gray-900">{stats.daysPresent} Full / {stats.halfDays} Half</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Base: ₹{stats.basePay.toFixed(2)}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-medium text-emerald-600">₹{stats.totalOvertimePay.toFixed(2)}</div>
                                        </td>
                                        <td className="p-5 text-rose-600 font-medium">
                                            <div className="text-sm">- ₹{stats.totalDeductions.toFixed(2)}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">Adv: ₹{stats.totalAdvances} | Late: ₹{stats.totalLateDeductions}</div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <span className="inline-flex items-center justify-center bg-[#E2F898]/40 text-[#143d30] px-3 py-1.5 rounded-lg text-base font-bold border border-[#E2F898]">
                                                ₹{stats.netPay.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}