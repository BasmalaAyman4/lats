import { getToken } from "next-auth/jwt";
import type { NextRequest } from 'next/server';

interface TokenResult {
    id?: string;
    mobile?: string;
    token?: string;
    firstName?: string;
    lastName?: string;
    address?: string | null;
    [key: string]: any;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

// Helper to check if user is authenticated
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });
        return !!token;
    } catch (error) {
        console.error('Authentication check failed:', error);
        return false;
    }
}

// Helper to get user info from token
export async function getUserFromToken(request: NextRequest): Promise<TokenResult | null> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });
        return token;
    } catch (error) {
        console.error('Failed to get user from token:', error);
        return null;
    }
}

// Check if path is public (doesn't require authentication)
export function isPublicPath(pathname: string): boolean {
    const publicPaths: string[] = [
        '/',
        '/about',
        '/contact',
        '/products',
        '/categories',
        '/search',
        '/privacy',
        '/terms'
    ];

    const publicPatterns: RegExp[] = [
        /^\/[a-z]{2}\/$/,                    // Root with locale (e.g., /en/, /ar/)
        /^\/[a-z]{2}\/about$/,               // About pages
        /^\/[a-z]{2}\/contact$/,             // Contact pages
        /^\/[a-z]{2}\/products/,             // Product pages
        /^\/[a-z]{2}\/categories/,           // Category pages
        /^\/[a-z]{2}\/search/,               // Search pages
        /^\/[a-z]{2}\/signin$/,              // Sign in pages
        /^\/[a-z]{2}\/signup$/,              // Sign up pages
        /^\/[a-z]{2}\/forgot-password$/,     // Forgot password
        /^\/[a-z]{2}\/reset-password$/,      // Reset password
        /^\/api\/auth\//,                    // NextAuth API routes
        /^\/api\/public\//,                  // Public API routes
    ];

    return publicPatterns.some(pattern => pattern.test(pathname));
}

// Check if path requires authentication
export function isProtectedPath(pathname: string): boolean {
    const protectedPatterns: RegExp[] = [
        /^\/[a-z]{2}\/checkout/,             // Checkout pages
        /^\/[a-z]{2}\/profile/,              // Profile pages
        /^\/[a-z]{2}\/orders/,               // Orders pages
        /^\/[a-z]{2}\/settings/,             // Settings pages
        /^\/[a-z]{2}\/dashboard/,            // Dashboard pages
        /^\/[a-z]{2}\/complete-profile/,     // Complete profile
        /^\/api\/protected\//,               // Protected API routes
    ];

    return protectedPatterns.some(pattern => pattern.test(pathname));
}

// Get locale from pathname
export function getLocaleFromPathname(pathname: string): string | null {
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
    return localeMatch ? localeMatch[1] : null;
}

// Create redirect URL with locale
export function createLocalizedUrl(pathname: string, locale: string, baseUrl: string): URL {
    const cleanPath = pathname.startsWith(`/${locale}`)
        ? pathname
        : `/${locale}${pathname}`;

    return new URL(cleanPath, baseUrl);
}

// Security validation helpers
export function validateRequest(request: NextRequest): ValidationResult {
    const errors: string[] = [];

    // Check User-Agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
        errors.push('Invalid User-Agent');
    }

    // Check for suspicious patterns
    const suspiciousPatterns: RegExp[] = [
        /sqlmap/i,
        /nikto/i,
        /netsparker/i,
        /acunetix/i,
        /burpsuite/i
    ];

    if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        errors.push('Suspicious User-Agent detected');
    }

    // Validate Content-Length for POST requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
            errors.push('Request payload too large');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Enhanced rate limiting with different tiers
interface RateLimitConfig {
    limit: number;
    window: number;
}

interface RequestRecord {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private requests: Map<string, RequestRecord> = new Map();
    private limits: Record<string, RateLimitConfig> = {
        auth: { limit: 10, window: 15 * 60 * 1000 },      // 10 requests per 15 minutes for auth
        api: { limit: 100, window: 60 * 1000 },           // 100 requests per minute for API
        general: { limit: 200, window: 60 * 1000 },       // 200 requests per minute for general
    };

    check(identifier: string, type: string = 'general'): RateLimitResult {
        const now = Date.now();
        const config = this.limits[type] || this.limits.general;
        const userRequests = this.requests.get(identifier) || { count: 0, resetTime: now + config.window };

        if (now > userRequests.resetTime) {
            userRequests.count = 1;
            userRequests.resetTime = now + config.window;
        } else {
            userRequests.count++;
        }

        this.requests.set(identifier, userRequests);

        return {
            allowed: userRequests.count <= config.limit,
            remaining: Math.max(0, config.limit - userRequests.count),
            resetTime: userRequests.resetTime
        };
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.requests.entries()) {
            if (now > value.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
