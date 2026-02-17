
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    // 0. MAINTENANCE MODE CHECK
    // Fetch status from backend (with short timeout)
    let isMaintenanceMode = false;
    try {
        // Use the backend URL from env, usually defined in next.config or .env
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const res = await fetch(`${backendUrl}/maintenance`, {
            next: { revalidate: 60 },
            signal: controller.signal
        }); // Cache for 60s to reduce load

        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            isMaintenanceMode = data.isMaintenanceMode;
        }
    } catch (err) {
        // If backend is down or timeout, default to NOT in maintenance mode
        // This prevents the site from being inaccessible if backend is slow/down
        console.error('Middleware maintenance check failed', err);
        isMaintenanceMode = false; // Fail open - allow access
    }

    // Allow static files, api routes, and admin routes even in maintenance mode
    if (isMaintenanceMode) {
        // Exclude specific paths from maintenance mode
        const isExcluded =
            request.nextUrl.pathname.startsWith('/_next') ||
            request.nextUrl.pathname.startsWith('/static') ||
            request.nextUrl.pathname.startsWith('/admin') ||
            request.nextUrl.pathname.startsWith('/api') || // Next.js API routes
            request.nextUrl.pathname === '/maintenance' ||
            request.nextUrl.pathname.startsWith('/login') || // Allow login for admins
            request.nextUrl.pathname.startsWith('/secure-admin-login'); // Allow stealth login

        if (!isExcluded) {
            return NextResponse.redirect(new URL('/maintenance', request.url));
        }
    } else {
        // If NOT in maintenance mode, redirect away from /maintenance page
        if (request.nextUrl.pathname === '/maintenance') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 1. CSRF Protection: Strict Origin/Referer Check for Mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        const host = request.headers.get('host'); // e.g. localhost:3000

        // Allow requests with no origin/referer (e.g. mobile apps, curl) if strict mode is off, 
        // BUT for a web app, we usually respect them. 
        // Here we ensure that IF they exist, they must match.

        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return new NextResponse(JSON.stringify({ message: 'CSRF: Origin Mismatch' }), { status: 403 });
            }
        }
    }

    // 2. Check if the path is an admin route
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // (Login page moved to /secure-admin-login, so no need to exclude it here as it's outside /admin scope)

        // 3. Get the token from cookies (Prioritize HTTP-only cookie)
        const token = request.cookies.get('token')?.value;

        if (!token) {
            // Stealth Mode: Redirect unauthorized users to Home 
            // This hides the existence of the admin panel
            return NextResponse.redirect(new URL('/', request.url));
        }

        // 4. Verify admin role from JWT token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const ADMIN_ROLES = [
                'ULTIMATE_ADMIN', 'SUPERADMIN',
                'SENIOR_CHIEF_SECURITY_ADMIN', 'CHIEF_DEVELOPMENT_ADMIN',
                'CHIEF_SECURITY_ADMIN', 'VICE_CHIEF_SECURITY_ADMIN',
                'SENIOR_ADMIN', 'JUNIOR_ADMIN', 'EMPLOYEE', 'ADMIN'
            ];

            if (!payload.role || !ADMIN_ROLES.includes(payload.role)) {
                // Not an admin - redirect silently to home
                return NextResponse.redirect(new URL('/', request.url));
            }
        } catch (error) {
            // Invalid token - redirect to home
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/admin/:path*', '/secure-admin-login'],
};
