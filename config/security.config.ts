// Security Configuration
interface PasswordConfig {
  MIN_LENGTH: number;
  MAX_LENGTH: number;
  REQUIRE_UPPERCASE: boolean;
  REQUIRE_LOWERCASE: boolean;
  REQUIRE_NUMBERS: boolean;
  REQUIRE_SPECIAL_CHARS: boolean;
  ALLOWED_SPECIAL_CHARS: string;
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_DURATION: number;
}

interface SessionConfig {
  MAX_AGE: number;
  UPDATE_AGE: number;
  ABSOLUTE_TIMEOUT: number;
}

interface TokenConfig {
  ACCESS_TOKEN_EXPIRY: number;
  REFRESH_TOKEN_EXPIRY: number;
  OTP_EXPIRY: number;
  OTP_LENGTH: number;
}

interface RateLimitConfig {
  WINDOW: number;
  MAX_ATTEMPTS?: number;
  MAX_REQUESTS?: number;
}

interface RateLimits {
  AUTH: RateLimitConfig;
  API: RateLimitConfig;
  GENERAL: RateLimitConfig;
}

interface CspConfig {
  DEFAULT_SRC: string[];
  SCRIPT_SRC: string[];
  STYLE_SRC: string[];
  FONT_SRC: string[];
  IMG_SRC: string[];
  CONNECT_SRC: string[];
  FRAME_ANCESTORS: string[];
}

interface SecurityHeaders {
  CSP: CspConfig;
  HSTS_MAX_AGE: number;
  REFERRER_POLICY: string;
}

interface ValidationConfig {
  MAX_INPUT_LENGTH: number;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  MOBILE_PATTERNS: RegExp[];
}

interface EncryptionConfig {
  ALGORITHM: string;
  KEY_LENGTH: number;
  IV_LENGTH: number;
  TAG_LENGTH: number;
}

interface ApiSecurityConfig {
  TIMEOUT: number;
  MAX_RETRIES: number;
  RETRY_DELAY: number;
  ALLOWED_ORIGINS: string[];
}

interface SecurityConfig {
  PASSWORD: PasswordConfig;
  SESSION: SessionConfig;
  TOKEN: TokenConfig;
  RATE_LIMITS: RateLimits;
  HEADERS: SecurityHeaders;
  VALIDATION: ValidationConfig;
  ENCRYPTION: EncryptionConfig;
  API: ApiSecurityConfig;
}

export const SECURITY_CONFIG: SecurityConfig = {
  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
    ALLOWED_SPECIAL_CHARS: '@$!%*?&',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },

  // Session Configuration
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours
    UPDATE_AGE: 2 * 60 * 60, // 2 hours
    ABSOLUTE_TIMEOUT: 7 * 24 * 60 * 60, // 7 days
  },

  // Token Configuration
  TOKEN: {
    ACCESS_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
    OTP_LENGTH: 6,
  },

  // Rate Limiting
  RATE_LIMITS: {
    AUTH: {
      WINDOW: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 10,
    },
    API: {
      WINDOW: 60 * 1000, // 1 minute
      MAX_REQUESTS: 100,
    },
    GENERAL: {
      WINDOW: 60 * 1000, // 1 minute
      MAX_REQUESTS: 200,
    },
  },

  // Security Headers
  HEADERS: {
    CSP: {
      DEFAULT_SRC: ["'self'"],
      SCRIPT_SRC: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://apis.google.com",
        "https://www.google-analytics.com"
      ],
      STYLE_SRC: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      FONT_SRC: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      IMG_SRC: [
        "'self'",
        "data:",
        "https:"
      ],
      CONNECT_SRC: [
        "'self'",
        "https://api.lajolie-eg.com",
        "https://www.google-analytics.com"
      ],
      FRAME_ANCESTORS: ["'none'"],
    },
    HSTS_MAX_AGE: 31536000, // 1 year
    REFERRER_POLICY: "strict-origin-when-cross-origin",
  },

  // Input Validation
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],

    MOBILE_PATTERNS: [
      /^(\+2)?010[0-9]{8}$/, // Vodafone
      /^(\+2)?011[0-9]{8}$/, // Etisalat
      /^(\+2)?012[0-9]{8}$/, // Orange
      /^(\+2)?015[0-9]{8}$/  // We
    ],
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
  },

  // API Security
  API: {
    TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'https://lajolie-eg.com',
      'https://www.lajolie-eg.com'
    ],
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  SECURITY_CONFIG.SESSION.MAX_AGE = 12 * 60 * 60; // 12 hours in production
  SECURITY_CONFIG.HEADERS.HSTS_MAX_AGE = 63072000; // 2 years
  SECURITY_CONFIG.API.TIMEOUT = 5000; // 5 seconds in production
}

export default SECURITY_CONFIG;