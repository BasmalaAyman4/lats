import { API_CONFIG } from '../config/api.config.js';
import { validateMobile, validatePassword, validateOTP, sanitizeInput } from '../utils/validation.js';

class JsonApiClient {
    constructor(baseURL, timeout = 10000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }

    async request(endpoint, method, data, extraHeaders = {}, retryCount = 0) {
        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; LaJolie-WebApp/1.0)',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            ...extraHeaders
        };

        try {
            const requestConfig = {
                method,
                headers,
                signal: controller.signal
            };

            // Only add body for methods that support it
            if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
                requestConfig.body = JSON.stringify(data);
            }

            console.log('Making API request:', {
                url,
                method,
                headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
                data: data ? { ...data, password: data.password ? '[REDACTED]' : data.password } : undefined,
                attempt: retryCount + 1
            });

            const response = await fetch(url, requestConfig);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
                
                // Retry on server errors (5xx) but not client errors (4xx)
                if (response.status >= 500 && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                    console.log(`Retrying request (attempt ${retryCount + 2}/${API_CONFIG.RETRY_ATTEMPTS + 1})`);
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount)));
                    return this.request(endpoint, method, data, extraHeaders, retryCount + 1);
                }
                
                throw new ApiError(response.status, errorText);
            }

            const responseData = await response.json();
            console.log('API response successful:', {
                status: response.status,
                data: responseData,
                attempt: retryCount + 1
            });

            return responseData;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                // Retry on timeout if we have attempts left
                if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                    console.log(`Request timeout, retrying (attempt ${retryCount + 2}/${API_CONFIG.RETRY_ATTEMPTS + 1})`);
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount)));
                    return this.request(endpoint, method, data, extraHeaders, retryCount + 1);
                }
                throw new ApiError(408, 'Request timeout');
            }

            // Retry on network errors
            if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                console.log(`Network error, retrying (attempt ${retryCount + 2}/${API_CONFIG.RETRY_ATTEMPTS + 1})`);
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount)));
                return this.request(endpoint, method, data, extraHeaders, retryCount + 1);
            }

            throw error;
        }
    }
}

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

const jsonApiClient = new JsonApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

export class AuthService {
    static async loginWithPassword(mobile, password, langCode = '1') {
        try {
            if (!validateMobile(mobile)) {
                throw new Error('رقم الهاتف غير صحيح');
            }

            if (!password || password.length < 8) {
                throw new Error('كلمة المرور قصيرة جداً');
            }

            console.log('Login attempt for mobile:', sanitizeInput(mobile));

            const response = await jsonApiClient.request(
                API_CONFIG.ENDPOINTS.LOGIN,
                'POST',
                {
                    mobile: sanitizeInput(mobile),
                    password: sanitizeInput(password)
                },
                { 'langCode': langCode }
            );

            console.log('Login successful');
            return { success: true, user: response };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: this.handleApiError(error) };
        }
    }

    static async signUpWithMobile(mobile, langCode = '1') {
        try {
            if (!validateMobile(mobile)) {
                throw new Error('رقم الهاتف غير صحيح');
            }

            console.log('Signup attempt for mobile:', sanitizeInput(mobile));

            const response = await jsonApiClient.request(
                API_CONFIG.ENDPOINTS.SIGNUP,
                'POST',
                {
                    mobile: sanitizeInput(mobile),
                    registerFrom: 1
                },
                { 'langCode': langCode }
            );

            console.log('Signup successful');
            return { success: true, user: response };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: this.handleApiError(error) };
        }
    }

    static async verifyOTP(userId, otp, langCode = '1') {
        try {
            if (!userId) {
                throw new Error('بيانات المستخدم مفقودة، حاول مرة أخرى.');
            }

            if (!validateOTP(otp)) {
                throw new Error('كود التحقق يجب أن يكون 6 أرقام');
            }

            console.log('OTP verification for user:', userId);

            // Build URL with query parameters
            const verifyUrl = `${API_CONFIG.ENDPOINTS.VERIFY_OTP}?userId=${encodeURIComponent(userId)}&otp=${encodeURIComponent(otp.trim())}`;

            const response = await jsonApiClient.request(
                verifyUrl,
                'POST',
                null, // No body data needed
                { 'langCode': langCode }
            );

            console.log('OTP verification successful');
            return { success: true, data: response };
        } catch (error) {
            console.error('OTP verification error:', error);
            return { success: false, error: this.handleApiError(error) };
        }
    }

    static async setPassword(userId, password, langCode = '1') {
        try {
            if (!userId) {
                throw new Error('بيانات المستخدم مفقودة، حاول مرة أخرى.');
            }

            const validation = validatePassword(password);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            console.log('Setting password for user:', userId);

            const response = await jsonApiClient.request(
                API_CONFIG.ENDPOINTS.SET_PASSWORD,
                'POST',
                {
                    userId: userId,
                    password: sanitizeInput(password)
                },
                { 'langCode': langCode }
            );

            console.log('Set password successful');
            return { success: true, userData: response };
        } catch (error) {
            console.error('Set password error:', error);
            return { success: false, error: this.handleApiError(error) };
        }
    }

    static async setPersonalInfo(token, personalData, langCode = '1') {
        try {
            if (!token) {
                throw new Error('رمز المصادقة مفقود');
            }

            const { firstName, lastName, birthDate, gender } = personalData;

            if (!firstName?.trim() || !lastName?.trim() || !birthDate || gender === undefined) {
                throw new Error('جميع الحقول مطلوبة');
            }

            const birthDateObj = new Date(birthDate);
            if (isNaN(birthDateObj.getTime()) || birthDateObj > new Date()) {
                throw new Error('تاريخ الميلاد غير صحيح');
            }

            console.log('Setting personal info');

            const response = await jsonApiClient.request(
                API_CONFIG.ENDPOINTS.USER_DATA,
                'PUT',
                {
                    firstName: sanitizeInput(firstName),
                    lastName: sanitizeInput(lastName),
                    birthdate: birthDate,
                    gender: parseInt(gender)
                },
                {
                    'langCode': langCode,
                    'Authorization': `Bearer ${token}`
                }
            );

            console.log('Set personal info successful');
            return { success: true, data: response };
        } catch (error) {
            console.error('Set personal info error:', error);
            return { success: false, error: this.handleApiError(error) };
        }
    }

    static handleApiError(error) {
        // Default fallback message
        let errorMessage = "حدث خطأ غير متوقع، حاول مرة أخرى.";

        // Check if it's a validation error with a specific message
        if (error instanceof Error && error.message) {
            // List of specific validation messages we want to show to users
            const validationMessages = [
                'رقم الهاتف غير صحيح',
                'كلمة المرور قصيرة جداً',
                'كود التحقق يجب أن يكون 6 أرقام',
                'بيانات المستخدم مفقودة، حاول مرة أخرى.',
                'رمز المصادقة مفقود',
                'جميع الحقول مطلوبة',
                'تاريخ الميلاد غير صحيح',
                'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
                'يجب أن تحتوي كلمة المرور على حرف صغير',
                'يجب أن تحتوي كلمة المرور على حرف كبير',
                'يجب أن تحتوي كلمة المرور على رقم',
                'كلمة المرور لا يمكن أن تحتوي على مسافات',
                'كلمة المرور تحتوي على أحرف غير مسموحة'
            ];

            // If the error message is in our validation list, show it
            if (validationMessages.includes(error.message)) {
                return error.message;
            }
        }

        // Handle API errors
        if (error instanceof ApiError) {
            switch (error.status) {
                case 400:
                    errorMessage = "بيانات غير صحيحة";
                    break;
                case 401:
                    errorMessage = "رقم الهاتف أو كلمة المرور غير صحيحة";
                    break;
                case 403:
                    errorMessage = "غير مسموح بهذا الإجراء";
                    break;
                case 404:
                    errorMessage = "المورد غير موجود";
                    break;
                case 408:
                    errorMessage = "انتهت مهلة الطلب، حاول مرة أخرى";
                    break;
                case 415:
                    errorMessage = "خطأ في تنسيق البيانات المرسلة";
                    break;
                case 422:
                    errorMessage = "بيانات غير صحيحة";
                    break;
                case 429:
                    errorMessage = "تم تجاوز الحد المسموح، حاول لاحقاً";
                    break;
                case 500:
                    errorMessage = "خطأ في الخادم، حاول مرة أخرى";
                    break;
                default:
                    errorMessage = "حدث خطأ غير متوقع، حاول مرة أخرى.";
            }
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = "خطأ في الشبكة، تحقق من اتصالك بالإنترنت";
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('API Error Details:', error);
        }

        return errorMessage;
    }
}