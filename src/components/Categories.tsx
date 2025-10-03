import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiClient from '@/api/apiClient';
import { filterErrorMessage } from '../utils/errorMessageFilter';
import { useDynamicData } from '../contexts/DynamicDataContext';

/** Types */
type Category = {
  id: string | number;
  category_name: string;
  icon?: string;
  color?: string;
  language_id?: string | number | null;
  languageName?: string;
  slug?: string;
  description?: string;
  is_active?: number | boolean | "1" | "0";
};

type Language = {
  id: string | number;
  language_name: string;
  language_code: string;
  languageName?: string;
};

type NewsItem = {
  id: string;
  title: string;
  excerpt?: string;
  shortNewsContent?: string;
};

type ApiResponse<T> = {
  status: number;
  message: string;
  result: T[];
};

interface NewsResponse {
  status: number;
  result: {
    items: NewsItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
}

/** Fetch languages */
const fetchLanguages = async (): Promise<Language[]> => {
  const res = await apiClient.get<ApiResponse<Language>>("/news/languages");
  return Array.isArray(res.data?.result) ? res.data.result : [];
};

/** Join relative icon URLs to a base */
const resolveIconUrl = (src?: string): string | undefined => {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const base =
    (import.meta as any).env?.VITE_IMG_BASE_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    "";
  if (!base) return src;
  return `${String(base).replace(/\/$/, "")}/${String(src).replace(/^\//, "")}`;
};

/** Bubble */
const CategoryBubble = ({ category, t, selectedLanguage }: { category: Category; t: (key: string) => string; selectedLanguage: Language | null }) => {
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const navigate = useNavigate();
  const iconUrl = resolveIconUrl(category.icon);
  const showImg = !!iconUrl && !imgError;

  const fetchNewsForDropdown = async () => {
    if (!category.id || !selectedLanguage?.id) {
      console.log(`[Categories.tsx] Cannot fetch news - missing category ID or language ID`);
      return;
    }

    try {
      setDropdownLoading(true);
      console.log(`[Categories.tsx] Fetching news for dropdown: ${category.category_name} (ID: ${category.id})`);
      console.log(`[Categories.tsx] Using language: ${selectedLanguage.language_name} (ID: ${selectedLanguage.id})`);
      
      const res = await apiClient.get<NewsResponse>(
        '/news/filter-multi-categories',
        {
          params: { 
            categoryIds: category.id, 
            language_id: selectedLanguage.id,
            limit: 5, 
            page: 1 
          },
        }
      );

      console.log(`[Categories.tsx] API response:`, res.data);

      if (res.data.status === 1 && res.data.result && res.data.result.items) {
        setNewsItems(res.data.result.items);
        console.log(`[Categories.tsx] Found ${res.data.result.items.length} news items for dropdown`);
      } else {
        setNewsItems([]);
        console.log(`[Categories.tsx] No news found for category ${category.category_name}. Status: ${res.data.status}`);
      }
    } catch (err) {
      console.error("Error fetching news for dropdown:", err);
      setNewsItems([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleCardClick = async () => {
    if (!category.id) return;

    try {
      setLoading(true);

      interface NewsApiResponse {
        status: number;
        message: string;
        result: { items: NewsItem[] };
      }

      // Get current language ID from the selected language
      const languageId = selectedLanguage?.id;

      console.log(`[Categories.tsx] Fetching news for category: ${category.category_name} (ID: ${category.id})`);
      console.log(`[Categories.tsx] Using language ID: ${languageId}`);
      
      // Special handling for International, National, and Breaking News categories
      if (category.category_name?.toLowerCase().includes('international') || 
          category.category_name?.toLowerCase().includes('world') ||
          category.category_name?.toLowerCase().includes('global')) {
        console.log(`[Categories.tsx] Detected International/World/Global category, using enhanced search...`);
      }
      
      if (category.category_name?.toLowerCase().includes('national') || 
          category.category_name?.toLowerCase().includes('india') ||
          category.category_name?.toLowerCase().includes('domestic')) {
        console.log(`[Categories.tsx] Detected National/India/Domestic category, using enhanced search...`);
      }
      
      if (category.category_name?.toLowerCase().includes('breaking') || 
          category.category_name?.toLowerCase().includes('urgent') ||
          category.category_name?.toLowerCase().includes('latest') ||
          category.category_name?.toLowerCase().includes('flash')) {
        console.log(`[Categories.tsx] Detected Breaking/Urgent/Latest/Flash category, using enhanced search...`);
      }

      // First, try with the specific category ID
      let res = await apiClient.get<NewsApiResponse>(
        '/news/filter-multi-categories',
        {
          params: { 
            categoryIds: category.id, 
            language_id: languageId,
            limit: 1, 
            page: 1 
          },
        }
      );

      // If no news found with specific category, show appropriate message
      if (res.data.status === 1 && res.data.result.items.length === 0) {
        console.log(`[Categories.tsx] No news found for specific category ${category.category_name}`);
      }

      if (res.data.status === 1 && res.data.result.items.length > 0) {
        const firstNews = res.data.result.items[0];
        console.log(`[Categories.tsx] Found news item: ${firstNews.title} (ID: ${firstNews.id})`);
        navigate(`/news/${firstNews.id}`);
      } else {
        console.log(`[Categories.tsx] No news found for category ${category.category_name}`);
        // Show a more informative message
        const message = t("news.noNewsAvailable") || `No news available for ${category.category_name} category. Please try another category.`;
        alert(message);
      }
    } catch (err) {
      console.error("Error fetching news for category:", err);
      alert(t("news.errorLoadingNews"));
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setShowDropdown(true);
    if (newsItems.length === 0) {
      if (selectedLanguage?.id) {
        console.log(`[Categories.tsx] Mouse entered category ${category.category_name}, fetching news...`);
        fetchNewsForDropdown();
      } else {
        console.log(`[Categories.tsx] Mouse entered category ${category.category_name}, but no language selected yet. Will retry in 1 second...`);
        // Retry after a short delay in case the language is still loading
        setTimeout(() => {
          if (selectedLanguage?.id && newsItems.length === 0) {
            console.log(`[Categories.tsx] Retrying news fetch for ${category.category_name}...`);
            fetchNewsForDropdown();
          }
        }, 1000);
      }
    }
  };

  const handleMouseLeave = () => {
    setShowDropdown(false);
  };

  // Refetch news when language changes
  React.useEffect(() => {
    if (selectedLanguage?.id && newsItems.length > 0) {
      console.log(`[Categories.tsx] Language changed, refetching news for ${category.category_name}`);
      fetchNewsForDropdown();
    }
  }, [selectedLanguage?.id]);

  return (
    <div
      className="flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] group flex flex-col items-center cursor-pointer transform transition-all duration-300 hover:scale-110 snap-center relative"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl flex items-center justify-center mb-3 sm:mb-4 overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 group-hover:border-white"
        style={{
          backgroundColor: category.color || "#3b82f6",
          boxShadow: `0 8px 25px ${(category.color || "#3b82f6")}40`,
        }}
        aria-label={category.category_name}
      >
        {showImg ? (
          <img
            src={iconUrl}
            alt={category.category_name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover" // ✅ makes image fill circle properly
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-white font-bold text-lg xs:text-xl sm:text-2xl md:text-3xl drop-shadow-lg select-none">
            {category.category_name?.charAt(0) ?? "?"}
          </span>
        )}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="text-center">
        <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
          {loading ? t("common.loading") : category.category_name}
        </h3>
      </div>

      {/* News Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
              {category.category_name} News
            </h4>
          </div>
          
          {dropdownLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading news...</p>
            </div>
          ) : newsItems.length > 0 ? (
            <div className="p-2">
              {newsItems.map((news) => (
                <div
                  key={news.id}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/news/${news.id}`);
                    setShowDropdown(false);
                  }}
                >
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                    {news.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {news.excerpt || news.shortNewsContent || 'No description available'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No news available for this category
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get dynamic data from context
  const {
    languages,
    categories,
    selectedLanguage,
    loadingLanguages,
    loadingCategories,
    errorLanguages,
    errorCategories,
    getCurrentLanguageId,
  } = useDynamicData();

  // Debug logging
  React.useEffect(() => {
    console.log('[Categories] Component rendered with:', {
      selectedLanguage: selectedLanguage?.language_name,
      categoriesCount: categories.length,
      loadingLanguages,
      loadingCategories
    });
  }, [selectedLanguage, categories.length, loadingLanguages, loadingCategories]);

  // Categories are now provided by the dynamic data context

  /** Auto-scroll */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || categories.length === 0) return;
    const scrollSpeed = 0.5;
    let animationFrame = 0;
    const scroll = () => {
      container.scrollLeft += scrollSpeed;
      if (
        container.scrollLeft >=
        container.scrollWidth - container.clientWidth
      ) {
        container.scrollLeft = 0;
      }
      animationFrame = requestAnimationFrame(scroll);
    };
    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [categories]);

  /** Loading */
  if (loadingCategories) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white font-mandali">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("categories.title")}
          </h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-700 dark:text-gray-300">
            {t("categories.loading")}
          </span>
        </div>
      </section>
    );
  }

  /** Error */
  if (errorCategories) {
    console.error('Categories error:', errorCategories);
    
    // Ensure we never show "Service Temporarily Unavailable" message
    let errorMessage = errorCategories || t("categories.error");
    errorMessage = filterErrorMessage(errorMessage);
    
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white font-mandali">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("categories.title")}
          </h2>
          <div className="flex flex-col items-center justify-center h-32">
            <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
            <span className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              {errorMessage}
            </span>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!selectedLanguage) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white font-mandali">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("categories.title")}
          </h2>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-gray-700 dark:text-gray-300">
              Loading default selections...
            </span>
          </div>
        </div>
      </section>
    );
  }

  // Handle case when no categories are available
  if (categories.length === 0 && !loadingCategories) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white font-mandali">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("categories.title")}
          </h2>
          <div className="flex flex-col items-center justify-center h-32">
            <AlertCircle className="h-8 w-8 mb-3 text-yellow-500" />
            <span className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              {t("categories.noCategories")}
            </span>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section
      id="categories"
      className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 font-mandali scroll-mt-20 sm:scroll-mt-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {t("categories.title")}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("categories.subtitle")}
          </p>
          <div className="w-16 sm:w-24 h-1 bg-blue-600 mx-auto mt-3 sm:mt-4 rounded-full"></div>
        </div>

        {/* Smooth auto-scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {categories.map((category) => (
            <CategoryBubble key={category.id} category={category} t={t} selectedLanguage={selectedLanguage} />
          ))}
        </div>

        {/* Dots Animation */}
        <div className="flex justify-center mt-8 sm:mt-12 space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </section>
  );
};

export default Categories;