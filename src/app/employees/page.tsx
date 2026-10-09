'use client';

import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/app/actions/employees';
import Link from 'next/link';
import { Plus, Search, X, Printer } from 'lucide-react';

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
    const [editEmp, setEditEmp] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Delete Modal State
    const [deleteModalEmp, setDeleteModalEmp] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        
        const res = editEmp 
            ? await updateEmployee(editEmp.id, formData)
            : await createEmployee(formData);
            
        setLoading(false);

        if (res.success) {
            setIsOpen(false);
            setEditEmp(null);
            loadStaff();
        } else {
            alert(res.error || `Failed to ${editEmp ? 'update' : 'register'} employee`);
        }
    };


    const confirmDelete = async () => {
        if (!deleteModalEmp) return;
        setIsDeleting(true);
        const res = await deleteEmployee(deleteModalEmp.id);
        setIsDeleting(false);
        if (res.success) {
            setDeleteModalEmp(null);
            loadStaff();
        } else {
            alert(res.error || 'Failed to delete account');
        }
    };

    const filteredStaff = staff.filter(
        (emp) =>
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.position.toLowerCase().includes(search.toLowerCase()) ||
            emp.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Roster</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage employee profiles and daily compensation.</p>
                </div>
                <button
                    onClick={() => { setEditEmp(null); setIsOpen(true); }}
                    className="w-full sm:w-auto justify-center bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_8px_20px_rgba(20,61,48,0.2)] flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Staff
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
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
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pr-2 shrink-0">
                    {filteredStaff.length} Records
                </div>
            </div>

            {/* Light Theme Data Table */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                    <table className="w-full text-left text-sm text-gray-700 whitespace-nowrap sm:whitespace-normal">
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
                                                    <div className="font-semibold text-gray-900">
                                                        {emp.name} <span className="text-gray-400 font-normal text-xs ml-1">#{emp.id}</span>
                                                    </div>
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
                                            <button
                                                onClick={() => { setEditEmp(emp); setIsOpen(true); }}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteModalEmp(emp)}
                                                className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded transition"
                                            >
                                                Delete
                                            </button>
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
                                <h2 className="text-xl font-bold text-gray-900">{editEmp ? 'Edit Staff Profile' : 'New Staff Profile'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{editEmp ? `Updating details for ${editEmp.name}.` : 'Enter details to generate an employee record.'}</p>
                            </div>
                            <button onClick={() => { setIsOpen(false); setEditEmp(null); }} className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-gray-50">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input name="name" defaultValue={editEmp?.name || ''} required placeholder="John Doe" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Age</label>
                                    <input name="age" type="number" defaultValue={editEmp?.age || ''} required placeholder="25" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                                    <input name="phone" defaultValue={editEmp?.phone || ''} required placeholder="+91..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Position</label>
                                <select name="position" defaultValue={editEmp?.position || ''} required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20">
                                    <option value="">Select Role</option>
                                    <option value="MECHANIC">Mechanic</option>
                                    <option value="CLEANER">Cleaner</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="RECEPTIONIST">Receptionist</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Daily Rate (₹)</label>
                                <input name="dailySalary" type="number" step="0.01" defaultValue={editEmp?.dailySalary || ''} required placeholder="800" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 font-mono" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setIsOpen(false); setEditEmp(null); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition">Cancel</button>
                                <button type="submit" disabled={loading} className="bg-[#143d30] hover:bg-[#1a4f3f] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-[0_8px_20px_rgba(20,61,48,0.2)] disabled:opacity-50">
                                    {loading ? 'Saving...' : editEmp ? 'Save Changes' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalEmp && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-scale-in">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Delete Employee Account?</h2>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                Are you sure you want to completely delete <strong className="text-gray-900">{deleteModalEmp.name}</strong>'s profile? This action is permanent and <strong className="text-red-600">cannot be recovered</strong>. All related attendance and salary records will also be erased.
                            </p>
                            
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setDeleteModalEmp(null)}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-[0_4px_12px_rgba(220,38,38,0.2)] disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}