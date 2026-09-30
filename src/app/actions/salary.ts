'use server';

import { attendance, salaryAdvances, employees } from '@/db/schema';
import { eq, like, and, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthSession } from '@/utils/auth';

function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error("CRITICAL: Cloudflare DB binding not found.");
    return drizzle(dbBinding);
}

    export async function getMonthlySalaryReport(monthPrefix: string) {
        try {
            const db = getEdgeDb();
            const session = await getAuthSession();
            const partnerId = session?.partnerId || null;
            
            let staffQuery = db.select().from(employees);
            if (partnerId) {
                staffQuery = staffQuery.where(and(eq(employees.status, 'ACTIVE'), eq(employees.partnerId, partnerId as string))) as any;
            } else {
                staffQuery = staffQuery.where(and(eq(employees.status, 'ACTIVE'), isNull(employees.partnerId))) as any;
            }
            const activeStaff = await staffQuery;
        const monthlyAttendance = await db.select().from(attendance).where(like(attendance.date, `${monthPrefix}-%`));
        const monthlyAdvances = await db.select().from(salaryAdvances).where(like(salaryAdvances.datePaid, `${monthPrefix}-%`));

        return activeStaff.map((emp) => {
            const empAttendance = monthlyAttendance.filter((a) => a.employeeId === emp.id);
            const empAdvances = monthlyAdvances.filter((a) => a.employeeId === emp.id);

            const daysPresent = empAttendance.filter(a => a.status === 'PRESENT').length;
            const halfDays = empAttendance.filter(a => a.status === 'HALF_DAY').length;
            
            const totalOvertimePay = empAttendance.reduce((sum, a) => sum + (a.overtimePay || 0), 0);
            const totalLateDeductions = empAttendance.reduce((sum, a) => sum + (a.lateDeduction || 0), 0);
            const totalAdvances = empAdvances.reduce((sum, a) => sum + a.amount, 0);

            const basePay = (daysPresent * emp.dailySalary) + (halfDays * (emp.dailySalary / 2));
            const grossPay = basePay + totalOvertimePay;
            const totalDeductions = totalAdvances + totalLateDeductions;
            const netPay = grossPay - totalDeductions;

            return { 
                employee: emp, 
                stats: { daysPresent, halfDays, totalOvertimePay, totalLateDeductions, basePay, totalAdvances, grossPay, totalDeductions, netPay },
                attendance: empAttendance,
                advances: empAdvances
            };
        });
    } catch (err) {
        return [];
    }
}

    export async function getEmployeeSalaryDetails(employeeId: string, monthPrefix: string) {
        try {
            const db = getEdgeDb();
            const session = await getAuthSession();
            const partnerId = session?.partnerId || null;
            
            let empQueryBuilder = db.select().from(employees);
            if (partnerId) {
                empQueryBuilder = empQueryBuilder.where(and(eq(employees.id, employeeId), eq(employees.partnerId, partnerId as string))) as any;
            } else {
                empQueryBuilder = empQueryBuilder.where(and(eq(employees.id, employeeId), isNull(employees.partnerId))) as any;
            }
            
            const empQuery = await empQueryBuilder;
        if (empQuery.length === 0) return null;
        
        const emp = empQuery[0];
        const empAttendance = await db.select().from(attendance).where(and(eq(attendance.employeeId, employeeId), like(attendance.date, `${monthPrefix}-%`)));
        const empAdvances = await db.select().from(salaryAdvances).where(and(eq(salaryAdvances.employeeId, employeeId), like(salaryAdvances.datePaid, `${monthPrefix}-%`)));

        const daysPresent = empAttendance.filter(a => a.status === 'PRESENT').length;
        const halfDays = empAttendance.filter(a => a.status === 'HALF_DAY').length;
        
        const totalOvertimePay = empAttendance.reduce((sum, a) => sum + (a.overtimePay || 0), 0);
        const totalLateDeductions = empAttendance.reduce((sum, a) => sum + (a.lateDeduction || 0), 0);
        const totalAdvances = empAdvances.reduce((sum, a) => sum + a.amount, 0);

        const basePay = (daysPresent * emp.dailySalary) + (halfDays * (emp.dailySalary / 2));
        const grossPay = basePay + totalOvertimePay;
        const totalDeductions = totalAdvances + totalLateDeductions;
        const netPay = grossPay - totalDeductions;

        return { 
            employee: emp, 
            stats: { daysPresent, halfDays, totalOvertimePay, totalLateDeductions, basePay, totalAdvances, grossPay, totalDeductions, netPay },
            attendance: empAttendance,
            advances: empAdvances
        };
    } catch (err) {
        return null;
    }
}
