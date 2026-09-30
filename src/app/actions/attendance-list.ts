'use server';

import { attendance, employees } from '@/db/schema';
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
                staffQuery = staffQuery.where(and(eq(employees.status, 'ACTIVE'), eq(employees.partnerId, partnerId))) as any;
            } else {
                staffQuery = staffQuery.where(and(eq(employees.status, 'ACTIVE'), isNull(employees.partnerId))) as any;
            }

            const activeStaff = await staffQuery;
        
        const records = await db.select().from(attendance)
            .where(and(gte(attendance.date, startDate), lte(attendance.date, endDate)));

        return activeStaff.map(emp => {
            const empRecords = records.filter(r => r.employeeId === emp.id);
            return {
                employee: emp,
                records: empRecords
            };
        });
    } catch (err) {
        console.error('Failed to get weekly attendance:', err);
        return [];
    }
}
