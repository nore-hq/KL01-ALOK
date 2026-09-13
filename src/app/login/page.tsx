export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '@/utils/auth';
import { cookies } from 'next/headers';
import { compareSync } from 'bcrypt-ts';

export default async function LoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ message?: string }>;
}) {
    const params = searchParams ? await searchParams : {};

    const signIn = async (formData: FormData) => {
        'use server';
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const db = getDb();
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
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });
        } catch (err: any) {
            // If it's a redirect error thrown by Next.js, let it propagate
            if (err?.message === 'NEXT_REDIRECT') throw err;
            console.error('Login error:', err);
            return redirect(`/login?message=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }

        return redirect('/');
    };

    return (
        <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-[#143d30] flex items-center justify-center font-black text-white text-xl shadow-lg mb-4">
                    KL
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    KL-01 CAR SPA
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Sign in to access the management workspace
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-[4px_4px_24px_rgba(0,0,0,0.02)] border border-gray-200 rounded-2xl sm:px-10">
                    {params.message && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center">
                            {params.message}
                        </div>
                    )}
                    <form className="space-y-6" action={signIn}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:border-[#143d30] focus:outline-none focus:ring-1 focus:ring-[#143d30] shadow-sm text-sm"
                                    placeholder="admin@kl01carspa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:border-[#143d30] focus:outline-none focus:ring-1 focus:ring-[#143d30] shadow-sm text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-xl bg-[#143d30] hover:bg-[#1a4f3f] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(20,61,48,0.2)] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143d30]"
                            >
                                Secure Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}