'use server';

import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

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
        return await db.select().from(employees);
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

        await db.insert(employees).values({
            id: crypto.randomUUID(),
            name,
            age,
            phone,
            position,
            dailySalary,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        });

        revalidatePath('/employees');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to create employee:', err);
        return { success: false, error: err.message || 'Database error occurred.' };
    }
}

export async function removeEmployee(id: string) {
    try {
        const db = getEdgeDb();
        await db.update(employees).set({ status: 'INACTIVE' }).where(eq(employees.id, id));
        revalidatePath('/employees');
        return { success: true };
    } catch (err) {
        console.error('Failed to remove employee:', err);
        return { success: false, error: 'Failed to deactivate employee.' };
    }
}