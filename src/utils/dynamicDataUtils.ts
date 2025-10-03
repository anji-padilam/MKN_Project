import apiClient from '../api/apiClient';

// Type definitions
export interface Language {
  id: string;
  language_name: string;
  language_code: string;
  icon: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

export interface State {
  id: string;
  state_name: string;
  state_code: string;
  language_id: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

export interface District {
  id: string;
  name: string;
  language_id: string;
  state_id: string;
  icon: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  category_name: string;
  language_id: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  result: T[];
}

// Cache configuration - now using session storage

// Helper function to get direct API URL
const getDirectApiUrl = (endpoint: string, params: Record<string, any>): string => {
  const baseUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news';
  
  // Map our internal endpoints to the actual API endpoints
  const endpointMap: Record<string, string> = {
    '/api/languages': '/languages',
    '/api/states': '/states', 
    '/api/districts': '/districts',
    '/api/categories': '/categories'
  };
  
  const actualEndpoint = endpointMap[endpoint] || endpoint;
  const url = new URL(`${baseUrl}${actualEndpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

// Main data fetching function with session storage caching
export const fetchAndCacheData = async <T>(
  apiEndpoint: string,
  params: Record<string, any> = {},
  cacheKey: string
): Promise<T[]> => {
  // Create a unique cache key that includes the parameters
  const fullCacheKey = `${cacheKey}-${JSON.stringify(params)}`;
  const cachedData = sessionStorage.getItem(fullCacheKey);
  const cachedTimestamp = sessionStorage.getItem(`${fullCacheKey}_timestamp`);

  // Check if we have valid cached data
  if (cachedData && cachedTimestamp) {
    const now = new Date().getTime();
    const timestamp = parseInt(cachedTimestamp, 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - timestamp < twentyFourHours) {
      console.log(`[DynamicData] Using cached data for ${cacheKey}`);
      return JSON.parse(cachedData);
    } else {
      console.log(`[DynamicData] Cache expired for ${cacheKey}`);
      sessionStorage.removeItem(fullCacheKey);
      sessionStorage.removeItem(`${fullCacheKey}_timestamp`);
    }
  }

  // In development mode, use direct API calls
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    console.log(`[DynamicData] Development mode: Using direct API for ${cacheKey}`);
    try {
      const directUrl = getDirectApiUrl(apiEndpoint, params);
      console.log(`[DynamicData] Direct API URL: ${directUrl}`);
      
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!directResponse.ok) {
        throw new Error(`Direct API failed with status: ${directResponse.status}`);
      }
      
      const directData = await directResponse.json();
      
      if (directData.status === 1 && Array.isArray(directData.result)) {
        const filteredData = directData.result.filter((item: any) => 
          item.is_deleted !== 1 && item.is_active === 1
        );
        
        console.log(`[DynamicData] Fetched ${filteredData.length} ${cacheKey} from direct API`);
        
        // Cache the data in session storage
        sessionStorage.setItem(fullCacheKey, JSON.stringify(filteredData));
        sessionStorage.setItem(`${fullCacheKey}_timestamp`, new Date().getTime().toString());
        
        return filteredData;
      } else {
        throw new Error(`Invalid direct API response format for ${cacheKey}`);
      }
    } catch (error: any) {
      console.error(`[DynamicData] Direct API failed for ${cacheKey}:`, error);
      throw new Error(`Direct API failed: ${error.message}`);
    }
  }

  // In production, try our API route first, then fallback to direct API
  try {
    console.log(`[DynamicData] Production mode: Trying API route for ${cacheKey}:`, apiEndpoint, params);
    
    // Try our API route first
    const response = await apiClient.get<ApiResponse<T>>(apiEndpoint, { params });
    
    if (response.data.status === 1 && Array.isArray(response.data.result)) {
      const filteredData = response.data.result.filter((item: any) => 
        item.is_deleted !== 1 && item.is_active === 1
      );
      
      console.log(`[DynamicData] Fetched ${filteredData.length} ${cacheKey} from API route`);
      
      // Cache the data in session storage
      sessionStorage.setItem(fullCacheKey, JSON.stringify(filteredData));
      sessionStorage.setItem(`${fullCacheKey}_timestamp`, new Date().getTime().toString());
      
      return filteredData;
    } else {
      throw new Error(`Invalid response format for ${cacheKey}: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error(`[DynamicData] API route failed for ${cacheKey}, trying direct API:`, error);
    
    // Fallback to direct API call
    try {
      const directUrl = getDirectApiUrl(apiEndpoint, params);
      console.log(`[DynamicData] Trying direct API: ${directUrl}`);
      
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!directResponse.ok) {
        throw new Error(`Direct API failed with status: ${directResponse.status}`);
      }
      
      const directData = await directResponse.json();
      
      if (directData.status === 1 && Array.isArray(directData.result)) {
        const filteredData = directData.result.filter((item: any) => 
          item.is_deleted !== 1 && item.is_active === 1
        );
        
        console.log(`[DynamicData] Fetched ${filteredData.length} ${cacheKey} from direct API`);
        
        // Cache the data in session storage
        sessionStorage.setItem(fullCacheKey, JSON.stringify(filteredData));
        sessionStorage.setItem(`${fullCacheKey}_timestamp`, new Date().getTime().toString());
        
        return filteredData;
      } else {
        throw new Error(`Invalid direct API response format for ${cacheKey}`);
      }
    } catch (directError: any) {
      console.error(`[DynamicData] Direct API also failed for ${cacheKey}:`, directError);
      throw new Error(`Both API routes failed: ${error.message || directError.message}`);
    }
  }
};

// Helper function to create a comprehensive search string
const createSearchString = (category: Category): string => {
  return [
    category.category_name,
    category.slug,
    category.description || '',
    // Add common variations
    category.category_name.replace(/[^\w\s]/g, ''), // Remove special characters
    category.slug.replace(/[^\w\s]/g, ''), // Remove special characters
  ].join(' ').toLowerCase();
};

// Category matching function - precise matching to avoid cross-contamination
export const getCategoryIdsByType = (categories: Category[], type: string): string[] => {
  const typeLower = type.toLowerCase();
  
  console.log(`[DynamicData] getCategoryIdsByType called with type: ${type}`);
  console.log(`[DynamicData] Available categories:`, categories.map(cat => ({
    id: cat.id,
    name: cat.category_name,
    slug: cat.slug,
    description: cat.description,
    language_id: cat.language_id
  })));
  
  const matchedCategories = categories.filter(category => {
    const name = category.category_name.toLowerCase();
    const slug = category.slug.toLowerCase();
    
    // Precise matching based on category type to avoid cross-contamination
    switch (typeLower) {
      case 'breaking':
        // Match categories that are specifically for breaking news
        const breakingPatterns = [
          'breaking news', 'breaking', 'urgent', 'latest', 'flash', 'alert', 'emergency', 'headlines', 'bulletin',
          'తాజా వార్తలు', 'తాజా', 'అత్యవసర', 'ఫ్లాష్', 'అలర్ట్', 'అత్యవసరం', 'వార్తలు', 'బ్రేకింగ్', 'బ్రేకింగ్ న్యూస్',
          'ब्रेकिंग न्यूज', 'ताजा', 'अत्यावश्यक', 'फ्लैश', 'अलर्ट', 'आपातकाल', 'समाचार', 'ताजा समाचार', 'ब्रेकिंग',
          'ತಾಜಾ ಸುದ್ದಿ', 'ತಾಜಾ', 'ತುರ್ತು', 'ಫ್ಲ್ಯಾಶ್', 'ಅಲರ್ಟ್', 'ಅತ್ಯಾವಶ್ಯಕ', 'ಸುದ್ದಿ', 'ಬ್ರೇಕಿಂಗ್', 'ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್',
          'பிரேக்கிங் நியூஸ்', 'பிரேக்கிங்', 'புதிய', 'அவசர', 'ஃபிளாஷ்', 'எச்சரிக்கை', 'அவசரம்', 'செய்தி', 'புதிய செய்தி',
          'بریکنگ نیوز', 'بریکنگ', 'تازہ', 'فوری', 'فلیش', 'الرٹ', 'ہنگامی', 'خبریں', 'تازہ خبریں'
        ];
        
        return breakingPatterns.some(pattern => 
          name.includes(pattern.toLowerCase()) || 
          slug.includes(pattern.toLowerCase())
        );
        
      case 'business':
        // Only match categories that are specifically for business
        return (
          name === 'business' ||
          name === 'economy' ||
          name === 'finance' ||
          slug === 'business' ||
          slug === 'economy' ||
          slug === 'finance' ||
          name.includes('business') ||
          name.includes('economy') ||
          name.includes('finance') ||
          name.includes('వ్యాపార') ||
          name.includes('व्यापार') ||
          name.includes('ವ್ಯಾಪಾರ') ||
          name.includes('வணிகம்') ||
          name.includes('کاروبار')
        );
        
      case 'politics':
        // Only match categories that are specifically for politics
        return (
          name === 'politics' ||
          name === 'political' ||
          slug === 'politics' ||
          slug === 'political' ||
          name.includes('politics') ||
          name.includes('political') ||
          name.includes('రాజకీయ') ||
          name.includes('राजनीति') ||
          name.includes('ರಾಜಕೀಯ') ||
          name.includes('அரசியல்') ||
          name.includes('سیاست')
        );
        
      case 'technology':
        // Only match categories that are specifically for technology
        return (
          name === 'technology' ||
          name === 'tech' ||
          slug === 'technology' ||
          slug === 'tech' ||
          name.includes('technology') ||
          name.includes('tech') ||
          name.includes('టెక్నాలజీ') ||
          name.includes('प्रौद्योगिकी') ||
          name.includes('ತಂತ್ರಜ್ಞಾನ') ||
          name.includes('தொழில்நுட்பம்') ||
          name.includes('ٹیکنالوجی')
        );
        
      case 'entertainment':
        // Only match categories that are specifically for entertainment
        return (
          name === 'entertainment' ||
          name === 'movies' ||
          name === 'music' ||
          slug === 'entertainment' ||
          slug === 'movies' ||
          slug === 'music' ||
          name.includes('entertainment') ||
          name.includes('movies') ||
          name.includes('music') ||
          name.includes('వినోదం') ||
          name.includes('मनोरंजन') ||
          name.includes('ಮನೋರಂಜನೆ') ||
          name.includes('பொழுதுபோக்கு') ||
          name.includes('تفریح')
        );
        
      case 'sports':
        // Only match categories that are specifically for sports
        return (
          name === 'sports' ||
          name === 'sport' ||
          slug === 'sports' ||
          slug === 'sport' ||
          name.includes('sports') ||
          name.includes('sport') ||
          name.includes('క్రీడలు') ||
          name.includes('खेल') ||
          name.includes('ಕ್ರೀಡೆ') ||
          name.includes('விளையாட்டு') ||
          name.includes('کھیل')
        );
        
      default:
        // For any other type, use basic matching
        return (
          name.includes(typeLower) ||
          slug.includes(typeLower)
        );
    }
  });
  
  const categoryIds = matchedCategories.map(cat => cat.id);
  console.log(`[DynamicData] Matched ${matchedCategories.length} categories for type '${type}':`, matchedCategories.map(cat => ({
    id: cat.id,
    name: cat.category_name,
    slug: cat.slug,
    language_id: cat.language_id
  })));
  console.log(`[DynamicData] Category IDs:`, categoryIds);
  
  return categoryIds;
};

// Debug function for category matching
export const debugCategoryMatching = (categories: Category[], type: string) => {
  console.log(`[DynamicData] Debugging category matching for type: ${type}`);
  console.log(`[DynamicData] Available categories:`, categories.map(cat => ({
    id: cat.id,
    name: cat.category_name,
    slug: cat.slug,
    description: cat.description
  })));
  
  const matched = getCategoryIdsByType(categories, type);
  console.log(`[DynamicData] Matched category IDs for ${type}:`, matched);
  
  return matched;
};