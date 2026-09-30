'use server';

import { billing } from '@/db/schema';
import { desc, eq, sql, isNull, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/utils/auth';

function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error("CRITICAL: Cloudflare DB binding not found.");
    return drizzle(dbBinding);
}

export async function getBills() {
    try {
        const db = getEdgeDb();
        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;

        let query = db.select().from(billing);
        if (partnerId) {
            query = query.where(eq(billing.partnerId, partnerId)) as any;
        } else {
            query = query.where(isNull(billing.partnerId)) as any;
        }

        const records = await query.orderBy(desc(billing.serialNumber));
        return records;
    } catch (err) {
        console.error('Failed to fetch bills:', err);
        return [];
    }
}

export async function getUniqueCustomers() {
    try {
        const db = getEdgeDb();
        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;

        let query = db.selectDistinct({ customerName: billing.customerName }).from(billing);
        if (partnerId) {
            query = query.where(eq(billing.partnerId, partnerId)) as any;
        } else {
            query = query.where(isNull(billing.partnerId)) as any;
        }

        const records = await query;
        return records.map(r => r.customerName);
    } catch (err) {
        console.error('Failed to fetch unique customers:', err);
        return [];
    }
}

export async function getUniquePaymentModes() {
    try {
        const db = getEdgeDb();
        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;

        let query = db.selectDistinct({ paymentMode: billing.paymentMode }).from(billing);
        if (partnerId) {
            query = query.where(eq(billing.partnerId, partnerId)) as any;
        } else {
            query = query.where(isNull(billing.partnerId)) as any;
        }

        const records = await query;
        return records.map(r => r.paymentMode);
    } catch (err) {
        console.error('Failed to fetch unique payment modes:', err);
        return [];
    }
}

export async function createBill(data: {
    customerName: string;
    vehicleNumber: string;
    vehicleModel: string;
    serviceType: string;
    paymentMode: string;
    amount: number;
    date: string;
}) {
    try {
        const db = getEdgeDb();
        const session = await getAuthSession();
        const partnerId = session?.partnerId || null;
        
        // Get the latest serial number to increment it (per partner if needed, but doing globally or per partner depends. Let's do per partner)
        let latestQuery = db.select({ maxSerial: sql`MAX(serial_number)` }).from(billing);
        if (partnerId) {
            latestQuery = latestQuery.where(eq(billing.partnerId, partnerId)) as any;
        } else {
            latestQuery = latestQuery.where(isNull(billing.partnerId)) as any;
        }
        
        const latest = await latestQuery;
        const maxSerial = latest[0]?.maxSerial as number || 0;
        const nextSerial = maxSerial + 1;

        await db.insert(billing).values({
            id: crypto.randomUUID(),
            serialNumber: nextSerial,
            customerName: data.customerName,
            vehicleNumber: data.vehicleNumber,
            vehicleModel: data.vehicleModel,
            serviceType: data.serviceType,
            paymentMode: data.paymentMode,
            amount: data.amount,
            date: data.date,
            createdAt: new Date().toISOString(),
            partnerId
        });

        revalidatePath('/billing');
        revalidatePath('/billing/listing');
        return { success: true, serialNumber: nextSerial };
    } catch (err: any) {
        console.error('Failed to create bill:', err);
        return { success: false, error: err.message };
    }
}

export async function deleteBill(id: string) {
    try {
        const db = getEdgeDb();
        await db.delete(billing).where(eq(billing.id, id));
        revalidatePath('/billing');
        revalidatePath('/billing/listing');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateBill(id: string, data: Partial<{
    customerName: string;
    vehicleNumber: string;
    vehicleModel: string;
    serviceType: string;
    paymentMode: string;
    amount: number;
    date: string;
}>) {
    try {
        const db = getEdgeDb();
        await db.update(billing).set(data).where(eq(billing.id, id));
        revalidatePath('/billing');
        revalidatePath('/billing/listing');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
