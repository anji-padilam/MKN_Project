import React, { useState, useEffect } from 'react';
import { Clock, User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { fetchNewsByCategory } from '@/services/api';
import { formatTimeAgo } from "@/utils/timeUtils";
import { useDynamicData } from '../contexts/DynamicDataContext';

interface NewsItem {
  id: string;
  title: string;
  shortNewsContent?: string;
  excerpt?: string;
  categoryName?: string;
  authorName?: string;
  createdAt: string;
  publishedAt?: string;
  districtName?: string;
  media?: Array<{
    mediaUrl: string;
    mediaType: string;
  }>;
  source?: string;
}

interface NewsResponse {
  status: number;
  result: {
    items: NewsItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
}

// Removed hardcoded language mapping - now using dynamic data context

const PoliticsNews: React.FC = () => {
  const { t } = useTranslation();
  const [politicsNews, setPoliticsNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get dynamic data from context
  const {
    selectedLanguage,
    categories,
    getCurrentLanguageId,
    getCategoryIdsByType,
  } = useDynamicData();

  const language_id = getCurrentLanguageId();

  const fetchNews = async () => {
    if (!language_id || !categories.length) return;

    setLoading(true);
    setError(null);

    try {
      // Get politics category IDs dynamically using the context function
      const politicsCategoryIds = getCategoryIdsByType('politics');

      if (!politicsCategoryIds || politicsCategoryIds.length === 0) {
        console.log('[PoliticsNews] No politics categories found');
        setPoliticsNews([]);
        return;
      }

      console.log('[PoliticsNews] Found politics categories:', politicsCategoryIds);

      // Fetch news for all politics categories
      const allNews = [];
      for (const categoryId of politicsCategoryIds) {
        const news = await fetchNewsByCategory(language_id, categoryId, 9, 1);
        allNews.push(...news);
      }
      
      setPoliticsNews(allNews.slice(0, 9)); // Take only first 9 items
      console.log('[PoliticsNews] Fetched politics news:', allNews.length, 'items');
    } catch (err) {
      console.error('[PoliticsNews] Error fetching politics news:', err);
      setError('Failed to fetch politics news');
      setPoliticsNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [language_id, categories]);


  const handleCardClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  if (loading) {
    return (
      <section id="politics" className="font-mandali py-8 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mb-3 sm:mb-4" />
            <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg">{t('loading.newsLoading')}</span>
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 w-full">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="h-40 sm:h-48 md:h-52 lg:h-56 xl:h-60 bg-gray-200 animate-pulse"></div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="h-4 sm:h-5 md:h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse mb-3 sm:mb-4 w-3/4"></div>
                    <div className="flex justify-between gap-2">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-12 sm:w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="politics" className="font-mandali py-8 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <div className="text-center">
              <div className="text-red-600 text-base sm:text-lg mb-2">{t('errors.newsLoadErrorTitle')}</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md text-sm sm:text-base px-4">{error}</p>
              <button
                onClick={fetchNews}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                {loading ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="politics" className="font-mandali py-8 sm:py-12 bg-gray-50 dark:bg-gray-800 scroll-mt-24">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('headings.politicsLatestNews')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('headings.latestUpdates')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {politicsNews.map((news) => {
            const imageUrl = news.media && news.media.length > 0
              ? news.media[0].mediaUrl
              : '/lovable-uploads/RRKCR5.webp';
            const summary = news.shortNewsContent || news.excerpt || t('labels.noDetails');
            const category = news.categoryName || t('labels.defaultCategory');
            const author = news.authorName || t('labels.unknownAuthor');
            const timeAgo = formatTimeAgo(news.createdAt, { t });

            return (
              <Card
                key={news.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-1 mobile-card"
                onClick={() => handleCardClick(news.id)}
              >
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={news.title}
                    className="w-full h-40 sm:h-48 md:h-52 lg:h-56 xl:h-60 object-cover group-hover:scale-105 transition-transform duration-300 mobile-image"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/lovable-uploads/RRKCR5.webp';
                      target.onerror = null; // Prevent infinite loop
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                    <span className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium line-clamp-1">
                      {category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-3 sm:p-4 md:p-6 mobile-content">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                    {summary}
                  </p>

                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <User className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate line-clamp-1">{author}</span>
                      </div>
                      <div className="flex items-center ml-2">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate line-clamp-1">{timeAgo}</span>
                      </div>
                    </div>
                    {news.districtName && (
  <div className="mt-2">
    <span className="inline-block bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-xs whitespace-nowrap">
      {news.districtName}
    </span>
  </div>
)}

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {politicsNews.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              {t('labels.noNewsAvailable')}
              <span className="block text-sm mt-1">
                No politics news available
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PoliticsNews;