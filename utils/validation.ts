import { rateLimit } from './rate-limit';
import { SecurityUtils } from './security.utils';
import { SECURITY_CONFIG } from '../config/security.config';
import type { ValidationResult, RateLimitResult } from '@/types/validation.types';

// Enhanced mobile validation for Egyptian numbers with security
export const validateMobile = (mobile: string): boolean => {
    if (!mobile || typeof mobile !== 'string') return false;

    // Sanitize input first
    const sanitizedMobile = SecurityUtils.sanitizeInput(mobile);

    // Remove all spaces and special characters
    const cleanMobile = sanitizedMobile.replace(/[\s\-\(\)]/g, '');

    // Validate length to prevent DoS
    if (cleanMobile.length > 20) return false;

    // Egyptian mobile patterns from security config
    return SECURITY_CONFIG.VALIDATION.MOBILE_PATTERNS.some((pattern: RegExp) =>
        pattern.test(cleanMobile)
    );
};

// Enhanced password validation with strength checking
export const validatePassword = (password: string): ValidationResult => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, message: "Password is required" };
    }

    // Check password length limits
    const config = SECURITY_CONFIG.PASSWORD;
    if (password.length < config.MIN_LENGTH) {
        return { isValid: false, message: `يجب أن تكون كلمة المرور ${config.MIN_LENGTH} أحرف على الأقل` };
    }

    if (password.length > config.MAX_LENGTH) {
        return { isValid: false, message: "كلمة المرور طويلة جداً" };
    }

    // Use security utils for strength checking
    const strengthCheck = SecurityUtils.checkPasswordStrength(password);

    const checks = {
        length: password.length >= config.MIN_LENGTH,
        lowercase: config.REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
        uppercase: config.REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
        number: config.REQUIRE_NUMBERS ? /\d/.test(password) : true,
        noSpaces: !/\s/.test(password),
        validChars: new RegExp(`^[A-Za-z\\d${config.ALLOWED_SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\  /**
            * Sanitize input to prevent')}