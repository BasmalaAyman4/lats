export interface EncryptionResult {
    encrypted: string;
    iv: string;
    tag: string;
}

export interface PasswordHashResult {
    hash: string;
    salt: string;
}

export interface EmailValidationResult {
    isValid: boolean;
    message?: string;
    email?: string;
}

export interface RateLimitResponse {
    allowed: boolean;
    count?: number;
    remaining?: number;
    resetTime?: number;
    error?: string;
}