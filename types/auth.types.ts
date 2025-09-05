// types/auth.types.ts
export interface LoginResponse {
    success: boolean;
    user?: {
        userId: string;
        lastMobileDigit?: string;
        token: string;
        firstName?: string;
        lastName?: string;
        address?: string | null;
    };
    error?: string;
}

export interface SignUpResponse {
    success: boolean;
    user?: string;
    error?: string;
}

export interface VerifyOTPResponse {
    success: boolean;
    error?: string;
}

export interface SetPasswordResponse {
    success: boolean;
    userData?: any;
    error?: string;
}

export interface SetPersonalInfoResponse {
    success: boolean;
    error?: string;
}

export interface AuthResult {
    success: boolean;
    error?: string;
    userId?: string;
    userData?: any;
}

export interface RateLimitResult {
    allowed: boolean;
    message?: string;
}

export interface PersonalData {
    firstName?: string;
    lastName?: string;
    email?: string;
    birthDate?: string;
    address?: string;
}