export const BASE_URL = 'https://api.lajolie-eg.com/api';
export const endpoints = {

// Banners
home:`${BASE_URL}/Home`,
  productBundle: `${BASE_URL}/ProductBundle?pageNo=1&pageSize=20`,
  // Auth (if you have auth endpoints)
  auth: {
    signin: `${BASE_URL}/auth/signin`,
    sendOTP: `${BASE_URL}/auth/otp/send`,
    verifyOTP: `${BASE_URL}/auth/otp/verify`,
    refresh: `${BASE_URL}/auth/refresh`,
    profile: `${BASE_URL}/auth/profile`,
  },
  
  // Cart & Favorites (if available)
  cart: `${BASE_URL}/cart`,
  favorites: `${BASE_URL}/favorites`,
};
