export interface ValidationResult {
    isValid: boolean;
    message?: string;
    strength?: string;
    score?: number;
}

export interface RateLimitOptions {
    interval?: number;
    uniqueTokenPerInterval?: number;
}

export interface RateLimitCheck {
    count: number;
    remaining: number;
    resetTime: number;
}

export interface RateLimitStatus {
    count: number;
    remaining: number;
    resetTime: number;
}

export interface SecurityValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface PasswordStrengthResult {
    score: number;
    strength: string;
    feedback: string[];
}