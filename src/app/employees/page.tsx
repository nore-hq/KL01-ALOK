'use client';

import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, removeEmployee } from '@/app/actions/employees';
import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    age: number;
    phone: string;
    position: string;
    dailySalary: number;
    status: string;
}

export default function EmployeesPage() {
    const [staff, setStaff] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadStaff = async () => {
        const data = await getEmployees();
        setStaff(data as Employee[]);
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = await createEmployee(formData);
        setLoading(false);

        if (res.success) {
            setIsOpen(false);
            loadStaff();
        } else {
            alert(res.error || 'Failed to register employee');
        }
    };

    const handleRemove = async (id: string) => {
        if (confirm('Deactivate this staff member?')) {
            await removeEmployee(id);
            loadStaff();
        }
    };

    const filteredStaff = staff.filter(
        (emp) =>
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Roster</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage employee profiles and daily compensation.</p>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_8px_20px_rgba(20,61,48,0.2)] flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Staff
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 p-2 rounded-xl shadow-[2px_2px_16px_rgba(0,0,0,0.01)]">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                    />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pr-4">
                    {filteredStaff.length} Records
                </div>
            </div>

            {/* Light Theme Data Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200 font-semibold">
                            <tr>
                                <th className="p-4 pl-6">Employee Details</th>
                                <th className="p-4">Position</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Daily Rate</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400">
                                        No active staff found. Add your team to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <Link href={`/employees/${emp.id}`} className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-[#E2F898] text-[#143d30] flex items-center justify-center font-bold text-xs">
                                                    {emp.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{emp.name}</div>
                                                    <div className="text-[11px] text-gray-400">{emp.age} yrs old</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="p-4 font-medium text-gray-600">{emp.position}</td>
                                        <td className="p-4 text-gray-500">{emp.phone}</td>
                                        <td className="p-4 font-semibold text-gray-900">₹{emp.dailySalary}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${emp.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            {emp.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleRemove(emp.id)}
                                                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition"
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Registration Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">New Staff Profile</h2>
                                <p className="text-xs text-gray-500 mt-1">Enter details to generate an employee record.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-gray-50">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input name="name" required placeholder="John Doe" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Age</label>
                                    <input name="age" type="number" required placeholder="25" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                                    <input name="phone" required placeholder="+91..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Position</label>
                                <select name="position" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20">
                                    <option value="">Select Role</option>
                                    <option value="MECHANIC">Mechanic</option>
                                    <option value="CLEANER">Cleaner</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="RECEPTIONIST">Receptionist</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Daily Rate (₹)</label>
                                <input name="dailySalary" type="number" step="0.01" required placeholder="800" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition">Cancel</button>
                                <button type="submit" disabled={loading} className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-[0_8px_20px_rgba(20,61,48,0.2)] disabled:opacity-50">
                                    {loading ? 'Saving...' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}