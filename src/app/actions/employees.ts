'use server';

import { employees, attendance, salaryAdvances } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthSession } from '@/utils/auth';

// 1. Initialize DB directly inside the action file to bypass Next.js import bugs
function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;

    // Fallback for local Node.js environment if Edge context misses
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;

    if (!dbBinding) {
        throw new Error("CRITICAL: Cloudflare DB binding not found.");
    }

    return drizzle(dbBinding);
}

export async function getEmployees() {
    try {
        const db = getEdgeDb();
        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;

        if (partnerId) {
            return await db.select().from(employees).where(eq(employees.partnerId, partnerId as string));
        } else {
            return await db.select().from(employees).where(isNull(employees.partnerId));
        }
    } catch (err) {
        console.error('Failed to fetch employees:', err);
        return [];
    }
}

export async function createEmployee(formData: FormData) {
    try {
        const db = getEdgeDb();
        const name = formData.get('name') as string;
        const age = parseInt(formData.get('age') as string, 10);
        const phone = formData.get('phone') as string;
        const position = formData.get('position') as 'MECHANIC' | 'CLEANER' | 'MANAGER' | 'RECEPTIONIST';
        const dailySalary = parseFloat(formData.get('dailySalary') as string);

        if (!name || !phone || !position || isNaN(dailySalary)) {
            return { success: false, error: 'Please fill in all required fields.' };
        }

        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;

        await db.insert(employees).values({
            id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            name,
            age,
            phone,
            position,
            dailySalary,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            partnerId,
        });

        revalidatePath('/employees');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to create employee:', err);
        return { success: false, error: err.message || 'Database error occurred.' };
    }
}

export async function updateEmployee(id: string, formData: FormData) {
    try {
        const db = getEdgeDb();
        const name = formData.get('name') as string;
        const age = parseInt(formData.get('age') as string, 10);
        const phone = formData.get('phone') as string;
        const position = formData.get('position') as 'MECHANIC' | 'CLEANER' | 'MANAGER' | 'RECEPTIONIST';
        const dailySalary = parseFloat(formData.get('dailySalary') as string);

        if (!name || !phone || !position || isNaN(dailySalary)) {
            return { success: false, error: 'Please fill in all required fields.' };
        }

        await db.update(employees).set({
            name,
            age,
            phone,
            position,
            dailySalary,
        }).where(eq(employees.id, id));

        revalidatePath('/employees');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to update employee:', err);
        return { success: false, error: err.message || 'Database error occurred.' };
    }
}


export async function deleteEmployee(id: string) {
    try {
        const db = getEdgeDb();
        // First delete related records to avoid foreign key constraints
        await db.delete(attendance).where(eq(attendance.employeeId, id));
        await db.delete(salaryAdvances).where(eq(salaryAdvances.employeeId, id));
        // Finally, delete the employee
        await db.delete(employees).where(eq(employees.id, id));
        
        revalidatePath('/employees');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to delete employee:', err);
        return { success: false, error: err.message || 'Failed to completely delete employee.' };
    }
}
