interface ApiEndpoints {
    LOGIN: string;
    SIGNUP: string;
    VERIFY_OTP: string;
    SET_PASSWORD: string;
    USER_DATA: string;
    VERIFY_TOKEN: string;
    LOGOUT: string;
    REFRESH_TOKEN: string;
}

interface DefaultHeaders {
    'Content-Type': string;
    'Accept': string;
    'X-Requested-With': string;
}

interface ApiConfig {
    BASE_URL: string;
    TIMEOUT: number;
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
    ENDPOINTS: ApiEndpoints;
    DEFAULT_HEADERS: DefaultHeaders;
}

export const API_CONFIG: ApiConfig = {
    BASE_URL: process.env.API_BASE_URL || 'https://api.lajolie-eg.com/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,

    ENDPOINTS: {
        LOGIN: '/Auth/login',
        SIGNUP: '/Auth/SignUp',
        VERIFY_OTP: '/Auth/verifyUser',
        SET_PASSWORD: '/Auth/setPassword',
        USER_DATA: '/UserData',
        VERIFY_TOKEN: '/Auth/verify',
        LOGOUT: '/Auth/logout',
        REFRESH_TOKEN: '/Auth/refresh'
    },

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
};