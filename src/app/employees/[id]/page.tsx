import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { employees } from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Banknote } from 'lucide-react';

export const runtime = 'edge';

// Bulletproof Edge DB initializer
function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error("CRITICAL: Cloudflare DB binding not found.");
    return drizzle(dbBinding);
}

export default async function EmployeeProfile({ params }: { params: { id: string } }) {
    // Await the dynamic params for Next.js 16+ compatibility
    const resolvedParams = params;
    const db = getEdgeDb();

    // Fetch the specific employee
    const employeeData = await db.select().from(employees).where(eq(employees.id, resolvedParams.id)).limit(1);
    const employee = employeeData[0];

    if (!employee) {
        return notFound();
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Back Navigation */}
            <Link href="/employees" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Roster
            </Link>

            {/* Profile Header Card */}
            <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl bg-[#E2F898] text-[#143d30] flex items-center justify-center font-black text-2xl sm:text-4xl shadow-sm shrink-0">
                        {employee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{employee.name}</h1>
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">{employee.position} • {employee.age} yrs old</p>
                        <div className="mt-2 sm:mt-3 inline-flex px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold rounded-full uppercase tracking-wider bg-green-100 text-green-700">
                            {employee.status}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                    <div className="text-xs sm:text-sm text-gray-500 font-medium">Daily Rate</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">₹{employee.dailySalary}</div>
                </div>
            </div>

            {/* Details & Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Contact Info */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact Details</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Phone Number</div>
                            <div className="text-gray-900 font-medium">{employee.phone}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Employee ID</div>
                            <div className="text-gray-900 font-medium text-sm font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                                {employee.id.split('-')[0]}...
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Join Date</div>
                            <div className="text-gray-900 font-medium">
                                {new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Management Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Link href="/attendance" className="group border border-gray-200 rounded-xl p-4 hover:border-[#143d30]/30 hover:bg-gray-50 transition-all">
                            <div className="text-xl mb-2">
                                <Calendar className="w-6 h-6 text-[#143d30]" />
                            </div>
                            <div className="font-semibold text-gray-900">Log Attendance</div>
                            <div className="text-xs text-gray-500 mt-1">Mark today's status or issue a cash advance.</div>
                        </Link>
                        <Link href="/salary" className="group border border-gray-200 rounded-xl p-4 hover:border-[#143d30]/30 hover:bg-gray-50 transition-all">
                            <div className="text-xl mb-2">
                                <Banknote className="w-6 h-6 text-[#143d30]" />
                            </div>
                            <div className="font-semibold text-gray-900">View Payroll</div>
                            <div className="text-xs text-gray-500 mt-1">Check monthly salary calculations and deductions.</div>
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}