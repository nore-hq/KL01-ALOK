'use server';

import { attendance, salaryAdvances, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { calculateLateDeduction } from '@/utils/payroll';

function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error("CRITICAL: Cloudflare DB binding not found.");
    return drizzle(dbBinding);
}

export async function getMonthlySalaryReport(targetMonth: string) {
    try {
        const db = getEdgeDb();
        const activeStaff = await db.select().from(employees).where(eq(employees.status, 'ACTIVE'));
        const allAttendance = await db.select().from(attendance);
        const allAdvances = await db.select().from(salaryAdvances);

        return activeStaff.map((emp) => {
            const empAttendance = allAttendance.filter((a) => a.employeeId === emp.id);
            const empAdvances = allAdvances.filter((a) => a.employeeId === emp.id);

            // Collect all unique YYYY-MM months up to targetMonth
            const monthSet = new Set<string>();
            empAttendance.forEach(a => { if (a.date <= `${targetMonth}-31`) monthSet.add(a.date.slice(0, 7)); });
            empAdvances.forEach(a => { if (a.datePaid <= `${targetMonth}-31`) monthSet.add(a.datePaid.slice(0, 7)); });
            monthSet.add(targetMonth);

            const sortedMonths = Array.from(monthSet).sort();

            let accumulatedAdvanceDeducted = 0;
            let currentMonthStats = {
                daysPresent: 0,
                halfDays: 0,
                totalOvertimeHours: 0,
                basePay: 0,
                overtimePay: 0,
                lateDeductions: 0,
                grossPay: 0,
                advanceBalanceBefore: 0,
                totalAdvancesDeducted: 0,
                advanceBalanceAfter: 0,
                netPay: 0,
            };

            for (const month of sortedMonths) {
                const monthAttendance = empAttendance.filter(a => a.date.startsWith(`${month}-`));

                const daysPresent = monthAttendance.filter(a => a.status === 'PRESENT').length;
                const halfDays = monthAttendance.filter(a => a.status === 'HALF_DAY').length;
                const totalOvertimeHours = monthAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

                const lateDeductions = monthAttendance.reduce((sum, a) => {
                    if (a.status === 'ABSENT') return sum;
                    const deduction = (a.lateDeduction !== undefined && a.lateDeduction !== null)
                        ? a.lateDeduction
                        : calculateLateDeduction({ isLate: a.isLate, status: a.status });
                    return sum + deduction;
                }, 0);

                const hourlyRate = emp.dailySalary / 8;
                const overtimePay = totalOvertimeHours * hourlyRate;
                const basePay = (daysPresent * emp.dailySalary) + (halfDays * (emp.dailySalary / 2));
                const grossPay = basePay + overtimePay;

                const payableSalary = Math.max(0, grossPay - lateDeductions);

                // Total advances given up to the end of month
                const totalAdvancesUpToMonth = empAdvances
                    .filter(a => a.datePaid <= `${month}-31`)
                    .reduce((sum, a) => sum + a.amount, 0);

                const advanceBalanceBefore = Math.max(0, totalAdvancesUpToMonth - accumulatedAdvanceDeducted);
                const advanceDeductionThisMonth = Math.min(payableSalary, advanceBalanceBefore);
                const advanceBalanceAfter = Math.max(0, advanceBalanceBefore - advanceDeductionThisMonth);
                const netPay = Math.max(0, payableSalary - advanceDeductionThisMonth);

                accumulatedAdvanceDeducted += advanceDeductionThisMonth;

                if (month === targetMonth) {
                    currentMonthStats = {
                        daysPresent,
                        halfDays,
                        totalOvertimeHours,
                        basePay,
                        overtimePay,
                        lateDeductions,
                        grossPay,
                        advanceBalanceBefore,
                        totalAdvancesDeducted: advanceDeductionThisMonth,
                        advanceBalanceAfter,
                        netPay,
                    };
                }
            }

            return { employee: emp, stats: currentMonthStats };
        });
    } catch (err) {
        console.error('Failed to calculate monthly salary report:', err);
        return [];
    }
}

export async function getEmployeeAdvanceDetails(employeeId: string) {
    try {
        const db = getEdgeDb();
        const empAdvances = await db.select().from(salaryAdvances).where(eq(salaryAdvances.employeeId, employeeId));
        const empAttendance = await db.select().from(attendance).where(eq(attendance.employeeId, employeeId));
        const empData = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);

        const dailySalary = empData[0]?.dailySalary || 0;

        // Sort advances chronologically
        const sortedAdvances = [...empAdvances].sort((a, b) => a.datePaid.localeCompare(b.datePaid));
        const totalAdvanceTaken = sortedAdvances.reduce((sum, a) => sum + a.amount, 0);

        // Find all unique months
        const monthSet = new Set<string>();
        empAttendance.forEach(a => monthSet.add(a.date.slice(0, 7)));
        empAdvances.forEach(a => monthSet.add(a.datePaid.slice(0, 7)));

        const sortedMonths = Array.from(monthSet).sort();

        let totalDeductedSoFar = 0;

        for (const month of sortedMonths) {
            const monthAttendance = empAttendance.filter(a => a.date.startsWith(`${month}-`));
            const daysPresent = monthAttendance.filter(a => a.status === 'PRESENT').length;
            const halfDays = monthAttendance.filter(a => a.status === 'HALF_DAY').length;
            const totalOvertimeHours = monthAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

            const lateDeductions = monthAttendance.reduce((sum, a) => {
                if (a.status === 'ABSENT') return sum;
                return sum + ((a.lateDeduction !== undefined && a.lateDeduction !== null)
                    ? a.lateDeduction
                    : calculateLateDeduction({ isLate: a.isLate, status: a.status }));
            }, 0);

            const hourlyRate = dailySalary / 8;
            const overtimePay = totalOvertimeHours * hourlyRate;
            const basePay = (daysPresent * dailySalary) + (halfDays * (dailySalary / 2));
            const grossPay = basePay + overtimePay;

            const payableSalary = Math.max(0, grossPay - lateDeductions);
            const totalAdvancesUpToMonth = empAdvances
                .filter(a => a.datePaid <= `${month}-31`)
                .reduce((sum, a) => sum + a.amount, 0);

            const advanceBalanceBefore = Math.max(0, totalAdvancesUpToMonth - totalDeductedSoFar);
            const advanceDeductionThisMonth = Math.min(payableSalary, advanceBalanceBefore);

            totalDeductedSoFar += advanceDeductionThisMonth;
        }

        const remainingAdvance = Math.max(0, totalAdvanceTaken - totalDeductedSoFar);

        // Allocate totalDeductedSoFar across advances in FIFO order for itemized view
        let remainingPoolToDeduct = totalDeductedSoFar;
        const itemizedAdvances = sortedAdvances.map((adv) => {
            const amountDeducted = Math.min(adv.amount, remainingPoolToDeduct);
            remainingPoolToDeduct = Math.max(0, remainingPoolToDeduct - amountDeducted);
            const remainingAmount = adv.amount - amountDeducted;
            return {
                ...adv,
                amountDeducted,
                remainingAmount,
            };
        });

        return {
            totalAdvanceTaken,
            totalAdvanceDeducted: totalDeductedSoFar,
            remainingAdvance,
            advances: itemizedAdvances,
        };
    } catch (err) {
        console.error('Failed to fetch employee advance details:', err);
        return {
            totalAdvanceTaken: 0,
            totalAdvanceDeducted: 0,
            remainingAdvance: 0,
            advances: [],
        };
    }
}