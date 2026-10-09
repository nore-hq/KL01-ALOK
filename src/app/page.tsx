import Link from 'next/link';
import { Search, Bell, Plus, TrendingUp, Calendar, Banknote, Loader2 } from 'lucide-react';
import { getDb } from '@/db';
import { employees, salaryAdvances, billing } from '@/db/schema';
import { eq, sql, isNull, and, inArray, like } from 'drizzle-orm';
import { Suspense } from 'react';
import { getAuthSession } from '@/utils/auth';

export const runtime = 'edge';

async function DashboardMetrics() {
  const db = getDb();
  const session = await getAuthSession();
  const partnerId = session?.partnerId || null;

  // Filter employees by partner
  let staffQueryBase = db.select().from(employees);
  if (partnerId) {
    staffQueryBase = staffQueryBase.where(eq(employees.partnerId, partnerId as string)) as any;
  } else {
    staffQueryBase = staffQueryBase.where(isNull(employees.partnerId)) as any;
  }
  const allStaff = await staffQueryBase;
  const staffIds = allStaff.map(s => s.id);

  const totalStaff = allStaff.filter(s => s.status === 'ACTIVE').length;

  let pendingAdvances = 0;
  if (staffIds.length > 0) {
    const advanceQuery = await db.select({ total: sql<number>`sum(${salaryAdvances.amount})` })
      .from(salaryAdvances)
      .where(inArray(salaryAdvances.employeeId, staffIds));
    pendingAdvances = advanceQuery[0]?.total || 0;
  }

  // Calculate today's revenue and jobs
  const todayString = new Date().toISOString().split('T')[0];
  let billingQuery = db.select().from(billing);
  if (partnerId) {
    billingQuery = billingQuery.where(and(like(billing.date, `${todayString}%`), eq(billing.partnerId, partnerId as string))) as any;
  } else {
    billingQuery = billingQuery.where(and(like(billing.date, `${todayString}%`), isNull(billing.partnerId))) as any;
  }
  
  const todayBills = await billingQuery;
  const jobsToday = todayBills.length;
  const revenueToday = todayBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 sm:divide-x divide-gray-100">
      <div className="bg-gray-50/80 sm:bg-transparent p-3.5 sm:p-0 sm:px-4 first:pl-0 rounded-xl sm:rounded-none">
        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Total Staff</div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">{totalStaff}</span>
          <span className="text-[10px] font-bold bg-[#E2F898] text-[#143d30] px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Active</span>
        </div>
      </div>

      <div className="bg-gray-50/80 sm:bg-transparent p-3.5 sm:p-0 sm:px-4 rounded-xl sm:rounded-none">
        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Jobs Today</div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">{jobsToday}</span>
          {jobsToday === 0 && <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded">No data</span>}
        </div>
      </div>

      <div className="bg-gray-50/80 sm:bg-transparent p-3.5 sm:p-0 sm:px-4 rounded-xl sm:rounded-none">
        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Today's Revenue</div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{revenueToday}</span>
        </div>
      </div>

      <div className="bg-gray-50/80 sm:bg-transparent p-3.5 sm:p-0 sm:px-4 rounded-xl sm:rounded-none">
        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Pending Advances</div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{pendingAdvances}</span>
          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 sm:px-2 py-0.5 rounded">Unsettled</span>
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
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

      {/* Top Search & Profile Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search CRM..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d30]/20 text-gray-900 placeholder-gray-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center justify-center shadow-sm">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Greeting & Primary Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm">Welcome back. Let's dive into today's operations.</p>
        </div>
        <Link href="/employees" className="w-full sm:w-auto justify-center bg-[#143d30] hover:bg-[#1a4f3f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_8px_20px_rgba(20,61,48,0.2)] flex items-center gap-2">
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
