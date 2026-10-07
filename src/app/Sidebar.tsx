'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, Banknote, Receipt, FileText, LogOut, Loader2 } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export default function Sidebar({ session }: { session?: any }) {
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logoutAction();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    // 1. Hide the sidebar completely if we are on the login page
    if (pathname === '/login') {
        return null;
    }

    // 2. Helper function to check active routes
    const isActive = (path: string) => pathname === path;

    return (
        <aside className="print:hidden w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="space-y-8">
                {/* Logo / Brand Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#143d30] flex items-center justify-center font-black text-white shadow-md">
                        KL
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-[15px] tracking-tight">KL-01 CAR SPA</h2>
                        <span className="text-[11px] text-gray-500 font-medium">Workspace</span>
                    </div>
                </div>

                {/* Nav Menu with Dynamic Active States */}
                <nav className="space-y-2">
                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Home className={`w-4 h-4 ${isActive('/') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Overview
                    </Link>

                    <Link
                        href="/employees"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/employees')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Users className={`w-4 h-4 ${isActive('/employees') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Staff Roster
                    </Link>

                    <Link
                        href="/attendance"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/attendance')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className={`w-4 h-4 ${isActive('/attendance') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Attendance
                    </Link>

                    <Link
                        href="/attendance-list"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/attendance-list')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className={`w-4 h-4 ${isActive('/attendance-list') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Attendance List
                    </Link>

                    <Link
                        href="/salary"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/salary')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Banknote className={`w-4 h-4 ${isActive('/salary') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Payroll
                    </Link>

                    <Link
                        href="/billing"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname === '/billing'
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Receipt className={`w-4 h-4 ${pathname === '/billing' ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Billing System
                    </Link>

                    <Link
                        href="/billing/listing"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname === '/billing/listing'
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <FileText className={`w-4 h-4 ${pathname === '/billing/listing' ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Bill Listing
                    </Link>

                    {(!session || session.role === 'ADMIN' || session.role === 'MANAGER') && !session?.partnerId && (
                        <Link
                            href="/partners"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname === '/partners'
                                    ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                    : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Users className={`w-4 h-4 ${pathname === '/partners' ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Create Account
                        </Link>
                    )}
                </nav>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${session?.username || 'Admin'}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-900 truncate">{session?.username || 'System Admin'}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{session?.role === 'PARTNER' ? 'Contract Showroom' : 'Main Branch'}</div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 border border-rose-200/50 transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm group"
                    title="Sign Out"
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Signing Out...</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Sign Out</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}