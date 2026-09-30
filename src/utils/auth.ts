import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key-for-local-dev-only';
const encodedKey = new TextEncoder().encode(secretKey);

export async function signToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function verifyToken(token: string | undefined = '') {
    try {
        if (!token) return null;
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

import { cookies } from 'next/headers';

export async function getAuthSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    return await verifyToken(token);
}
