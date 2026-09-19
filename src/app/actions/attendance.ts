'use server';

import { attendance, salaryAdvances, employees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error("CRITICAL: Cloudflare DB binding not found.");
    return drizzle(dbBinding);
}

export async function getDailyAttendance(dateString: string) {
    try {
        const db = getEdgeDb();
        const activeStaff = await db.select().from(employees).where(eq(employees.status, 'ACTIVE'));
        const attendanceRecords = await db.select().from(attendance).where(eq(attendance.date, dateString));
        const advanceRecords = await db.select().from(salaryAdvances).where(eq(salaryAdvances.datePaid, dateString));

        return activeStaff.map((emp) => {
            const record = attendanceRecords.find((a) => a.employeeId === emp.id);
            const advances = advanceRecords.filter((adv) => adv.employeeId === emp.id);
            const totalAdvanceToday = advances.reduce((sum, item) => sum + item.amount, 0);

            return {
                employee: emp,
                attendance: record || null,
                advancePaidToday: totalAdvanceToday,
            };
        });
    } catch (err) {
        console.error('Failed to fetch attendance:', err);
        return [];
    }
}

import { calculateLateDeduction } from '@/utils/payroll';

export async function saveAttendanceRecord(data: {
    employeeId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
    isLate: boolean;
    lateDeduction?: number;
    overtimeHours: number;
    notes?: string;
}) {
    try {
        const db = getEdgeDb();
        const computedDeduction = data.lateDeduction !== undefined
            ? data.lateDeduction
            : calculateLateDeduction({ isLate: data.isLate, status: data.status });

        const existing = await db.select().from(attendance).where(and(eq(attendance.employeeId, data.employeeId), eq(attendance.date, data.date)));

        if (existing.length > 0) {
            await db.update(attendance).set({
                status: data.status,
                isLate: data.isLate,
                lateDeduction: computedDeduction,
                overtimeHours: data.overtimeHours,
                notes: data.notes || ''
            }).where(eq(attendance.id, existing[0].id));
        } else {
            await db.insert(attendance).values({
                id: crypto.randomUUID(),
                employeeId: data.employeeId,
                date: data.date,
                status: data.status,
                isLate: data.isLate,
                lateDeduction: computedDeduction,
                overtimeHours: data.overtimeHours,
                notes: data.notes || ''
            });
        }
        revalidatePath('/attendance');
        revalidatePath('/salary');
        return { success: true };
    } catch (err) {
        console.error('Save attendance error:', err);
        return { success: false, error: 'Database update failed.' };
    }
}

export async function recordSalaryAdvance(data: { employeeId: string; amount: number; datePaid: string; notes?: string; }) {
    try {
        if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
            return { success: false, error: 'Advance amount must be greater than ₹0.' };
        }
        const db = getEdgeDb();
        await db.insert(salaryAdvances).values({
            id: crypto.randomUUID(),
            employeeId: data.employeeId,
            amount: data.amount,
            datePaid: data.datePaid,
            notes: data.notes || 'Cash Advance'
        });
        revalidatePath('/attendance');
        revalidatePath('/employees');
        revalidatePath(`/employees/${data.employeeId}`);
        revalidatePath('/salary');
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Failed to record advance cash.' };
    }
}