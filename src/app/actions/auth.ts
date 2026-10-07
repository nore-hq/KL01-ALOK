'use server';

import { cookies } from 'next/headers';

export async function logoutAction() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth_token');
        cookieStore.set('auth_token', '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
        });
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: 'Failed to logout' };
    }
}
