import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './utils/auth';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next();

    const token = request.cookies.get('auth_token')?.value;
    const user = await verifyToken(token);

    // Protect all internal CRM routes
    const protectedRoutes = ['/', '/employees', '/attendance', '/salary', '/billing'];
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect authenticated users away from the login page
    if (request.nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};