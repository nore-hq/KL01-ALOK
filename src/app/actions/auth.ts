'use server';

import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signToken } from '@/utils/auth';
import { cookies } from 'next/headers';
import { compareSync } from 'bcrypt-ts';
import { redirect } from 'next/navigation';

function getEdgeDb() {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const dbBinding = env?.DB || (process.env as any).DB || (globalThis as any).__env__?.DB;
    if (!dbBinding) throw new Error('CRITICAL: Cloudflare DB binding not found.');
    return drizzle(dbBinding);
}

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const db = getEdgeDb();
        const userRecords = await db.select().from(users).where(eq(users.email, email));

        if (!userRecords || userRecords.length === 0) {
            return redirect('/login?message=Invalid email or password');
        }

        const user = userRecords[0];
        const passwordMatch = compareSync(password, user.passwordHash);

        if (!passwordMatch) {
            return redirect('/login?message=Invalid email or password');
        }

        const token = await signToken({ id: user.id, email: user.email, role: user.role });

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
    } catch (err: any) {
        if (err?.message === 'NEXT_REDIRECT') throw err;
        console.error('Login error:', err);
        return redirect(`/login?message=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }

    return redirect('/');
}
