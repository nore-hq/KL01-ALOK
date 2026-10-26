'use client';

import { useState, useEffect } from 'react';
import { getDailyAttendance, saveAttendanceRecord, recordSalaryAdvance, updateSalaryAdvance, deleteSalaryAdvance } from '@/app/actions/attendance';
import { Check, Plus, Search, Pencil, Trash2, X, Loader2 } from 'lucide-react';

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // State for inline advance editing
    const [editingAdvanceEmpId, setEditingAdvanceEmpId] = useState<string | null>(null);
    const [editAdvanceAmount, setEditAdvanceAmount] = useState<string>('');
    const [isUpdatingAdvance, setIsUpdatingAdvance] = useState(false);

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

    const handleSaveAdvance = async (employeeId: string) => {
        const parsed = parseFloat(editAdvanceAmount);
        if (isNaN(parsed) || parsed < 0) {
            alert('Please enter a valid amount (0 or higher).');
            return;
        }

        setIsUpdatingAdvance(true);
        try {
            const res = await updateSalaryAdvance({
                employeeId,
                datePaid: selectedDate,
                newAmount: parsed,
            });

            if (res.success) {
                setRecords((prev) =>
                    prev.map((r) =>
                        r.employee.id === employeeId
                            ? { ...r, advancePaidToday: parsed }
                            : r
                    )
                );
                setPendingChanges((prev) => {
                    const copy = { ...prev };
                    if (copy[employeeId]) {
                        const { advanceAmount, ...rest } = copy[employeeId];
                        copy[employeeId] = rest;
                    }
                    return copy;
                });
                setEditingAdvanceEmpId(null);
            } else {
                alert(res.error || 'Failed to update advance.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update advance.');
        } finally {
            setIsUpdatingAdvance(false);
        }
    };

    const handleDeleteAdvance = async (employeeId: string, employeeName: string) => {
        if (!confirm(`Are you sure you want to delete the advance record for ${employeeName}?`)) {
            return;
        }

        setIsUpdatingAdvance(true);
        try {
            const res = await deleteSalaryAdvance({
                employeeId,
                datePaid: selectedDate,
            });

            if (res.success) {
                setRecords((prev) =>
                    prev.map((r) =>
                        r.employee.id === employeeId
                            ? { ...r, advancePaidToday: 0 }
                            : r
                    )
                );
                setPendingChanges((prev) => {
                    const copy = { ...prev };
                    if (copy[employeeId]) {
                        const { advanceAmount, ...rest } = copy[employeeId];
                        copy[employeeId] = rest;
                    }
                    return copy;
                });
                setEditingAdvanceEmpId(null);
            } else {
                alert(res.error || 'Failed to delete advance.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete advance.');
        } finally {
            setIsUpdatingAdvance(false);
        }
    };

    // Helper to merge database state with local unsaved state
    const getAttendanceState = (employeeId: string, dbAttendance: any) => {
        return pendingChanges[employeeId] || dbAttendance || { status: 'UNMARKED', isLate: false, lateDeduction: 0, overtimePay: 0, notes: '' };
    };

    const handleLocalChange = (employeeId: string, field: string, value: any, dbAttendance: any) => {
        setPendingChanges((prev) => {
            const currentState = getAttendanceState(employeeId, dbAttendance);
            let updatedState = { ...currentState, [field]: value };
            
            // If setting back to On Time, clear the late deduction
            if (field === 'isLate' && value === false) {
                updatedState.lateDeduction = 0;
            }

            // If setting status to WEEK_OFF or ABSENT, clear late and overtime
            if (field === 'status' && (value === 'WEEK_OFF' || value === 'ABSENT')) {
                updatedState.isLate = false;
                updatedState.lateDeduction = 0;
                updatedState.overtimePay = 0;
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

                // If any attendance state was modified, or if an attendance record already existed
                const shouldSaveAttendance = 
                    (data.status && data.status !== 'UNMARKED') || 
                    data.isLate || 
                    (data.lateDeduction && data.lateDeduction > 0) || 
                    (data.overtimePay && data.overtimePay > 0) ||
                    data.notes !== undefined;

                if (shouldSaveAttendance) {
                    const finalStatus = (!data.status || data.status === 'UNMARKED') ? 'PRESENT' : data.status;
                    const existingRecord = records.find(r => r.employee.id === employeeId)?.attendance;
                    const finalNotes = data.notes !== undefined ? data.notes : (existingRecord?.notes || '');

                    calls.push(saveAttendanceRecord({
                        employeeId,
                        date: selectedDate,
                        status: finalStatus,
                        isLate: !!data.isLate,
                        lateDeduction: Number(data.lateDeduction) || 0,
                        overtimePay: Number(data.overtimePay) || 0,
                        notes: finalNotes || '',
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

    const summaryStats = records.reduce((acc, curr) => {
        const state = getAttendanceState(curr.employee.id, curr.attendance);
        if (state.status === 'PRESENT') acc.present++;
        else if (state.status === 'HALF_DAY') acc.halfDay++;
        else if (state.status === 'WEEK_OFF') acc.weekOff++;
        else if (state.status === 'ABSENT') acc.absent++;

        acc.overtime += (Number(state.overtimePay) || 0);
        acc.lateDues += (Number(state.lateDeduction) || 0);
        acc.advances += (Number(curr.advancePaidToday) || 0) + (Number(state.advanceAmount) || 0);
        return acc;
    }, { present: 0, halfDay: 0, weekOff: 0, absent: 0, overtime: 0, lateDues: 0, advances: 0 });

    const filteredRecords = records.filter(({ employee }) =>
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.id.toLowerCase().includes(search.toLowerCase()) ||
        employee.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header & Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Attendance</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Mark daily present status, late arrivals, overtime, and advances.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full sm:w-auto">
                    <div className="flex flex-col w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 shadow-sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleEndOfDaySubmit}
                        disabled={!hasUnsavedChanges || isSubmitting}
                        className={`w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_8px_20px_rgba(20,61,48,0.15)] flex items-center gap-2 ${hasUnsavedChanges && !isSubmitting
                                ? 'bg-[#143d30] hover:bg-[#1a4f3f] text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {isSubmitting ? 'Saving...' : <><Check className="w-4 h-4" /> Submit End of Day</>}
                    </button>
                </div>
            </div>

            {/* Daily KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance Status</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                        {summaryStats.present} Present {summaryStats.halfDay > 0 && <span className="text-sm font-medium text-amber-600">• {summaryStats.halfDay} Half</span>} {summaryStats.weekOff > 0 && <span className="text-sm font-medium text-indigo-600">• {summaryStats.weekOff} Off</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{records.length} Total Staff</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Today's Overtime</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">₹{summaryStats.overtime.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Payable Addition</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Today's Late Dues / Fines</div>
                    <div className="text-lg sm:text-xl font-bold text-amber-700 mt-1">₹{summaryStats.lateDues.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Deduction Applied</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Today's Advances</div>
                    <div className="text-lg sm:text-xl font-bold text-rose-700 mt-1">₹{summaryStats.advances.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Cash Disbursed</div>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
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
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pr-2 shrink-0">
                    {filteredRecords.length} Records
                </div>
            </div>

            {/* Attendance Matrix Table */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <table className="w-full text-left text-sm text-gray-900 whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-5">Staff Name</th>
                                <th className="p-5">Daily Rate</th>
                                <th className="p-5 min-w-[320px]">Attendance Status</th>
                                <th className="p-5">Punctuality & Late Dues</th>
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
                                    const { status, isLate, lateDeduction, overtimePay, notes } = currentState;

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
                                            <td className="p-5 font-medium text-gray-600 align-top">₹{employee.dailySalary}</td>
                                            <td className="p-5 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-lg w-max border border-gray-200/50">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLocalChange(employee.id, 'status', 'PRESENT', attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'PRESENT' ? 'bg-[#143d30] text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLocalChange(employee.id, 'status', 'HALF_DAY', attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'HALF_DAY' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            Half Day
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLocalChange(employee.id, 'status', 'ABSENT', attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'ABSENT' ? 'bg-rose-500 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            Absent
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLocalChange(employee.id, 'status', 'WEEK_OFF', attendance)}
                                                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${status === 'WEEK_OFF' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                                        >
                                                            Week Off
                                                        </button>
                                                    </div>

                                                    {status === 'WEEK_OFF' && (
                                                        <div className="flex items-center gap-1.5 animate-fade-in">
                                                            <input
                                                                type="text"
                                                                placeholder="Reason (e.g. Christmas, Sunday, Holiday...)"
                                                                value={notes !== undefined ? notes : (attendance?.notes || '')}
                                                                onChange={(e) => handleLocalChange(employee.id, 'notes', e.target.value, attendance)}
                                                                className="w-60 bg-white border border-indigo-200 focus:border-indigo-600 rounded-lg px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-sm placeholder:text-gray-400 font-medium"
                                                            />
                                                        </div>
                                                    )}
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
                                                    {lateDeduction > 0 && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                Fine: -₹{lateDeduction}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-400 font-medium">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            placeholder="0"
                                                            value={overtimePay || ''}
                                                            onChange={(e) => handleLocalChange(employee.id, 'overtimePay', parseFloat(e.target.value) || 0, attendance)}
                                                            className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                                        />
                                                    </div>
                                                    {overtimePay > 0 && (
                                                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-max">
                                                            OT: +₹{overtimePay}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                {editingAdvanceEmpId === employee.id ? (
                                                    <div className="flex items-center gap-1.5 animate-fade-in">
                                                        <span className="text-xs text-gray-400 font-medium">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            autoFocus
                                                            placeholder="0"
                                                            value={editAdvanceAmount}
                                                            onChange={(e) => setEditAdvanceAmount(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveAdvance(employee.id);
                                                                if (e.key === 'Escape') setEditingAdvanceEmpId(null);
                                                            }}
                                                            className="w-20 bg-white border-2 border-[#143d30] rounded-lg px-2 py-1 text-xs text-gray-900 font-bold focus:outline-none shadow-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            title="Save Advance"
                                                            disabled={isUpdatingAdvance}
                                                            onClick={() => handleSaveAdvance(employee.id)}
                                                            className="p-1.5 rounded-lg bg-[#143d30] text-white hover:bg-[#1a4f3f] disabled:opacity-50 transition-colors shadow-sm"
                                                        >
                                                            {isUpdatingAdvance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Cancel"
                                                            disabled={isUpdatingAdvance}
                                                            onClick={() => setEditingAdvanceEmpId(null)}
                                                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {advancePaidToday > 0 ? (
                                                            <div className="inline-flex items-center gap-1.5 bg-[#E2F898]/40 border border-[#b2d952] pl-2.5 pr-1.5 py-1 rounded-lg">
                                                                <span className="text-xs font-bold text-[#143d30]">
                                                                    ₹{advancePaidToday}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    title="Edit Advance Amount"
                                                                    onClick={() => {
                                                                        setEditingAdvanceEmpId(employee.id);
                                                                        setEditAdvanceAmount(String(advancePaidToday));
                                                                    }}
                                                                    className="p-1 text-gray-600 hover:text-[#143d30] hover:bg-white/80 rounded transition-colors"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Delete Advance"
                                                                    onClick={() => handleDeleteAdvance(employee.id, employee.name)}
                                                                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <span>—</span>
                                                                <button
                                                                    type="button"
                                                                    title="Add Advance"
                                                                    onClick={() => {
                                                                        setEditingAdvanceEmpId(employee.id);
                                                                        setEditAdvanceAmount('');
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-[#143d30] hover:bg-gray-100 rounded transition-colors"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5 text-right align-top">
                                                {advancePaidToday > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingAdvanceEmpId(employee.id);
                                                            setEditAdvanceAmount(String(advancePaidToday));
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#143d30] bg-gray-100 hover:bg-[#E2F898]/40 border border-gray-200 hover:border-[#143d30]/30 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="w-3 h-3" /> Edit Advance
                                                    </button>
                                                ) : (
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


        </div>
    );
}