import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchNewsByCategory } from '@/services/api';
import { useDynamicData } from '../contexts/DynamicDataContext';

// Define the structure of media
interface Media {
  mediaUrl: string;
  caption?: string | null;
}

// Define the structure of each news item
interface NewsItem {
  id: string;
  title: string;
  shortNewsContent: string | null;
  media: Media[];
  categoryName: string;
  createdAt: string;
}

// Define the API response structure
interface ApiResponse {
  status: number;
  message: string;
  result: {
    status: number;
    message: string;
    items: NewsItem[];
  };
}

// Removed hardcoded language mapping - now using dynamic data context

const SportsSection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Get dynamic data from context
  const {
    selectedLanguage,
    categories,
    getCurrentLanguageId,
    getCategoryIdsByType,
  } = useDynamicData();

  const [sportsNews, setSportsNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const language_id = getCurrentLanguageId();

  const fetchSportsNews = async () => {
    if (!language_id || !categories.length) return;

    setLoading(true);

    try {
      // Get sports category IDs dynamically using the context function
      const sportsCategoryIds = getCategoryIdsByType('sports');

      if (!sportsCategoryIds || sportsCategoryIds.length === 0) {
        console.log('[SportsSection] No sports categories found');
        setSportsNews([]);
        return;
      }

      console.log('[SportsSection] Found sports categories:', sportsCategoryIds);

      // Fetch news for all sports categories
      const allNews = [];
      for (const categoryId of sportsCategoryIds) {
        const news = await fetchNewsByCategory(language_id, categoryId, 4, 1);
        allNews.push(...news);
      }
      
      setSportsNews(allNews.slice(0, 4)); // Take only first 4 items
      console.log('[SportsSection] Fetched sports news:', allNews.length, 'items');
    } catch (err) {
      console.error('[SportsSection] Error fetching sports news:', err);
      setSportsNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSportsNews();
  }, [language_id, categories]);

  const handleCardClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  return (
    <section id="sports" className="font-mandali py-8 sm:py-12 bg-white scroll-mt-20 sm:scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            {t("sports.title")}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            {t("sports.subtitle")}
          </p>
        </div>

        {/* Full-width sports news */}
        <div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {t("sports.latestNews")}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-600 mb-3 sm:mb-4"></div>
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg">{t("sports.loading")}</p>
              {/* Loading skeleton */}
              <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8 w-full">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="w-full sm:w-2/5 h-48 sm:h-44 md:h-48 lg:h-52 xl:h-56 bg-gray-200 animate-pulse flex-shrink-0"></div>
                      <div className="w-full sm:w-3/5 flex flex-col justify-between p-3 sm:p-4 md:p-6">
                        <div className="flex-1">
                          <div className="flex flex-row items-center justify-between gap-2 mb-3">
                            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse mb-3"></div>
                        </div>
                        <div className="mt-auto">
                          <div className="space-y-2">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : sportsNews.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg">{t("sports.noNews")}</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {sportsNews.map((news) => {
                const imageUrl = news.media && news.media.length > 0 && news.media[0].mediaUrl
                  ? news.media[0].mediaUrl
                  : "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center";
                const summary = news.shortNewsContent || t("sports.noSummary");
                const category = news.categoryName || t("sports.defaultCategory");
                const time = new Date(news.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Card
                    key={news.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 h-full"
                    onClick={() => handleCardClick(news.id)}
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      {/* Image */}
                      <div className="w-full sm:w-2/5 h-48 sm:h-44 md:h-48 lg:h-52 xl:h-56 flex-shrink-0 relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={news.title}
                          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center";
                            target.onerror = null; // Prevent infinite loop
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Text Content */}
                      <div className="w-full sm:w-3/5 flex flex-col justify-between p-3 sm:p-4 md:p-6 min-h-0">
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-row items-center justify-between gap-2 mb-2 sm:mb-3">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                              {category}
                            </span>
                            <div className="flex items-center text-gray-500 text-xs">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{time}</span>
                            </div>
                          </div>
                          <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                            {news.title}
                          </CardTitle>
                          <p className="text-gray-600 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 leading-relaxed flex-1">
                            {summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SportsSection;