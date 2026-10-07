'use server';

import { attendance, employees, salaryAdvances } from '@/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
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

    export async function getWeeklyAttendanceReport(startDate: string, endDate: string) {
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
        
        const records = await db.select().from(attendance)
            .where(and(gte(attendance.date, startDate), lte(attendance.date, endDate)));
            
        const advances = await db.select().from(salaryAdvances)
            .where(and(gte(salaryAdvances.datePaid, startDate), lte(salaryAdvances.datePaid, endDate)));

        return activeStaff.map(emp => {
            const empRecords = records.filter(r => r.employeeId === emp.id);
            const empAdvances = advances.filter(a => a.employeeId === emp.id);
            
            // Merge advances into records by date for easy UI rendering
            const mergedRecords = empRecords.map(r => {
                const dayAdvances = empAdvances.filter(a => a.datePaid === r.date);
                const totalAdvance = dayAdvances.reduce((sum, a) => sum + a.amount, 0);
                return { ...r, advanceAmount: totalAdvance };
            });
            
            // Also add standalone advances for days where attendance wasn't marked
            empAdvances.forEach(adv => {
                if (!mergedRecords.find(r => r.date === adv.datePaid)) {
                    mergedRecords.push({
                        date: adv.datePaid,
                        status: 'UNMARKED',
                        isLate: false,
                        lateDeduction: 0,
                        overtimePay: 0,
                        advanceAmount: adv.amount
                    } as any);
                }
            });

            return {
                employee: emp,
                records: mergedRecords
            };
        });
    } catch (err) {
        console.error('Failed to get weekly attendance:', err);
        return [];
    }
}
