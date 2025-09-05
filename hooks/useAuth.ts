"use client";
import { useState, useCallback, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/auth.service';
import { checkRateLimit } from '../utils/validation';

interface AuthResponse {
  success: boolean;
  error?: string;
  userId?: string;
  userData?: any;
}

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

interface PersonalData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
}

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (mobile: string, password: string, langCode?: string) => Promise<AuthResponse>;
  signup: (mobile: string, langCode?: string) => Promise<AuthResponse>;
  verifyOTP: (userId: string, otp: string, langCode?: string) => Promise<AuthResponse>;
  setPassword: (userId: string, password: string, langCode?: string) => Promise<AuthResponse>;
  setPersonalInfo: (token: string, personalData: PersonalData, langCode?: string) => Promise<AuthResponse>;
  cancelRequest: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const cleanup = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (mobile: string, password: string, langCode: string = '1'): Promise<AuthResponse> => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // Check rate limiting
      const rateLimitCheck: RateLimitResult = await checkRateLimit(`login:${mobile}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || 'Rate limit exceeded');
        return { success: false, error: rateLimitCheck.message || 'Rate limit exceeded' };
      }

      console.log('Starting login process...');

      // Call login service
      const response = await AuthService.loginWithPassword(mobile, password, langCode);

      if (response.success) {
        console.log('API login successful, now signing in with NextAuth...');

        // Sign in with NextAuth
        const result = await signIn("credentials", {
          redirect: false,
          id: response.user.userId,
          mobile: response.user.lastMobileDigit || mobile,
          token: response.user.token,
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          address: response.user.address || null
        });

        console.log('NextAuth signin result:', result);

        if (result?.error) {
          console.error('NextAuth signin error:', result.error);
          setError('فشل في تسجيل الدخول - خطأ في النظام');
          return { success: false, error: 'فشل في تسجيل الدخول - خطأ في النظام' };
        }

        if (result?.ok) {
          console.log('Login successful, redirecting...');

          // Small delay to ensure session is established
          setTimeout(() => {
            // Get the callback URL or redirect to home
            const urlParams = new URLSearchParams(window.location.search);
            const callbackUrl = urlParams.get('callbackUrl');
            const redirectUrl = callbackUrl || `/${langCode === '2' ? 'en' : 'ar'}`;

            console.log('Redirecting to:', redirectUrl);
            router.push(redirectUrl);
          }, 100);

          return { success: true };
        } else {
          setError('فشل في تسجيل الدخول');
          return { success: false, error: 'فشل في تسجيل الدخول' };
        }
      } else {
        console.error('API login failed:', response.error);
        setError(response.error || 'Login failed');
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (err: any) {
      console.error('Login exception:', err);

      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ غير متوقع";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, router]);

  const signup = useCallback(async (mobile: string, langCode: string = '1'): Promise<AuthResponse> => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const rateLimitCheck: RateLimitResult = await checkRateLimit(`signup:${mobile}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || 'Rate limit exceeded');
        return { success: false, error: rateLimitCheck.message || 'Rate limit exceeded' };
      }

      const response = await AuthService.signUpWithMobile(mobile, langCode);

      if (response.success) {
        return { success: true, userId: response.user };
      } else {
        setError(response.error || 'Signup failed');
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في التسجيل";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const verifyOTP = useCallback(async (userId: string, otp: string, langCode: string = '1'): Promise<AuthResponse> => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const rateLimitCheck: RateLimitResult = await checkRateLimit(`otp:${userId}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || 'Rate limit exceeded');
        return { success: false, error: rateLimitCheck.message || 'Rate limit exceeded' };
      }

      const response = await AuthService.verifyOTP(userId, otp, langCode);

      if (response.success) {
        return { success: true };
      } else {
        setError(response.error || 'OTP verification failed');
        return { success: false, error: response.error || 'OTP verification failed' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في التحقق";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const setPassword = useCallback(async (userId: string, password: string, langCode: string = '1'): Promise<AuthResponse> => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await AuthService.setPassword(userId, password, langCode);

      if (response.success) {
        return { success: true, userData: response.userData };
      } else {
        setError(response.error || 'Set password failed');
        return { success: false, error: response.error || 'Set password failed' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في تعيين كلمة المرور";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const setPersonalInfo = useCallback(async (token: string, personalData: PersonalData, langCode: string = '1'): Promise<AuthResponse> => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await AuthService.setPersonalInfo(token, personalData, langCode);

      if (response.success) {
        return { success: true };
      } else {
        setError(response.error || 'Set personal info failed');
        return { success: false, error: response.error || 'Set personal info failed' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في حفظ البيانات الشخصية";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const cancelRequest = useCallback((): void => {
    cleanup();
  }, [cleanup]);

  return {
    loading,
    error,
    clearError,
    login,
    signup,
    verifyOTP,
    setPassword,
    setPersonalInfo,
    cancelRequest
  };
};