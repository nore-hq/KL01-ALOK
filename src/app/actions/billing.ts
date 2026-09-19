'use server';

import { bills } from '@/db/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';
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

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';

export interface CreateBillInput {
    customerName: string;
    vehicleNumber: string;
    vehicleModel: string;
    service: string;
    amount: number;
    paymentMode: PaymentMode;
}

export async function getBills(search?: string, paymentModeFilter?: string) {
    try {
        const db = getEdgeDb();
        let allBills = await db.select().from(bills).orderBy(desc(bills.createdAt));

        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            allBills = allBills.filter((b) =>
                b.customerName.toLowerCase().includes(q) ||
                b.vehicleNumber.toLowerCase().includes(q) ||
                b.billNumber.toLowerCase().includes(q) ||
                b.service.toLowerCase().includes(q)
            );
        }

        if (paymentModeFilter && paymentModeFilter !== 'ALL') {
            allBills = allBills.filter((b) => b.paymentMode === paymentModeFilter);
        }

        return allBills;
    } catch (err) {
        console.error('Failed to fetch bills:', err);
        return [];
    }
}

export async function getBillById(id: string) {
    try {
        const db = getEdgeDb();
        const result = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
        return result[0] || null;
    } catch (err) {
        console.error('Failed to fetch bill details:', err);
        return null;
    }
}

export async function createBill(data: CreateBillInput) {
    try {
        const customerName = data.customerName?.trim();
        const vehicleNumber = data.vehicleNumber?.trim();
        const vehicleModel = data.vehicleModel?.trim();
        const service = data.service?.trim();
        const amount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount as any);
        const paymentMode = data.paymentMode;

        // Validation
        if (!customerName) return { success: false, error: 'Customer Name is required.' };
        if (!vehicleNumber) return { success: false, error: 'Vehicle Number is required.' };
        if (!vehicleModel) return { success: false, error: 'Vehicle Model is required.' };
        if (!service) return { success: false, error: 'Service description is required.' };
        if (isNaN(amount) || amount <= 0) return { success: false, error: 'Amount must be a valid positive number.' };
        const validModes: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];
        if (!validModes.includes(paymentMode)) return { success: false, error: 'Please select a valid payment mode.' };

        const db = getEdgeDb();

        // Generate unique bill/serial number (e.g. INV-1001)
        const countRes = await db.select({ count: sql<number>`count(*)` }).from(bills);
        const totalExisting = countRes[0]?.count || 0;
        let serialNum = 1001 + totalExisting;
        let billNumber = `INV-${serialNum}`;

        // Ensure no collisions
        let exists = await db.select({ id: bills.id }).from(bills).where(eq(bills.billNumber, billNumber));
        while (exists.length > 0) {
            serialNum++;
            billNumber = `INV-${serialNum}`;
            exists = await db.select({ id: bills.id }).from(bills).where(eq(bills.billNumber, billNumber));
        }

        const newId = crypto.randomUUID();
        const nowIso = new Date().toISOString();

        await db.insert(bills).values({
            id: newId,
            billNumber,
            customerName,
            vehicleNumber,
            vehicleModel,
            service,
            amount,
            paymentMode,
            createdAt: nowIso,
        });

        revalidatePath('/billing');
        revalidatePath('/');
        return { success: true, billId: newId, billNumber };
    } catch (err: any) {
        console.error('Failed to create bill:', err);
        return { success: false, error: err?.message || 'Database error creating bill.' };
    }
}
