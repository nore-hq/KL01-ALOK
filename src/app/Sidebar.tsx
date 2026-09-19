'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, Banknote, FileText } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    // 1. Hide the sidebar completely if we are on the login page
    if (pathname === '/login') {
        return null;
    }

    // 2. Helper function to check active routes
    const isActive = (path: string) => pathname === path;

    return (
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
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
                        href="/billing"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/billing')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <FileText className={`w-4 h-4 ${isActive('/billing') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Billing
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
                        href="/salary"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive('/salary')
                                ? 'font-semibold text-gray-900 bg-[#E2F898]'
                                : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Banknote className={`w-4 h-4 ${isActive('/salary') ? 'opacity-100 text-[#143d30]' : 'opacity-50'}`} /> Payroll
                    </Link>
                </nav>
            </div>

            <div className="pt-4 flex items-center gap-3 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Admin`} alt="avatar" />
                </div>
                <div>
                    <div className="text-xs font-semibold text-gray-900">System Admin</div>
                    <div className="text-[10px] text-gray-500">ID: 001</div>
                </div>
            </div>
        </aside>
    );
}