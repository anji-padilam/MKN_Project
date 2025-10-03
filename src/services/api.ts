
import axios from 'axios';

// Reusable function to fetch news by category and language
export const fetchNewsByCategory = async (languageId: string, categoryId: string, limit: number = 20, page: number = 1) => {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
    
    const res = await axios.get(`${API_BASE}/news/filter-multi-categories`, {
      params: { 
        categoryIds: categoryId,
        language_id: languageId,
        limit,
        page
      }
    });
    
    console.log(`[fetchNewsByCategory] Fetched news for categoryId: ${categoryId}, languageId: ${languageId}`, res.data);
    
    if (res.data.status === 1 && res.data.result && res.data.result.items) {
      return res.data.result.items;
    } else {
      console.log(`[fetchNewsByCategory] No news found for categoryId: ${categoryId}, languageId: ${languageId}`);
      return [];
    }
  } catch (err) {
    console.error(`[fetchNewsByCategory] Error fetching news for categoryId: ${categoryId}, languageId: ${languageId}:`, err);
    return [];
  }
};

// Simple fallback data
const fallbackData = {
  languages: [
    { id: 'en', languageName: 'English', code: 'en', icon: '🇺🇸', is_active: 1 },
    { id: 'te', languageName: 'Telugu', code: 'te', icon: '🇮🇳', is_active: 1 },
    { id: 'hi', languageName: 'Hindi', code: 'hi', icon: '🇮🇳', is_active: 1 }
  ],
  categories: [
    { id: '1', name: 'General', language_id: 'en', icon: '📰', color: '#3B82F6', is_active: 1 }
  ],
  states: [
    { id: '1', stateName: 'Telangana', language_id: 'en', isDeleted: 0, is_active: 1 }
  ],
  districts: [
    { id: '1', districtName: 'Hyderabad', state_id: '1', isDeleted: 0, is_active: 1 }
  ],
  newsItems: [
    {
      id: 'fallback-1',
      title: 'Service temporarily unavailable',
      shortNewsContent: 'Please check back later for the latest news.',
      media: [{ mediaUrl: '/placeholder.svg' }],
      categoryName: 'General',
      districtName: 'Unknown',
      stateName: 'Unknown',
      readTime: '1',
      authorName: 'System',
      createdAt: new Date().toISOString()
    }
  ]
};

// Centralized API configuration
const API_BASE_URL = 
  (import.meta as any).env?.API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1";

// Determine the base URL based on environment
const getBaseURL = () => {
  // In development, use the proxy
  if (import.meta.env.DEV) {
    return "/api";
  }
  // In production, use the direct API URL
  return API_BASE_URL;
};

// Create a centralized API client
const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add JWT token to all requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('JWT token added to request');
    } else {
      console.log('No JWT token found in localStorage');
    }
    
    // Add any request modifications here if needed
    console.log('Making API request to:', config.url);
    console.log('Full URL:', config.baseURL + config.url);
    
    // Add mobile-specific headers for better debugging
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      config.headers['X-Client-Type'] = 'mobile';
      config.headers['X-User-Agent'] = userAgent;
      console.log('Mobile device detected, adding mobile headers');
    } else {
      config.headers['X-Client-Type'] = 'desktop';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    const err = error as any;
    
    // Suppress 404 errors for comments API (not implemented yet)
    if (err?.response?.status === 404 && err?.config?.url?.includes('/comments')) {
      // Don't log 404 errors for comments API
    } else {
      console.error("API Error:", {
        message: err?.message,
        url: err?.config?.url,
        status: err?.response?.status,
        data: err?.response?.data,
        type: err?.type
      });
    }

    // Handle CORS errors specifically
    if (err?.message?.includes('CORS') || err?.code === 'ERR_BLOCKED_BY_CLIENT' || err?.message?.includes('Access-Control-Allow-Origin')) {
      console.warn('CORS error detected, this should be handled by the proxy');
      return Promise.reject({
        message: "Connection error. Please refresh the page and try again.",
        status: 0,
        type: 'CORS_ERROR'
      });
    }

    // Handle different error types
    if (err?.code === 'ERR_NETWORK') {
      return Promise.reject({
        message: "Network error. Please check your internet connection.",
        status: 0,
        type: 'NETWORK_ERROR'
      });
    }

    if (err?.response?.status === 404) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Suppress 404 error details for comments API
      if (!err?.config?.url?.includes('/comments')) {
        console.error('404 Error Details:', {
          url: err?.config?.url,
          method: err?.config?.method,
          headers: err?.config?.headers,
          userAgent: navigator.userAgent,
          isMobile: isMobile
        });
      }
      
      // Provide more helpful error messages for mobile users
      let errorMessage = "Service temporarily unavailable. Please try again later.";
      if (isMobile && err?.config?.url?.includes('forgot-password')) {
        errorMessage = "Unable to send OTP. Please check your internet connection and try again.";
      } else if (isMobile && err?.config?.url?.includes('verify-code')) {
        errorMessage = "Unable to verify OTP. Please check your internet connection and try again.";
      } else if (isMobile && err?.config?.url?.includes('reset-password')) {
        errorMessage = "Unable to reset password. Please check your internet connection and try again.";
      } else if (isMobile) {
        errorMessage = "Connection issue detected. Please check your internet and try again.";
      }
      
      return Promise.reject({
        message: errorMessage,
        status: 404,
        type: 'NOT_FOUND',
        details: {
          url: err?.config?.url,
          isMobile: isMobile
        }
      });
    }

    if (err?.response?.status === 500) {
      return Promise.reject({
        message: "Server error. Please try again later.",
        status: 500,
        type: 'SERVER_ERROR'
      });
    }

    if (err?.response?.status === 403) {
      return Promise.reject({
        message: "Access denied. Please check your permissions.",
        status: 403,
        type: 'FORBIDDEN'
      });
    }

    // Handle timeout errors
    if (err?.code === 'ECONNABORTED') {
      return Promise.reject({
        message: "Request timeout. Please try again.",
        status: 0,
        type: 'TIMEOUT_ERROR'
      });
    }

    return Promise.reject(
      err?.response?.data || { 
        message: "Something went wrong. Please try again later.",
        status: err?.response?.status || 0,
        type: 'UNKNOWN_ERROR'
      }
    );
  }
);

export interface Language {
  id: string;
  languageName: string;
  code: string;
  icon: string;
  is_active: number;
}

export interface NewsCategory {
  id: string;
  name: string;
  language_id: string;
  icon: string;
  color: string;
  is_active: number;
}

export interface State {
  id: string;
  stateName: string;
  language_id: string;
  isDeleted: number;
  is_active: number;
}

export interface District {
  id: string;
  districtName: string;
  state_id: string;
  isDeleted: number;
  is_active: number;
}

export interface LocalMandiCategory {
  id: string;
  categoryName: string;
  categoryIcon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  shortNewsContent: string;
  media: { mediaUrl: string }[];
  categoryName: string;
  districtName: string;
  stateName: string;
  readTime: string;
  authorName: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  result: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Exact types for /states API response items
interface StateApiItem {
  id: string;
  name: string;
  code: string;
  language_id: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
}

type StatesApiResponse = ApiResponse<PaginatedResponse<StateApiItem>>;

// Retry function for failed requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on network errors or 5xx errors
      if (error?.type === 'NETWORK_ERROR' || (error?.status >= 500 && error?.status < 600)) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// API service functions
export const apiService = {
  // 1. Languages Dropdown
  async getLanguages(): Promise<Language[]> {
    try {
      const response = await retryRequest(async () => 
        await apiClient.get<ApiResponse<Language[]>>('/data?type=languages')
      );
      return response.data.result || [];
    } catch (error: any) {
      console.error('Error fetching languages:', error);
      console.warn('Using fallback data for languages');
      return fallbackData.languages as Language[];
    }
  },

  // 2. News Categories Dropdown
  async getNewsCategories(language_id: string): Promise<NewsCategory[]> {
    try {
      const response = await retryRequest(async () => 
        await apiClient.get<ApiResponse<NewsCategory[]>>(`/data?type=categories&language_id=${language_id}`)
      );
      return response.data.result || [];
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      console.warn('Using fallback data for categories');
      return fallbackData.categories as NewsCategory[];
    }
  },

  // 3. States List
  async getStates(language_id: string): Promise<State[]> {
    try {
      const response = await retryRequest(async () =>
        await apiClient.get<StatesApiResponse>(`/data?type=states&language_id=${language_id}`)
      );
      const items = response.data.result?.items || response.data.result || [];
      return items.map((s: StateApiItem) => ({
        id: s.id,
        stateName: s.name,
        language_id: s.language_id,
        isDeleted: s.isDeleted ? 1 : 0,
        is_active: s.is_active ? 1 : 0,
      }));
    } catch (error: any) {
      console.error('Error fetching states:', error);
      console.warn('Using fallback data for states');
      return fallbackData.states as State[];
    }
  },

  // 4. Districts List
  async getDistricts(language_id: string): Promise<District[]> {
    try {
      const response = await retryRequest(async () => 
        await apiClient.get<ApiResponse<District[]>>(`/data?type=districts&language_id=${language_id}`)
      );
      return response.data.result?.filter(district => district.isDeleted !== 1) || [];
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      console.warn('Using fallback data for districts');
      return fallbackData.districts as District[];
    }
  },

  // 5. Local Mandi Categories
  async getLocalMandiCategories(): Promise<LocalMandiCategory[]> {
    try {
      const response = await retryRequest(async () => 
        await apiClient.get<ApiResponse<{ items: LocalMandiCategory[] }>>('/local-mandi-categories')
      );
      return response.data.result?.items || [];
    } catch (error: any) {
      console.error('Error fetching local mandi categories:', error);
      return [];
    }
  },

  // Breaking News Section
  async getBreakingNews(): Promise<NewsItem[]> {
    try {
      const response = await retryRequest(async () => 
        await apiClient.get<ApiResponse<PaginatedResponse<NewsItem>>>('/news/filter-advanced')
      );
      return response.data.result?.items || [];
    } catch (error: any) {
      console.error('Error fetching breaking news:', error);
      console.warn('Using fallback data for breaking news');
      return fallbackData.newsItems as NewsItem[];
    }
  }
};

// Export the centralized API client
export default apiClient;
