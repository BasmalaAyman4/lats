import crypto from 'crypto';
import { SECURITY_CONFIG } from '../config/security.config';
import type {
  EncryptionResult,
  PasswordHashResult,
  EmailValidationResult,
  PasswordStrengthResult,
  RateLimitResponse
} from '../types/security.types';

// Encryption utilities
export class SecurityUtils {
  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(text: string, key: string): EncryptionResult {
    try {
      const algorithm = SECURITY_CONFIG.ENCRYPTION.ALGORITHM;
      const iv = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);
      const cipher = crypto.createCipherGCM(algorithm, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt encrypted data
   */
  static decrypt(encryptedData: EncryptionResult, key: string): string {
    try {
      const { encrypted, iv, tag } = encryptedData;
      const algorithm = SECURITY_CONFIG.ENCRYPTION.ALGORITHM;

      const decipher = crypto.createDecipherGCM(algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with salt using PBKDF2
   */
  static hashPassword(password: string, salt: string | null = null): PasswordHashResult {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');

    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
  }

  /**
   * Generate HMAC signature
   */
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/[<>\"'`]/g, '') // Remove potential XSS characters
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .slice(0, SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH);
  }

  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): EmailValidationResult {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email || typeof email !== 'string') {
      return { isValid: false, message: 'Email is required' };
    }

    const sanitizedEmail = this.sanitizeInput(email.toLowerCase());

    if (!emailRegex.test(sanitizedEmail)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    if (sanitizedEmail.length > 254) {
      return { isValid: false, message: 'Email too long' };
    }

    return { isValid: true, email: sanitizedEmail };
  }

  /**
   * Check if request is from allowed origin
   */
  static isAllowedOrigin(origin: string): boolean {
    if (!origin) return false;
    return SECURITY_CONFIG.API.ALLOWED_ORIGINS.includes(origin);
  }

  /**
   * Generate Content Security Policy header value
   */
  static generateCSPHeader(): string {
    const csp = SECURITY_CONFIG.HEADERS.CSP;
    let cspString = '';

    Object.entries(csp).forEach(([directive, sources]) => {
      const directiveName = directive.replace(/_/g, '-').toLowerCase();
      cspString += `${directiveName} ${(sources as string[]).join(' ')}; `;
    });

    return cspString.trim();
  }

  /**
   * Validate request size
   */
  static isValidRequestSize(contentLength: number): boolean {
    return contentLength <= SECURITY_CONFIG.VALIDATION.MAX_FILE_SIZE;
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): PasswordStrengthResult {
    if (!password) {
      return { score: 0, strength: 'Weak', feedback: ['Password is required'] };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Common sequences

    const strength = score < 3 ? 'Weak' : score < 5 ? 'Medium' : 'Strong';

    return {
      score: Math.max(0, score),
      strength,
      feedback: feedback.length > 0 ? feedback : ['Password meets security requirements']
    };
  }

  /**
   * Rate limit check with security logging
   */
  static async checkRateLimit(
    identifier: string,
    action: string,
    rateLimiter: any
  ): Promise<RateLimitResponse> {
    try {
      const result = await rateLimiter.check(10, identifier);

      // Log suspicious activity
      if (result.count > 7) {
        console.warn(`High rate limit usage: ${identifier} - ${action}`, {
          count: result.count,
          remaining: result.remaining,
          timestamp: new Date().toISOString()
        });
      }

      return { allowed: true, ...result };
    } catch (error: any) {
      // Log rate limit violations
      console.warn(`Rate limit exceeded: ${identifier} - ${action}`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return { allowed: false, error: error.message };
    }
  }
}

export default SecurityUtils;
