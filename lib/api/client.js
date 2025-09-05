// lib/api/client.js
import { cache } from 'react';

class OptimizedApiClient {
  constructor() {
    this.baseURL = 'https://api.lajolie-eg.com/api';
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Cleanup cache periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupCache(), this.cacheTimeout);
    }
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size > this.cacheMaxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.cacheMaxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Cached request method for server components
  cachedRequest = cache(async (url, options = {}) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Check cache with timestamp
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        next: { revalidate: 300, tags: ['products', 'categories'] }, // 5min cache
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store with timestamp
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Cleanup if cache is getting too large
      if (this.cache.size > this.cacheMaxSize) {
        this.cleanupCache();
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  });

  // Client-side request with proper error handling
  async clientRequest(url, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Client API request failed:', error);
      throw error;
    }
  }

  // Server-side methods (cached)
  async getCategoryFilters(categoryId, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    return this.cachedRequest(
      `${this.baseURL}/AdvancedSearch/getBasicData?categoryId=${categoryId}`,
      {
        headers: { langCode },
        next: { revalidate: 3600, tags: [`category-${categoryId}`] }, // 1hr cache
      }
    );
  }

  async getFilteredProducts(filters, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    
    console.log('Server getFilteredProducts - sending filters in body:', filters);
    
    return this.cachedRequest(
      `${this.baseURL}/AdvancedSearch/getFilteredProducts`,
      {
        method: 'POST',
        body: JSON.stringify(filters),
        headers: { 
          'Content-Type': 'application/json',
          langCode 
        },
        next: { revalidate: 180, tags: [`products-${filters.categoryId}`] }, // 3min cache
      }
    );
  }

  // Client-side methods (non-cached, for interactions)
  async clientGetFilteredProducts(filters, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    
    console.log('Client getFilteredProducts - sending filters in body:', filters);
    
    return this.clientRequest(`${this.baseURL}/AdvancedSearch/getFilteredProducts`, {
      method: 'POST',
      body: JSON.stringify(filters),
      headers: { 
        'Content-Type': 'application/json',
        langCode 
      },
    });
  }
}

export const apiClient = new OptimizedApiClient();