import { endpoints } from './endpoints';

const serverRequest = async (url, options = {}) => {
  // إنشاء AbortController للـ timeout بدلاً من AbortSignal.timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 ثواني timeout

  try {
    const config = {
      signal: controller.signal, // استخدام signal من AbortController
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Server/1.0',
        ...options.headers,
      }
    };

    console.log('🔍 Config:', JSON.stringify(config, null, 2));

    const response = await fetch(url, config);

    // مسح الـ timeout بعد نجاح الطلب
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success:', data);
    return data;
  } catch (error) {
    // مسح الـ timeout في حالة الخطأ
    clearTimeout(timeoutId);

    console.error('❌ Server API request failed:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API took too long to respond');
    }
    if (error.message === 'fetch failed') {
      throw new Error('Network error - Unable to connect to API. Check if the API is accessible and HTTPS is properly configured.');
    }

    throw error;
  }
};

export const serverGet = (url, options = {}) => serverRequest(url, {
  method: 'GET',
  next: { revalidate: 300 },
  ...options
});

export const serverPost = (url, body, options = {}) => serverRequest(url, {
  method: 'POST',
  body: JSON.stringify(body),
  ...options
});

export const serverGetHome = (locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.home, {
    headers: {
      'langCode': langCode,
    }
  });
};

export const serverGetProductBundle = (locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.productBundle, {
    headers: {
      'langCode': langCode,
    }
  });
};