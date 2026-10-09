'use client';

import { useState, useEffect } from 'react';
import { getWeeklyAttendanceReport } from '@/app/actions/attendance-list';
import { Search, ChevronLeft, ChevronRight, Printer, Calendar } from 'lucide-react';

export default function AttendanceListPage() {
    // Default to the current week's Monday
    const getMonday = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
    
    // Derive weekStart dynamically from the selected date string
    const weekStart = getMonday(new Date(selectedDateStr));
    
    const [report, setReport] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const getWeekDays = (start: Date) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            days.push(current.toISOString().split('T')[0]);
        }
        return days;
    };

    const weekDays = getWeekDays(weekStart);

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            const data = await getWeeklyAttendanceReport(weekDays[0], weekDays[6]);
            setReport(data);
            setLoading(false);
        };
        loadReport();
    }, [weekStart.toISOString().split('T')[0]]); // Refetch only when the derived Monday changes

    const handlePrevWeek = () => {
        const current = new Date(selectedDateStr);
        current.setDate(current.getDate() - 7);
        setSelectedDateStr(current.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const current = new Date(selectedDateStr);
        current.setDate(current.getDate() + 7);
        setSelectedDateStr(current.toISOString().split('T')[0]);
    };

    const filteredReport = report.filter(({ employee }) =>
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.position.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusIndicator = (status: string, isLate: boolean) => {
        if (status === 'PRESENT' && !isLate) return <span className="text-green-600 font-bold">P</span>;
        if (status === 'PRESENT' && isLate) return <span className="text-amber-500 font-bold">L</span>;
        if (status === 'HALF_DAY') return <span className="text-orange-500 font-bold">HD</span>;
        if (status === 'ABSENT') return <span className="text-red-500 font-bold">A</span>;
        return <span className="text-gray-300">-</span>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Attendance List</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 print:hidden">Weekly log sheet of all employee attendance.</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                    <button onClick={handlePrevWeek} className="print:hidden p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all" aria-label="Previous week">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <input
                        type="date"
                        className="text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 print:hidden cursor-pointer flex-1 sm:flex-initial"
                        value={selectedDateStr}
                        onChange={(e) => {
                            if (e.target.value) {
                                setSelectedDateStr(e.target.value);
                            }
                        }}
                    />
                    <div className="hidden print:block text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                        {weekDays[0].split('-').reverse().join('-')} - {weekDays[6].split('-').reverse().join('-')}
                    </div>
                    <button onClick={handleNextWeek} className="print:hidden p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all" aria-label="Next week">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-200 p-2 rounded-xl shadow-sm print:hidden">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                    />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <button 
                    onClick={() => window.print()}
                    className="w-full sm:w-auto justify-center bg-[#143d30] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a4f3f] transition-colors flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" /> Print
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Employee</th>
                                {weekDays.map(dateStr => {
                                    const date = new Date(dateStr);
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                    const dayNum = date.getDate();
                                    return (
                                        <th key={dateStr} className="p-5 text-center border-l border-gray-100">
                                            <div className="text-gray-900">{dayName}</div>
                                            <div className="text-gray-400 text-[10px] mt-0.5">{dayNum}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading attendance...</td></tr>
                            ) : filteredReport.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No active staff found.</td></tr>
                            ) : (
                                filteredReport.map(({ employee, records }) => (
                                    <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5">
                                            <div className="font-semibold text-gray-900">{employee.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{employee.position}</div>
                                        </td>
                                        {weekDays.map(dateStr => {
                                            const record = records.find((r: any) => r.date === dateStr);
                                            return (
                                                <td key={dateStr} className="p-5 text-center border-l border-gray-100">
                                                    {record ? (
                                                        <div className="flex flex-col items-center justify-center gap-1 cursor-default" title={record.notes || undefined}>
                                                            {getStatusIndicator(record.status, record.isLate)}
                                                            {record.overtimePay > 0 && <span className="text-[10px] text-emerald-600 font-medium">OT: ₹{record.overtimePay}</span>}
                                                            {record.lateDeduction > 0 && <span className="text-[10px] text-red-500 font-medium">Fine: ₹{record.lateDeduction}</span>}
                                                            {record.advanceAmount > 0 && <span className="text-[10px] text-amber-600 font-medium">Adv: ₹{record.advanceAmount}</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex gap-4 text-xs text-gray-500 items-center pl-2">
                <strong>Legend:</strong>
                <span className="flex items-center gap-1"><span className="text-green-600 font-bold">P</span> Present</span>
                <span className="flex items-center gap-1"><span className="text-amber-500 font-bold">L</span> Late</span>
                <span className="flex items-center gap-1"><span className="text-orange-500 font-bold">HD</span> Half Day</span>
                <span className="flex items-center gap-1"><span className="text-red-500 font-bold">A</span> Absent</span>
            </div>
        </div>
    );
}
