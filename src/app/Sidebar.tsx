'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    Users, 
    Calendar, 
    Banknote, 
    Receipt, 
    FileText, 
    LogOut, 
    Loader2, 
    Menu, 
    X,
    UserCheck
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export default function Sidebar({ session }: { session?: any }) {
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile drawer on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

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

    // Hide sidebar completely on login page
    if (pathname === '/login') {
        return null;
    }

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: '/', label: 'Overview', icon: Home, active: isActive('/') },
        { href: '/employees', label: 'Staff Roster', icon: Users, active: isActive('/employees') },
        { href: '/attendance', label: 'Attendance', icon: Calendar, active: isActive('/attendance') },
        { href: '/attendance-list', label: 'Attendance List', icon: UserCheck, active: isActive('/attendance-list') },
        { href: '/salary', label: 'Payroll', icon: Banknote, active: isActive('/salary') },
        { href: '/billing', label: 'Billing System', icon: Receipt, active: pathname === '/billing' },
        { href: '/billing/listing', label: 'Bill Listing', icon: FileText, active: pathname === '/billing/listing' },
    ];

    const canManagePartners = (!session || session.role === 'ADMIN' || session.role === 'MANAGER') && !session?.partnerId;

    const renderNavContent = () => (
        <>
            <div className="space-y-6">
                {/* Logo / Brand Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#143d30] flex items-center justify-center font-black text-white shadow-md">
                            KL
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-[15px] tracking-tight">KL-01 CAR SPA</h2>
                            <span className="text-[11px] text-gray-500 font-medium">Workspace</span>
                        </div>
                    </div>
                    {/* Close button for mobile drawer */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                                    item.active
                                        ? 'font-semibold text-gray-900 bg-[#E2F898] shadow-sm'
                                        : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${item.active ? 'text-[#143d30]' : 'opacity-60 text-gray-500'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {canManagePartners && (
                        <Link
                            href="/partners"
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                                pathname === '/partners'
                                    ? 'font-semibold text-gray-900 bg-[#E2F898] shadow-sm'
                                    : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                        >
                            <Users className={`w-4 h-4 ${pathname === '/partners' ? 'text-[#143d30]' : 'opacity-60 text-gray-500'}`} />
                            <span>Create Account</span>
                        </Link>
                    )}
                </nav>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="pt-4 mt-6 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                        <img 
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${session?.username || 'Admin'}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-900 truncate">{session?.username || 'System Admin'}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate">
                            {session?.role === 'PARTNER' ? 'Contract Showroom' : 'Main Branch'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 border border-rose-200/50 transition-all disabled:opacity-50 cursor-pointer shadow-sm group"
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
        </>
    );

    return (
        <>
            {/* 1. Mobile Top Navigation Bar (Shown only on small screens) */}
            <header className="print:hidden md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#143d30] flex items-center justify-center font-black text-white text-xs shadow-sm">
                        KL
                    </div>
                    <span className="font-bold text-gray-900 text-sm tracking-tight">KL-01 CAR SPA</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                        <img 
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${session?.username || 'Admin'}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* 2. Mobile Drawer Overlay & Slide-over Drawer */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => setIsMobileOpen(false)}
                    />

                    {/* Drawer Content */}
                    <aside className="relative w-72 max-w-[85vw] bg-white h-full p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
                        {renderNavContent()}
                    </aside>
                </div>
            )}

            {/* 3. Desktop Permanent Sidebar (Hidden on mobile, fixed on desktop) */}
            <aside className="print:hidden hidden md:flex w-64 min-h-screen bg-white border-r border-gray-200 p-6 flex-col justify-between shrink-0 sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {renderNavContent()}
            </aside>
        </>
    );
}