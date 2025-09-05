// middleware.js - Updated to fix NextAuth configuration error
import { NextResponse } from 'next/server';
import { withAuth } from "next-auth/middleware";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
 import {
  isProtectedPath,
  isPublicPath,
  getLocaleFromPathname,
  createLocalizedUrl,
  validateRequest,
  rateLimiter
} from './utils/middleware.utils';

const locales = ['en', 'ar'];
const defaultLocale = 'en';

function getLocale(request) {
  const negotiatorHeaders = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  return match(languages, locales, defaultLocale);
}

function addSecurityHeaders(response) {
  const headers = {
    // Existing headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Enhanced security headers
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.lajolie-eg.com https://www.google-analytics.com; frame-ancestors 'none';",
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };

  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

function getClientIP(request) {
  return request.ip ||
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    request.headers.get('X-Real-IP') ||
    'unknown';
}

function handleRateLimit(request) {
  const ip = getClientIP(request);
  const { pathname } = request.nextUrl;

  let limitType = 'general';
  if (pathname.includes('/api/auth/') || pathname.includes('/signin') || pathname.includes('/signup')) {
    limitType = 'auth';
  } else if (pathname.startsWith('/api/')) {
    limitType = 'api';
  }

  const result = rateLimiter.check(ip, limitType);

  if (!result.allowed) {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
    return addSecurityHeaders(response);
  }

  return null;
}

export default withAuth(
  function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;

    console.log('Middleware processing:', pathname);

    // Skip middleware for static files and Next.js internals
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/_') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // IMPORTANT: Always allow NextAuth API routes to pass through
    if (pathname.startsWith('/api/auth/')) {
      console.log('Allowing NextAuth API route:', pathname);
      return NextResponse.next();
    }

    // Handle rate limiting (skip for auth routes)
    if (!pathname.startsWith('/api/auth/')) {
      const rateLimitResponse = handleRateLimit(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // Security validation (skip for auth routes)
    if (!pathname.startsWith('/api/auth/')) {
      const validation = validateRequest(request);
      if (!validation.isValid) {
        console.warn('Security validation failed:', validation.errors);
        return addSecurityHeaders(
          new NextResponse('Bad Request', { status: 400 })
        );
      }
    }

    // Handle internationalization
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!pathnameHasLocale) {
      const locale = getLocale(request);
      const redirectUrl = createLocalizedUrl(pathname, locale, request.url);

      if (searchParams.toString()) {
        redirectUrl.search = searchParams.toString();
      }

      console.log('Redirecting for locale:', redirectUrl.toString());
      const response = NextResponse.redirect(redirectUrl);
      return addSecurityHeaders(response);
    }

    const currentLocale = getLocaleFromPathname(pathname);

    // Check authentication status
    const nextAuthToken = request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token');

    const isAuthenticated = !!nextAuthToken;

    console.log('Authentication check:', { pathname, isAuthenticated });

    // Handle protected routes
    if (isProtectedPath(pathname) && !isAuthenticated) {
      const signinUrl = createLocalizedUrl('/signin', currentLocale, request.url);
      signinUrl.searchParams.set('callbackUrl', pathname);

      console.log('Redirecting to signin:', signinUrl.toString());
      const response = NextResponse.redirect(signinUrl);
      return addSecurityHeaders(response);
    }

    // Redirect authenticated users away from auth pages
    const isAuthPage = pathname.includes('/signin') ||
      pathname.includes('/signup') ||
      pathname.includes('/complete-profile');

    if (isAuthPage && isAuthenticated) {
      // Check if user has completed profile
      const hasCompletedProfile = request.cookies.get('profile-completed');

      if (!hasCompletedProfile && !pathname.includes('/complete-profile')) {
        const completeProfileUrl = createLocalizedUrl('/complete-profile', currentLocale, request.url);
        console.log('Redirecting to complete profile:', completeProfileUrl.toString());
        const response = NextResponse.redirect(completeProfileUrl);
        return addSecurityHeaders(response);
      }

      if (hasCompletedProfile || pathname.includes('/complete-profile')) {
        // Redirect to callback URL or home
        const callbackUrl = searchParams.get('callbackUrl');
        const redirectUrl = callbackUrl
          ? createLocalizedUrl(callbackUrl, currentLocale, request.url)
          : createLocalizedUrl('/', currentLocale, request.url);

        console.log('Redirecting authenticated user:', redirectUrl.toString());
        const response = NextResponse.redirect(redirectUrl);
        return addSecurityHeaders(response);
      }
    }

    console.log('Continuing with request:', pathname);
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        console.log('Authorization callback:', { pathname, hasToken: !!token });

        // Always allow public paths and auth routes
        if (isPublicPath(pathname) || pathname.startsWith('/api/auth/')) {
          return true;
        }

        // For protected API routes, require token
        if (pathname.startsWith('/api/protected/') || pathname.startsWith('/api/user/')) {
          return !!token;
        }

        // For other routes, handle in main middleware
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\..*).*)',
  ]
};