'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployeeSalaryDetails } from '@/app/actions/salary';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeSalaryDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ month: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const resolvedSearchParams = use(searchParams);
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const monthPrefix = resolvedSearchParams.month || new Date().toISOString().slice(0, 7);
    const displayMonth = new Date(monthPrefix + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    
    useEffect(() => {
        const load = async () => {
            const result = await getEmployeeSalaryDetails(resolvedParams.id, monthPrefix);
            setData(result);
            setLoading(false);
        };
        load();
    }, [resolvedParams.id, monthPrefix]);

    if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading detailed payroll data...</div>;
    if (!data) return <div className="p-12 text-center text-gray-500">No data found for this employee.</div>;

    const { employee, stats, attendance, advances } = data;

    const logMap: Record<string, any> = {};
    attendance.forEach((a: any) => {
        if (!logMap[a.date]) logMap[a.date] = { date: a.date, attendance: null, advance: 0 };
        logMap[a.date].attendance = a;
    });
    advances.forEach((a: any) => {
        if (!logMap[a.datePaid]) logMap[a.datePaid] = { date: a.datePaid, attendance: null, advance: 0 };
        logMap[a.datePaid].advance += a.amount;
    });
    const dailyLogs = Object.values(logMap).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return (
        <div className="space-y-6">
            <Link href="/salary" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143d30] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Payroll
            </Link>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{employee.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">{employee.position} &bull; ID: #{employee.id} &bull; Rate: ₹{employee.dailySalary}/day</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">{displayMonth} Net Pay</div>
                        <div className="text-4xl font-black text-[#143d30] mt-1">₹{stats.netPay.toFixed(2)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Base Pay</div>
                        <div className="text-xl font-bold text-gray-900 mt-1">₹{stats.basePay.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-1">{stats.daysPresent} Full, {stats.halfDays} Half</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-emerald-600 uppercase">Overtime (OT)</div>
                        <div className="text-xl font-bold text-emerald-700 mt-1">+ ₹{stats.totalOvertimePay.toFixed(2)}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-amber-600 uppercase">Late Fines</div>
                        <div className="text-xl font-bold text-amber-700 mt-1">- ₹{stats.totalLateDeductions.toFixed(2)}</div>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-rose-600 uppercase">Cash Advances</div>
                        <div className="text-xl font-bold text-rose-700 mt-1">- ₹{stats.totalAdvances.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Day-by-Day Detailed Log</h2>
                </div>
                
                {dailyLogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No attendance or advance records found for this month.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {dailyLogs.map((log: any, idx) => (
                            <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="font-semibold text-gray-700 w-32 shrink-0">
                                    {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                
                                <div className="flex-1 flex flex-wrap gap-x-6 gap-y-2 items-center">
                                    {log.attendance ? (
                                        <>
                                            <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${log.attendance.status === 'PRESENT' ? 'text-emerald-600' : log.attendance.status === 'HALF_DAY' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {log.attendance.status === 'PRESENT' && <CheckCircle className="w-4 h-4" />}
                                                {log.attendance.status === 'HALF_DAY' && <Clock className="w-4 h-4" />}
                                                {log.attendance.status === 'ABSENT' && <XCircle className="w-4 h-4" />}
                                                {log.attendance.status.replace('_', ' ')}
                                            </span>
                                            
                                            {log.attendance.overtimePay > 0 && (
                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                                    OT: +₹{log.attendance.overtimePay}
                                                </span>
                                            )}
                                            
                                            {log.attendance.lateDeduction > 0 && (
                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                                                    Late Fine: -₹{log.attendance.lateDeduction}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-gray-400 italic text-sm">No attendance marked</span>
                                    )}
                                </div>
                                
                                <div className="sm:text-right shrink-0">
                                    {log.advance > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                            Advance: -₹{log.advance}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
