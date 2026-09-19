'use client';

import { useState, useEffect } from 'react';
import { getMonthlySalaryReport } from '@/app/actions/salary';
import Link from 'next/link';

export default function SalaryPage() {
    // Default to current month (YYYY-MM format)
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Final Salary Calculation</h1>
                    <p className="text-sm text-gray-500 mt-1">Automated monthly payroll sheet based on attendance, late deductions, and advance balance carryforward.</p>
                </div>

                <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Select Month</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 shadow-sm font-mono"
                    />
                </div>
            </div>

            {/* Salary Ledger Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Employee</th>
                                <th className="p-5">Daily Salary</th>
                                <th className="p-5">Attendance & Base Pay</th>
                                <th className="p-5">Overtime Pay</th>
                                <th className="p-5 text-amber-700">Late Deductions</th>
                                <th className="p-5 text-rose-700">Advance Balance & Deductions</th>
                                <th className="p-5 text-right text-[#143d30]">Net Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Calculating payroll...</td>
                                </tr>
                            ) : report.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">No active staff found for this month.</td>
                                </tr>
                            ) : (
                                report.map(({ employee, stats }) => (
                                    <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5">
                                            <Link href={`/employees/${employee.id}`} className="font-semibold text-gray-900 hover:text-[#143d30] hover:underline">
                                                {employee.name}
                                            </Link>
                                            <div className="text-xs text-gray-500 mt-0.5">{employee.position}</div>
                                        </td>
                                        <td className="p-5 font-medium text-gray-600">₹{employee.dailySalary}</td>
                                        <td className="p-5">
                                            <div className="font-medium text-gray-900">{stats.daysPresent} Full / {stats.halfDays} Half</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Base: ₹{stats.basePay.toFixed(2)}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-medium text-gray-900">{stats.totalOvertimeHours} Hrs</div>
                                            <div className="text-xs text-gray-500 mt-0.5">₹{stats.overtimePay.toFixed(2)}</div>
                                        </td>
                                        <td className="p-5">
                                            {stats.lateDeductions > 0 ? (
                                                <span className="font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-xs">
                                                    - ₹{stats.lateDeductions.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">₹0.00</span>
                                            )}
                                        </td>
                                        <td className="p-5 space-y-0.5 text-xs">
                                            <div><span className="text-gray-500">Prior Balance:</span> <span className="font-semibold">₹{stats.advanceBalanceBefore.toFixed(2)}</span></div>
                                            <div><span className="text-gray-500">Deducted Now:</span> <span className="font-semibold text-rose-600">- ₹{stats.totalAdvancesDeducted.toFixed(2)}</span></div>
                                            <div><span className="text-gray-500">Remaining Balance:</span> <span className="font-semibold text-amber-700">₹{stats.advanceBalanceAfter.toFixed(2)}</span></div>
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