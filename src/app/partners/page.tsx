'use client';

import { useState, useEffect } from 'react';
import { getPartners, createPartner, updatePartner } from '@/app/actions/partners';
import { Building2, Plus, User, Key, Shield, Edit2, X } from 'lucide-react';

export default function PartnersPage() {
    const [partners, setPartners] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingPartner, setEditingPartner] = useState<any>(null);

    const loadPartners = async () => {
        setLoading(true);
        const data = await getPartners();
        setPartners(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPartners();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await createPartner(formData);
        setIsCreating(false);
        loadPartners();
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append('id', editingPartner.id);
        await updatePartner(formData);
        setEditingPartner(null);
        loadPartners();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contract Showrooms</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage partner accounts and separate dashboard access.</p>
                </div>
                
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-[#143d30] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a4f3f] transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> {isCreating ? 'Cancel' : 'New Partner'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Partner Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Showroom Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="e.g. Downtown Motors"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    placeholder="Partner login username"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Secure password"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#E2F898] text-[#143d30] px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#d4ed79] transition-colors"
                        >
                            Create Account
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-[4px_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <table className="w-full text-left text-sm text-gray-900">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="p-5">Showroom Name</th>
                            <th className="p-5">Username</th>
                            <th className="p-5">Created At</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading partners...</td></tr>
                        ) : partners.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No partner accounts found.</td></tr>
                        ) : (
                            partners.map((partner: any) => (
                                <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-5 font-semibold text-gray-900 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        {partner.name}
                                    </td>
                                    <td className="p-5 text-gray-600">{partner.username}</td>
                                    <td className="p-5 text-gray-500">{new Date(partner.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                            <Shield className="w-3 h-3" /> ACTIVE
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button 
                                            onClick={() => setEditingPartner(partner)}
                                            className="p-2 text-gray-500 hover:text-[#143d30] hover:bg-[#E2F898] rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingPartner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setEditingPartner(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-900"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Partner Account</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Showroom Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={editingPartner.name}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        defaultValue={editingPartner.username}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password <span className="font-normal text-gray-400">(leave blank to keep current)</span></label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="New password (optional)"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-[#143d30] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a4f3f] transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
