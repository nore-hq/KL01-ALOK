'use client';

import { useState, useEffect } from 'react';
import { getDailyAttendance, saveAttendanceRecord, recordSalaryAdvance } from '@/app/actions/attendance';
import { Check, Plus, Search } from 'lucide-react';

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // New state to track unsubmitted changes locally
    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);



    const loadData = async () => {
        const data = await getDailyAttendance(selectedDate);
        setRecords(data);
        setPendingChanges({}); // Clear any unsaved changes when changing dates
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    // Helper to merge database state with local unsaved state
    const getAttendanceState = (employeeId: string, dbAttendance: any) => {
        return pendingChanges[employeeId] || dbAttendance || { status: 'UNMARKED', isLate: false, lateDeduction: 0, overtimePay: 0 };
    };

    const handleLocalChange = (employeeId: string, field: string, value: any, dbAttendance: any) => {
        setPendingChanges((prev) => {
            const currentState = getAttendanceState(employeeId, dbAttendance);
            let updatedState = { ...currentState, [field]: value };
            
            // If setting back to On Time, clear the late deduction
            if (field === 'isLate' && value === false) {
                updatedState.lateDeduction = 0;
            }

            return {
                ...prev,
                [employeeId]: updatedState
            };
        });
    };

    // Master Submit Function
    const handleEndOfDaySubmit = async () => {
        if (Object.keys(pendingChanges).length === 0) return;

        setIsSubmitting(true);
        try {
            const promises = Object.entries(pendingChanges).map(async ([employeeId, data]: [string, any]) => {
                const calls = [];
                
                // If they entered an advance amount for today, record it
                if (data.advanceAmount > 0) {
                    calls.push(recordSalaryAdvance({
                        employeeId,
                        amount: data.advanceAmount,
                        datePaid: selectedDate
                    }));
                }

                // If it's not just an empty unmarked status, record attendance
                if (!(data.status === 'UNMARKED' && !data.overtimePay && !data.lateDeduction)) {
                    const finalStatus = data.status === 'UNMARKED' ? 'PRESENT' : data.status;
                    calls.push(saveAttendanceRecord({
                        employeeId,
                        date: selectedDate,
                        ...data,
                        status: finalStatus
                    }));
                }
                
                return Promise.all(calls);
            });

            // Execute all updates concurrently
            await Promise.all(promises);
            await loadData();
        } catch (error) {
            console.error("Failed to save attendance:", error);
            alert("Failed to save some records. Please check the console.");
        } finally {
            setIsSubmitting(false);
            setPendingChanges({});
        }
    };


    const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

    const filteredRecords = records.filter(({ employee }) =>
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.id.toLowerCase().includes(search.toLowerCase()) ||
        employee.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header & Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1">Mark daily present status, late arrivals, overtime, and advances.</p>
                </div>

                <div className="flex items-end gap-4">
                    <div className="flex flex-col">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 shadow-sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleEndOfDaySubmit}
                        disabled={!hasUnsavedChanges || isSubmitting}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_8px_20px_rgba(20,61,48,0.15)] flex items-center gap-2 ${hasUnsavedChanges && !isSubmitting
                                ? 'bg-[#143d30] hover:bg-[#1a4f3f] text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Submit End of Day</>}
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 p-2 rounded-xl shadow-[2px_2px_16px_rgba(0,0,0,0.01)]">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search staff by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                    />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pr-4">
                    {filteredRecords.length} Records
                </div>
            </div>

            {/* Attendance Matrix Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-900">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Staff Name</th>
                                <th className="p-5">Daily Rate</th>
                                <th className="p-5 min-w-[240px]">Attendance Status</th>
                                <th className="p-5">Punctuality</th>
                                <th className="p-5">Overtime Pay (₹)</th>
                                <th className="p-5">Advance Cash</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No staff found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map(({ employee, attendance, advancePaidToday }) => {
                                    // Use local state if it exists, otherwise use DB state
                                    const currentState = getAttendanceState(employee.id, attendance);
                                    const { status, isLate, lateDeduction, overtimePay } = currentState;

                                    return (
                                        <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-5 align-top">
                                                <div className="font-semibold text-gray-900">
                                                    {employee.name} <span className="text-gray-400 font-normal text-xs ml-1">#{employee.id}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">{employee.position}</div>
                                                {attendance?.timestamp && (
                                                    <div className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1" title={new Date(attendance.timestamp).toLocaleString()}>
                                                        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Saved {new Date(attendance.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5 font-medium text-gray-600 align-top">₹{employee.dailyRate}</td>
                                            <td className="p-5 align-top">
                                                <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg w-max border border-gray-200/50">
                                                    <button
                                                        onClick={() => handleLocalChange(employee.id, 'status', 'PRESENT', attendance)}
                                                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'PRESENT' ? 'bg-[#143d30] text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleLocalChange(employee.id, 'status', 'HALF_DAY', attendance)}
                                                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'HALF_DAY' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                    >
                                                        Half Day
                                                    </button>
                                                    <button
                                                        onClick={() => handleLocalChange(employee.id, 'status', 'ABSENT', attendance)}
                                                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'ABSENT' ? 'bg-rose-500 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg w-max border border-gray-200/50">
                                                        <button
                                                            onClick={() => handleLocalChange(employee.id, 'isLate', false, attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${!isLate ? 'bg-[#143d30] text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            On Time
                                                        </button>
                                                        <button
                                                            onClick={() => handleLocalChange(employee.id, 'isLate', true, attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${isLate ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            Late
                                                        </button>
                                                    </div>
                                                    {isLate && (
                                                        <div className="flex items-center gap-1.5 animate-fade-in mt-1">
                                                            <span className="text-xs text-gray-400 font-medium">₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                placeholder="Deduction"
                                                                value={lateDeduction || ''}
                                                                onChange={(e) => handleLocalChange(employee.id, 'lateDeduction', parseFloat(e.target.value) || 0, attendance)}
                                                                className="w-24 bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-400 font-medium">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={overtimePay || ''}
                                                        onChange={(e) => handleLocalChange(employee.id, 'overtimePay', parseFloat(e.target.value) || 0, attendance)}
                                                        className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                {advancePaidToday > 0 ? (
                                                    <span className="inline-flex items-center gap-1 bg-[#E2F898]/30 text-[#143d30] px-2.5 py-1 rounded-md text-xs font-bold border border-[#E2F898]">
                                                        ₹{advancePaidToday}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right align-top">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className="text-xs text-gray-400 font-medium">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        placeholder="Amount"
                                                        value={currentState.advanceAmount || ''}
                                                        onChange={(e) => handleLocalChange(employee.id, 'advanceAmount', parseFloat(e.target.value) || 0, attendance)}
                                                        className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                                    />
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