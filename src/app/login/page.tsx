export const runtime = 'edge';

import { signIn } from '@/app/actions/auth';

export default async function LoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ message?: string }>;
}) {
    const params = searchParams ? await searchParams : {};

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