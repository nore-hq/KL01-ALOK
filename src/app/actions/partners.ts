'use server';

import { getDb } from '@/db';
import { partners } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/utils/auth';

export async function getPartners() {
    const session = await getAuthSession();
    if (!session || session.role === 'PARTNER') {
        throw new Error('Unauthorized: Admin access required');
    }
    const db = getDb();
    const allPartners = await db.select().from(partners).all();
    return allPartners;
}

export async function createPartner(formData: FormData) {
    const session = await getAuthSession();
    if (!session || session.role === 'PARTNER') {
        throw new Error('Unauthorized: Admin access required');
    }

    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!name || !username || !password) {
        throw new Error('All fields are required');
    }

    const db = getDb();
    
    // In a real app, hash the password using bcrypt. For now, we will store a dummy hash or just the plain password for demo purposes if bcrypt isn't imported, but let's use bcrypt since it is in package.json
    const { hash } = await import('bcrypt-ts');
    const passwordHash = await hash(password, 10);

    const newPartner = {
        id: crypto.randomUUID(),
        name,
        username,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    await db.insert(partners).values(newPartner).run();
    revalidatePath('/partners');
}

export async function updatePartner(formData: FormData) {
    const session = await getAuthSession();
    if (!session || session.role === 'PARTNER') {
        throw new Error('Unauthorized: Admin access required');
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!id || !name || !username) {
        throw new Error('ID, Name, and Username are required');
    }

    const db = getDb();
    
    const updateData: any = { name, username };
    
    if (password) {
        const { hash } = await import('bcrypt-ts');
        updateData.passwordHash = await hash(password, 10);
    }

    const { eq } = await import('drizzle-orm');
    await db.update(partners).set(updateData).where(eq(partners.id, id)).run();
    revalidatePath('/partners');
}
