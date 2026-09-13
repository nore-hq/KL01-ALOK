import Link from 'next/link';
import { Search, Bell, Plus, TrendingUp, Calendar, Banknote, Loader2 } from 'lucide-react';
import { getDb } from '@/db';
import { employees, salaryAdvances } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Suspense } from 'react';

export const runtime = 'edge';

async function DashboardMetrics() {
  const db = getDb();

  // Fetch real data from D1
  const staffQuery = await db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, 'ACTIVE'));
  const totalStaff = staffQuery[0]?.count || 0;

  const advanceQuery = await db.select({ total: sql<number>`sum(${salaryAdvances.amount})` }).from(salaryAdvances);
  const pendingAdvances = advanceQuery[0]?.total || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
      <div className="sm:px-4 first:pl-0">
        <div className="text-sm text-gray-500 mb-2">Total Staff</div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900">{totalStaff}</span>
          <span className="text-[10px] font-bold bg-[#E2F898] text-[#143d30] px-2 py-0.5 rounded flex items-center gap-1 mb-1"><Plus className="w-3 h-3" /> Active</span>
        </div>
      </div>

      <div className="sm:px-4 pt-4 sm:pt-0">
        <div className="text-sm text-gray-500 mb-2">Jobs Today</div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900">0</span>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1 mb-1">No data</span>
        </div>
      </div>

      <div className="sm:px-4 pt-4 sm:pt-0">
        <div className="text-sm text-gray-500 mb-2">Today's Revenue</div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900">₹0</span>
        </div>
      </div>

      <div className="sm:px-4 pt-4 sm:pt-0">
        <div className="text-sm text-gray-500 mb-2">Pending Advances</div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900">₹{pendingAdvances}</span>
          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded flex items-center mb-1">Unsettled</span>
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="flex items-center justify-center p-8 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin text-[#143d30] mr-2" />
      <span className="text-sm font-medium">Loading metrics...</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Top Search & Profile Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search CRM..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 text-gray-900 placeholder-gray-400"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Greeting & Primary Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back. Let's dive into today's operations.</p>
        </div>
        <Link href="/employees" className="bg-[#143d30] hover:bg-[#1a4f3f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_8px_20px_rgba(20,61,48,0.2)] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Manage Staff
        </Link>
      </div>

      {/* KPI Metrics Row */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Operations Overview</h3>
        <Suspense fallback={<MetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/attendance" className="group bg-white border border-gray-200 p-6 rounded-2xl hover:border-[#143d30]/30 transition-all shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
          <div className="h-12 w-12 bg-[#F3F4F6] group-hover:bg-[#E2F898] rounded-xl flex items-center justify-center text-xl mb-4 transition-colors">
            <Calendar className="w-6 h-6 text-[#143d30]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Daily Attendance</h3>
          <p className="text-sm text-gray-500 mt-2">Mark present status, late arrivals, and distribute daily cash advances.</p>
        </Link>

        <Link href="/salary" className="group bg-white border border-gray-200 p-6 rounded-2xl hover:border-[#143d30]/30 transition-all shadow-[4px_4px_24px_rgba(0,0,0,0.02)]">
          <div className="h-12 w-12 bg-[#F3F4F6] group-hover:bg-[#E2F898] rounded-xl flex items-center justify-center text-xl mb-4 transition-colors">
            <Banknote className="w-6 h-6 text-[#143d30]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Payroll Calculation</h3>
          <p className="text-sm text-gray-500 mt-2">Generate automated monthly salary reports based on attendance records.</p>
        </Link>
      </div>

    </div>
  );
}